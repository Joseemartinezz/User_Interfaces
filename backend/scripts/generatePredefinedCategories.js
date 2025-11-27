// Script to generate predefinedCategories.json with actual mappings
// Run this once to populate the predefined categories file

const fs = require('fs').promises;
const path = require('path');

const ARASAAC_FILE = path.join(__dirname, '../data/arasaac_en.json');
const OUTPUT_FILE = path.join(__dirname, '../data/predefinedCategories.json');

// Category-to-tag/keyword mappings
const CATEGORY_MAPPINGS = {
  'Food': {
    tags: ['food', 'beverage', 'feeding', 'meal', 'eating', 'drink', 'mineral rich food', 'processed food', 'ultra-processed food'],
    keywords: ['food', 'eat', 'drink', 'meal', 'snack', 'breakfast', 'lunch', 'dinner', 'pizza', 'apple', 'bread', 'water', 'milk', 'banana', 'orange', 'cake', 'soup', 'rice', 'meat', 'fish', 'egg', 'cheese', 'cookie', 'juice', 'fruit', 'vegetable', 'cereal', 'yogurt', 'coffee', 'tea']
  },
  'Games': {
    tags: ['game', 'toy', 'play', 'entertainment', 'traditional game'],
    keywords: ['play', 'ball', 'toy', 'puzzle', 'doll', 'car', 'blocks', 'cards', 'board', 'video', 'console', 'game', 'fun', 'win', 'lose', 'team', 'chess', 'checkers', 'dice']
  },
  'School': {
    tags: ['education', 'school', 'learning', 'study'],
    keywords: ['school', 'book', 'pencil', 'teacher', 'student', 'desk', 'chair', 'backpack', 'homework', 'test', 'learn', 'read', 'write', 'draw', 'class', 'friend', 'classroom', 'library', 'notebook', 'pen', 'eraser', 'ruler']
  },
  'Family': {
    tags: ['family', 'person', 'elderly', 'relative'],
    keywords: ['i', 'you', 'mom', 'dad', 'mother', 'father', 'brother', 'sister', 'baby', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'son', 'daughter', 'family', 'home', 'parent', 'child', 'children']
  },
  'Sports': {
    tags: ['sport', 'sport material', 'sportswear', 'exercise'],
    keywords: ['football', 'basketball', 'run', 'jump', 'swim', 'bike', 'bicycle', 'tennis', 'soccer', 'baseball', 'volleyball', 'gym', 'exercise', 'win', 'team', 'coach', 'match', 'sport', 'athlete', 'training', 'competition']
  },
  'Music': {
    tags: ['music', 'sound', 'instrument', 'entertainment'],
    keywords: ['music', 'sing', 'dance', 'piano', 'guitar', 'drum', 'song', 'listen', 'radio', 'concert', 'band', 'play', 'microphone', 'speaker', 'cd', 'headphones', 'violin', 'trumpet', 'flute', 'harmonica']
  },
  'Animals': {
    tags: ['animal', 'terrestrial animal', 'aquatic animal', 'marine animal', 'flying animal'],
    keywords: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'horse', 'cow', 'pig', 'duck', 'chicken', 'sheep', 'lion', 'bear', 'elephant', 'tiger', 'monkey', 'animal', 'pet', 'puppy', 'kitten', 'puppy', 'bird', 'parrot']
  },
  'Transport': {
    tags: ['mode of transport', 'land transport', 'air transport', 'water transport', 'traffic'],
    keywords: ['car', 'bus', 'train', 'plane', 'airplane', 'bike', 'bicycle', 'boat', 'truck', 'motorcycle', 'taxi', 'helicopter', 'subway', 'walk', 'stop', 'go', 'road', 'parking', 'vehicle', 'ship', 'cruise', 'metro']
  }
};

/**
 * Find pictograms matching a category based on keywords and tags
 */
function findPictogramsByCategory(categoryName, pictograms) {
  const mapping = CATEGORY_MAPPINGS[categoryName];
  if (!mapping) {
    return [];
  }

  const matchingIds = [];
  const tagSet = new Set(mapping.tags.map(t => t.toLowerCase()));
  const keywordSet = new Set(mapping.keywords.map(k => k.toLowerCase()));

  for (const pictogram of pictograms) {
    let matches = false;

    // Check tags
    if (pictogram.tags && pictogram.tags.length > 0) {
      for (const tag of pictogram.tags) {
        if (tagSet.has(tag.toLowerCase())) {
          matches = true;
          break;
        }
      }
    }

    // Check keywords
    if (!matches && pictogram.keywords && pictogram.keywords.length > 0) {
      for (const keyword of pictogram.keywords) {
        if (keywordSet.has(keyword.toLowerCase())) {
          matches = true;
          break;
        }
      }
    }

    if (matches) {
      matchingIds.push(pictogram.id);
    }
  }

  return matchingIds;
}

async function generatePredefinedCategories() {
  console.log('🔄 Loading master pictogram database...');
  const data = await fs.readFile(ARASAAC_FILE, 'utf-8');
  const pictograms = JSON.parse(data);
  console.log(`✅ Loaded ${pictograms.length} pictograms`);

  const predefinedCategories = [
    'Food',
    'Games',
    'School',
    'Family',
    'Sports',
    'Music',
    'Animals',
    'Transport'
  ];

  const categories = {};

  console.log('\n🔄 Generating category mappings...');
  for (const categoryName of predefinedCategories) {
    console.log(`   Processing ${categoryName}...`);
    const pictogramIds = findPictogramsByCategory(categoryName, pictograms);
    categories[categoryName] = pictogramIds;
    console.log(`   ✅ ${categoryName}: ${pictogramIds.length} pictograms`);
  }

  console.log('\n💾 Saving predefined categories...');
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(categories, null, 2),
    'utf-8'
  );

  console.log(`\n✅ Predefined categories generated successfully!`);
  console.log(`   File: ${OUTPUT_FILE}`);
  console.log(`\n📊 Summary:`);
  for (const [category, ids] of Object.entries(categories)) {
    console.log(`   ${category}: ${ids.length} pictograms`);
  }
}

// Run the script
generatePredefinedCategories().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

