/**
 * Direct Azure OpenAI API Test
 * Tests the exact same call that categoryService makes
 */

require('dotenv').config();

/**
 * Extrae el texto del array output de la respuesta
 */
function extractOutputText(data) {
  if (data.output && Array.isArray(data.output)) {
    // La estructura es: output[] -> message -> content[] -> output_text -> text
    let allText = '';
    
    for (const item of data.output) {
      if (item.type === 'message' && item.content && Array.isArray(item.content)) {
        // Buscar elementos de tipo "output_text" dentro del array content
        const textParts = item.content
          .filter(contentItem => contentItem.type === 'output_text')
          .map(contentItem => contentItem.text)
          .join('');
        allText += textParts;
      } else if (item.type === 'output_text') {
        // Caso directo (por si acaso)
        allText += (item.text || '');
      }
    }
    
    return allText;
  }
  return '';
}

/**
 * Hace polling de la respuesta hasta que esté completa
 */
async function pollResponse(responseId, endpoint, apiKey, maxAttempts = 10) {
  // Construir la URL para obtener la respuesta específica
  // El endpoint tiene formato: https://...openai/responses?api-version=...
  // Necesitamos: https://...openai/responses/{responseId}?api-version=...
  const baseUrl = endpoint.split('?')[0]; // Obtener la base sin query params
  const queryParams = endpoint.split('?')[1] || ''; // Obtener los query params
  const pollUrl = `${baseUrl}/${responseId}?${queryParams}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    try {
      const pollResponse = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      });
      
      if (pollResponse.ok) {
        const pollData = await pollResponse.json();
        
        if (pollData.status === 'completed' || pollData.status === 'failed') {
          return pollData;
        }
        // Si está in_progress o incomplete, continuar polling
      }
    } catch (error) {
      console.error(`   ⚠️  Polling error on attempt ${attempt + 1}:`, error.message);
    }
  }
  
  return null; // Timeout
}

async function testAzureDirect() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 DIRECT AZURE OPENAI API TEST');
  console.log('='.repeat(80));

  const config = {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    deployment: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini',
  };

  console.log('\n📋 Configuration:');
  console.log(`   URL (full): ${config.url}`);
  console.log(`   Key: ***${config.key.substring(config.key.length - 4)}`);
  console.log(`   Deployment: ${config.deployment}`);

  const fullEndpoint = config.url;
  console.log(`\n🌐 Full Endpoint URL:`);
  console.log(`   ${fullEndpoint}`);

  // Test 1: Simple ping
  console.log('\n🧪 TEST 1: Simple Ping');
  try {
    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        model: config.deployment,
        instructions: 'You are a helpful assistant.',
        input: 'Say "pong"',
        max_output_tokens: 200, // Aumentado para que haya tokens disponibles después del reasoning
        reasoning: {
          effort: 'minimal' // Reducir tokens de reasoning para que haya más disponibles para la salida
        },
      }),
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);
    console.log(`   Response Headers:`);
    for (const [key, value] of response.headers.entries()) {
      console.log(`      ${key}: ${value}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error Response Body:\n${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   ❌ Error JSON:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }
    } else {
      let data = await response.json();
      console.log(`   📊 Initial Status: ${data.status}`);
      
      // Si la respuesta está incompleta o en progreso, hacer polling
      if (data.status === 'incomplete' || data.status === 'in_progress') {
        console.log(`   🔄 Polling for complete response...`);
        const polledData = await pollResponse(data.id, fullEndpoint, config.key);
        if (polledData) {
          data = polledData;
          console.log(`   📊 Final Status: ${data.status}`);
        }
      }
      
      console.log(`   ✅ Full Response:`, JSON.stringify(data, null, 2));
      
      // Extraer el contenido de la respuesta desde el array output
      const outputText = extractOutputText(data);
      
      // Mostrar información del status
      if (data.status === 'incomplete') {
        console.log(`   ⚠️  Incomplete reason: ${data.incomplete_details?.reason || 'unknown'}`);
        if (data.incomplete_details?.reason === 'max_output_tokens') {
          console.log(`   💡 Tip: Increase max_output_tokens to get more content`);
        }
      }
      
      if (outputText) {
        console.log(`   ✅ AI Response Content: ${outputText}`);
      } else {
        console.log(`   ⚠️  No text content found in output array`);
        console.log(`   📋 Output array contains:`, data.output?.map(item => item.type).join(', ') || 'empty');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception:`, error.message);
    console.error(`   Stack:`, error.stack);
  }

  // Test 2: Category search (like categoryService.ts)
  console.log('\n🧪 TEST 2: Category Search Request (like categoryService)');
  try {
    const prompt = `You are an expert at categorizing pictograms for AAC systems.

CATEGORY TO ANALYZE:
Category name: "Emotions"
Category description: "Feelings and emotional states like happy, sad, angry"

YOUR TASK:
Generate keywords and tags that will match pictograms belonging to this category.

Return ONLY valid JSON (no markdown, no explanation):
{"keywords": ["happy", "sad", "angry"], "tags": ["emotion", "feeling"]}`;

    const response = await fetch(fullEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        model: config.deployment,
        instructions: 'You are a semantic analysis expert for AAC pictogram databases. Return only valid JSON.',
        input: prompt,
        max_output_tokens: 1500, // Aumentado significativamente para que haya tokens disponibles después del reasoning
        reasoning: {
          effort: 'minimal' // Reducir tokens de reasoning para que haya más disponibles para la salida
        },
        text: {
          format: {
            type: 'json_object'
          }
        },
      }),
    });

    console.log(`   Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ Error Response Body:\n${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   ❌ Error Details:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }
    } else {
      let data = await response.json();
      console.log(`   📊 Initial Status: ${data.status}`);
      
      // Si la respuesta está incompleta o en progreso, hacer polling
      if (data.status === 'incomplete' || data.status === 'in_progress') {
        console.log(`   🔄 Polling for complete response...`);
        const polledData = await pollResponse(data.id, fullEndpoint, config.key);
        if (polledData) {
          data = polledData;
          console.log(`   📊 Final Status: ${data.status}`);
        }
      }
      
      console.log(`   ✅ Full Response:`, JSON.stringify(data, null, 2));
      
      // Extraer el contenido de la respuesta desde el array output
      const outputText = extractOutputText(data);
      
      // Mostrar información del status
      if (data.status === 'incomplete') {
        console.log(`   ⚠️  Incomplete reason: ${data.incomplete_details?.reason || 'unknown'}`);
        if (data.incomplete_details?.reason === 'max_output_tokens') {
          console.log(`   💡 Tip: Increase max_output_tokens to get more content`);
        }
      }
      
      if (outputText) {
        console.log(`   ✅ AI Response Content:\n${outputText}`);
      } else {
        console.log(`   ⚠️  No text content found in output array`);
        console.log(`   📋 Output array contains:`, data.output?.map(item => item.type).join(', ') || 'empty');
      }
    }
  } catch (error) {
    console.error(`   ❌ Exception:`, error.message);
    console.error(`   Stack:`, error.stack);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

testAzureDirect().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
