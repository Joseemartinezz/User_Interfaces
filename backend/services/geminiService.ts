// URL del backend - Cambia esto según tu configuración
// Para desarrollo local: http://localhost:3000
// Para emulador Android: http://10.0.2.2:3000 (Android emulator usa 10.0.2.2 para localhost)
// Para emulador iOS: http://localhost:3000
// Para dispositivo físico: http://TU_IP_LOCAL:3000 (ej: http://192.168.1.100:3000)
// Para web en Expo: a veces necesita http://127.0.0.1:3000 en lugar de localhost
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Prueba la conexión con el servidor backend
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
 * Genera frases naturales a partir de palabras seleccionadas usando Gemini
 * Ahora usa el backend proxy para evitar problemas de CORS
 */
export async function generatePhrases(words: string[]): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Intentando conectar a: ${API_BASE_URL}/api/generate-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/generate-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
        `1. Verify the server is running: npm run server\n` +
        `2. Test in browser: ${API_BASE_URL}\n` +
        `3. If you're on Android Emulator, change URL to: http://10.0.2.2:3000\n` +
        `4. If you're on web, try changing to: http://127.0.0.1:3000 or http://localhost:3000`;
      throw new Error(errorMsg);
    }
    
    throw new Error(error.message || 'Error generating phrases. Verify that the backend server is running.');
  }
}

/**
 * Genera más frases sin repetir las existentes
 * Ahora usa el backend proxy para evitar problemas de CORS
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[]
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    console.log(`🔄 Intentando conectar a: ${API_BASE_URL}/api/generate-more-phrases`);
    const response = await fetch(`${API_BASE_URL}/api/generate-more-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, existingPhrases }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
        `1. Verify the server is running: npm run server\n` +
        `2. Test in browser: ${API_BASE_URL}\n` +
        `3. If you're on Android Emulator, change URL to: http://10.0.2.2:3000\n` +
        `4. If you're on web, try changing to: http://127.0.0.1:3000 or http://localhost:3000`;
      throw new Error(errorMsg);
    }
    
    throw new Error(error.message || 'Error generating more phrases. Verify that the backend server is running.');
  }
}

// Esta función ya no es necesaria porque el backend la maneja
// Se mantiene por compatibilidad pero no se usa

