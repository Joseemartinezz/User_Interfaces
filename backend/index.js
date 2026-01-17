// Load environment variables FIRST, before any other require
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const { generateAzurePhrases, generateMoreAzurePhrases, testAzureConnection } = require('./services/azureService.ts');
const { generateAacImage, generateAacImagesForPhrases } = require('./services/imageService.ts');
const {
  getAllCategories,
  getUserCategories,
  getCategoryPictograms,
  getUserCategoryPictograms,
  createCategory,
  createUserCategory,
  deleteCategory,
  deleteUserCategory,
  initializePredefinedCategories,
  isPredefinedCategory,
  PREDEFINED_CATEGORIES
} = require('./services/categoryService.ts');
const {
  searchPictograms,
  getPictogramById,
  getPictogramImage,
  searchMultiplePictograms
} = require('./services/arasaacService.ts');

const app = express();
const PORT = process.env.PORT || 3000;

    // Middleware that runs on all requests
    // 1. CORS - Allows requests from frontend
    app.use(cors());

    // 2. JSON Parser - Converts JSON body to JavaScript object
    app.use(express.json());

// Middleware logging for all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'N/A'}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  if (Object.keys(req.body).length > 0 && req.method !== 'GET') {
    console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  
  // Intercept response to log status
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 [${timestamp}] ${req.method} ${req.path} → ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});

/**
 * Simple authentication middleware
 * Extracts userId from Authorization header or body
 * In production, should verify Firebase token with Admin SDK
 */
const authenticateUser = (req, res, next) => {
  // Try to get userId from Authorization header (format: "Bearer userId" or just "userId")
  const authHeader = req.headers.authorization;
  let userId = null;
  
  if (authHeader) {
    // If it comes as "Bearer userId", extract userId
    const parts = authHeader.split(' ');
    userId = parts.length > 1 ? parts[1] : parts[0];
  }
  
  // If not in header, try from body
  if (!userId && req.body && req.body.userId) {
    userId = req.body.userId;
  }
  
  // If still no userId, try from query (for GET requests)
  if (!userId && req.query && req.query.userId) {
    userId = req.query.userId;
  }
  
  if (!userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'userId is required for this operation. Include userId in Authorization header, body or query.'
    });
  }
  
  // Add userId to request for use in handlers
  req.userId = userId;
  next();
};

// Azure OpenAI Configuration (Primary Provider) - For phrase generation
const AZURE_OPENAI_PHRASE_URL = process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL;
const AZURE_OPENAI_PHRASE_KEY = process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY;

if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
  console.warn('⚠️ WARNING: Azure OpenAI for phrases is not configured in environment variables');
  console.warn('   Add AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY to backend/.env file');
  console.warn('   Azure OpenAI is the primary AI provider');
} else {
  console.log('✅ Azure OpenAI configured (Primary Provider)');
}

