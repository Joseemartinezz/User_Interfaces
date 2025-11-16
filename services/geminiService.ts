import { GoogleGenerativeAI } from '@google/generative-ai';

// Obtener la API key desde las variables de entorno
// En Expo, las variables que empiezan con EXPO_PUBLIC_ están disponibles en process.env
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ ADVERTENCIA: EXPO_PUBLIC_GEMINI_API_KEY no está configurada en las variables de entorno');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

/**
 * Extrae frases numeradas del texto de respuesta
 */
function extractPhrases(text: string): string[] {
  const lines = text.split('\n');
  const phrases: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Busca líneas que empiecen con número seguido de punto
    const match = trimmed.match(/^\d+\.\s*(.+)$/);
    if (match && match[1]) {
      phrases.push(match[1].trim());
    }
  }

  return phrases.length > 0 ? phrases : [text.trim()];
}

/**
 * Genera frases naturales a partir de palabras seleccionadas usando Gemini
 * Ahora usa directamente la API de Gemini desde el cliente móvil
 */
export async function generatePhrases(words: string[]): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  if (!GEMINI_API_KEY) {
    throw new Error('API Key de Gemini no configurada. Agrega EXPO_PUBLIC_GEMINI_API_KEY a tu archivo .env');
  }

  try {
    const basePrompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
`;

    console.log('🔄 Llamando a Gemini API con palabras:', words);
    
    // Intentar primero con gemini-1.5-pro, si falla usar gemini-pro
    let text: string;
    let modelName = 'gemini-1.5-pro';
    
    try {
      console.log(`📡 Intentando con modelo: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(basePrompt);
      const response = await result.response;
      text = response.text();
      console.log('✅ Respuesta recibida de Gemini:', text.substring(0, 100) + '...');
    } catch (modelError: any) {
      if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
        console.log(`⚠️ ${modelName} no disponible, intentando con gemini-pro...`);
        modelName = 'gemini-pro';
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        text = response.text();
        console.log('✅ Respuesta recibida de Gemini (gemini-pro):', text.substring(0, 100) + '...');
      } else {
        throw modelError; // Re-lanzar si es otro tipo de error
      }
    }

    const phrases = extractPhrases(text);
    return phrases;
  } catch (error: any) {
    console.error('Error generating phrases:', error);
    
    if (error.message?.includes('API_KEY')) {
      throw new Error('API Key de Gemini inválida o no configurada. Verifica tu archivo .env');
    }
    
    throw new Error(error.message || 'Error al generar frases. Verifica tu API key de Gemini.');
  }
}

/**
 * Genera más frases sin repetir las existentes
 * Ahora usa directamente la API de Gemini desde el cliente móvil
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[]
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  if (!GEMINI_API_KEY) {
    throw new Error('API Key de Gemini no configurada. Agrega EXPO_PUBLIC_GEMINI_API_KEY a tu archivo .env');
  }

  try {
    const basePrompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
`;

    const promptMore = basePrompt + '\nDo NOT repeat any of these phrases:\n' + existingPhrases.join('\n');

    // Intentar primero con gemini-1.5-pro, si falla usar gemini-pro
    let text: string;
    let modelName = 'gemini-1.5-pro';
    
    try {
      console.log(`📡 Intentando con modelo: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(promptMore);
      const response = await result.response;
      text = response.text();
      console.log('✅ Respuesta recibida de Gemini:', text.substring(0, 100) + '...');
    } catch (modelError: any) {
      if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
        console.log(`⚠️ ${modelName} no disponible, intentando con gemini-pro...`);
        modelName = 'gemini-pro';
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptMore);
        const response = await result.response;
        text = response.text();
        console.log('✅ Respuesta recibida de Gemini (gemini-pro):', text.substring(0, 100) + '...');
      } else {
        throw modelError; // Re-lanzar si es otro tipo de error
      }
    }

    const phrases = extractPhrases(text);
    return phrases;
  } catch (error: any) {
    console.error('Error generating more phrases:', error);
    
    if (error.message?.includes('API_KEY')) {
      throw new Error('API Key de Gemini inválida o no configurada. Verifica tu archivo .env');
    }
    
    throw new Error(error.message || 'Error al generar más frases. Verifica tu API key de Gemini.');
  }
}

