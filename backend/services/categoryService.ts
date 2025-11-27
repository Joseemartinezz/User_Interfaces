// Category Service for Dynamic Pictogram Categories
// Manages category-to-pictogram mappings using a JSON file
// Uses Azure OpenAI to find relevant pictograms for new categories

const fs = require('fs').promises;
const path = require('path');

// Path to categories JSON files
const PREDEFINED_CATEGORIES_FILE_PATH = path.join(__dirname, '../data/predefinedCategories.json');
const CUSTOM_CATEGORIES_FILE_PATH = path.join(__dirname, '../data/categories.json');

// Predefined categories (from PCSScreen.tsx)
const PREDEFINED_CATEGORIES = [
  'Food',
  'Games',
  'School',
  'Family',
  'Sports',
  'Music',
  'Animals',
  'Transport'
];

// Category-to-tag/keyword mappings for initialization
const CATEGORY_MAPPINGS = {
  'Food': {
    tags: ['food', 'beverage', 'feeding', 'meal', 'eating', 'drink'],
    keywords: ['food', 'eat', 'drink', 'meal', 'snack', 'breakfast', 'lunch', 'dinner', 'pizza', 'apple', 'bread', 'water', 'milk', 'banana', 'orange', 'cake', 'soup', 'rice', 'meat', 'fish', 'egg', 'cheese', 'cookie', 'juice']
  },
  'Games': {
    tags: ['game', 'toy', 'play', 'entertainment', 'traditional game'],
    keywords: ['play', 'ball', 'toy', 'puzzle', 'doll', 'car', 'blocks', 'cards', 'board', 'video', 'console', 'game', 'fun', 'win', 'lose', 'team']
  },
  'School': {
    tags: ['education', 'school', 'learning', 'study'],
    keywords: ['school', 'book', 'pencil', 'teacher', 'student', 'desk', 'chair', 'backpack', 'homework', 'test', 'learn', 'read', 'write', 'draw', 'class', 'friend']
  },
  'Family': {
    tags: ['family', 'person', 'elderly', 'relative'],
    keywords: ['i', 'you', 'mom', 'dad', 'mother', 'father', 'brother', 'sister', 'baby', 'grandma', 'grandpa', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'son', 'daughter', 'family', 'home']
  },
  'Sports': {
    tags: ['sport', 'sport material', 'sportswear', 'exercise'],
    keywords: ['football', 'basketball', 'run', 'jump', 'swim', 'bike', 'tennis', 'soccer', 'baseball', 'volleyball', 'gym', 'exercise', 'win', 'team', 'coach', 'match', 'sport']
  },
  'Music': {
    tags: ['music', 'sound', 'instrument', 'entertainment'],
    keywords: ['music', 'sing', 'dance', 'piano', 'guitar', 'drum', 'song', 'listen', 'radio', 'concert', 'band', 'play', 'microphone', 'speaker', 'cd', 'headphones']
  },
  'Animals': {
    tags: ['animal', 'terrestrial animal', 'aquatic animal', 'marine animal', 'flying animal'],
    keywords: ['dog', 'cat', 'bird', 'fish', 'rabbit', 'horse', 'cow', 'pig', 'duck', 'chicken', 'sheep', 'lion', 'bear', 'elephant', 'tiger', 'monkey', 'animal']
  },
  'Transport': {
    tags: ['mode of transport', 'land transport', 'air transport', 'water transport', 'traffic'],
    keywords: ['car', 'bus', 'train', 'plane', 'airplane', 'bike', 'bicycle', 'boat', 'truck', 'motorcycle', 'taxi', 'helicopter', 'subway', 'walk', 'stop', 'go', 'road', 'parking']
  }
};

/**
 * Load predefined categories JSON file
 * Returns empty object if file doesn't exist
 */
async function loadPredefinedCategories(): Promise<Record<string, number[]>> {
  try {
    const data = await fs.readFile(PREDEFINED_CATEGORIES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      console.warn('⚠️ Predefined categories file not found. Run the initialization script.');
      return {};
    }
    console.error('❌ Error loading predefined categories:', error);
    throw error;
  }
}

