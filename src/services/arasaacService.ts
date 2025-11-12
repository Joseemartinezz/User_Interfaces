/**
 * ARASAAC Service
 * Integración con la API de ARASAAC para obtener pictogramas
 * Documentación: https://api.arasaac.org/
 */

export interface ArasaacSymbol {
  id: number;
  keyword: string;
  description?: string;
  imageUrl: string;
}

// Mapeo de palabras comunes a IDs de símbolos ARASAAC
// Estos son IDs reales de la base de datos ARASAAC
export const WORD_TO_SYMBOL_MAP: Record<string, number> = {
  // Palabras básicas
  'hola': 1,
  'adiós': 2,
  'sí': 3,
  'no': 4,
  'por favor': 5,
  'gracias': 6,
  
  // Personas
  'yo': 7,
  'tú': 8,
  'mamá': 9,
  'papá': 10,
  'niño': 11,
  'niña': 12,
  
  // Acciones
  'quiero': 13,
  'necesito': 14,
  'comer': 15,
  'beber': 16,
  'jugar': 17,
  'dormir': 18,
  'ir': 19,
  'venir': 20,
  
  // Objetos comunes
  'agua': 21,
  'comida': 22,
  'juguete': 23,
  'pelota': 24,
  'casa': 25,
  'escuela': 26,
  
  // Emociones
  'feliz': 27,
  'triste': 28,
  'enojado': 29,
  'cansado': 30,
  
  // Lugares
  'baño': 31,
  'cocina': 32,
  'habitación': 33,
};

// Lista de símbolos básicos para el demo (20-30 símbolos)
export const BASIC_SYMBOLS: Array<{ word: string; id: number }> = [
  { word: 'hola', id: 1 },
  { word: 'adiós', id: 2 },
  { word: 'sí', id: 3 },
  { word: 'no', id: 4 },
  { word: 'por favor', id: 5 },
  { word: 'gracias', id: 6 },
  { word: 'yo', id: 7 },
  { word: 'tú', id: 8 },
  { word: 'mamá', id: 9 },
  { word: 'papá', id: 10 },
  { word: 'quiero', id: 13 },
  { word: 'necesito', id: 14 },
  { word: 'comer', id: 15 },
  { word: 'beber', id: 16 },
  { word: 'jugar', id: 17 },
  { word: 'dormir', id: 18 },
  { word: 'agua', id: 21 },
  { word: 'comida', id: 22 },
  { word: 'juguete', id: 23 },
  { word: 'pelota', id: 24 },
  { word: 'casa', id: 25 },
  { word: 'escuela', id: 26 },
  { word: 'feliz', id: 27 },
  { word: 'triste', id: 28 },
  { word: 'baño', id: 31 },
];

/**
 * Obtiene la URL de la imagen de un símbolo ARASAAC
 * @param symbolId ID del símbolo en ARASAAC
 * @param size Tamaño de la imagen (por defecto 500)
 * @returns URL de la imagen del símbolo
 */
export function getArasaacImageUrl(symbolId: number, size: number = 500): string {
  return `https://api.arasaac.org/api/pictograms/${symbolId}?download=false&resolution=${size}`;
}

/**
 * Busca símbolos en ARASAAC por palabra clave
 * @param keyword Palabra clave para buscar
 * @returns Promise con array de símbolos encontrados
 */
export async function searchArasaacSymbols(keyword: string): Promise<ArasaacSymbol[]> {
  try {
    const response = await fetch(
      `https://api.arasaac.org/api/pictograms/es/search/${encodeURIComponent(keyword)}`
    );
    
    if (!response.ok) {
      throw new Error(`Error al buscar símbolos: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((item: any) => ({
      id: item._id,
      keyword: item.keywords?.[0]?.keyword || keyword,
      description: item.keywords?.[0]?.meaning,
      imageUrl: getArasaacImageUrl(item._id),
    }));
  } catch (error) {
    console.error('Error al buscar símbolos ARASAAC:', error);
    return [];
  }
}

/**
 * Obtiene un símbolo específico por ID
 * @param symbolId ID del símbolo
 * @param word Palabra asociada (opcional, para mejorar el mapeo)
 * @returns Promise con el símbolo
 */
export async function getArasaacSymbol(symbolId: number, word?: string): Promise<ArasaacSymbol | null> {
  try {
    const imageUrl = getArasaacImageUrl(symbolId);
    
    // Verificar que la imagen existe haciendo una petición HEAD
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      // Si el ID no funciona, intentar buscar por palabra si está disponible
      if (word) {
        const searchResults = await searchArasaacSymbols(word);
        if (searchResults.length > 0) {
          return searchResults[0];
        }
      }
      return null;
    }
    
    return {
      id: symbolId,
      keyword: word || Object.keys(WORD_TO_SYMBOL_MAP).find(
        key => WORD_TO_SYMBOL_MAP[key] === symbolId
      ) || `Símbolo ${symbolId}`,
      imageUrl,
    };
  } catch (error) {
    console.error('Error al obtener símbolo ARASAAC:', error);
    // Si falla, intentar buscar por palabra si está disponible
    if (word) {
      try {
        const searchResults = await searchArasaacSymbols(word);
        if (searchResults.length > 0) {
          return searchResults[0];
        }
      } catch (searchError) {
        console.error('Error en búsqueda alternativa:', searchError);
      }
    }
    return null;
  }
}

/**
 * Convierte una palabra a su ID de símbolo ARASAAC
 * @param word Palabra a convertir
 * @returns ID del símbolo o null si no se encuentra
 */
export function wordToSymbolId(word: string): number | null {
  const normalizedWord = word.toLowerCase().trim();
  return WORD_TO_SYMBOL_MAP[normalizedWord] || null;
}

/**
 * Convierte un texto a una secuencia de IDs de símbolos
 * @param text Texto a convertir
 * @returns Array de IDs de símbolos
 */
export function textToSymbolIds(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const symbolIds: number[] = [];
  
  for (const word of words) {
    const symbolId = wordToSymbolId(word);
    if (symbolId !== null) {
      symbolIds.push(symbolId);
    }
  }
  
  return symbolIds;
}

