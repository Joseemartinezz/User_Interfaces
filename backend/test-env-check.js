/**
 * Quick test to verify environment variables are loaded correctly
 * Run with: node test-env-check.js
 */

// Register ts-node to handle TypeScript imports
require('ts-node/register');
require('dotenv').config();

console.log('\n' + '='.repeat(80));
console.log('🔍 ENVIRONMENT VARIABLES CHECK');
console.log('='.repeat(80));

const vars = {
  'AZURE_OPENAI_PHRASE_URL': process.env.AZURE_OPENAI_PHRASE_URL,
  'EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL': process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL,
  'AZURE_OPENAI_PHRASE_KEY': process.env.AZURE_OPENAI_PHRASE_KEY,
  'EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY': process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY,
  'AZURE_OPENAI_PHRASE_DEPLOYMENT': process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT,
  'EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT': process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT,
  'AZURE_OPENAI_PHRASE_API_VERSION': process.env.AZURE_OPENAI_PHRASE_API_VERSION,
};

for (const [key, value] of Object.entries(vars)) {
  if (value) {
    if (key.includes('KEY')) {
      console.log(`✅ ${key}: ***${value.substring(value.length - 4)}`);
    } else if (key.includes('URL')) {
      console.log(`✅ ${key}: ${value.substring(0, 40)}...`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
}

console.log('\n📋 Configuration that will be used:');

function getAzureConfig() {
  return {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    model: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini'
  };
}

const config = getAzureConfig();

console.log(`URL (complete): ${config.url || '❌ NOT SET'}`);
console.log(`Key: ${config.key ? '***' + config.key.substring(config.key.length - 4) : '❌ NOT SET'}`);
console.log(`Model: ${config.model}`);

console.log('\n' + '='.repeat(80));

if (!config.url || !config.key) {
  console.log('❌ CONFIGURATION INCOMPLETE');
  console.log('\nPlease set the following in backend/.env:');
  console.log('   AZURE_OPENAI_PHRASE_URL=https://your-resource.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview');
  console.log('   AZURE_OPENAI_PHRASE_KEY=your-api-key');
  console.log('   AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-5-mini (optional)');
  process.exit(1);
} else {
  console.log('✅ CONFIGURATION COMPLETE - Ready to use Azure OpenAI');
  process.exit(0);
}
