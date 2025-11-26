// API helper functions - Solo llamadas HTTP al backend
// Toda la lógica de negocio está en el backend

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Log de la URL del API para debugging
console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔗 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'no configurada (usando default)');

/**
 * Prueba la conexión con el servidor backend
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log(`🔍 Test de conexión: Intentando conectar a ${API_BASE_URL}/api/health`);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const isOk = response.ok;
    console.log(`✅ Test de conexión: ${isOk ? 'ÉXITO' : 'FALLO'} - Status: ${response.status}`);
    return isOk;
  } catch (error: any) {
    console.error('❌ Test de conexión FALLIDO:', error);
    console.error('   Tipo:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   URL intentada:', `${API_BASE_URL}/api/health`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   ⚠️ El backend no está accesible en:', API_BASE_URL);
      console.error('   💡 Verifica que el backend esté corriendo: npm run server');
    }
    return false;
  }
}

/**
 * Genera frases naturales a partir de palabras seleccionadas usando Gemini
 */
export async function generatePhrases(words: string[]): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating phrases:', error);
    throw new Error(error.message || 'Error generating phrases. Verify that the backend server is running.');
  }
}

/**
 * Genera más frases sin repetir las existentes
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[]
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-more-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, existingPhrases }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating more phrases:', error);
    throw new Error(error.message || 'Error generating more phrases. Verify that the backend server is running.');
  }
}

/**
 * Tipo de pictograma de ARASAAC
 */
export interface ArasaacPictogram {
  _id: number;
  keywords: Array<{
    keyword: string;
    hasLocution: boolean;
  }>;
  synsets?: string[];
  categories?: string[];
  schematic?: boolean;
  sex?: boolean;
  violence?: boolean;
  aac?: boolean;
  aacColor?: boolean;
  skin?: boolean;
  hair?: boolean;
  downloads?: number;
  variations?: any;
}

/**
 * Opciones para obtener la URL de una imagen de pictograma
 */
export interface PictogramImageOptions {
  size?: 'small' | 'medium' | 'large';
  plural?: boolean;
  color?: boolean;
  backgroundColor?: 'white' | 'black' | 'transparent';
  skinColor?: string;
  hairColor?: string;
  action?: 'present' | 'past' | 'future';
}

/**
 * Busca pictogramas de ARASAAC por término de búsqueda
 */
export async function searchPictograms(
  searchTerm: string,
  language: string = 'es'
): Promise<ArasaacPictogram[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/arasaac/search/${language}/${encodeURIComponent(searchTerm)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error buscando pictogramas:', error);
    throw new Error(error.message || 'Error al buscar pictogramas. Verifica que el servidor backend esté ejecutándose.');
  }
}

/**
 * Obtiene la información de un pictograma específico por su ID
 */
export async function getPictogramById(
  pictogramId: number,
  language: string = 'es'
): Promise<ArasaacPictogram> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/arasaac/pictogram/${language}/${pictogramId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error obteniendo pictograma:', error);
    throw new Error(error.message || 'Error al obtener pictograma. Verifica que el servidor backend esté ejecutándose.');
  }
}

/**
 * Obtiene la URL de una imagen de pictograma
 */
export function getPictogramImageUrl(
  pictogramId: number,
  options: PictogramImageOptions = {}
): string {
  const { size = 'medium', plural = false, color = true, backgroundColor = 'white', skinColor, hairColor, action } = options;
  
  let url = `${API_BASE_URL}/api/arasaac/image/${pictogramId}`;
  const params: string[] = [];
  
  // FIX: Asegurar que el parámetro sea "color" (no "collor" o "ccolor")
  if (color !== undefined) params.push(`color=${color}`);
  if (plural) params.push('plural=true');
  if (backgroundColor) params.push(`backgroundColor=${encodeURIComponent(backgroundColor)}`);
  if (skinColor) params.push(`skin=${encodeURIComponent(skinColor)}`);
  if (hairColor) params.push(`hair=${encodeURIComponent(hairColor)}`);
  if (action) params.push(`action=${encodeURIComponent(action)}`);
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }
  
  return url;
}

/**
 * Busca pictogramas para múltiples palabras
 */
export async function searchMultiplePictograms(
  words: string[],
  language: string = 'es'
): Promise<Array<{ word: string; pictogram: ArasaacPictogram | null; imageUrl: string }>> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/arasaac/search-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, language }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error buscando múltiples pictogramas:', error);
    throw new Error(error.message || 'Error al buscar pictogramas. Verifica que el servidor backend esté ejecutándose.');
  }
}

/**
 * Obtiene el mejor pictograma para una palabra
 */
export async function getBestPictogramForWord(
  word: string,
  language: string = 'es'
): Promise<ArasaacPictogram | null> {
  try {
    const pictograms = await searchPictograms(word, language);
    if (pictograms.length === 0) {
      return null;
    }
    // Retornar el primero (puedes agregar lógica de selección más sofisticada)
    return pictograms[0];
  } catch (error) {
    console.error('Error obteniendo mejor pictograma:', error);
    return null;
  }
}

/**
 * Convierte palabras en pictogramas con sus URLs de imagen
 */
export async function convertWordsToPictograms(
  words: string[],
  language: string = 'es'
): Promise<Array<{ word: string; pictogram: ArasaacPictogram | null; imageUrl: string }>> {
  return await searchMultiplePictograms(words, language);
}

// ============================================================================
// USER & PROFILE API
// ============================================================================

/**
 * Tipo de usuario
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  preferences: {
    language: string;
    theme: number;
    fontSize: string;
    voiceSpeed: number;
  };
}

/**
 * Obtiene los datos del usuario actual
 */
export async function getUser(): Promise<User | null> {
  try {
    console.log(`🔍 Intentando conectar a: ${API_BASE_URL}/api/user`);
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Respuesta recibida: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('❌ Error getting user:', error);
    console.error('   Tipo de error:', error.name);
    console.error('   Mensaje:', error.message);
    console.error('   URL intentada:', `${API_BASE_URL}/api/user`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   ⚠️ PROBLEMA DE CONEXIÓN: El backend no está accesible');
      console.error('   💡 Verifica que:');
      console.error('      1. El backend esté corriendo (npm run server)');
      console.error('      2. La URL sea correcta para tu plataforma');
      console.error('      3. No haya firewall bloqueando la conexión');
    }
    return null;
  }
}

/**
 * Actualiza los datos del usuario
 */
export async function updateUser(updates: {
  email?: string;
  fullName?: string;
  preferences?: Partial<User['preferences']>;
}): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Resetea el usuario a valores por defecto
 */
export async function resetUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('Error resetting user:', error);
    throw error;
  }
}

/**
 * Obtiene la URL del avatar de un usuario
 */
export async function getUserAvatarUrl(user: {
  id?: string | number;
  email?: string;
  fullName?: string;
}): Promise<string | null> {
  if (!user) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.avatarUrl || null;
  } catch (error: any) {
    console.error('Error getting user avatar URL:', error);
    return null;
  }
}

