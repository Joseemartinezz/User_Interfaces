// Azure OpenAI API service for generating phrases
// Frontend service that calls backend proxy endpoints

// Backend URL - Change this according to your configuration
// For local development: http://localhost:3000
// For Android emulator: http://10.0.2.2:3000 (Android emulator uses 10.0.2.2 for localhost)
// For iOS emulator: http://localhost:3000
// For physical device: http://YOUR_LOCAL_IP:3000 (e.g. http://192.168.1.100:3000)
// For web in Expo: sometimes needs http://127.0.0.1:3000 instead of localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Tests connection with backend server and Azure OpenAI
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
    console.error('❌ No se pudo conectar al servidor:', error);
    return false;
  }
}

/**
 * Genera frases naturales a partir de palabras seleccionadas usando Azure OpenAI
 * Usa el backend proxy para evitar problemas de CORS
 * @param words Array de palabras seleccionadas
 */
export async function generatePhrases(words: string[]): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Intentando conectar a: ${API_BASE_URL}/api/azure/generate-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/azure/generate-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
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
 * Generates more phrases without repeating existing ones using Azure OpenAI
 * Uses backend proxy to avoid CORS issues
 * @param words Array of selected words
 * @param existingPhrases Already generated phrases that should not be repeated
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[]
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Intentando conectar a: ${API_BASE_URL}/api/azure/generate-more-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/azure/generate-more-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, existingPhrases }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
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

