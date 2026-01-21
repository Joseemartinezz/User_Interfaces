/**
 * AAC Backend Server - TypeScript Version
 * 
 * This is the main entry point for the AAC backend server.
 * Converted to TypeScript with strict mode enabled for better type safety.
 */

// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';

// Import services
import { generateAzurePhrases, generateMoreAzurePhrases } from './services/azureService';
import { generateAacImage, generateAacImagesForPhrases } from './services/imageService';
import {
  getUserCategories,
  getUserCategoryPictograms,
  createUserCategory,
  createEmptyUserCategory,
  deleteUserCategory,
  initializePredefinedCategories,
  isPredefinedCategory,
  PREDEFINED_CATEGORIES
} from './services/categoryService';
import {
  searchPictograms,
  getPictogramById,
  getPictogramImage,
  searchMultiplePictograms
} from './services/arasaacService';
import {
  generateAvatarDataUrl,
  createUserSeed,
  getInitials
} from './services/avatarService';
import {
  getUserData,
  updateUserData,
  resetUserData,
  getCacheStats,
  UserPreferences
} from './services/userService';
import { getAzurePhraseConfig, getServerConfig } from './config';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Extended Request interface with userId from authentication
 */
interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Error with additional properties for API error handling
 */
interface ApiError extends Error {
  status?: number;
  statusText?: string;
}

/**
 * Request body types
 */
interface GeneratePhrasesBody {
  words: string[];
  childAge?: number;
}

interface GenerateMorePhrasesBody {
  words: string[];
  existingPhrases: string[];
  childAge?: number;
}

interface GenerateImageBody {
  phrase: string;
}

interface GenerateImagesBody {
  phrases: string[];
}

interface SearchMultipleBody {
  words: string[];
  language?: string;
}

interface CreateCategoryBody {
  categoryName: string;
  maxResults?: number;
  description?: string;
  userId?: string;
}

interface CreateEmptyCategoryBody {
  categoryName: string;
  userId?: string;
}

interface AvatarBody {
  userId?: string;
  email?: string;
  fullName?: string;
}

interface UpdateUserBody {
  email?: string;
  fullName?: string;
  preferences?: Partial<UserPreferences>;
  userId?: string;
}

interface PictogramImageOptions {
  color?: boolean;
  backgroundColor?: string;
  plural?: boolean;
  skin?: string;
  hair?: string;
  action?: string;
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Application = express();
const serverConfig = getServerConfig();
const PORT: number = serverConfig.port;

// Middleware that runs on all requests
// 1. CORS - Allows requests from frontend
app.use(cors());

// 2. JSON Parser - Converts JSON body to JavaScript object
app.use(express.json());

// Middleware logging for all requests
app.use((req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'N/A'}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  if (Object.keys(req.body as object).length > 0 && req.method !== 'GET') {
    console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  
  // Intercept response to log status
  const originalSend = res.send.bind(res);
  res.send = function(data: unknown): Response {
    console.log(`[${timestamp}] ${req.method} ${req.path} -> ${res.statusCode}`);
    return originalSend(data);
  };
  
  next();
});

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Simple authentication middleware
 * Extracts userId from Authorization header or body
 * In production, should verify Firebase token with Admin SDK
 */
const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  // Try to get userId from Authorization header (format: "Bearer userId" or just "userId")
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  
  if (authHeader) {
    // If it comes as "Bearer userId", extract userId
    const parts = authHeader.split(' ');
    userId = parts.length > 1 ? parts[1] : parts[0];
  }
  
  // If not in header, try from body
  const body = req.body as { userId?: string };
  if (!userId && body?.userId) {
    userId = body.userId;
  }
  
  // If still no userId, try from query (for GET requests)
  if (!userId && req.query?.userId) {
    userId = req.query.userId as string;
  }
  
  if (!userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'userId is required for this operation. Include userId in Authorization header, body or query.'
    });
    return;
  }
  
  // Add userId to request for use in handlers
  (req as AuthenticatedRequest).userId = userId;
  next();
};

// ============================================================================
// Azure OpenAI Configuration (using centralized config)
// ============================================================================

const azurePhraseConfig = getAzurePhraseConfig();

