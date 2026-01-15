// API helper functions - HTTP calls to backend only
// All business logic is in the backend

import { auth } from './config/firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Gets Firebase authentication token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('❌ Error getting authentication token:', error);
    return null;
  }
}

/**
 * Gets the current user's userId
 */
function getCurrentUserId(): string | null {
  const currentUser = auth.currentUser;
  return currentUser?.uid || null;
}

// Log de la URL del API para debugging
console.log('🔗 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔗 EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'no configurada (usando default)');

/**
 * Tests connection with backend server
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log(`🔍 Connection test: Attempting to connect to ${API_BASE_URL}/api/health`);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const isOk = response.ok;
    console.log(`✅ Connection test: ${isOk ? 'SUCCESS' : 'FAILED'} - Status: ${response.status}`);
    return isOk;
  } catch (error: any) {
    console.error('❌ Connection test FAILED:', error);
    console.error('   Type:', error.name);
    console.error('   Message:', error.message);
    console.error('   Attempted URL:', `${API_BASE_URL}/api/health`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   ⚠️ Backend is not accessible at:', API_BASE_URL);
      console.error('   💡 Verify that the backend is running: npm run server');
    }
    return false;
  }
}

/**
 * Generates natural phrases from selected words using Gemini
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
 * ARASAAC pictogram type
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
 * Searches ARASAAC pictograms by search term
 */
export async function searchPictograms(
  searchTerm: string,
  language: string = 'en'
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error searching pictograms:', error);
    throw new Error(error.message || 'Error searching pictograms. Verify that the backend server is running.');
  }
}

/**
 * Gets information for a specific pictogram by its ID
 */
export async function getPictogramById(
  pictogramId: number,
  language: string = 'en'
): Promise<ArasaacPictogram> {
  const url = `${API_BASE_URL}/api/arasaac/pictogram/${language}/${pictogramId}`;
  
  try {
    console.log(`   🌐 Llamando a: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error || `Error ${response.status}`;
      console.error(`   ❌ Error ${response.status} getting pictogram ${pictogramId}:`, errorMessage);
      throw new Error(errorMessage);
    }

    const pictogram = await response.json();
    return pictogram;
  } catch (error: any) {
    console.error(`   ❌ Error getting pictogram ${pictogramId}:`, error.message || error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Could not connect to backend. Verify it is running at ${API_BASE_URL}`);
    }
    throw new Error(error.message || 'Error getting pictogram. Verify that the backend server is running.');
  }
}

/**
 * Gets the URL of a pictogram image
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
 * Searches pictograms for multiple words
 */
export async function searchMultiplePictograms(
  words: string[],
  language: string = 'en'
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error searching multiple pictograms:', error);
    throw new Error(error.message || 'Error searching pictograms. Verify that the backend server is running.');
  }
}

/**
 * Gets the best pictogram for a word
 */
export async function getBestPictogramForWord(
  word: string,
  language: string = 'en'
): Promise<ArasaacPictogram | null> {
  try {
    const pictograms = await searchPictograms(word, language);
    if (pictograms.length === 0) {
      return null;
    }
    // Return the first one (you can add more sophisticated selection logic)
    return pictograms[0];
  } catch (error) {
    console.error('Error getting best pictogram:', error);
    return null;
  }
}

/**
 * Convierte palabras en pictogramas con sus URLs de imagen
 */
export async function convertWordsToPictograms(
  words: string[],
  language: string = 'en'
): Promise<Array<{ word: string; pictogram: ArasaacPictogram | null; imageUrl: string }>> {
  return await searchMultiplePictograms(words, language);
}

// ============================================================================
// USER & PROFILE API
// ============================================================================

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  preferences: {
    language: string;
    theme: number;
    fontSize: string;
  };
}

/**
 * Obtiene los datos del usuario actual
 */