// Gemini Configuration (Secondary Provider/Fallback)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not configured in environment variables');
  console.warn('   Add GEMINI_API_KEY=your_key_here to backend/.env file');
  console.warn('   Gemini will be used as fallback if Azure OpenAI fails');
} else {
  console.log('✅ Gemini configured (Secondary Provider/Fallback)');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

/**
 * Lists available Gemini models
 * Useful for debugging
 */
async function listAvailableModels() {
  try {
    // Try to list models if method is available
    if (typeof genAI.listModels === 'function') {
      const models = await genAI.listModels();
      const modelNames = Array.isArray(models) 
        ? models.map(model => model.name || model)
        : [];
      console.log('📋 Available models:', modelNames);
      return modelNames;
    } else {
      console.log('⚠️ listModels() is not available in this SDK version');
      return [];
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    return [];
  }
}

/**
 * Extracts numbered phrases from the response text
 */
function extractPhrases(text) {
  const lines = text.split('\n');
  const phrases = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Search for lines that start with number followed by period
    const match = trimmed.match(/^\d+\.\s*(.+)$/);
    if (match && match[1]) {
      phrases.push(match[1].trim());
    }
  }

  return phrases.length > 0 ? phrases : [text.trim()];
}

/**
 * Endpoint to generate phrases
 * Uses Azure OpenAI as primary provider, Gemini as fallback
 */
app.post('/api/generate-phrases', async (req, res) => {
  try {
    const { words, childAge } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    // Try first with Azure OpenAI (Primary Provider)
    if (AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) {
      try {
        console.log('🔄 Attempting to generate phrases with Azure OpenAI (Primary Provider)...');
        const phrases = await generateAzurePhrases(words, childAge);
        console.log('✅ Phrases generated successfully with Azure OpenAI');
        return res.json({ phrases });
      } catch (azureError) {
        console.error('❌ Azure OpenAI failed:', azureError.message);
        console.log('⚠️ Attempting with Gemini as fallback...');
      }
    } else {
      console.log('⚠️ Azure OpenAI is not configured, using Gemini as primary provider...');
    }

    // If Azure failed or is not configured, try with Gemini (Secondary Provider)
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'No AI provider is configured',
        message: 'Configure AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY, or GEMINI_API_KEY in backend/.env'
      });
    }

    // Build age-specific context for the prompt
    const ageContext = childAge 
      ? `The child is ${childAge} years old. Adjust the language complexity, vocabulary, and sentence structure to be age-appropriate for a ${childAge}-year-old child.`
      : 'Adjust the language complexity and vocabulary to be appropriate for a child.';

    const basePrompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
${ageContext}
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- Use vocabulary and sentence complexity appropriate for the child's age.
- Generate exactly 3 different phrases.
- Return one phrase per line, numbered starting from 1.
`;

    console.log('🔄 Calling Gemini API with words:', words);
    
    // Try with different Gemini models in order of preference
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Attempting with Gemini model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Response received from Gemini with model: ${modelName}`);
        console.log('📄 Full text:', text);
        break; // If it works, exit the loop
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.log(`❌ ${modelName} failed:`, errorMsg.substring(0, 150));
        lastError = modelError;
        continue; // Try next model
      }
    }
    
    if (!text) {
      // If all Gemini models failed
      console.log('⚠️ All Gemini models failed. Listing available models...');
      await listAvailableModels();
      throw lastError || new Error('All AI providers failed. Verify your configuration.');
    }

    const phrases = extractPhrases(text);
    // Limit to exactly 3 phrases for initial generation
    const limitedPhrases = phrases.slice(0, 3);
    console.log(`📊 Extracted phrases: ${phrases.length}, limited to: ${limitedPhrases.length}`);
    if (limitedPhrases.length !== 3) {
      console.warn(`⚠️ Warning: Expected 3 phrases but got ${limitedPhrases.length}`);
    }
    res.json({ phrases: limitedPhrases });
  } catch (error) {
    console.error('❌ Error generating phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // More useful error message
    let errorMessage = error.message || 'Unknown error';
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'Gemini model is not available. Verify your API key and available models.';
    } else if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'Invalid Gemini API Key or no permissions. Verify your API key.';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Gemini API quota exceeded. Verify your plan.';
    }
    
    res.status(500).json({ 
      error: 'Error generating phrases',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        status: error.status
      } : undefined
    });
  }
});

/**
 * Endpoint to generate more phrases
 * Uses Azure OpenAI as primary provider, Gemini as fallback
 */
app.post('/api/generate-more-phrases', async (req, res) => {
  try {
    const { words, existingPhrases, childAge } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    if (!existingPhrases || !Array.isArray(existingPhrases)) {
      return res.status(400).json({ error: 'An array of existing phrases is required' });
    }

    // Try first with Azure OpenAI (Primary Provider)
    if (AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) {
      try {
        console.log('🔄 Attempting to generate more phrases with Azure OpenAI (Primary Provider)...');
        const phrases = await generateMoreAzurePhrases(words, existingPhrases, childAge);
        // Limit to exactly 1 phrase for "Generate More" (one additional phrase)
        const limitedPhrases = phrases.slice(0, 1);
        console.log(`📊 Azure phrases: ${phrases.length}, limited to: ${limitedPhrases.length}`);
        if (limitedPhrases.length !== 1) {
          console.warn(`⚠️ Warning: Expected 1 phrase but got ${limitedPhrases.length}`);
        }
        console.log('✅ Phrase generated successfully with Azure OpenAI');
        return res.json({ phrases: limitedPhrases });
      } catch (azureError) {
        console.error('❌ Azure OpenAI failed:', azureError.message);
        console.log('⚠️ Attempting with Gemini as fallback...');
      }
    } else {
      console.log('⚠️ Azure OpenAI is not configured, using Gemini as primary provider...');
    }

    // If Azure failed or is not configured, try with Gemini (Secondary Provider)
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'No AI provider is configured',
        message: 'Configure AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY, or GEMINI_API_KEY in backend/.env'
      });
    }

    // Build age-specific context for the prompt
    const ageContext = childAge 
      ? `The child is ${childAge} years old. Adjust the language complexity, vocabulary, and sentence structure to be age-appropriate for a ${childAge}-year-old child.`
      : 'Adjust the language complexity and vocabulary to be appropriate for a child.';

    const basePrompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
