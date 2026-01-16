/**
 * Test Phrase Generation (that supposedly works)
 * Uses the exact same pattern as azureService.ts
 */

require('dotenv').config();

async function testPhraseGeneration() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 PHRASE GENERATION TEST (azureService.ts pattern)');
  console.log('='.repeat(80));

  function getAzureConfig() {
    return {
      url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
      key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
      model: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini'
    };
  }

  const config = getAzureConfig();
  
  console.log('\n📋 Configuration (from getAzureConfig):');
  console.log(`   URL (complete): ${config.url}`);
  console.log(`   Key: ***${config.key.substring(config.key.length - 4)}`);
  console.log(`   Model: ${config.model}`);

  const words = ['happy', 'play', 'home'];
  const instructions = 'You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.';
  const input = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
`;

  console.log('\n🧪 Testing phrase generation with words:', words);

  try {
    console.log(`\n🌐 Endpoint URL: ${config.url}`);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        model: config.model,
        instructions: instructions,
        input: input,
        max_output_tokens: 500,
        reasoning: {
          effort: 'minimal'
        }
      }),
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ ERROR - Failed to generate phrases`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Body: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`   JSON:`, JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Not JSON
      }
      return;
    }

    const data = await response.json();
    
    // Extract text from output array
    let output = '';
    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              output = contentItem.text;
              break;
            }
          }
          if (output) break;
        }
      }
    }
    
    if (!output) {
      console.error('❌ No output from AI');
      console.error('   Full response:', JSON.stringify(data, null, 2));
      return;
    }

    console.log(`\n✅ SUCCESS - AI Response:`);
    console.log(output);

    // Extract phrases
    const lines = output.split('\n');
    const phrases = [];
    for (const line of lines) {
      const cleaned = String(line).replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned && cleaned.length > 0) {
        phrases.push(cleaned);
      }
    }

    console.log(`\n📝 Extracted Phrases (${phrases.length}):`);
    phrases.forEach((phrase, i) => {
      console.log(`   ${i + 1}. "${phrase}"`);
    });

  } catch (error) {
    console.error('\n❌ Exception:', error.message);
    console.error('   Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE');
  console.log('='.repeat(80) + '\n');
}

testPhraseGeneration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
