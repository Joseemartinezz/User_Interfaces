/**
 * Direct Azure OpenAI API Test
 * Tests the exact same call that categoryService makes
 */

require('dotenv').config();

async function testAzureDirect() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 DIRECT AZURE OPENAI API TEST');
  console.log('='.repeat(80));

  const config = {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    deployment: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-4o-mini',
    apiVersion: process.env.AZURE_OPENAI_PHRASE_API_VERSION || '2023-03-15-preview'
  };

  console.log('\n📋 Configuration:');
  console.log(`   URL (full): ${config.url}`);
  console.log(`   Key: ***${config.key.substring(config.key.length - 4)}`);
  console.log(`   Deployment: ${config.deployment}`);
  console.log(`   API Version: ${config.apiVersion}`);

  const fullEndpoint = `${config.url}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;
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
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "pong"' }
        ],
        max_tokens: 10,
        temperature: 0.5,
        n: 1,
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
      const data = await response.json();
      console.log(`   ✅ Success Response:`, JSON.stringify(data, null, 2));
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
        messages: [
          {
            role: 'system',
            content: 'You are a semantic analysis expert for AAC pictogram databases. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.3,
        n: 1,
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
      const data = await response.json();
      const output = data.choices?.[0]?.message?.content;
      console.log(`   ✅ AI Response Content:\n${output}`);
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