${ageContext}
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

IMPORTANT: You MUST generate EXACTLY 1 phrase. No more, no less. Just one single phrase.

Guidelines:
- The phrase must be short but contain ALL information provided.
- It should sound natural when spoken aloud.
- It must be grammatically correct and easy for a child.
- Use vocabulary and sentence complexity appropriate for the child's age.
- Generate EXACTLY 1 phrase. Do not generate 2, 3, or any other number. Only 1.
- Return exactly 1 phrase.
`;

    const promptMore = basePrompt + '\n\nDo NOT repeat any of these phrases:\n' + existingPhrases.join('\n') + '\n\nRemember: Generate EXACTLY 1 new phrase only.';

    // Try with different Gemini models in order of preference
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Attempting with Gemini model: ${modelName} to generate more phrases...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptMore);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Response received from Gemini with model: ${modelName}`);
        console.log('📄 Full text:', text);
        break; // If it works, exit the loop
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.log(`❌ ${modelName} failed:`, errorMsg.substring(0, 150));
        lastError = modelError;
        continue; // Try next model
      }
    }
    
    if (!text) {
      // If all Gemini models failed
      console.log('⚠️ All Gemini models failed. Listing available models...');
      await listAvailableModels();
      throw lastError || new Error('All AI providers failed. Verify your configuration.');
    }

    const phrases = extractPhrases(text);
    // Limit to exactly 1 phrase for "Generate More" (one additional phrase)
    const limitedPhrases = phrases.slice(0, 1);
    console.log(`📊 Extracted phrases: ${phrases.length}, limited to: ${limitedPhrases.length}`);
    if (limitedPhrases.length !== 1) {
      console.warn(`⚠️ Warning: Expected 1 phrase but got ${limitedPhrases.length}`);
    }
    res.json({ phrases: limitedPhrases });
  } catch (error) {
    console.error('❌ Error generating more phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // More useful error message
    let errorMessage = error.message || 'Unknown error';
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'Gemini model is not available. Verify your API key and available models.';
    } else if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'Invalid Gemini API Key or no permissions. Verify your API key.';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Gemini API quota exceeded. Verify your plan.';
    }
    
    res.status(500).json({ 
      error: 'Error generating more phrases',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        status: error.status
      } : undefined
    });
  }
});

// ==========================================
// IMAGE GENERATION ENDPOINT
// ==========================================

/**
 * Endpoint to generate an image with DALL-E for an AAC phrase
 * POST /api/generate-image
 * Body: { phrase: string }
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { phrase } = req.body;

    if (!phrase || typeof phrase !== 'string' || phrase.trim().length === 0) {
      return res.status(400).json({ 
        error: 'A valid phrase is required',
        message: 'The "phrase" field is required and must be a non-empty string'
      });
    }

    const imageBase64 = await generateAacImage(phrase.trim());
    
    res.json({ 
      imageBase64, 
      phrase: phrase.trim() 
    });
  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    let statusCode = 500;
    let errorMessage = error.message || 'Unknown error generating image';
    
    if (error.message?.includes('API key') || error.message?.includes('API Key') || error.message?.includes('not configured')) {
      statusCode = 500;
      errorMessage = 'Azure OpenAI API Key not configured. Configure AZURE_OPENAI_IMAGE_API_KEY in backend/.env';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      statusCode = 429;
      errorMessage = 'Azure OpenAI quota exceeded. Verify your plan.';
    }
    
    res.status(statusCode).json({ 
      error: 'Error generating image',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      } : undefined
    });
  }
});

/**
 * Endpoint to generate multiple images in parallel
 * POST /api/generate-images
 * Body: { phrases: string[] }
 */
