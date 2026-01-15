/**
 * Test Script for Category Creation with PCS Pictograms
 * 
 * This script tests the improved category creation system
 * Run with: node test-category-creation.js
 * 
 * Make sure to set environment variables before running:
 * - AZURE_OPENAI_PHRASE_URL
 * - AZURE_OPENAI_PHRASE_KEY
 * - AZURE_OPENAI_PHRASE_DEPLOYMENT (optional, defaults to gpt-4o-mini)
 */

// Register ts-node to handle TypeScript imports
require('ts-node/register');

require('dotenv').config();

const categoryService = require('./services/categoryService');
const fs = require('fs').promises;
const path = require('path');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

// Test cases for category creation
const TEST_CASES = [
  {
    name: 'Emotions',
    description: 'Feelings and emotional states like happy, sad, angry, scared',
    expectedMinResults: 10,
    expectedKeywords: ['happy', 'sad', 'angry', 'emotion', 'feeling'],
  },
  {
    name: 'Weather',
    description: 'Weather conditions and climate elements like sun, rain, clouds, snow',
    expectedMinResults: 5,
    expectedKeywords: ['sun', 'rain', 'cloud', 'weather'],
  },
  {
    name: 'Clothes',
    description: 'Clothing items and accessories like shirt, pants, shoes, hat',
    expectedMinResults: 10,
    expectedKeywords: ['shirt', 'pants', 'shoe', 'dress', 'clothing'],
  },
  {
    name: 'Body Parts',
    description: 'Parts of the human body like head, hand, foot, eye, nose',
    expectedMinResults: 10,
    expectedKeywords: ['head', 'hand', 'eye', 'body'],
  },
  {
    name: 'Colors',
    description: 'Basic colors like red, blue, green, yellow, orange',
    expectedMinResults: 5,
    expectedKeywords: ['red', 'blue', 'green', 'yellow', 'color'],
  },
];

/**
 * Load pictogram data to verify results
 */
async function loadPictograms() {
  const data = await fs.readFile(
    path.join(__dirname, 'data/arasaac_en.json'),
    'utf-8'
  );
  return JSON.parse(data);
}

/**
 * Get pictogram info by ID
 */
function getPictogramInfo(pictograms, id) {
  return pictograms.find(p => p.id === id);
}

/**
 * Test a single category creation
 */
