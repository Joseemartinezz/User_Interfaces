// Category Service for Dynamic Pictogram Categories
// Manages category-to-pictogram mappings using a JSON file
// Uses Azure OpenAI (with Gemini fallback) to find relevant pictograms for new categories


const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const PREDEFINED_CATEGORIES_FILE_PATH = path.join(__dirname, '../data/predefinedCategories.json');
const USER_CATEGORIES_DIR = path.join(__dirname, '../data/user_categories');

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Minimum category name length for valid search
 */
const MIN_CATEGORY_NAME_LENGTH = 2;

/**
 * Maximum pictogram results to return (prevents excessive data)
 */
const MAX_PICTOGRAM_RESULTS = 100;

/**
 * Minimum relevance score for a pictogram to be included
 * This filters out low-quality matches
 */
const MIN_RELEVANCE_SCORE = 3;

/**
 * Score weights for different match types
 * Note: Only AI weights are used now (local search has been removed)
 */
const SCORE_WEIGHTS = {
  EXACT_KEYWORD_MATCH: 15,      // Exact match in keywords (legacy, not used)
  EXACT_TAG_MATCH: 12,          // Exact match in tags (legacy, not used)
  PARTIAL_KEYWORD_MATCH: 6,     // Keyword contains search term or vice versa (legacy, not used)
  PARTIAL_TAG_MATCH: 4,         // Tag contains search term or vice versa (legacy, not used)
  WORD_IN_KEYWORD: 3,           // Individual word matches keyword (legacy, not used)
  WORD_IN_TAG: 2,               // Individual word matches tag (legacy, not used)
  AI_KEYWORD_MATCH: 8,          // AI-suggested keyword matches
  AI_TAG_MATCH: 6,              // AI-suggested tag matches
};

/**
 * Cache for unique tags from the database (for AI context)
 */
let cachedUniqueTags: string[] | null = null;

/**
 * Get path to user-specific categories file
 */
function getUserCategoriesPath(userId: string): string {
  return path.join(USER_CATEGORIES_DIR, `${userId}.json`);
}

/**
 * Sanitize and validate category name for search
 * - Removes leading/trailing whitespace
 * - Removes special characters that could break search
 * - Returns null if invalid (too short, empty, only special chars)
 * 
 * @param categoryName - Raw category name input
 * @returns Sanitized category name or null if invalid
 */
function sanitizeCategoryName(categoryName: string): string | null {
  if (!categoryName || typeof categoryName !== 'string') {
    return null;
  }

  // Trim whitespace
  let sanitized = categoryName.trim();

  // Remove special characters that could cause issues (keep letters, numbers, spaces, hyphens)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-áéíóúñüÁÉÍÓÚÑÜ]/g, '');

  // Collapse multiple spaces into single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Validate minimum length
  if (sanitized.length < MIN_CATEGORY_NAME_LENGTH) {
    return null;
  }

  return sanitized;
}

/**
 * Validate userId format (Firebase UIDs are typically alphanumeric)
 * 
 * @param userId - User ID to validate
 * @returns true if valid, false otherwise
 */
function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  // Firebase UIDs are typically 28 alphanumeric characters
  // Allow some flexibility for different auth providers
  return /^[a-zA-Z0-9_-]{10,128}$/.test(userId);
}

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
      console.warn('Predefined categories file not found. Run the initialization script.');
      return {};
    }
    console.error('Error loading predefined categories:', error);
    throw error;
  }
}

/**
 * Load user-specific categories JSON file
 * Returns empty object if file doesn't exist
 */
async function loadUserCategories(userId: string): Promise<Record<string, number[]>> {
  try {
    const filePath = getUserCategoriesPath(userId);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty object
      return {};
    }
    console.error(`Error loading user categories for ${userId}:`, error);
    throw error;
  }
}

/**
 * Save user-specific categories JSON file
 */
async function saveUserCategories(userId: string, categories: Record<string, number[]>): Promise<void> {
  try {
    // Ensure user_categories directory exists
    await fs.mkdir(USER_CATEGORIES_DIR, { recursive: true });

    const filePath = getUserCategoriesPath(userId);
    await fs.writeFile(
      filePath,
      JSON.stringify(categories, null, 2),
      'utf-8'
    );
    console.log(`User categories saved successfully for user ${userId}`);
  } catch (error) {
    console.error(`Error saving user categories for ${userId}:`, error);
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
    console.error('Error loading master pictograms:', error);
    throw error;
  }
}