app.post('/api/generate-images', async (req, res) => {
  try {
    const { phrases } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({ 
        error: 'An array of phrases is required',
        message: 'The "phrases" field must be a non-empty array'
      });
    }

    // Validate that all phrases are strings
    const validPhrases = phrases
      .filter(p => typeof p === 'string' && p.trim().length > 0)
      .map(p => p.trim());

    if (validPhrases.length === 0) {
      return res.status(400).json({ 
        error: 'No valid phrases',
        message: 'All phrases must be non-empty strings'
      });
    }

    const results = await generateAacImagesForPhrases(validPhrases);
    
    res.json({ 
      images: results,
      total: results.length,
      successful: results.filter(r => r.imageBase64 !== '').length
    });
  } catch (error) {
    console.error('❌ Error generating images:', error);
    
    res.status(500).json({ 
      error: 'Error generating images',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE AZURE OPENAI (Directos - no usados por los endpoints principales)
// ==========================================

/**
 * Endpoint directo para generar frases con Azure OpenAI
 * POST /api/azure/generate-phrases
 * Nota: Los endpoints principales /api/generate-phrases ya usan Azure primero
 */
app.post('/api/azure/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI is not configured',
        message: 'Add AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY to backend/.env file'
      });
    }

    console.log('🔄 Calling Azure OpenAI API with words:', words);
    
    try {
      const phrases = await generateAzurePhrases(words);
      console.log(`✅ Response received from Azure OpenAI`);
      console.log('📄 Generated phrases:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Azure OpenAI error:', azureError);
      
      let errorMessage = azureError.message || 'Unknown error';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'Azure OpenAI API Key invalid. Verify your API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Azure OpenAI API quota exceeded. Verify your plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'Azure OpenAI deployment is not available. Verify the configuration.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE AZURE OPENAI (Directos - no usados por los endpoints principales)
// ==========================================

/**
 * Endpoint directo para generar frases con Azure OpenAI
 * POST /api/azure/generate-phrases
 * Nota: Los endpoints principales /api/generate-phrases ya usan Azure primero
 */
app.post('/api/azure/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI is not configured',
        message: 'Add AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY to backend/.env file'
      });
    }

    console.log('🔄 Calling Azure OpenAI API with words:', words);
    
    try {
      const phrases = await generateAzurePhrases(words);
      console.log(`✅ Response received from Azure OpenAI`);
      console.log('📄 Generated phrases:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Azure OpenAI error:', azureError);
      
      let errorMessage = azureError.message || 'Unknown error';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'Azure OpenAI API Key invalid. Verify your API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Azure OpenAI API quota exceeded. Verify your plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'Azure OpenAI deployment is not available. Verify the configuration.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

/**
 * Endpoint to generate more phrases with Azure OpenAI
 * POST /api/azure/generate-more-phrases
 */
app.post('/api/azure/generate-more-phrases', async (req, res) => {
  try {
    const { words, existingPhrases } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    if (!existingPhrases || !Array.isArray(existingPhrases)) {
      return res.status(400).json({ error: 'An array of existing phrases is required' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI is not configured',
        message: 'Add AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY to backend/.env file'
      });
    }

    console.log('🔄 Calling Azure OpenAI API to generate more phrases...');
    console.log('   Words:', words);
    console.log('   Existing phrases:', existingPhrases);
    
    try {
      const phrases = await generateMoreAzurePhrases(words, existingPhrases);
      console.log(`✅ Response received from Azure OpenAI`);
      console.log('📄 Generated phrases:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Azure OpenAI error:', azureError);
      
      let errorMessage = azureError.message || 'Unknown error';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'Azure OpenAI API Key invalid. Verify your API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Azure OpenAI API quota exceeded. Verify your plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'Azure OpenAI deployment is not available. Verify the configuration.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating more phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error generating more phrases',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE ARASAAC
// ==========================================

/**
 * Endpoint to serve pictogram images as proxy
 * GET /api/arasaac/image/:idPictogram
 * 
 * IMPORTANT: This route must go BEFORE other ARASAAC routes
 * to avoid routing conflicts
 */
app.get('/api/arasaac/image/:idPictogram', async (req, res) => {
  try {
    const { idPictogram } = req.params;
    const { color, backgroundColor, plural, skin, hair, action } = req.query;

    if (!idPictogram) {
      return res.status(400).json({ error: 'Pictogram ID is required' });
    }

    console.log(`🖼️ Serving pictogram image ID: ${idPictogram}`);
    console.log(`   Request from: ${req.headers['user-agent'] || 'Unknown'}`);

    // Use ARASAAC service to get image
    const { buffer: imageBuffer, contentType } = await getPictogramImage(parseInt(idPictogram), {
      color: color !== undefined ? color === 'true' : undefined,
      backgroundColor,
      plural: plural === 'true',
      skin,
      hair,
      action,
    });

    // Send image with correct headers for React Native
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS for React Native
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ Error getting image from ARASAAC:', error);
    
    if (error.message?.includes('not found')) {
      return res.status(404).json({ 
        error: 'Pictogram not found',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Error getting image',
      message: error.message
    });
  }
});

/**
 * Searches ARASAAC pictograms by search term
 * GET /api/arasaac/search/:language/:searchTerm
 */
app.get('/api/arasaac/search/:language/:searchTerm', async (req, res) => {
  try {
    const { language, searchTerm } = req.params;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ error: 'A search term is required' });
    }

    // Use ARASAAC service to search pictograms
    const pictograms = await searchPictograms(searchTerm, language);

    res.json(pictograms);
  } catch (error) {
    console.error('❌ Error searching pictograms in ARASAAC:', error);
    res.status(500).json({ 
      error: 'Error searching pictograms',
      message: error.message
    });
  }
});

/**
 * Gets information for a specific pictogram by ID
 * GET /api/arasaac/pictogram/:language/:idPictogram
 */
app.get('/api/arasaac/pictogram/:language/:idPictogram', async (req, res) => {
  try {
    const { language, idPictogram } = req.params;

    if (!idPictogram) {
      return res.status(400).json({ error: 'Se requiere un ID de pictograma' });
    }

    // Use ARASAAC service to get pictogram
    const pictogram = await getPictogramById(parseInt(idPictogram), language);

    res.json(pictogram);
  } catch (error) {
    console.error('❌ Error getting pictogram from ARASAAC:', error);
    
    if (error.message?.includes('not found')) {
      return res.status(404).json({ 
        error: 'Pictogram not found',
        message: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Error getting pictogram',
      message: error.message
    });
  }
});

/**
 * Endpoint to search pictograms for multiple words
 * POST /api/arasaac/search-multiple
 */
app.post('/api/arasaac/search-multiple', async (req, res) => {
  try {
    const { words, language = 'es' } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'An array of words is required' });
    }

    // Use ARASAAC service to search multiple pictograms
    const resultsMap = await searchMultiplePictograms(words, language);

    res.json(resultsMap);
  } catch (error) {
    console.error('❌ Error in multiple search:', error);
    res.status(500).json({ 
      error: 'Error searching multiple pictograms',
      message: error.message
    });
  }
});

/**
 * Root route - Server information
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'AAC Backend Server is running correctly',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      // Gemini endpoints
      generatePhrases: 'POST /api/generate-phrases',
      generateMorePhrases: 'POST /api/generate-more-phrases',
      // Azure OpenAI endpoints (directos)
      azureGeneratePhrases: 'POST /api/azure/generate-phrases',
      azureGenerateMorePhrases: 'POST /api/azure/generate-more-phrases',
      // ARASAAC endpoints
      arasaacSearch: 'GET /api/arasaac/search/:language/:searchTerm',
      arasaacPictogram: 'GET /api/arasaac/pictogram/:language/:idPictogram',
      arasaacImage: 'GET /api/arasaac/image/:idPictogram',
      arasaacSearchMultiple: 'POST /api/arasaac/search-multiple',
      // User & Profile endpoints
      userGet: 'GET /api/user',
      userUpdate: 'PUT /api/user',
      userReset: 'POST /api/user/reset',
      avatar: 'POST /api/avatar',
      userInitials: 'GET /api/user/initials'
    },
    hasGeminiApiKey: !!GEMINI_API_KEY,
    hasAzureOpenAI: !!(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY)
  });
});

// ============================================================================
// USER & PROFILE MANAGEMENT API
// ============================================================================

// In-memory user storage (for prototype - replace with database in production)
let userData = {
  id: 'default-user',
  email: 'user@example.com',
  fullName: 'Usuario',
  preferences: {
    language: 'es',
    theme: 1
  }
};

/**
 * GET /api/user - Obtiene datos del usuario actual
 */
app.get('/api/user', (req, res) => {
  try {
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuario',
      message: error.message
    });
  }
});