async function testCategory(testCase, pictograms, testUserId) {
  log(colors.cyan, '\n' + '━'.repeat(80));
  log(colors.bright + colors.cyan, `📋 TESTING CATEGORY: "${testCase.name}"`);
  log(colors.cyan, '━'.repeat(80));
  
  console.log(`📝 Description: "${testCase.description}"`);
  console.log(`🎯 Expected min results: ${testCase.expectedMinResults}`);
  console.log(`🔑 Expected keywords: [${testCase.expectedKeywords.join(', ')}]`);
  
  const startTime = Date.now();
  
  try {
    // Note: We use a test approach that doesn't save to file
    // by directly calling the internal search function
    const { findPictogramsWithAI } = require('./services/categoryService');
    
    // Since findPictogramsWithAI is not exported, we'll test via createUserCategory
    // but use a test userId to avoid conflicts
    
    // First, check if category already exists for test user
    const userCategories = await categoryService.loadUserCategories(testUserId);
    if (userCategories[testCase.name]) {
      log(colors.yellow, `⚠️ Category "${testCase.name}" already exists for test user. Deleting...`);
      delete userCategories[testCase.name];
      await categoryService.saveUserCategories(testUserId, userCategories);
    }
    
    // Create the category
    const pictogramIds = await categoryService.createUserCategory(
      testUserId,
      testCase.name,
      50, // maxResults
      testCase.description
    );
    
    const duration = Date.now() - startTime;
    
    // Analyze results
    log(colors.green, `\n✅ RESULTS for "${testCase.name}":`);
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   📊 Pictograms found: ${pictogramIds.length}`);
    
    // Check if we met the minimum
    const metMinimum = pictogramIds.length >= testCase.expectedMinResults;
    if (metMinimum) {
      log(colors.green, `   ✅ Met minimum threshold (${testCase.expectedMinResults})`);
    } else {
      log(colors.red, `   ❌ Below minimum threshold (expected ${testCase.expectedMinResults}, got ${pictogramIds.length})`);
    }
    
    // Show sample results
    console.log('\n   📌 Sample pictograms:');
    for (let i = 0; i < Math.min(10, pictogramIds.length); i++) {
      const pict = getPictogramInfo(pictograms, pictogramIds[i]);
      if (pict) {
        console.log(`      ${i + 1}. ID ${pict.id}: "${pict.keywords?.[0] || 'unknown'}" - tags: [${pict.tags?.slice(0, 3).join(', ')}]`);
      }
    }
    
    // Check for expected keywords in results
    const foundExpectedKeywords = [];
    const missingExpectedKeywords = [];
    
    for (const expectedKw of testCase.expectedKeywords) {
      let found = false;
      for (const pictId of pictogramIds) {
        const pict = getPictogramInfo(pictograms, pictId);
        if (pict?.keywords?.some(k => k.toLowerCase().includes(expectedKw.toLowerCase()))) {
          found = true;
          break;
        }
        if (pict?.tags?.some(t => t.toLowerCase().includes(expectedKw.toLowerCase()))) {
          found = true;
          break;
        }
      }
      if (found) {
        foundExpectedKeywords.push(expectedKw);
      } else {
        missingExpectedKeywords.push(expectedKw);
      }
    }
    
    console.log(`\n   🔍 Expected keyword analysis:`);
    if (foundExpectedKeywords.length > 0) {
      log(colors.green, `      ✅ Found: [${foundExpectedKeywords.join(', ')}]`);
    }
    if (missingExpectedKeywords.length > 0) {
      log(colors.yellow, `      ⚠️ Missing: [${missingExpectedKeywords.join(', ')}]`);
    }
    
    const keywordCoverage = (foundExpectedKeywords.length / testCase.expectedKeywords.length) * 100;
    console.log(`      📈 Keyword coverage: ${keywordCoverage.toFixed(0)}%`);
    
    return {
      category: testCase.name,
      success: true,
      pictogramCount: pictogramIds.length,
      metMinimum,
      duration,
      keywordCoverage,
      foundKeywords: foundExpectedKeywords,
      missingKeywords: missingExpectedKeywords,
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(colors.red, `\n❌ ERROR testing "${testCase.name}":`);
    console.error(`   ${error.message}`);
    
    return {
      category: testCase.name,
      success: false,
      error: error.message,
      duration,
    };
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(testUserId) {
  log(colors.yellow, '\n🧹 Cleaning up test data...');
  try {
    const userCategoriesPath = path.join(__dirname, `data/user_categories/${testUserId}.json`);
    await fs.unlink(userCategoriesPath);
    log(colors.green, '   ✅ Test user categories file deleted');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log(colors.yellow, `   ⚠️ Could not delete test file: ${error.message}`);
    } else {
      console.log('   ℹ️  No test file to delete');
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log(colors.bright + colors.magenta, '\n' + '═'.repeat(80));
  log(colors.bright + colors.magenta, '🧪 CATEGORY CREATION TEST SUITE');
  log(colors.bright + colors.magenta, '═'.repeat(80));
  
  // Check environment variables
  console.log('\n📋 Checking configuration...');
  
  const requiredEnvVars = [
    'AZURE_OPENAI_PHRASE_URL',
    'AZURE_OPENAI_PHRASE_KEY',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length > 0) {
    log(colors.red, `\n❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
    log(colors.yellow, '\nPlease set the following in your .env file:');
    console.log('   AZURE_OPENAI_PHRASE_URL=https://your-resource.openai.azure.com');
    console.log('   AZURE_OPENAI_PHRASE_KEY=your-api-key');
    console.log('   AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-4o-mini (optional)');
    process.exit(1);
  }
  
  log(colors.green, '   ✅ Environment variables configured');
  
  // Load pictogram data
  console.log('\n📂 Loading pictogram database...');
  const pictograms = await loadPictograms();
  log(colors.green, `   ✅ Loaded ${pictograms.length} pictograms`);
  
  // Generate test user ID
  const testUserId = `TEST_USER_${Date.now()}`;
  console.log(`\n👤 Test user ID: ${testUserId}`);
  
  // Run tests
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testCategory(testCase, pictograms, testUserId);
    results.push(result);
    
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  log(colors.bright + colors.magenta, '\n' + '═'.repeat(80));
  log(colors.bright + colors.magenta, '📊 TEST SUMMARY');
  log(colors.bright + colors.magenta, '═'.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const metMinimum = results.filter(r => r.metMinimum);
  
  console.log(`\n   Total tests: ${results.length}`);
  log(colors.green, `   ✅ Successful: ${successful.length}`);
  if (failed.length > 0) {
    log(colors.red, `   ❌ Failed: ${failed.length}`);
  }
  log(colors.cyan, `   📊 Met minimum threshold: ${metMinimum.length}/${results.length}`);
  
  // Average metrics
  const avgPictograms = successful.reduce((acc, r) => acc + r.pictogramCount, 0) / successful.length;
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
  const avgKeywordCoverage = successful.reduce((acc, r) => acc + r.keywordCoverage, 0) / successful.length;
  
  console.log(`\n   📈 Averages:`);
  console.log(`      - Pictograms per category: ${avgPictograms.toFixed(1)}`);
  console.log(`      - Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`      - Keyword coverage: ${avgKeywordCoverage.toFixed(0)}%`);
  
  // Detailed results table
  console.log('\n   📋 Detailed Results:');
  console.log('   ' + '─'.repeat(76));
  console.log(`   ${'Category'.padEnd(15)} | ${'Status'.padEnd(8)} | ${'Count'.padEnd(6)} | ${'Time'.padEnd(8)} | ${'Coverage'.padEnd(10)}`);
  console.log('   ' + '─'.repeat(76));
  
  for (const result of results) {
    const status = result.success ? '✅ OK' : '❌ FAIL';
    const count = result.pictogramCount?.toString() || 'N/A';
    const time = `${result.duration}ms`;
    const coverage = result.keywordCoverage ? `${result.keywordCoverage.toFixed(0)}%` : 'N/A';
    
    console.log(`   ${result.category.padEnd(15)} | ${status.padEnd(8)} | ${count.padEnd(6)} | ${time.padEnd(8)} | ${coverage.padEnd(10)}`);
  }
  console.log('   ' + '─'.repeat(76));
  
  // Cleanup
  await cleanupTestData(testUserId);
  
  log(colors.bright + colors.magenta, '\n═'.repeat(80));
  log(colors.bright + colors.magenta, '🏁 TEST SUITE COMPLETE');
  log(colors.bright + colors.magenta, '═'.repeat(80) + '\n');
  
  // Exit with appropriate code
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log(colors.red, '\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});