export async function getUser(): Promise<User | null> {
  try {
    console.log(`🔍 Attempting to connect to: ${API_BASE_URL}/api/user`);
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`✅ Response received: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('❌ Error getting user:', error);
    console.error('   Error type:', error.name);
    console.error('   Message:', error.message);
    console.error('   Attempted URL:', `${API_BASE_URL}/api/user`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   ⚠️ CONNECTION PROBLEM: Backend is not accessible');
      console.error('   💡 Verify that:');
      console.error('      1. Backend is running (npm run server)');
      console.error('      2. URL is correct for your platform');
      console.error('      3. No firewall is blocking the connection');
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
 * Resets user to default values
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

// ============================================================================
// CATEGORIES API
// ============================================================================

/**
 * Gets all categories (predefined + custom)
 * If userId is provided, returns only the user's categories
 */
export async function getAllCategories(userId?: string): Promise<Record<string, number[]>> {
  try {
    const url = userId 
      ? `${API_BASE_URL}/api/categories?userId=${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/api/categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.categories || {};
  } catch (error: any) {
    console.error('Error getting categories:', error);
    throw new Error(error.message || 'Error al obtener categorías. Verifica que el servidor backend esté ejecutándose.');
  }
}

/**
 * Gets pictogram IDs for a specific category
 * If userId is provided, searches in user's categories
 */
export async function getCategoryPictogramIds(categoryName: string, userId?: string): Promise<number[]> {
  const baseUrl = `${API_BASE_URL}/api/categories/${encodeURIComponent(categoryName)}`;
  const url = userId ? `${baseUrl}?userId=${encodeURIComponent(userId)}` : baseUrl;
  
  try {
    console.log(`🔍 Getting pictogram IDs for category "${categoryName}"${userId ? ` (user: ${userId})` : ''}`);
    console.log(`   🌐 Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`   ❌ Error ${response.status}:`, errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    const ids = data.pictogramIds || [];
    console.log(`   ✅ Obtenidos ${ids.length} IDs de pictogramas para "${categoryName}"`);
    if (ids.length > 0) {
      console.log(`   📋 Primeros IDs: ${ids.slice(0, 10).join(', ')}${ids.length > 10 ? '...' : ''}`);
    }
    return ids;
  } catch (error: any) {
    console.error(`❌ Error getting pictogram IDs for category "${categoryName}":`, error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Could not connect to backend. Verify it is running at ${API_BASE_URL}`);
    }
    throw new Error(error.message || 'Error getting pictograms from category.');
  }
}

/**
 * Creates a new category with pictograms using AI
 * @param categoryName Category name
 * @param description Optional description of what the category encompasses
 * @param maxResults Maximum number of pictograms to include (default 50)
 * @param userId User ID (optional, obtained automatically if not provided)
 */
export async function createCategoryWithPictograms(
  categoryName: string,
  description?: string,
  maxResults: number = 50,
  userId?: string
): Promise<{ category: string; pictogramIds: number[]; count: number }> {
  try {
    // Obtener userId si no se proporciona
    const finalUserId = userId || getCurrentUserId();
    if (!finalUserId) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Could not get authentication token.');
    }

    const body: { categoryName: string; maxResults: number; description?: string; userId: string } = {
      categoryName,
      maxResults,
      userId: finalUserId,
    };

    if (description && description.trim()) {
      body.description = description.trim();
    }

    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalUserId}`, // Send userId as token (backend extracts it)
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return {
      category: data.category,
      pictogramIds: data.pictogramIds || [],
      count: data.count || 0,
    };
  } catch (error: any) {
    console.error('Error creating category with pictograms:', error);
    throw new Error(error.message || 'Error creating category with pictograms. Verify that the backend server is running.');
  }
}

/**
 * Deletes a user's custom category
 * @param categoryName Name of category to delete
 * @param userId User ID
 */
export async function deleteCategoryWithPictograms(
  categoryName: string,
  userId?: string
): Promise<void> {
  try {
    // Obtener userId si no se proporciona
    const finalUserId = userId || getCurrentUserId();
    if (!finalUserId) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Could not get authentication token.');
    }

    const response = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(categoryName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalUserId}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    console.log(`✅ Category "${categoryName}" deleted successfully from backend`);
  } catch (error: any) {
    console.error('Error deleting category with pictograms:', error);
    throw new Error(error.message || 'Error deleting category from backend.');
  }
}

/**
 * Gets pictogram information by their IDs
 * Obtiene los detalles completos de múltiples pictogramas desde ARASAAC
 */
export async function getPictogramsByIds(
  pictogramIds: number[],
  language: string = 'en'
): Promise<Array<{ id: number; pictogram: ArasaacPictogram | null; text: string }>> {
  if (!pictogramIds || pictogramIds.length === 0) {
    return [];
  }

  console.log(`🔍 Getting ${pictogramIds.length} pictograms from ARASAAC (language: ${language})`);
  console.log(`   IDs: ${pictogramIds.slice(0, 10).join(', ')}${pictogramIds.length > 10 ? '...' : ''}`);

  try {
    // Get information for each pictogram in parallel
    const promises = pictogramIds.map(async (id) => {
      try {
        console.log(`   📥 Getting pictogram ID: ${id}`);
        const pictogram = await getPictogramById(id, language);
        // Get main text (first keyword)
        const text = pictogram.keywords?.[0]?.keyword || `Pictogram ${id}`;
        console.log(`   ✅ Pictogram ${id} obtained: "${text}"`);
        return { id, pictogram, text };
      } catch (error: any) {
        console.warn(`⚠️ Could not get pictogram ${id}:`, error.message || error);
        return { id, pictogram: null, text: `Pictogram ${id}` };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.pictogram !== null).length;
    console.log(`✅ Obtained ${successful}/${pictogramIds.length} pictograms successfully`);
    return results;
  } catch (error: any) {
    console.error('❌ Error getting pictograms by IDs:', error);
    throw new Error(error.message || 'Error getting pictograms.');
  }
}