/**
 * PUT /api/user - Updates user data
 */
app.put('/api/user', (req, res) => {
  try {
    const { email, fullName, preferences } = req.body;
    
    // Validate data
    if (!email && !fullName && !preferences) {
      return res.status(400).json({ 
        error: 'At least one field is required to update' 
      });
    }
    
    // Update data
    if (email !== undefined) userData.email = email;
    if (fullName !== undefined) userData.fullName = fullName;
    if (preferences !== undefined) {
      userData.preferences = { ...userData.preferences, ...preferences };
    }
    
    console.log('✅ User updated:', userData);
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ 
      error: 'Error updating user',
      message: error.message
    });
  }
});

/**
 * POST /api/user/reset - Resets the user to default values
 */
app.post('/api/user/reset', (req, res) => {
  try {
    userData = {
      id: 'default-user',
      email: 'user@example.com',
      fullName: 'Usuario',
      preferences: {
        language: 'es',
        theme: 1,
        fontSize: 'medium'
      }
    };
    
    console.log('🔄 User reset to default values');
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error resetting user:', error);
    res.status(500).json({ 
      error: 'Error resetting user',
      message: error.message
    });
  }
});

/**
 * Endpoint to generate user avatars
 * POST /api/avatar
 * Returns PNG base64 data URL (compatible with React Native)
 */
