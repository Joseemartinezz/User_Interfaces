// Backend URL - Change this according to your configuration
// For local development: http://localhost:3000
// For Android emulator: http://10.0.2.2:3000 (Android emulator uses 10.0.2.2 for localhost)
// For iOS emulator: http://localhost:3000
// For physical device: http://YOUR_LOCAL_IP:3000 (e.g. http://192.168.1.100:3000)
// For web in Expo: sometimes needs http://127.0.0.1:3000 instead of localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface ErrorResponse {
  error?: string;
  message?: string;
}

interface PhrasesResponse {
  phrases?: string[];
}

interface SymbolsResponse {
  symbols?: string[];
}

interface TextResponse {
  text?: string;
}

/**
 * Tests connection with the backend server
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Could not connect to server:', error);
    return false;
  }
}

/**
 * Generates natural phrases from selected words using OpenAI
 * Usa el backend proxy para evitar problemas de CORS
 * @param words Array de palabras seleccionadas
 * @param model Modelo de OpenAI a usar (por defecto: 'gpt-5-mini')
 */
export async function generatePhrases(
  words: string[],
  model: string = 'gpt-5-mini'
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Attempting to connect to: ${API_BASE_URL}/api/openai/generate-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/openai/generate-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ErrorResponse;
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as PhrasesResponse;
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating phrases:', error);
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      const errorMsg = `Could not connect to backend server at ${API_BASE_URL}.\n\n` +
        `Solution:\n` +
        `1. Verify that the server is running: npm run server\n` +
        `2. Test in browser: ${API_BASE_URL}\n` +
        `3. If you're on Android Emulator, change URL to: http://10.0.2.2:3000\n` +
        `4. If you're on web, try changing to: http://127.0.0.1:3000 or http://localhost:3000`;
      throw new Error(errorMsg);
    }
    
    throw new Error(error.message || 'Error generating phrases. Verify that the backend server is running.');
  }
}

/**
 * Generates more phrases without repeating existing ones using OpenAI
 * Uses backend proxy to avoid CORS issues
 * @param words Array of selected words
 * @param existingPhrases Already generated phrases that should not be repeated
 * @param model OpenAI model to use (default: 'gpt-5-mini')
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[],
  model: string = 'gpt-5-mini'
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Attempting to connect to: ${API_BASE_URL}/api/openai/generate-more-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/openai/generate-more-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, existingPhrases, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ErrorResponse;
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as PhrasesResponse;
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating more phrases:', error);
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      const errorMsg = `Could not connect to backend server at ${API_BASE_URL}.\n\n` +
        `Solution:\n` +
        `1. Verify that the server is running: npm run server\n` +
        `2. Test in browser: ${API_BASE_URL}\n` +
        `3. If you're on Android Emulator, change URL to: http://10.0.2.2:3000\n` +
        `4. If you're on web, try changing to: http://127.0.0.1:3000 or http://localhost:3000`;
      throw new Error(errorMsg);
    }
    
    throw new Error(error.message || 'Error generating more phrases. Verify that the backend server is running.');
  }
}

/**
 * Converts text to PCS symbol sequence using OpenAI
 * Useful when a caregiver writes text and needs to see the corresponding symbols
 * @param text Text to convert
 * @param model OpenAI model to use (default: 'gpt-5-mini')
 */
export async function textToPCSSequence(
  text: string,
  model: string = 'gpt-5-mini'
): Promise<string[]> {
  if (!text || text.trim() === '') {
    return [];
  }

  try {
    console.log(`🔄 Converting text to PCS: "${text}"`);
    const response = await fetch(`${API_BASE_URL}/api/openai/text-to-pcs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ErrorResponse;
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json() as SymbolsResponse;
    return data.symbols || [];
  } catch (error: any) {
    console.error('Error converting text to PCS:', error);
    throw new Error(error.message || 'Error converting text to PCS symbols.');
  }
}

/**
 * Converts a PCS symbol sequence to natural text using OpenAI
 * Useful when a child selects symbols and needs to see the corresponding text
 * @param symbols Array of selected words/symbols
 * @param model OpenAI model to use (default: 'gpt-5-mini')
 */
export async function pcsSequenceToText(
  symbols: string[],
  model: string = 'gpt-5-mini'
): Promise<string> {
  if (!symbols || symbols.length === 0) {
    return '';
  }

  try {
    console.log(`🔄 Converting PCS to text: ${symbols.join(', ')}`);
    const response = await fetch(`${API_BASE_URL}/api/openai/pcs-to-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbols, model }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as ErrorResponse;
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json() as TextResponse;
    return data.text || '';
  } catch (error: any) {
    console.error('Error converting PCS to text:', error);
    throw new Error(error.message || 'Error converting PCS symbols to text.');
  }
}

