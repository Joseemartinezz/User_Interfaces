// URL del backend - Cambia esto según tu configuración
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Configuración: usar proxy del backend para imágenes (evita problemas de DNS)
const USE_BACKEND_PROXY_FOR_IMAGES = true;

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
  skinColor?: string; // Por ejemplo: '#F5E6DE', '#E2C4A8', '#A65E26', '#5A463A'
  hairColor?: string; // Por ejemplo: '#000000', '#8B4513', '#FFD700'
  action?: 'present' | 'past' | 'future';
}

/**
 * Busca pictogramas de ARASAAC por término de búsqueda
 * @param searchTerm Término de búsqueda en el idioma especificado
 * @param language Código de idioma (ej: 'es', 'en', 'it', 'fr')
 */
export async function searchPictograms(
  searchTerm: string,
  language: string = 'es'
): Promise<ArasaacPictogram[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  try {
    console.log(`🔍 Buscando pictogramas para: "${searchTerm}" en idioma: ${language}`);
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
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string };
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const pictograms = await response.json() as ArasaacPictogram[];
    console.log(`✅ Se encontraron ${pictograms.length} pictogramas`);
    return pictograms;
  } catch (error: any) {
    console.error('Error buscando pictogramas:', error);
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      const errorMsg = `No se pudo conectar al servidor backend en ${API_BASE_URL}.\n\n` +
        `Solución:\n` +
        `1. Verifica que el servidor esté corriendo: npm run server\n` +
        `2. Prueba en el navegador: ${API_BASE_URL}`;
      throw new Error(errorMsg);
    }
    
    throw new Error(error.message || 'Error al buscar pictogramas. Verifica que el servidor backend esté ejecutándose.');
  }
}

/**
 * Obtiene la información de un pictograma específico por su ID
 * @param pictogramId ID del pictograma
 * @param language Código de idioma (ej: 'es', 'en', 'it', 'fr')
 */
export async function getPictogramById(
  pictogramId: number,
  language: string = 'es'
): Promise<ArasaacPictogram> {
  try {
    console.log(`🔍 Obteniendo pictograma ID: ${pictogramId} en idioma: ${language}`);
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
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string };
      console.error('❌ Error del servidor:', errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const pictogram = await response.json() as ArasaacPictogram;
    console.log(`✅ Pictograma obtenido: ${pictogram._id}`);
    return pictogram;
  } catch (error: any) {
    console.error('Error obteniendo pictograma:', error);
    throw new Error(error.message || 'Error al obtener el pictograma.');
  }
}

/**
 * Genera la URL de la imagen de un pictograma con las opciones especificadas
 * Por defecto usa el proxy del backend para evitar problemas de DNS y CORS
 * @param pictogramId ID del pictograma
 * @param options Opciones de personalización de la imagen
 */
export function getPictogramImageUrl(
  pictogramId: number,
  options: PictogramImageOptions = {}
): string {
  const {
    size = 'medium',
    plural = false,
    color = true,
    backgroundColor = 'white',
    skinColor,
    hairColor,
    action = 'present',
  } = options;

  // Si usamos el proxy del backend (recomendado para evitar problemas de DNS)
  if (USE_BACKEND_PROXY_FOR_IMAGES) {
    // Construir URL del backend proxy
    let url = `${API_BASE_URL}/api/arasaac/image/${pictogramId}`;
    
    // Construir parámetros para el proxy
    const params: string[] = [];
    
    // Color (solo agregar si es false, por defecto es true)
    if (!color) {
      params.push('color=false');
    }
    
    // Plural (solo agregar si es true)
    if (plural) {
      params.push('plural=true');
    }
    
    // Color de fondo (solo agregar si no es white)
    if (backgroundColor !== 'white') {
      params.push(`backgroundColor=${encodeURIComponent(backgroundColor)}`);
    }
    
    // Color de piel
    if (skinColor) {
      params.push(`skin=${encodeURIComponent(skinColor)}`);
    }
    
    // Color de cabello
    if (hairColor) {
      params.push(`hair=${encodeURIComponent(hairColor)}`);
    }
    
    // Acción/tiempo verbal
    if (action !== 'present') {
      params.push(`action=${encodeURIComponent(action)}`);
    }

    // Construir la URL final
    const queryString = params.length > 0 ? params.join('&') : '';
    return queryString ? `${url}?${queryString}` : url;
  }

  // URL directa de ARASAAC (puede tener problemas de DNS en emuladores)
  const baseUrl = 'https://api.arasaac.org/api/pictograms';
  let url = `${baseUrl}/${pictogramId}`;
  
  const params: string[] = [];
  
  if (!color) {
    params.push('color=false');
  }
  if (plural) {
    params.push('plural=true');
  }
  if (backgroundColor !== 'white') {
    params.push(`backgroundColor=${encodeURIComponent(backgroundColor)}`);
  }
  if (skinColor) {
    params.push(`skin=${encodeURIComponent(skinColor)}`);
  }
  if (hairColor) {
    params.push(`hair=${encodeURIComponent(hairColor)}`);
  }
  if (action !== 'present') {
    params.push(`action=${encodeURIComponent(action)}`);
  }

  const queryString = params.length > 0 ? params.join('&') : '';
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Busca pictogramas para múltiples palabras a la vez
 * Útil para obtener pictogramas para una frase completa
 * @param words Array de palabras a buscar
 * @param language Código de idioma
 */
export async function searchMultiplePictograms(
  words: string[],
  language: string = 'es'
): Promise<Map<string, ArasaacPictogram[]>> {
  const results = new Map<string, ArasaacPictogram[]>();
  
  // Buscar pictogramas para cada palabra
  const promises = words.map(async (word) => {
    const pictograms = await searchPictograms(word, language);
    return { word, pictograms };
  });
  
  const allResults = await Promise.all(promises);
  
  // Crear el mapa con los resultados
  allResults.forEach(({ word, pictograms }) => {
    results.set(word, pictograms);
  });
  
  return results;
}

/**
 * Obtiene el mejor pictograma para una palabra
 * Retorna el pictograma con más descargas o el primero si no hay información de descargas
 * @param word Palabra a buscar
 * @param language Código de idioma
 */
export async function getBestPictogramForWord(
  word: string,
  language: string = 'es'
): Promise<ArasaacPictogram | null> {
  const pictograms = await searchPictograms(word, language);
  
  if (pictograms.length === 0) {
    return null;
  }
  
  // Ordenar por número de descargas (más populares primero)
  const sorted = pictograms.sort((a, b) => {
    const downloadsA = a.downloads || 0;
    const downloadsB = b.downloads || 0;
    return downloadsB - downloadsA;
  });
  
  return sorted[0];
}

/**
 * Convierte un array de palabras en pictogramas (busca el mejor para cada palabra)
 * @param words Array de palabras
 * @param language Código de idioma
 */
export async function convertWordsToPictograms(
  words: string[],
  language: string = 'es'
): Promise<Array<{ word: string; pictogram: ArasaacPictogram | null; imageUrl: string | null }>> {
  const results = await Promise.all(
    words.map(async (word) => {
      const pictogram = await getBestPictogramForWord(word, language);
      const imageUrl = pictogram ? getPictogramImageUrl(pictogram._id) : null;
      return { word, pictogram, imageUrl };
    })
  );
  
  return results;
}

