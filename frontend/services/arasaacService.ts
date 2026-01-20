// ARASAAC Service - Frontend
// Service for interacting with ARASAAC pictogram API through backend

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
 * Options for getting a pictogram image URL
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
 * @param searchTerm Search term in the specified language
 * @param language Language code (e.g. 'es', 'en', 'it', 'fr') - defaults to 'en'
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
 * @param pictogramId Pictogram ID
 * @param language Language code (e.g. 'es', 'en', 'it', 'fr') - defaults to 'en'
 */
export async function getPictogramById(
  pictogramId: number,
  language: string = 'en'
): Promise<ArasaacPictogram> {
  const url = `${API_BASE_URL}/api/arasaac/pictogram/${language}/${pictogramId}`;
  
  try {
    console.log(`   Calling: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error || `Error ${response.status}`;
      console.error(`   Error ${response.status} getting pictogram ${pictogramId}:`, errorMessage);
      throw new Error(errorMessage);
    }

    const pictogram = await response.json();
    return pictogram;
  } catch (error: any) {
    console.error(`   Error getting pictogram ${pictogramId}:`, error.message || error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Could not connect to backend. Verify it is running at ${API_BASE_URL}`);
    }
    throw new Error(error.message || 'Error getting pictogram. Verify that the backend server is running.');
  }
}

/**
 * Gets the URL of a pictogram image
 * @param pictogramId Pictogram ID
 * @param options Options for image customization
 */
export function getPictogramImageUrl(
  pictogramId: number,
  options: PictogramImageOptions = {}
): string {
  const { size = 'medium', plural = false, color = true, backgroundColor = 'white', skinColor, hairColor, action } = options;
  
  let url = `${API_BASE_URL}/api/arasaac/image/${pictogramId}`;
  const params: string[] = [];
  
  // FIX: Ensure the parameter is "color" (not "collor" or "ccolor")
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
 * @param words Array of words to search
 * @param language Language code - defaults to 'en'
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
 * @param word Word to search
 * @param language Language code - defaults to 'en'
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
 * Converts words into pictograms with their image URLs
 * @param words Array of words
 * @param language Language code - defaults to 'en'
 */
export async function convertWordsToPictograms(
  words: string[],
  language: string = 'en'
): Promise<Array<{ word: string; pictogram: ArasaacPictogram | null; imageUrl: string }>> {
  return await searchMultiplePictograms(words, language);
}

/**
 * Gets pictogram information by their IDs
 * Gets complete details of multiple pictograms from ARASAAC
 * @param pictogramIds Array of pictogram IDs
 * @param language Language code - defaults to 'en'
 */
export async function getPictogramsByIds(
  pictogramIds: number[],
  language: string = 'en'
): Promise<Array<{ id: number; pictogram: ArasaacPictogram | null; text: string }>> {
  if (!pictogramIds || pictogramIds.length === 0) {
    return [];
  }

  console.log(`Getting ${pictogramIds.length} pictograms from ARASAAC (language: ${language})`);
  console.log(`   IDs: ${pictogramIds.slice(0, 10).join(', ')}${pictogramIds.length > 10 ? '...' : ''}`);

  try {
    // Get information for each pictogram in parallel
    const promises = pictogramIds.map(async (id) => {
      try {
        console.log(`   Getting pictogram ID: ${id}`);
        const pictogram = await getPictogramById(id, language);
        // Get main text (first keyword)
        const text = pictogram.keywords?.[0]?.keyword || `Pictogram ${id}`;
        console.log(`   Pictogram ${id} obtained: "${text}"`);
        return { id, pictogram, text };
      } catch (error: any) {
        console.warn(`Could not get pictogram ${id}:`, error.message || error);
        return { id, pictogram: null, text: `Pictogram ${id}` };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.pictogram !== null).length;
    console.log(`Obtained ${successful}/${pictogramIds.length} pictograms successfully`);
    return results;
  } catch (error: any) {
    console.error('Error getting pictograms by IDs:', error);
    throw new Error(error.message || 'Error getting pictograms.');
  }
}