/**
 * Load custom categories JSON file (user-created categories only)
 * Returns empty object if file doesn't exist
 */
async function loadCustomCategories(): Promise<Record<string, number[]>> {
  try {
    const data = await fs.readFile(CUSTOM_CATEGORIES_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    console.error('❌ Error loading custom categories:', error);
    throw error;
  }
}

/**
 * Save custom categories JSON file (user-created categories only)
 */
async function saveCustomCategories(categories: Record<string, number[]>): Promise<void> {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CUSTOM_CATEGORIES_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(
      CUSTOM_CATEGORIES_FILE_PATH,
      JSON.stringify(categories, null, 2),
      'utf-8'
    );
    console.log('✅ Custom categories saved successfully');
  } catch (error) {
    console.error('❌ Error saving custom categories:', error);
    throw error;
  }
}

/**
 * Load master pictogram data from arasaac_en.json
 */
async function loadMasterPictograms(): Promise<Array<{ id: number; keywords: string[]; tags: string[] }>> {
  try {
    const data = await fs.readFile(
      path.join(__dirname, '../data/arasaac_en.json'),
      'utf-8'
    );
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading master pictograms:', error);
    throw error;
  }
}

/**
 * Find pictograms matching a category based on keywords and tags
 * This is used for initializing predefined categories
 */