if (!azurePhraseConfig.isConfigured) {
  console.warn('WARNING: Azure OpenAI for phrases is not configured in environment variables');
  console.warn('   Add AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY to backend/.env file');
  console.warn('   Azure OpenAI is required for AI features');
} else {
  console.log('Azure OpenAI configured');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats error messages for Azure OpenAI errors
 */
function formatAzureErrorMessage(error: ApiError): string {
  let errorMessage = error.message || 'Unknown error';
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    errorMessage = 'Azure OpenAI API Key invalid. Verify your API key.';
  } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
    errorMessage = 'Azure OpenAI API quota exceeded. Verify your plan.';
  } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
    errorMessage = 'Azure OpenAI deployment is not available. Verify the configuration.';
  }
  return errorMessage;
}

// ============================================================================
// Phrase Generation Endpoints
// ============================================================================

/**
 * Endpoint to generate phrases
 * Uses Azure OpenAI for phrase generation
 */
app.post('/api/generate-phrases', async (req: Request, res: Response): Promise<void> => {
  try {
    const { words, childAge } = req.body as GeneratePhrasesBody;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({ error: 'An array of words is required' });
      return;
    }

    // Check if Azure OpenAI is configured
    if (!azurePhraseConfig.isConfigured) {
      res.status(500).json({ 
        error: 'Azure OpenAI is not configured',
        message: 'Configure AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY in backend/.env'
      });
      return;
    }

    console.log('Generating phrases with Azure OpenAI...');
    const phrases = await generateAzurePhrases(words, childAge);
    console.log('Phrases generated successfully with Azure OpenAI');
    res.json({ phrases });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error generating phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    const errorMessage = formatAzureErrorMessage(error);
    
    res.status(500).json({ 
      error: 'Error generating phrases',
      message: errorMessage,
      details: serverConfig.isDevelopment ? {
        originalError: error.message,
        status: error.status
      } : undefined
    });
  }
});

/**
 * Endpoint to generate more phrases
 * Uses Azure OpenAI for phrase generation
 */
app.post('/api/generate-more-phrases', async (req: Request, res: Response): Promise<void> => {
  try {
    const { words, existingPhrases, childAge } = req.body as GenerateMorePhrasesBody;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({ error: 'An array of words is required' });
      return;
    }

    if (!existingPhrases || !Array.isArray(existingPhrases)) {
      res.status(400).json({ error: 'An array of existing phrases is required' });
      return;
    }

    // Check if Azure OpenAI is configured
    if (!azurePhraseConfig.isConfigured) {
      res.status(500).json({ 
        error: 'Azure OpenAI is not configured',
        message: 'Configure AZURE_OPENAI_PHRASE_URL and AZURE_OPENAI_PHRASE_KEY in backend/.env'
      });
      return;
    }

    console.log('Generating more phrases with Azure OpenAI...');
    const phrases = await generateMoreAzurePhrases(words, existingPhrases, childAge);
    // Limit to exactly 1 phrase for "Generate More" (one additional phrase)
    const limitedPhrases = phrases.slice(0, 1);
    console.log(`Azure phrases: ${phrases.length}, limited to: ${limitedPhrases.length}`);
    if (limitedPhrases.length !== 1) {
      console.warn(`Warning: Expected 1 phrase but got ${limitedPhrases.length}`);
    }
    console.log('Phrase generated successfully with Azure OpenAI');
    res.json({ phrases: limitedPhrases });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error generating more phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    const errorMessage = formatAzureErrorMessage(error);
    
    res.status(500).json({ 
      error: 'Error generating more phrases',
      message: errorMessage,
      details: serverConfig.isDevelopment ? {
        originalError: error.message,
        status: error.status
      } : undefined
    });
  }
});

// ============================================================================
// Image Generation Endpoints
// ============================================================================

/**
 * Endpoint to generate an image with DALL-E for an AAC phrase
 * POST /api/generate-image
 * Body: { phrase: string }
 */
