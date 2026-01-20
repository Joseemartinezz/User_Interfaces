// Gemini Service - Backend
// Service for generating phrases using Google Gemini AI
// Used as fallback when Azure OpenAI is not available or fails

// Use dynamic require to avoid TypeScript redeclaration conflicts with other services
const GoogleGenAI = require('@google/generative-ai');

/**
 * Get Gemini configuration from environment variables
 */
function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
  return { apiKey };
}

/**
 * Check if Gemini is configured
 */
function isGeminiConfigured(): boolean {
  const { apiKey } = getGeminiConfig();
  return !!apiKey;
}

/**
 * Extract numbered phrases from AI response text
 * @param text Raw text response from AI
 * @returns Array of extracted phrases
 */
function extractPhrases(text: string): string[] {
  const lines = text.split('\n');
  const phrases: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Search for lines that start with number followed by period or parenthesis
    const match = trimmed.match(/^\d+[\.\)]\s*(.+)$/);
    if (match && match[1]) {
      phrases.push(match[1].trim());
    }
  }

  return phrases.length > 0 ? phrases : [text.trim()];
}

/**
 * Lists available Gemini models
 * Useful for debugging
 */
async function listAvailableModels(): Promise<string[]> {
  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    console.log('Gemini API key not configured');
    return [];
  }

  try {
    const genAI = new GoogleGenAI.GoogleGenerativeAI(apiKey);
    // Try to list models if method is available
    if (typeof genAI.listModels === 'function') {
      const models = await genAI.listModels();
      const modelNames = Array.isArray(models) 
        ? models.map((model: any) => model.name || model)
        : [];
      console.log('Available models:', modelNames);
      return modelNames;
    } else {
      console.log('listModels() is not available in this SDK version');
      return [];
    }
  } catch (error: any) {
    console.error('Error listing models:', error.message);
    return [];
  }
}

/**
 * Build age-specific context for prompts
 */
function buildAgeContext(childAge?: number): string {
  return childAge 
    ? `The child is ${childAge} years old. Adjust the language complexity, vocabulary, and sentence structure to be age-appropriate for a ${childAge}-year-old child.`
    : 'Adjust the language complexity and vocabulary to be appropriate for a child.';
}

/**
 * Generate phrases using Gemini AI
 * @param words Array of words to include in the phrases
 * @param childAge Optional age of the child for age-appropriate language
 * @returns Array of generated phrases
 */
async function generateGeminiPhrases(words: string[], childAge?: number): Promise<string[]> {
  if (!words || words.length === 0) return [];

  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const ageContext = buildAgeContext(childAge);

  const prompt = `
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

  console.log('Calling Gemini API with words:', words);
  
  // Try with different Gemini models in order of preference
  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  let text: string | null = null;
  let lastError: Error | null = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting with Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
      console.log(`Response received from Gemini with model: ${modelName}`);
      console.log('Full text:', text);
      break; // If it works, exit the loop
    } catch (modelError: any) {
      const errorMsg = modelError.message || String(modelError);
      console.log(`${modelName} failed:`, errorMsg.substring(0, 150));
      lastError = modelError;
      continue; // Try next model
    }
  }
  
  if (!text) {
    // If all Gemini models failed
    console.log('All Gemini models failed. Listing available models...');
    await listAvailableModels();
    throw lastError || new Error('All Gemini models failed. Verify your configuration.');
  }

  const phrases = extractPhrases(text);
  // Limit to exactly 3 phrases for initial generation
  return phrases.slice(0, 3);
}

/**
 * Generate more phrases using Gemini AI (avoiding existing phrases)
 * @param words Array of words to include in the phrases
 * @param existingPhrases Phrases that should not be repeated
 * @param childAge Optional age of the child for age-appropriate language
 * @returns Array of generated phrases (1 new phrase)
 */
async function generateMoreGeminiPhrases(
  words: string[],
  existingPhrases: string[],
  childAge?: number
): Promise<string[]> {
  if (!words || words.length === 0) return [];

  const { apiKey } = getGeminiConfig();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const ageContext = buildAgeContext(childAge);

  const prompt = `
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

    Do NOT repeat any of these phrases:
    ${existingPhrases.join('\n')}

    Remember: Generate EXACTLY 1 new phrase only.
`;

  // Try with different Gemini models in order of preference
  const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  let text: string | null = null;
  let lastError: Error | null = null;
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting with Gemini model: ${modelName} to generate more phrases...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
      console.log(`Response received from Gemini with model: ${modelName}`);
      console.log('Full text:', text);
      break; // If it works, exit the loop
    } catch (modelError: any) {
      const errorMsg = modelError.message || String(modelError);
      console.log(`${modelName} failed:`, errorMsg.substring(0, 150));
      lastError = modelError;
      continue; // Try next model
    }
  }
  
  if (!text) {
    // If all Gemini models failed
    console.log('All Gemini models failed. Listing available models...');
    await listAvailableModels();
    throw lastError || new Error('All Gemini models failed. Verify your configuration.');
  }

  const phrases = extractPhrases(text);
  // Limit to exactly 1 phrase for "Generate More"
  return phrases.slice(0, 1);
}

/**
 * Format error message for Gemini errors
 */
function formatGeminiError(error: any): string {
  const message = error.message || 'Unknown error';
  
  if (message.includes('404') || message.includes('not found')) {
    return 'Gemini model is not available. Verify your API key and available models.';
  } else if (message.includes('API_KEY') || message.includes('API key')) {
    return 'Invalid Gemini API Key or no permissions. Verify your API key.';
  } else if (message.includes('quota') || message.includes('limit')) {
    return 'Gemini API quota exceeded. Verify your plan.';
  }
  
  return message;
}

module.exports = {
  getGeminiConfig,
  isGeminiConfigured,
  extractPhrases,
  listAvailableModels,
  generateGeminiPhrases,
  generateMoreGeminiPhrases,
  formatGeminiError
};