/**
 * Extract and cache all unique tags from the database
 * This helps the AI generate more accurate tag suggestions
 */
async function getUniqueTags(): Promise<string[]> {
  if (cachedUniqueTags) {
    return cachedUniqueTags;
  }

  const pictograms = await loadMasterPictograms();
  const tagSet = new Set<string>();

  for (const pictogram of pictograms) {
    if (pictogram.tags && Array.isArray(pictogram.tags)) {
      for (const tag of pictogram.tags) {
        tagSet.add(tag.toLowerCase());
      }
    }
  }

  cachedUniqueTags = Array.from(tagSet).sort();
  console.log(`Cached ${cachedUniqueTags.length} unique tags from database`);
  return cachedUniqueTags;
}

/**
 * Extract sample keywords from the database for a given search context
 * Helps AI understand what kind of keywords exist
 */
async function getSampleKeywords(pictograms: Array<{ id: number; keywords: string[]; tags: string[] }>, limit: number = 100): Promise<string[]> {
  const keywordSet = new Set<string>();

  for (const pictogram of pictograms.slice(0, 500)) {
    if (pictogram.keywords && Array.isArray(pictogram.keywords)) {
      for (const keyword of pictogram.keywords) {
        keywordSet.add(keyword.toLowerCase());
        if (keywordSet.size >= limit) break;
      }
    }
    if (keywordSet.size >= limit) break;
  }

  return Array.from(keywordSet);
}

// ============================================================================
// SCORING AND RANKING SYSTEM
// ============================================================================

interface ScoredPictogram {
  id: number;
  score: number;
  matchReasons: string[];
}

/**
 * Calculate relevance score for a pictogram against search terms
 * Returns detailed scoring with reasons for debugging
 */
function calculatePictogramScore(
  pictogram: { id: number; keywords: string[]; tags: string[] },
  searchTerms: { keywords: Set<string>; tags: Set<string> },
  categoryWords: string[],
  isAIMatch: boolean = false
): ScoredPictogram {
  let score = 0;
  const matchReasons: string[] = [];

  const keywords = pictogram.keywords || [];
  const tags = pictogram.tags || [];

  // Check keywords
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();

    // Check against search keywords
    for (const searchKeyword of searchTerms.keywords) {
      if (keywordLower === searchKeyword) {
        score += isAIMatch ? SCORE_WEIGHTS.AI_KEYWORD_MATCH : SCORE_WEIGHTS.EXACT_KEYWORD_MATCH;
        matchReasons.push(`exact_keyword:${keyword}`);
      } else if (keywordLower.includes(searchKeyword) || searchKeyword.includes(keywordLower)) {
        if (keywordLower.length > 2 && searchKeyword.length > 2) {
          score += SCORE_WEIGHTS.PARTIAL_KEYWORD_MATCH;
          matchReasons.push(`partial_keyword:${keyword}~${searchKeyword}`);
        }
      }
    }

    // Check against category words
    for (const word of categoryWords) {
      if (word.length >= 3 && keywordLower === word) {
        score += SCORE_WEIGHTS.WORD_IN_KEYWORD;
        matchReasons.push(`word_keyword:${keyword}`);
      }
    }
  }

  // Check tags
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();

    // Check against search tags
    for (const searchTag of searchTerms.tags) {
      if (tagLower === searchTag) {
        score += isAIMatch ? SCORE_WEIGHTS.AI_TAG_MATCH : SCORE_WEIGHTS.EXACT_TAG_MATCH;
        matchReasons.push(`exact_tag:${tag}`);
      } else if (tagLower.includes(searchTag) || searchTag.includes(tagLower)) {
        if (tagLower.length > 3 && searchTag.length > 3) {
          score += SCORE_WEIGHTS.PARTIAL_TAG_MATCH;
          matchReasons.push(`partial_tag:${tag}~${searchTag}`);
        }
      }
    }

    // Check against category words
    for (const word of categoryWords) {
      if (word.length >= 3 && tagLower.includes(word)) {
        score += SCORE_WEIGHTS.WORD_IN_TAG;
        matchReasons.push(`word_tag:${tag}`);
      }
    }
  }

  return { id: pictogram.id, score, matchReasons };
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
  console.log('Loading predefined categories...');

  // Try to load from file first
  let categories = await loadPredefinedCategories();

  // If file is empty or doesn't exist, generate it
  if (Object.keys(categories).length === 0) {
    console.log('Predefined categories file is empty, generating from master database...');
    const pictograms = await loadMasterPictograms();
    categories = {};

    for (const categoryName of PREDEFINED_CATEGORIES) {
      const pictogramIds = findPictogramsByCategory(categoryName, pictograms);
      categories[categoryName] = pictogramIds;
      console.log(`${categoryName}: ${pictogramIds.length} pictograms found`);
    }

    // Save to predefined categories file
    const dataDir = path.dirname(PREDEFINED_CATEGORIES_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(
      PREDEFINED_CATEGORIES_FILE_PATH,
      JSON.stringify(categories, null, 2),
      'utf-8'
    );
    console.log('Predefined categories generated and saved');
  } else {
    console.log('Predefined categories loaded from file');
  }

  return categories;
}