app.post('/api/avatar', async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;
    
    // Import avatar generator
    const avatarGenerator = require('./utils/avatarGenerator.js');
    
    // Create consistent seed
    const seed = avatarGenerator.createUserSeed(userId, email, fullName);
    
    // Generate avatar (now async because it converts SVG to PNG)
    const avatarUrl = await avatarGenerator.generateAvatarDataUrl(seed);
    
    console.log(`✅ Avatar generated for seed: ${seed.substring(0, 10)}...`);
    res.json({ avatarUrl, seed });
  } catch (error) {
    console.error('❌ Error generating avatar:', error);
    res.status(500).json({ 
      error: 'Error generating avatar',
      message: error.message
    });
  }
});

/**
 * GET /api/user/initials - Gets the initials of the user
 */
app.get('/api/user/initials', (req, res) => {
  try {
    const avatarGenerator = require('./utils/avatarGenerator.js');
    const initials = avatarGenerator.getInitials(userData.fullName, userData.email);
    
    res.json({ initials });
  } catch (error) {
    console.error('❌ Error getting initials:', error);
    res.status(500).json({ 
      error: 'Error getting initials',
      message: error.message
    });
  }
});

/**
 * ========================================
 * CATEGORY MANAGEMENT ENDPOINTS
 * ========================================
 */

/**
 * GET /api/categories
 * Get all categories with their pictogram IDs
 * If userId is provided, returns only the user's categories
 */
app.get('/api/categories', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    let categories;
    if (userId) {
      // Load categories for specific user
      categories = await getUserCategories(userId);
      console.log(`✅ Categories loaded for user ${userId}: ${Object.keys(categories).length} categories`);
    } else {
      // Load all categories (backward compatibility)
      categories = await getAllCategories();
      console.log(`✅ All categories loaded: ${Object.keys(categories).length} categories`);
    }
    
    res.json({ categories });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      error: 'Error getting categories',
      message: error.message
    });
  }
});

/**
 * GET /api/categories/:categoryName
 * Get pictogram IDs for a specific category
 * If userId is provided, searches in the user's categories
 */