app.post('/api/generate-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phrase } = req.body as GenerateImageBody;

    if (!phrase || typeof phrase !== 'string' || phrase.trim().length === 0) {
      res.status(400).json({ 
        error: 'A valid phrase is required',
        message: 'The "phrase" field is required and must be a non-empty string'
      });
      return;
    }

    const imageBase64 = await generateAacImage(phrase.trim());
    
    res.json({ 
      imageBase64, 
      phrase: phrase.trim() 
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error generating image:', error);
    
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
      details: serverConfig.isDevelopment ? {
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
app.post('/api/generate-images', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phrases } = req.body as GenerateImagesBody;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      res.status(400).json({ 
        error: 'An array of phrases is required',
        message: 'The "phrases" field must be a non-empty array'
      });
      return;
    }

    // Validate that all phrases are strings
    const validPhrases = phrases
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .map(p => p.trim());

    if (validPhrases.length === 0) {
      res.status(400).json({ 
        error: 'No valid phrases',
        message: 'All phrases must be non-empty strings'
      });
      return;
    }

    const results = await generateAacImagesForPhrases(validPhrases);
    
    res.json({ 
      images: results,
      total: results.length,
      successful: results.filter(r => r.imageBase64 !== '').length
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error generating images:', error);
    
    res.status(500).json({ 
      error: 'Error generating images',
      message: error.message || 'Unknown error',
      details: serverConfig.isDevelopment ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ============================================================================
// ARASAAC Endpoints
// ============================================================================

/**
 * Endpoint to serve pictogram images as proxy
 * GET /api/arasaac/image/:idPictogram
 * 
 * IMPORTANT: This route must go BEFORE other ARASAAC routes
 * to avoid routing conflicts
 */
app.get('/api/arasaac/image/:idPictogram', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idPictogram } = req.params;
    const { color, backgroundColor, plural, skin, hair, action } = req.query as Record<string, string | undefined>;

    if (!idPictogram) {
      res.status(400).json({ error: 'Pictogram ID is required' });
      return;
    }

    console.log(`Serving pictogram image ID: ${idPictogram}`);
    console.log(`   Request from: ${req.headers['user-agent'] || 'Unknown'}`);

    // Use ARASAAC service to get image
    const options: PictogramImageOptions = {
      color: color !== undefined ? color === 'true' : undefined,
      backgroundColor,
      plural: plural === 'true',
      skin,
      hair,
      action,
    };
    
    const { buffer: imageBuffer, contentType } = await getPictogramImage(parseInt(idPictogram, 10), options);

    // Send image with correct headers for React Native
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS for React Native
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.send(imageBuffer);
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting image from ARASAAC:', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({ 
        error: 'Pictogram not found',
        message: error.message
      });
      return;
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
app.get('/api/arasaac/search/:language/:searchTerm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, searchTerm } = req.params;

    if (!searchTerm || searchTerm.trim() === '') {
      res.status(400).json({ error: 'A search term is required' });
      return;
    }

    // Use ARASAAC service to search pictograms
    const pictograms = await searchPictograms(searchTerm, language);

    res.json(pictograms);
  } catch (err) {
    const error = err as ApiError;
    console.error('Error searching pictograms in ARASAAC:', error);
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
app.get('/api/arasaac/pictogram/:language/:idPictogram', async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, idPictogram } = req.params;

    if (!idPictogram) {
      res.status(400).json({ error: 'A pictogram ID is required' });
      return;
    }

    // Use ARASAAC service to get pictogram
    const pictogram = await getPictogramById(parseInt(idPictogram, 10), language);

    res.json(pictogram);
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting pictogram from ARASAAC:', error);
    
    if (error.message?.includes('not found')) {
      res.status(404).json({ 
        error: 'Pictogram not found',
        message: error.message
      });
      return;
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
app.post('/api/arasaac/search-multiple', async (req: Request, res: Response): Promise<void> => {
  try {
    const { words, language = 'en' } = req.body as SearchMultipleBody;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({ error: 'An array of words is required' });
      return;
    }

    // Use ARASAAC service to search multiple pictograms
    const resultsMap = await searchMultiplePictograms(words, language);

    res.json(resultsMap);
  } catch (err) {
    const error = err as ApiError;
    console.error('Error in multiple search:', error);
    res.status(500).json({ 
      error: 'Error searching multiple pictograms',
      message: error.message
    });
  }
});

// ============================================================================
// Server Information Endpoint
// ============================================================================

/**
 * Root route - Server information
 */
app.get('/', (_req: Request, res: Response): void => {
  res.json({ 
    message: 'AAC Backend Server is running correctly',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      // Phrase generation endpoints
      generatePhrases: 'POST /api/generate-phrases',
      generateMorePhrases: 'POST /api/generate-more-phrases',
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
      userInitials: 'GET /api/user/initials',
      userCacheStats: 'GET /api/user/cache-stats'
    },
    hasAzureOpenAI: azurePhraseConfig.isConfigured
  });
});

// ============================================================================
// User & Profile Management Endpoints
// ============================================================================

// NOTE: Global mutable state has been eliminated!
// User data is now managed by userService.ts with proper isolation per userId
// using an LRU cache to prevent memory leaks.

/**
 * GET /api/user - Gets current user data
 * Requires userId via authenticateUser middleware
 */
app.get('/api/user', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const userData = getUserData(userId);
    res.json({ user: userData });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting user:', error);
    res.status(500).json({ 
      error: 'Error getting user',
      message: error.message
    });
  }
});

/**
 * PUT /api/user - Updates user data
 * Requires userId via authenticateUser middleware
 */
app.put('/api/user', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { email, fullName, preferences } = req.body as UpdateUserBody;
    
    // Validate data
    if (email === undefined && fullName === undefined && preferences === undefined) {
      res.status(400).json({ 
        error: 'At least one field is required to update' 
      });
      return;
    }
    
    // Update user data using the service
    const updatedUser = updateUserData(userId, { email, fullName, preferences });
    
    console.log(`User ${userId} updated:`, updatedUser);
    res.json({ user: updatedUser });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Error updating user',
      message: error.message
    });
  }
});