function findPictogramsByCategory(
  categoryName: string,
  pictograms: Array<{ id: number; keywords: string[]; tags: string[] }>
): number[] {
  const mapping = CATEGORY_MAPPINGS[categoryName];
  if (!mapping) {
    return [];
  }

  const matchingIds: number[] = [];
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

/**
 * Initialize predefined categories
 * This loads from predefinedCategories.json (should be pre-generated)
 * If file doesn't exist, generates it from master database
 */
async function initializePredefinedCategories(): Promise<Record<string, number[]>> {
  console.log('🔄 Loading predefined categories...');
  
  // Try to load from file first
  let categories = await loadPredefinedCategories();
  
  // If file is empty or doesn't exist, generate it
  if (Object.keys(categories).length === 0) {
    console.log('⚠️ Predefined categories file is empty, generating from master database...');
    const pictograms = await loadMasterPictograms();
    categories = {};

    for (const categoryName of PREDEFINED_CATEGORIES) {
      const pictogramIds = findPictogramsByCategory(categoryName, pictograms);
      categories[categoryName] = pictogramIds;
      console.log(`✅ ${categoryName}: ${pictogramIds.length} pictograms found`);
    }

    // Save to predefined categories file
    const dataDir = path.dirname(PREDEFINED_CATEGORIES_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      PREDEFINED_CATEGORIES_FILE_PATH,
      JSON.stringify(categories, null, 2),
      'utf-8'
    );
    console.log('✅ Predefined categories generated and saved');
  } else {
    console.log('✅ Predefined categories loaded from file');
  }
  
  return categories;
}

/**
 * Use Azure OpenAI to find relevant pictograms for a new category
 * Uses a hybrid approach: local search + AI refinement
 */
async function findPictogramsWithAI(
  categoryName: string,
  maxResults: number = 50
): Promise<number[]> {
  const config = {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    deployment: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-4o-mini',
    apiVersion: process.env.AZURE_OPENAI_PHRASE_API_VERSION || '2023-03-15-preview'
  };

  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI no está configurado. Verifica las variables de entorno AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY.');
  }

  // Load all pictograms
  const pictograms = await loadMasterPictograms();
  
  // Step 1: Do a local search first based on category name similarity
  const categoryNameLower = categoryName.toLowerCase();
  const categoryWords = categoryNameLower.split(/\s+/);
  
  // Find pictograms that match the category name in keywords or tags
  const localMatches: number[] = [];
  for (const pictogram of pictograms) {
    let score = 0;
    
    // Check keywords
    if (pictogram.keywords && pictogram.keywords.length > 0) {
      for (const keyword of pictogram.keywords) {
        const keywordLower = keyword.toLowerCase();
        // Exact match
        if (keywordLower === categoryNameLower) {
          score += 10;
        }
        // Contains category name
        else if (keywordLower.includes(categoryNameLower) || categoryNameLower.includes(keywordLower)) {
          score += 5;
        }
        // Word match
        else {
          for (const word of categoryWords) {
            if (keywordLower.includes(word) || keywordLower === word) {
              score += 2;
            }
          }
        }
      }
    }
    
    // Check tags
    if (pictogram.tags && pictogram.tags.length > 0) {
      for (const tag of pictogram.tags) {
        const tagLower = tag.toLowerCase();
        if (tagLower === categoryNameLower) {
          score += 8;
        } else if (tagLower.includes(categoryNameLower) || categoryNameLower.includes(tagLower)) {
          score += 4;
        } else {
          for (const word of categoryWords) {
            if (tagLower.includes(word)) {
              score += 1;
            }
          }
        }
      }
    }
    
    if (score > 0) {
      localMatches.push(pictogram.id);
    }
  }
  
  console.log(`🔍 Local search found ${localMatches.length} potential matches for "${categoryName}"`);

  // Step 2: Use AI to find additional relevant keywords/tags, then search locally
  // Create a sample of matching pictograms for context
  const sampleSize = Math.min(20, localMatches.length);
  const sampleIds = localMatches.slice(0, sampleSize);
  const samplePictograms = pictograms
    .filter(p => sampleIds.includes(p.id))
    .map(p => ({
      id: p.id,
      keywords: p.keywords || [],
      tags: p.tags || []
    }));

  const prompt = `You are helping to categorize pictograms for an Augmentative and Alternative Communication (AAC) system.

Given a category name "${categoryName}", I need you to identify relevant keywords and tags that would help find pictograms belonging to this category.

The master database contains ${pictograms.length} pictograms. Each pictogram has:
- id: unique identifier
- keywords: array of keywords in English
- tags: array of semantic tags

Sample pictograms that might belong to "${categoryName}":
${JSON.stringify(samplePictograms.slice(0, 10), null, 2)}

Your task:
1. Understand what "${categoryName}" category represents
2. Based on the sample, identify 10-20 relevant keywords and 5-10 relevant tags that would help find pictograms in this category
3. Return a JSON object with this structure:
{
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...]
}

IMPORTANT: 
- Return ONLY the JSON object, no explanation
- Keywords should be single words or short phrases in English
- Tags should be semantic categories
- Focus on terms that would actually appear in pictogram metadata
- Be specific and relevant to "${categoryName}"`;

  try {
    const response = await fetch(
      `${config.url}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.key,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert at categorizing pictograms for AAC systems. You analyze semantic patterns and return relevant search terms as JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3,
          n: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error?.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;
    
    if (!output) {
      throw new Error('No response from Azure OpenAI');
    }

    // Parse AI response to get keywords and tags
    let aiSearchTerms: { keywords: string[]; tags: string[] } = { keywords: [], tags: [] };
    
    try {
      const cleaned = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      if (parsed.keywords && Array.isArray(parsed.keywords)) {
        aiSearchTerms.keywords = parsed.keywords.map((k: any) => String(k).toLowerCase());
      }
      if (parsed.tags && Array.isArray(parsed.tags)) {
        aiSearchTerms.tags = parsed.tags.map((t: any) => String(t).toLowerCase());
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse AI response, using local search only');
    }

    // Step 3: Search pictograms using AI-suggested keywords and tags
    const aiMatches: number[] = [];
    const keywordSet = new Set(aiSearchTerms.keywords);
    const tagSet = new Set(aiSearchTerms.tags);
    
    for (const pictogram of pictograms) {
      // Skip if already in local matches
      if (localMatches.includes(pictogram.id)) {
        continue;
      }
      
      let matches = false;
      
      // Check keywords
      if (pictogram.keywords && pictogram.keywords.length > 0) {
        for (const keyword of pictogram.keywords) {
          if (keywordSet.has(keyword.toLowerCase())) {
            matches = true;
            break;
          }
        }
      }
      
      // Check tags
      if (!matches && pictogram.tags && pictogram.tags.length > 0) {
        for (const tag of pictogram.tags) {
          if (tagSet.has(tag.toLowerCase())) {
            matches = true;
            break;
          }
        }
      }
      
      if (matches) {
        aiMatches.push(pictogram.id);
      }
    }

    // Combine local and AI matches, remove duplicates
    const allMatches = [...new Set([...localMatches, ...aiMatches])];
    
    // Limit to maxResults
    const finalMatches = allMatches.slice(0, maxResults);

    console.log(`✅ Found ${finalMatches.length} pictograms for category "${categoryName}" (${localMatches.length} local + ${aiMatches.length} AI)`);
    return finalMatches;
    
  } catch (error: any) {
    console.error('❌ Error finding pictograms with AI:', error);
    
    // Fallback to local search only
    if (localMatches.length > 0) {
      console.log(`⚠️ Using local search results only (${localMatches.length} pictograms)`);
      return localMatches.slice(0, maxResults);
    }
    
    throw new Error(error.message || 'Error al buscar pictogramas con IA.');
  }
}

/**
 * Create a new custom category
 * Uses AI to find relevant pictograms
 */
async function createCategory(categoryName: string, maxResults: number = 50): Promise<number[]> {
  // Check if it's a predefined category
  if (PREDEFINED_CATEGORIES.includes(categoryName)) {
    throw new Error(`Category "${categoryName}" is a predefined category and cannot be recreated`);
  }

  // Check if category already exists in custom categories
  const customCategories = await loadCustomCategories();
  if (customCategories[categoryName]) {
    throw new Error(`Category "${categoryName}" already exists`);
  }

  // Use AI to find relevant pictograms
  console.log(`🔄 Finding pictograms for new category "${categoryName}"...`);
  const pictogramIds = await findPictogramsWithAI(categoryName, maxResults);

  // Add to custom categories
  customCategories[categoryName] = pictogramIds;
  await saveCustomCategories(customCategories);

  console.log(`✅ Category "${categoryName}" created with ${pictogramIds.length} pictograms`);
  return pictogramIds;
}

/**
 * Delete a custom category
 * Cannot delete predefined categories
 */
async function deleteCategory(categoryName: string): Promise<void> {
  if (PREDEFINED_CATEGORIES.includes(categoryName)) {
    throw new Error(`Cannot delete predefined category "${categoryName}"`);
  }

  const customCategories = await loadCustomCategories();
  if (!customCategories[categoryName]) {
    throw new Error(`Category "${categoryName}" does not exist`);
  }

  delete customCategories[categoryName];
  await saveCustomCategories(customCategories);

  console.log(`✅ Category "${categoryName}" deleted`);
}

/**
 * Get all categories (predefined + custom)
 */
async function getAllCategories(): Promise<Record<string, number[]>> {
  // Load predefined categories
  const predefined = await initializePredefinedCategories();
  
  // Load custom categories
  const custom = await loadCustomCategories();
  
  // Merge both (custom categories override predefined if same name, but shouldn't happen)
  return { ...predefined, ...custom };
}

/**
 * Get pictogram IDs for a specific category
 */
async function getCategoryPictograms(categoryName: string): Promise<number[]> {
  // Check if it's a predefined category
  if (PREDEFINED_CATEGORIES.includes(categoryName)) {
    const predefined = await initializePredefinedCategories();
    return predefined[categoryName] || [];
  }
  
  // Otherwise, check custom categories
  const custom = await loadCustomCategories();
  return custom[categoryName] || [];
}

/**
 * Check if a category is predefined
 */
function isPredefinedCategory(categoryName: string): boolean {
  return PREDEFINED_CATEGORIES.includes(categoryName);
}

module.exports = {
  loadPredefinedCategories,
  loadCustomCategories,
  saveCustomCategories,
  initializePredefinedCategories,
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryPictograms,
  isPredefinedCategory,
  PREDEFINED_CATEGORIES
};

