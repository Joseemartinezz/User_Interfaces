// Azure OpenAI DALL-E Image Generation Service for AAC Phrases
// Backend service that handles image generation with DALL-E 3 via Azure OpenAI

interface AzureOpenAIImageResponse {
  data: Array<{
    url: string;
  }>;
}

/**
 * Cleans and sanitizes the phrase to avoid issues with API policies
 */
function sanitizePhrase(phrase) {
  if (!phrase) return '';
  
  // Clean the phrase: remove numbers at the start, dots, and problematic special characters
  let cleaned = phrase.trim()
    .replace(/^\d+\.\s*/, '') // Remove numbers at the start
    .replace(/[^\w\s.,!?-]/g, '') // Remove special characters except basic punctuation
    .trim();
  
  // Convert to lowercase to avoid issues
  cleaned = cleaned.toLowerCase();
  
  return cleaned;
}

/**
 * Builds the optimized prompt for generating AAC child-friendly images
 * Uses a safe approach that complies with API policies
 */
function buildAacImagePrompt(phrase) {
  // Sanitize the phrase
  const sanitizedPhrase = sanitizePhrase(phrase);
  
  // Create a safer, descriptive and generic prompt
  // We avoid including the phrase directly if it might be problematic
  // Instead, we use a more descriptive and safe format
    return `A cheerful, simple illustration for children showing a positive and happy scene. 
  The illustration should be colorful, friendly, and easy to understand. 
  Use soft, rounded shapes, bright colors, and a warm, welcoming style. 
  The image should show appropriate, family-friendly content suitable for young children. 
  Keep the design simple with a clean, uncluttered background. 
  No text, letters, numbers, or symbols should appear in the image. 
  The overall feeling should be positive, happy, and inclusive. 
  Illustrate the concept: ${sanitizedPhrase}`.trim();
}

/**
 * Gets Azure OpenAI configuration for images from environment variables
 * The endpoint already comes complete with deploymentName and api-version
 */
function getAzureOpenAIConfig() {
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY;

  if (!endpoint) {
    throw new Error('AZURE_OPENAI_IMAGE_ENDPOINT is not configured in environment variables');
  }
  if (!apiKey) {
    throw new Error('AZURE_OPENAI_IMAGE_API_KEY is not configured in environment variables');
  }

  return { endpoint, apiKey };
}

/**
 * Converts an image from a URL to base64
 * @param {string} imageUrl Image URL
 * @returns {Promise<string>} Image in base64 format
 */