/**
 * POST /api/user/reset - Resets the user to default values
 * Requires userId via authenticateUser middleware
 */
app.post('/api/user/reset', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const resetUser = resetUserData(userId);
    
    console.log(`User ${userId} reset to default values`);
    res.json({ user: resetUser });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error resetting user:', error);
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
app.post('/api/avatar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, email, fullName } = req.body as AvatarBody;
    
    // Create consistent seed
    const seed = createUserSeed(userId, email, fullName);
    
    // Generate avatar (async because it converts SVG to PNG)
    const avatarUrl = await generateAvatarDataUrl(seed);
    
    console.log(`Avatar generated for seed: ${seed.substring(0, 10)}...`);
    res.json({ avatarUrl, seed });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error generating avatar:', error);
    res.status(500).json({ 
      error: 'Error generating avatar',
      message: error.message
    });
  }
});

/**
 * GET /api/user/initials - Gets the initials of the user
 * Requires userId via authenticateUser middleware
 */
app.get('/api/user/initials', authenticateUser, (req: Request, res: Response): void => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const userData = getUserData(userId);
    const initials = getInitials(userData.fullName, userData.email);
    
    res.json({ initials });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting initials:', error);
    res.status(500).json({ 
      error: 'Error getting initials',
      message: error.message
    });
  }
});

/**
 * GET /api/user/cache-stats - Gets cache statistics (for debugging/monitoring)
 * This endpoint is useful for monitoring the user cache state
 */
app.get('/api/user/cache-stats', (_req: Request, res: Response): void => {
  try {
    const stats = getCacheStats();
    res.json({ stats });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting cache stats:', error);
    res.status(500).json({ 
      error: 'Error getting cache stats',
      message: error.message
    });
  }
});

// ============================================================================
// Category Management Endpoints
// ============================================================================

/**
 * GET /api/categories
 * Get all categories with their pictogram IDs for a specific user
 * Requires userId query parameter
 */
app.get('/api/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string | undefined;
    
    if (!userId) {
      res.status(400).json({
        error: 'Missing userId',
        message: 'userId query parameter is required'
      });
      return;
    }
    
    const categories = await getUserCategories(userId);
    console.log(`Categories loaded for user ${userId}: ${Object.keys(categories).length} categories`);
    
    res.json({ categories });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting categories:', error);
    res.status(500).json({
      error: 'Error getting categories',
      message: error.message
    });
  }
});

/**
 * GET /api/categories/:categoryName
 * Get pictogram IDs for a specific category
 * Requires userId query parameter
 */