app.get('/api/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const userId = req.query.userId;
    
    let pictogramIds;
    if (userId) {
      pictogramIds = await getUserCategoryPictograms(userId, categoryName);
    } else {
      pictogramIds = await getCategoryPictograms(categoryName);
    }
    
    res.json({
      category: categoryName,
      pictogramIds,
      count: pictogramIds.length,
      isPredefined: isPredefinedCategory(categoryName)
    });
  } catch (error) {
    console.error('❌ Error getting category pictograms:', error);
    res.status(500).json({
      error: 'Error getting category pictograms',
      message: error.message
    });
  }
});

/**
 * POST /api/categories
 * Create a new custom category
 * Body: { categoryName: string, maxResults?: number, description?: string, userId: string }
 * Header: Authorization: Bearer <userId> (opcional si viene en body)
 */
app.post('/api/categories', authenticateUser, async (req, res) => {
  try {
    const { categoryName, maxResults = 50, description } = req.body;
    const userId = req.userId; // Obtained from authenticateUser middleware

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      return res.status(400).json({
        error: 'A valid category name is required'
      });
    }

    const trimmedName = categoryName.trim();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : undefined;

    // Validate category name
    if (isPredefinedCategory(trimmedName)) {
      return res.status(400).json({
        error: `Category "${trimmedName}" is a predefined category and cannot be recreated`
      });
    }

    // Create category using AI (user-specific)
    const pictogramIds = await createUserCategory(userId, trimmedName, maxResults, trimmedDescription);

    res.json({
      category: trimmedName,
      pictogramIds,
      count: pictogramIds.length,
      message: `Category "${trimmedName}" created successfully with ${pictogramIds.length} pictograms for user ${userId}`
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    
    // Check if it's a duplicate error
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Error creating category',
      message: error.message
    });
  }
});

/**
 * DELETE /api/categories/:categoryName
 * Delete a custom category (cannot delete predefined categories)
 * Header: Authorization: Bearer <userId> (optional if coming in body)
 */
app.delete('/api/categories/:categoryName', authenticateUser, async (req, res) => {
  try {
    const { categoryName } = req.params;
    const userId = req.userId; // Obtained from authenticateUser middleware

    if (isPredefinedCategory(categoryName)) {
      return res.status(400).json({
        error: `Cannot delete predefined category "${categoryName}"`
      });
    }

    await deleteUserCategory(userId, categoryName);

    res.json({
      message: `Category "${categoryName}" deleted successfully for user ${userId}`
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Error deleting custom category',
      message: error.message
    });
  }
});

/**
 * POST /api/categories/initialize
 * Initialize predefined categories (useful for first-time setup)
 */
app.post('/api/categories/initialize', async (req, res) => {
  try {
    const categories = await initializePredefinedCategories();
    
    res.json({
      message: 'Predefined categories initialized successfully',
      categories,
      predefinedCategories: PREDEFINED_CATEGORIES
    });
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    res.status(500).json({
      error: 'Error initializing categories',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasGeminiApiKey: !!GEMINI_API_KEY,
    hasAzureOpenAI: !!(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY)
  });
});

// Listen on all interfaces (0.0.0.0) to allow connections from emulators and devices
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`🌐 Also available at http://127.0.0.1:${PORT}`);
  console.log(`\n📡 API Keys configured:`);
  console.log(`   - Azure OpenAI (Primary): ${(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) ? '✅ Yes' : '❌ No'}`);
  console.log(`   - Gemini (Secondary/Fallback): ${GEMINI_API_KEY ? '✅ Yes' : '❌ No'}`);
  console.log(`\n💡 To connect from:`);
  console.log(`   - Web/Browser: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   - iOS Simulator: http://localhost:${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   - GET  /api/health - Check server status`);
  console.log(`   - GET  / - Server information`);
  console.log(`   - POST /api/generate-phrases - Generate phrases`);
  console.log(`   - GET  /api/arasaac/image/:id - Get pictogram image`);
  console.log(`   - GET  /api/categories - Get all categories`);
  console.log(`   - GET  /api/categories/:name - Get category pictograms`);
  console.log(`   - POST /api/categories - Create new custom category`);
  console.log(`   - DELETE /api/categories/:name - Delete custom category`);
  console.log(`   - POST /api/categories/initialize - Initialize predefined categories`);
  console.log(`\n🔍 Logging enabled: All requests will be logged here`);
  console.log(`${'='.repeat(60)}\n`);
});

