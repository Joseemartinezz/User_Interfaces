// ARASAAC Service - Backend
// Service for interacting with ARASAAC API directly
// This service makes direct calls to https://api.arasaac.org/api

// Note: fetch is available globally in Node.js 18+, no need to import it
// If using older Node.js, fetch is already imported in index.js
// Using global fetch (available via node-fetch in index.js)

/**
 * Base URL of ARASAAC API
 */
const ARASAAC_BASE_URL = 'https://api.arasaac.org/api';

/**
 * ARASAAC pictogram type
 */
interface ArasaacPictogram {
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
 * Searches ARASAAC pictograms by search term
 * @param searchTerm Search term in the specified language
 * @param language Language code (e.g. 'es', 'en', 'it', 'fr') - defaults to 'es'
 */
async function searchPictograms(
  searchTerm: string,
  language: string = 'es'
): Promise<ArasaacPictogram[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    console.log(`🔍 Searching ARASAAC pictograms: "${searchTerm}" in language: ${language}`);
    const url = `${ARASAAC_BASE_URL}/pictograms/${language}/search/${encodeURIComponent(searchTerm)}`;
    console.log(`📡 ARASAAC URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ ARASAAC error: ${response.status} ${response.statusText}`);
      throw new Error(`ARASAAC API error: ${response.status} ${response.statusText}`);
    }

    const pictograms = await response.json() as ArasaacPictogram[];
    console.log(`✅ Found ${pictograms.length} pictograms in ARASAAC`);
    return pictograms;
  } catch (error: any) {
    console.error('❌ Error searching pictograms in ARASAAC:', error);
    throw new Error(error.message || 'Error searching pictograms in ARASAAC');
  }
}

/**
 * Gets information for a specific pictogram by its ID
 * @param pictogramId Pictogram ID
 * @param language Language code (e.g. 'es', 'en', 'it', 'fr') - defaults to 'es'
 */
async function getPictogramById(
  pictogramId: number,
  language: string = 'es'
): Promise<ArasaacPictogram> {
  try {
    console.log(`🔍 Getting ARASAAC pictogram ID: ${pictogramId} in language: ${language}`);
    const url = `${ARASAAC_BASE_URL}/pictograms/${language}/${pictogramId}`;
    console.log(`📡 ARASAAC URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ ARASAAC error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        throw new Error(`Pictogram with ID ${pictogramId} was not found`);
      }
      
      throw new Error(`ARASAAC API error: ${response.status} ${response.statusText}`);
    }

    const pictogram = await response.json() as ArasaacPictogram;
    console.log(`✅ Pictogram obtained: ${pictogram._id}`);
    return pictogram;
  } catch (error: any) {
    console.error('❌ Error getting pictogram from ARASAAC:', error);
    throw new Error(error.message || 'Error getting pictogram from ARASAAC');
  }
}

/**
 * Gets pictogram image as buffer
 * @param pictogramId Pictogram ID
 * @param options Options for image customization
 */
async function getPictogramImage(
  pictogramId: number,
  options: {
    color?: boolean;
    backgroundColor?: string;
    plural?: boolean;
    skin?: string;
    hair?: string;
    action?: string;
  } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const { color, backgroundColor, plural, skin, hair, action } = options;
    
    // Build ARASAAC URL with optional parameters
    let url = `${ARASAAC_BASE_URL}/pictograms/${pictogramId}`;
    const params: string[] = [];
    
    if (color !== undefined) {
      params.push(`color=${color}`);
    }
    if (backgroundColor) {
      params.push(`backgroundColor=${encodeURIComponent(backgroundColor)}`);
    }
    if (plural === true) {
      params.push('plural=true');
    }
    if (skin) {
      params.push(`skin=${encodeURIComponent(skin)}`);
    }
    if (hair) {
      params.push(`hair=${encodeURIComponent(hair)}`);
    }
    if (action) {
      params.push(`action=${encodeURIComponent(action)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    console.log(`📡 ARASAAC URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/png,image/*,*/*',
      },
    });

    if (!response.ok) {
      console.error(`❌ ARASAAC error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        throw new Error(`Pictogram with ID ${pictogramId} was not found`);
      }
      
      throw new Error(`ARASAAC API error: ${response.status} ${response.statusText}`);
    }

    // Get image buffer
    // node-fetch v2 uses .buffer(), v3 uses .arrayBuffer()
    let imageBuffer: Buffer;
    try {
      // node-fetch v2 has buffer() method, v3 uses arrayBuffer()
      const responseAny = response as any;
      if (typeof responseAny.buffer === 'function') {
        imageBuffer = await responseAny.buffer();
      } else {
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      }
    } catch (error) {
      // Fallback to arrayBuffer if buffer() fails
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';
    console.log(`✅ Image obtained: ${imageBuffer.length} bytes, type: ${contentType}`);

    return { buffer: imageBuffer, contentType };
  } catch (error: any) {
    console.error('❌ Error getting image from ARASAAC:', error);
    throw new Error(error.message || 'Error getting image from ARASAAC');
  }
}

/**
 * Searches pictograms for multiple words
 * @param words Array of words to search
 * @param language Language code - defaults to 'es'
 */
async function searchMultiplePictograms(
  words: string[],
  language: string = 'es'
): Promise<Record<string, { pictograms: ArasaacPictogram[]; error: boolean }>> {
  if (!words || words.length === 0) {
    return {};
  }

  try {
    console.log(`🔍 Searching pictograms for ${words.length} words in language: ${language}`);

    // Search pictograms for each word in parallel
    const searchPromises = words.map(async (word) => {
      try {
        const pictograms = await searchPictograms(word, language);
        return { word, pictograms, error: false };
      } catch (error) {
        console.error(`❌ Error searching "${word}":`, error);
        return { word, pictograms: [], error: true };
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Convert to object for easier access
    const resultsMap: Record<string, { pictograms: ArasaacPictogram[]; error: boolean }> = {};
    results.forEach(({ word, pictograms, error }) => {
      resultsMap[word] = { pictograms, error };
    });

    console.log(`✅ Search completed for ${words.length} words`);
    return resultsMap;
  } catch (error: any) {
    console.error('❌ Error in multiple search:', error);
    throw new Error(error.message || 'Error searching multiple pictograms');
  }
}

module.exports = {
  searchPictograms,
  getPictogramById,
  getPictogramImage,
  searchMultiplePictograms
};