app.get('/api/categories/:categoryName', async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryName } = req.params;
    const userId = req.query.userId as string | undefined;
    
    if (!userId) {
      res.status(400).json({
        error: 'Missing userId',
        message: 'userId query parameter is required'
      });
      return;
    }
    
    const pictogramIds = await getUserCategoryPictograms(userId, categoryName);
    
    res.json({
      category: categoryName,
      pictogramIds,
      count: pictogramIds.length,
      isPredefined: isPredefinedCategory(categoryName)
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error getting category pictograms:', error);
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
 * Header: Authorization: Bearer <userId> (optional if provided in body)
 */
app.post('/api/categories', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryName, maxResults = 50, description } = req.body as CreateCategoryBody;
    const userId = (req as AuthenticatedRequest).userId;

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      res.status(400).json({
        error: 'A valid category name is required'
      });
      return;
    }

    const trimmedName = categoryName.trim();
    const trimmedDescription = description && typeof description === 'string' ? description.trim() : undefined;

    // Validate category name
    if (isPredefinedCategory(trimmedName)) {
      res.status(400).json({
        error: `Category "${trimmedName}" is a predefined category and cannot be recreated`
      });
      return;
    }

    // Create category using AI (user-specific)
    const pictogramIds = await createUserCategory(userId, trimmedName, maxResults, trimmedDescription);

    res.json({
      category: trimmedName,
      pictogramIds,
      count: pictogramIds.length,
      message: `Category "${trimmedName}" created successfully with ${pictogramIds.length} pictograms for user ${userId}`
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error creating category:', error);
    
    // Check if it's a duplicate error
    if (error.message.includes('already exists')) {
      res.status(409).json({
        error: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Error creating category',
      message: error.message
    });
  }
});

/**
 * POST /api/categories/empty
 * Create an empty custom category (without AI-generated pictograms)
 * Used when creating a category without standard symbols
 * Body: { categoryName: string, userId: string }
 * Header: Authorization: Bearer <userId> (optional if provided in body)
 */
app.post('/api/categories/empty', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryName } = req.body as CreateEmptyCategoryBody;
    const userId = (req as AuthenticatedRequest).userId;

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      res.status(400).json({
        error: 'A valid category name is required'
      });
      return;
    }

    const trimmedName = categoryName.trim();

    // Validate category name
    if (isPredefinedCategory(trimmedName)) {
      res.status(400).json({
        error: `Category "${trimmedName}" is a predefined category and cannot be recreated`
      });
      return;
    }

    // Create empty category (user-specific)
    await createEmptyUserCategory(userId, trimmedName);

    res.json({
      category: trimmedName,
      pictogramIds: [],
      count: 0,
      message: `Empty category "${trimmedName}" created successfully for user ${userId}`
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error creating empty category:', error);
    
    // Check if it's a duplicate error
    if (error.message.includes('already exists')) {
      res.status(409).json({
        error: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Error creating empty category',
      message: error.message
    });
  }
});

/**
 * DELETE /api/categories/:categoryName
 * Delete a custom category (cannot delete predefined categories)
 * Header: Authorization: Bearer <userId> (optional if coming in body)
 */
app.delete('/api/categories/:categoryName', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryName } = req.params;
    const userId = (req as AuthenticatedRequest).userId;

    if (isPredefinedCategory(categoryName)) {
      res.status(400).json({
        error: `Cannot delete predefined category "${categoryName}"`
      });
      return;
    }

    await deleteUserCategory(userId, categoryName);

    res.json({
      message: `Category "${categoryName}" deleted successfully for user ${userId}`
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error deleting category:', error);
    
    if (error.message.includes('does not exist')) {
      res.status(404).json({
        error: error.message
      });
      return;
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
app.post('/api/categories/initialize', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await initializePredefinedCategories();
    
    res.json({
      message: 'Predefined categories initialized successfully',
      categories,
      predefinedCategories: PREDEFINED_CATEGORIES
    });
  } catch (err) {
    const error = err as ApiError;
    console.error('Error initializing categories:', error);
    res.status(500).json({
      error: 'Error initializing categories',
      message: error.message
    });
  }
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ 
    status: 'ok',
    hasAzureOpenAI: azurePhraseConfig.isConfigured
  });
});

// ============================================================================
// Server Startup
// ============================================================================

// Listen on all interfaces (0.0.0.0) to allow connections from emulators and devices
app.listen(PORT, '0.0.0.0', (): void => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Backend server running at http://localhost:${PORT}`);
  console.log(`Also available at http://127.0.0.1:${PORT}`);
  console.log(`\nAPI Keys configured:`);
  console.log(`   - Azure OpenAI: ${azurePhraseConfig.isConfigured ? 'Yes' : 'No'}`);
  console.log(`\nTo connect from:`);
  console.log(`   - Web/Browser: http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
  console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   - iOS Simulator: http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`   - GET  /api/health - Check server status`);
  console.log(`   - GET  / - Server information`);
  console.log(`   - POST /api/generate-phrases - Generate phrases`);
  console.log(`   - GET  /api/arasaac/image/:id - Get pictogram image`);
  console.log(`   - GET  /api/categories - Get all categories`);
  console.log(`   - GET  /api/categories/:name - Get category pictograms`);
  console.log(`   - POST /api/categories - Create new custom category`);
  console.log(`   - DELETE /api/categories/:name - Delete custom category`);
  console.log(`   - POST /api/categories/initialize - Initialize predefined categories`);
  console.log(`\nLogging enabled: All requests will be logged here`);
  console.log(`${'='.repeat(60)}\n`);
});