async function urlToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error downloading image: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Error converting URL to base64: ${error.message}`);
  }
}

/**
 * Generates an image for an AAC phrase using DALL-E 3 via Azure OpenAI
 * Includes retry logic with exponential backoff to handle connection errors
 * @param {string} phrase The phrase for which to generate the image
 * @param {number} retryAttempt Current attempt number (for retry)
 * @returns {Promise<string>} The image in base64 format
 */
async function generateAacImage(phrase, retryAttempt = 0) {
  if (!phrase || phrase.trim().length === 0) {
    throw new Error('The phrase cannot be empty');
  }

  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 initial second

  try {
    const { endpoint, apiKey } = getAzureOpenAIConfig();
    const prompt = buildAacImagePrompt(phrase);

    if (retryAttempt === 0) {
      console.log(`Generating image with Azure OpenAI DALL-E 3 for phrase: "${phrase}"`);
    } else {
      console.log(`Retrying image generation (attempt ${retryAttempt + 1}/${MAX_RETRIES + 1}) for phrase: "${phrase}"`);
    }

    // The endpoint already comes complete with deploymentName and api-version
    const url = endpoint;

    const headers = {
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const body = {
      prompt: prompt,
      size: '1024x1024',
      n: 1
    };

    // Longer timeout to avoid ECONNRESET (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchError) {
      // If the fetch fails, clear the timeout and rethrow the error to be handled by the outer catch
      clearTimeout(timeoutId);
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Azure OpenAI error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        // If it cannot be parsed as JSON, use the text as is
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Azure OpenAI API Key invalid or not configured. Verify AZURE_OPENAI_IMAGE_API_KEY in backend/.env');
      }
      
      if (response.status === 429) {
        // For rate limiting, retry with longer delay
        if (retryAttempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt); // Exponential backoff
          console.log(`Rate limit detected. Waiting ${delay}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateAacImage(phrase, retryAttempt + 1);
        }
        throw new Error('Azure OpenAI quota exceeded. Verify your plan and limits.');
      }

      throw new Error(errorMessage);
    }

    const result = await response.json() as AzureOpenAIImageResponse;

    if (!result.data || result.data.length === 0) {
      throw new Error('No image received in Azure OpenAI response');
    }

    const imageUrl = result.data[0].url;
    if (!imageUrl) {
      throw new Error('The received image does not contain a URL');
    }

    // Convert URL to base64 to maintain compatibility
    const imageBase64 = await urlToBase64(imageUrl);

    if (retryAttempt > 0) {
      console.log(`Image generated successfully after ${retryAttempt + 1} attempts for: "${phrase}"`);
    } else {
      console.log(`Image generated successfully for: "${phrase}"`);
    }
    return imageBase64;
  } catch (error) {
    // Detect connection errors that may be recoverable
    // Includes common Node.js error codes and numeric codes that may indicate network problems
    const errorCode = error.code || error.errno || error.cause?.code;
    const errorMessage = error.message || '';
    const errorName = error.name || '';
    
    const isConnectionError = 
      errorCode === 'ECONNRESET' ||
      errorCode === 'ETIMEDOUT' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'EAI_AGAIN' ||
      errorCode === 'EPIPE' ||
      // Common numeric codes for network errors (20 may be a fetch/HTTP error code)
      (typeof errorCode === 'number' && (errorCode === 20 || errorCode < 0)) ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorName === 'AbortError' ||
      errorName === 'TypeError' && errorMessage.includes('fetch');

    // If it's a connection error and we still have retries available, retry
    if (isConnectionError && retryAttempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt); // Exponential backoff: 1s, 2s, 4s
      const errorInfo = errorCode || errorMessage || 'unknown';
      console.log(`Transient connection error detected (${errorInfo}). Retrying automatically in ${delay}ms... (attempt ${retryAttempt + 1}/${MAX_RETRIES + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateAacImage(phrase, retryAttempt + 1);
    }

    console.error(`Error generating image for "${phrase}" (attempt ${retryAttempt + 1}):`, error);
    
    if (error.message?.includes('API Key') || error.message?.includes('not configured')) {
      throw new Error('Azure OpenAI API Key invalid or not configured. Verify AZURE_OPENAI_IMAGE_API_KEY in backend/.env');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
      throw new Error('Azure OpenAI quota exceeded. Verify your plan and limits.');
    }

    throw new Error(error.message || 'Unknown error generating image');
  }
}

// Global variable to track the last request time (to avoid saturating Azure)
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 300; // 300ms minimum between requests

/**
 * Generates images for multiple phrases in parallel with staggered delays
 * (avoids Azure OpenAI rate limiting by using delays between calls)
 * @param {string[]} phrases Array of phrases for which to generate images
 * @returns {Promise<Array<{phrase: string, imageBase64: string}>>} Array of objects with phrase and base64 image
 */
async function generateAacImagesForPhrases(phrases) {
  if (!phrases || phrases.length === 0) {
    return [];
  }

  console.log(`Generating ${phrases.length} images in parallel with staggered delays...`);

  // Helper function for delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Generate images in parallel with staggered delay to avoid rate limiting
  // Each image starts with a 500ms delay relative to the previous one
  // Additionally, we respect a minimum delay since the last request
  const imagePromises = phrases.map(async (phrase, index) => {
    try {
      // Calculate staggered delay: 500ms, 1000ms, 1500ms, etc.
      const baseDelay = index * 500;
      
      // Ensure there's a minimum delay since the last request
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const additionalDelay = Math.max(0, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
      
      const totalDelay = baseDelay + additionalDelay;
      
      if (totalDelay > 0) {
        await delay(totalDelay);
      }
      
      lastRequestTime = Date.now();
      
      console.log(`Starting image generation ${index + 1}/${phrases.length} for: "${phrase}"`);
      const imageBase64 = await generateAacImage(phrase);
      console.log(`Image ${index + 1}/${phrases.length} completed`);
      return { phrase, imageBase64 };
    } catch (error) {
      console.error(`Error generating image ${index + 1}/${phrases.length} for "${phrase}":`, error);
      // Return without image in case of error (after all retries)
      return { phrase, imageBase64: '' };
    }
  });

  const results = await Promise.all(imagePromises);
  const successful = results.filter(r => r.imageBase64 !== '').length;
  console.log(`${successful}/${phrases.length} images generated successfully`);

  return results;
}

/**
 * Tests connection with Azure OpenAI
 * @returns {Promise<boolean>}
 */
async function testOpenAIConnection() {
  try {
    const { endpoint, apiKey } = getAzureOpenAIConfig();
    
    // The endpoint already comes complete with deploymentName and api-version
    const url = endpoint;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        prompt: 'A simple test image',
        size: '1024x1024',
        n: 1
      })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json() as AzureOpenAIImageResponse;
    return result.data && result.data.length > 0;
  } catch (error) {
    console.error('Error testing connection with Azure OpenAI:', error);
    return false;
  }
}

module.exports = {
  generateAacImage,
  generateAacImagesForPhrases,
  testOpenAIConnection
};