/**
 * Use Azure OpenAI to find relevant pictograms for a new category
 * Uses AI-only approach for better quality results
 * 
 * OPTIMIZED VERSION with:
 * - AI-driven keyword/tag generation
 * - Detailed scoring system
 * - Quality filtering (minimum score threshold)
 * - Ranking by relevance
 * - Fallback to Gemini if Azure fails
 * - Comprehensive logging for debugging
 */
async function findPictogramsWithAI(
  categoryName: string,
  maxResults: number = 50,
  description?: string
): Promise<number[]> {
  console.log('\n' + '='.repeat(80));
  console.log(`STARTING PICTOGRAM SEARCH FOR CATEGORY: "${categoryName}"`);
  if (description) console.log(`Description: "${description}"`);
  console.log('='.repeat(80));

  const config = {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    model: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini'
  };

  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI is not configured. Verify environment variables AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY.');
  }

  // Load all pictograms and unique tags
  const pictograms = await loadMasterPictograms();
  const uniqueTags = await getUniqueTags();

  console.log(`Database stats: ${pictograms.length} pictograms, ${uniqueTags.length} unique tags`);

  // ============================================================================
  // STEP 1: AI-DRIVEN KEYWORD/TAG GENERATION
  // ============================================================================
  console.log('\nSTEP 1: AI-driven keyword/tag generation...');

  // Get relevant tags from database for AI context
  const categoryNameLower = categoryName.toLowerCase();
  const categoryWords = categoryNameLower.split(/\s+/).filter(w => w.length >= 3);
  
  const relevantDatabaseTags = uniqueTags.filter(tag => {
    for (const word of categoryWords) {
      if (tag.includes(word) || word.includes(tag)) return true;
    }
    return false;
  }).slice(0, 30);

  console.log(`   Relevant database tags: [${relevantDatabaseTags.slice(0, 10).join(', ')}${relevantDatabaseTags.length > 10 ? '...' : ''}]`);

  // Build optimized prompt (without local search contamination)
  const categoryContext = description
    ? `Category name: "${categoryName}"\nCategory description: "${description}"`
    : `Category name: "${categoryName}"`;

  const prompt = `You are an expert at categorizing pictograms for AAC (Augmentative and Alternative Communication) systems used by children with communication difficulties.

CATEGORY TO ANALYZE:
${categoryContext}

AVAILABLE DATABASE TAGS (use these exact terms when relevant):
${JSON.stringify(relevantDatabaseTags.length > 0 ? relevantDatabaseTags : uniqueTags.slice(0, 50), null, 2)}

YOUR TASK:
Generate keywords and tags that will match pictograms belonging to this category.

IMPORTANT GUIDELINES:
1. KEYWORDS should be specific nouns, verbs, or adjectives that represent items/concepts in this category
2. TAGS should be semantic categories from the AVAILABLE DATABASE TAGS list above when possible
3. Focus on terms a child would understand and relate to
4. Include common synonyms and related concepts
5. Prioritize concrete, visual concepts over abstract ones
6. Generate 15-30 keywords for comprehensive coverage
7. Generate 1-5 tags for semantic categorization

EXAMPLES:
- For "Emotions": keywords=["happy","sad","angry","scared","surprised","tired","excited","cry","laugh","smile"], tags=["emotion","feeling","psychology"]
- For "Furniture": keywords=["chair","table","bed","sofa","desk","lamp","wardrobe","shelf","drawer","closet"], tags=["furniture","household","home","object"]
- For "Weather": keywords=["sun","rain","cloud","snow","wind","storm","rainbow","thunder","lightning","fog"], tags=["weather","nature","climate"]

Return ONLY valid JSON (no markdown, no explanation):
{"keywords": ["word1", "word2", ...], "tags": ["tag1", "tag2", ...]}`;

  let aiSearchTerms: { keywords: string[]; tags: string[] } = { keywords: [], tags: [] };

  try {
    console.log('   Calling Azure OpenAI...');
    const response = await fetch(
      config.url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': config.key,
        },
        body: JSON.stringify({
          model: config.model,
          instructions: 'You are a semantic analysis expert for AAC pictogram databases. Return only valid JSON with relevant keywords and tags. Be precise and child-appropriate.',
          input: prompt,
          max_output_tokens: 1000,
          reasoning: {
            effort: 'minimal'
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: { message?: string } | string };
      const errorMessage = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error;
      throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    const data = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
    
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
      throw new Error('Empty response from AI');
    }

    console.log(`   AI raw response: ${output.substring(0, 200)}...`);

    // Parse AI response
    const cleaned = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.keywords && Array.isArray(parsed.keywords)) {
      aiSearchTerms.keywords = parsed.keywords
        .map((k: any) => String(k).toLowerCase().trim())
        .filter((k: string) => k.length >= 2);
    }
    if (parsed.tags && Array.isArray(parsed.tags)) {
      aiSearchTerms.tags = parsed.tags
        .map((t: any) => String(t).toLowerCase().trim())
        .filter((t: string) => t.length >= 2);
    }

    console.log(`   AI generated ${aiSearchTerms.keywords.length} keywords: [${aiSearchTerms.keywords.slice(0, 10).join(', ')}...]`);
    console.log(`   AI generated ${aiSearchTerms.tags.length} tags: [${aiSearchTerms.tags.join(', ')}]`);

  } catch (aiError: any) {
    console.warn(`   Azure OpenAI failed: ${aiError.message}`);
    console.log('   Attempting fallback to Gemini...');
    
    // Try Gemini as fallback (same pattern as index.js)
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        console.log('   Gemini API key not configured, continuing with local search only...');
      } else {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        
        // Simplified prompt for Gemini
        const geminiPrompt = `You are an expert at categorizing pictograms for AAC systems.

CATEGORY: "${categoryName}"
${description ? `DESCRIPTION: "${description}"` : ''}

Generate keywords and tags that will match pictograms in this category.

Return ONLY valid JSON (no markdown, no explanation):
{"keywords": ["word1", "word2", ...], "tags": ["tag1", "tag2", ...]}`;

        // Try different Gemini models
        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
        let geminiOutput = null;
        
        for (const modelName of modelsToTry) {
          try {
            console.log(`   Trying Gemini model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(geminiPrompt);
            const response = await result.response;
            geminiOutput = response.text();
            console.log(`   Gemini response received from ${modelName}`);
            break;
          } catch (modelError: any) {
            console.log(`   ${modelName} failed: ${modelError.message?.substring(0, 100)}`);
            continue;
          }
        }
        
        if (geminiOutput) {
          console.log(`   Gemini raw response: ${geminiOutput.substring(0, 200)}...`);
          
          // Parse Gemini response (same as Azure)
          try {
            const cleaned = geminiOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            
            if (parsed.keywords && Array.isArray(parsed.keywords)) {
              aiSearchTerms.keywords = parsed.keywords
                .map((k: any) => String(k).toLowerCase().trim())
                .filter((k: string) => k.length >= 2);
              console.log(`   Gemini generated ${aiSearchTerms.keywords.length} keywords`);
            }
            if (parsed.tags && Array.isArray(parsed.tags)) {
              aiSearchTerms.tags = parsed.tags
                .map((t: any) => String(t).toLowerCase().trim())
                .filter((t: string) => t.length >= 2);
              console.log(`   Gemini generated ${aiSearchTerms.tags.length} tags`);
            }
            
            console.log(`   Gemini keywords: [${aiSearchTerms.keywords.slice(0, 10).join(', ')}${aiSearchTerms.keywords.length > 10 ? '...' : ''}]`);
            console.log(`   Gemini tags: [${aiSearchTerms.tags.join(', ')}]`);
          } catch (parseError: any) {
            console.error(`   Failed to parse Gemini response: ${parseError.message}`);
            console.log('   Continuing with local search results only...');
          }
        } else {
          console.log('   All Gemini models failed, continuing with local search only...');
        }
      }
    } catch (geminiError: any) {
      console.error(`   Gemini fallback also failed: ${geminiError.message}`);
      console.log('   Continuing with local search results only...');
    }
  }

  // ============================================================================
  // STEP 2: SCORE AND RANK PICTOGRAMS USING AI-GENERATED TERMS
  // ============================================================================
  console.log('\nSTEP 2: Scoring and ranking pictograms...');

  const scoredPictograms: ScoredPictogram[] = [];

  if (aiSearchTerms.keywords.length > 0 || aiSearchTerms.tags.length > 0) {
    const aiTerms = {
      keywords: new Set(aiSearchTerms.keywords),
      tags: new Set(aiSearchTerms.tags)
    };

    for (const pictogram of pictograms) {
      const scored = calculatePictogramScore(pictogram, aiTerms, [], true);
      if (scored.score >= MIN_RELEVANCE_SCORE) {
        scoredPictograms.push(scored);
      }
    }

    scoredPictograms.sort((a, b) => b.score - a.score);
    console.log(`   Found ${scoredPictograms.length} pictograms above threshold (min score: ${MIN_RELEVANCE_SCORE})`);
    
    if (scoredPictograms.length > 0) {
      console.log(`   Top 5 matches:`);
      scoredPictograms.slice(0, 5).forEach((p, i) => {
        const pict = pictograms.find(x => x.id === p.id);
        console.log(`      ${i + 1}. ID ${p.id} (score: ${p.score}) - keywords: [${pict?.keywords?.slice(0, 3).join(', ')}]`);
      });
    }
  } else {
    console.warn('   No AI keywords/tags generated, returning empty results');
  }

  // ============================================================================
  // STEP 3: FILTER AND LIMIT FINAL RESULTS
  // ============================================================================
  console.log('\nSTEP 3: Filtering and limiting results...');

  // Take top results up to maxResults
  const finalResults = scoredPictograms
    .slice(0, maxResults)
    .map(p => p.id);

  // Log final results summary
  console.log('\n' + '='.repeat(80));
  console.log(`SEARCH COMPLETE: Found ${finalResults.length} pictograms for "${categoryName}"`);
  console.log(`   - AI-generated keywords: ${aiSearchTerms.keywords.length}`);
  console.log(`   - AI-generated tags: ${aiSearchTerms.tags.length}`);
  console.log(`   - Total matches: ${scoredPictograms.length}`);
  console.log(`   - Final (after limit): ${finalResults.length}`);
  
  if (finalResults.length > 0) {
    console.log('\n   Top 10 final results:');
    finalResults.slice(0, 10).forEach((id, i) => {
      const pict = pictograms.find(p => p.id === id);
      const scored = scoredPictograms.find(s => s.id === id);
      console.log(`      ${i + 1}. ID ${id} (score: ${scored?.score || 0}) - "${pict?.keywords?.[0] || 'unknown'}"`);
    });
  }
  console.log('='.repeat(80) + '\n');

  return finalResults;
}

/**
 * Create a new user-specific category
 * Uses AI to find relevant pictograms
 * Includes input validation to prevent invalid categories
 */
async function createUserCategory(
  userId: string,
  categoryName: string,
  maxResults: number = 50,
  description?: string
): Promise<number[]> {
  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================

  // Validate userId
  if (!isValidUserId(userId)) {
    throw new Error('Invalid user ID. Please log in again.');
  }

  // Sanitize and validate category name
  const sanitizedName = sanitizeCategoryName(categoryName);
  if (!sanitizedName) {
    throw new Error('Invalid category name. Please use at least 2 characters with letters and numbers only.');
  }

  // Enforce maximum results limit
  const limitedMaxResults = Math.min(Math.max(1, maxResults), MAX_PICTOGRAM_RESULTS);

  // Check if it's a predefined category
  if (PREDEFINED_CATEGORIES.includes(sanitizedName)) {
    throw new Error(`Category "${sanitizedName}" is a predefined category and cannot be recreated`);
  }

  // Check if category already exists in user categories
  const userCategories = await loadUserCategories(userId);
  if (userCategories[sanitizedName]) {
    throw new Error(`Category "${sanitizedName}" already exists for this user`);
  }

  // Use AI to find relevant pictograms
  console.log(`Finding pictograms for new category "${sanitizedName}" for user ${userId}${description ? ` with description: "${description}"` : ''}...`);
  const pictogramIds = await findPictogramsWithAI(sanitizedName, limitedMaxResults, description);

  // ============================================================================
  // DEDUPLICATION: Ensure no duplicate IDs in result
  // ============================================================================
  const uniquePictogramIds = [...new Set(pictogramIds)];

  // Graceful handling: Return empty array if no pictograms found (don't throw)
  if (uniquePictogramIds.length === 0) {
    console.warn(`No pictograms found for category "${sanitizedName}". Creating empty category.`);
  }

  // Add to user categories
  userCategories[sanitizedName] = uniquePictogramIds;
  await saveUserCategories(userId, userCategories);

  console.log(`Category "${sanitizedName}" created for user ${userId} with ${uniquePictogramIds.length} pictograms`);
  return uniquePictogramIds;
}

/**
 * Delete a user-specific category
 * Cannot delete predefined categories
 */
async function deleteUserCategory(userId: string, categoryName: string): Promise<void> {
  if (PREDEFINED_CATEGORIES.includes(categoryName)) {
    throw new Error(`Cannot delete predefined category "${categoryName}"`);
  }

  const userCategories = await loadUserCategories(userId);
  if (!userCategories[categoryName]) {
    throw new Error(`Category "${categoryName}" does not exist for this user`);
  }

  delete userCategories[categoryName];
  await saveUserCategories(userId, userCategories);

  console.log(`Category "${categoryName}" deleted for user ${userId}`);
}

/**
 * Get all categories for a specific user (predefined + user-specific ONLY)
 * 
 * IMPORTANT: This function intentionally DOES NOT load legacy global categories
 * to ensure proper user isolation. Each user should only see:
 * 1. Predefined categories (available to all users)
 * 2. Their own user-specific categories
 * 
 * This fixes the bug where categories created by one user appeared for all users.
 */
async function getUserCategories(userId: string): Promise<Record<string, number[]>> {
  // Load predefined categories (shared by all users)
  const predefined = await initializePredefinedCategories();

  // Load user-specific categories ONLY
  // DO NOT load legacy global categories - this was causing cross-user data leakage
  const userCategories = await loadUserCategories(userId);

  // Merge: predefined + user-specific only (user-specific has priority)
  // This ensures strict user isolation - no shared custom categories
  return { ...predefined, ...userCategories };
}

/**
 * Get pictogram IDs for a specific user category
 */
async function getUserCategoryPictograms(userId: string, categoryName: string): Promise<number[]> {
  // Check if it's a predefined category
  if (PREDEFINED_CATEGORIES.includes(categoryName)) {
    const predefined = await initializePredefinedCategories();
    return predefined[categoryName] || [];
  }

  // Check user-specific categories
  const userCategories = await loadUserCategories(userId);
  return userCategories[categoryName] || [];
}

/**
 * Check if a category is predefined
 */
function isPredefinedCategory(categoryName: string): boolean {
  return PREDEFINED_CATEGORIES.includes(categoryName);
}

module.exports = {
  loadPredefinedCategories,
  loadUserCategories,
  saveUserCategories,
  initializePredefinedCategories,
  createUserCategory,
  deleteUserCategory,
  getUserCategories,
  getUserCategoryPictograms,
  isPredefinedCategory,
  PREDEFINED_CATEGORIES
};

