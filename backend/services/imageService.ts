// Azure OpenAI DALL-E Image Generation Service for AAC Phrases
// Backend service that handles image generation with DALL-E 3 via Azure OpenAI

interface AzureOpenAIImageResponse {
  data: Array<{
    url: string;
  }>;
}

/**
 * Limpia y sanitiza la frase para evitar problemas con las políticas de la API
 */
function sanitizePhrase(phrase) {
  if (!phrase) return '';
  
  // Limpiar la frase: remover números al inicio, puntos, y caracteres especiales problemáticos
  let cleaned = phrase.trim()
    .replace(/^\d+\.\s*/, '') // Remover números al inicio
    .replace(/[^\w\s.,!?-]/g, '') // Remover caracteres especiales excepto puntuación básica
    .trim();
  
  // Convertir a minúsculas para evitar problemas
  cleaned = cleaned.toLowerCase();
  
  return cleaned;
}

/**
 * Construye el prompt optimizado para generar imágenes AAC child-friendly
 * Usa un enfoque seguro que cumple con las políticas de la API
 */
function buildAacImagePrompt(phrase) {
  // Sanitizar la frase
  const sanitizedPhrase = sanitizePhrase(phrase);
  
  // Crear un prompt más seguro, descriptivo y genérico
  // Evitamos incluir la frase directamente si puede ser problemática
  // En su lugar, usamos un formato más descriptivo y seguro
  return `A cheerful, simple illustration for children showing a positive and happy scene. 
The illustration should be colorful, friendly, and easy to understand. 
Use soft, rounded shapes, bright colors, and a warm, welcoming style. 
The image should show appropriate, family-friendly content suitable for young children. 
Keep the design simple with a clean, uncluttered background. 
No text, letters, numbers, or symbols should appear in the image. 
The overall feeling should be positive, happy, and inclusive. 
Illustrate the concept: ${sanitizedPhrase}`.trim();
}

/**
 * Obtiene la configuración de Azure OpenAI para imágenes desde variables de entorno
 * El endpoint ya viene completo con deploymentName y api-version
 */
function getAzureOpenAIConfig() {
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY;

  if (!endpoint) {
    throw new Error('AZURE_OPENAI_IMAGE_ENDPOINT no está configurada en las variables de entorno');
  }
  if (!apiKey) {
    throw new Error('AZURE_OPENAI_IMAGE_API_KEY no está configurada en las variables de entorno');
  }

  return { endpoint, apiKey };
}

/**
 * Convierte una imagen desde una URL a base64
 * @param {string} imageUrl URL de la imagen
 * @returns {Promise<string>} Imagen en formato base64
 */
async function urlToBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Error al descargar imagen: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    throw new Error(`Error convirtiendo URL a base64: ${error.message}`);
  }
}

/**
 * Genera una imagen para una frase AAC usando DALL-E 3 a través de Azure OpenAI
 * Incluye lógica de retry con backoff exponencial para manejar errores de conexión
 * @param {string} phrase La frase para la cual generar la imagen
 * @param {number} retryAttempt Número de intento actual (para retry)
 * @returns {Promise<string>} La imagen en formato base64
 */
async function generateAacImage(phrase, retryAttempt = 0) {
  if (!phrase || phrase.trim().length === 0) {
    throw new Error('La frase no puede estar vacía');
  }

  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000; // 1 segundo inicial

  try {
    const { endpoint, apiKey } = getAzureOpenAIConfig();
    const prompt = buildAacImagePrompt(phrase);

    if (retryAttempt === 0) {
      console.log(`🎨 Generando imagen con Azure OpenAI DALL-E 3 para frase: "${phrase}"`);
    } else {
      console.log(`🔄 Reintentando generación de imagen (intento ${retryAttempt + 1}/${MAX_RETRIES + 1}) para: "${phrase}"`);
    }

    // El endpoint ya viene completo con deploymentName y api-version
    const url = endpoint;

    const headers = {
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const body = {
      prompt: prompt,
      size: '1024x1024',
      n: 1
    };

    // Timeout más largo para evitar ECONNRESET (60 segundos)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Error de Azure OpenAI: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto tal cual
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Azure OpenAI API Key inválida o no configurada. Verifica AZURE_OPENAI_IMAGE_API_KEY en backend/.env');
      }
      
      if (response.status === 429) {
        // Para rate limiting, hacer retry con delay más largo
        if (retryAttempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt); // Backoff exponencial
          console.log(`⏳ Rate limit detectado. Esperando ${delay}ms antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateAacImage(phrase, retryAttempt + 1);
        }
        throw new Error('Se ha excedido la cuota de Azure OpenAI. Verifica tu plan y límites.');
      }

      throw new Error(errorMessage);
    }

    const result = await response.json() as AzureOpenAIImageResponse;

    if (!result.data || result.data.length === 0) {
      throw new Error('No se recibió imagen en la respuesta de Azure OpenAI');
    }

    const imageUrl = result.data[0].url;
    if (!imageUrl) {
      throw new Error('La imagen recibida no contiene URL');
    }

    // Convertir la URL a base64 para mantener compatibilidad
    const imageBase64 = await urlToBase64(imageUrl);

    if (retryAttempt > 0) {
      console.log(`✅ Imagen generada exitosamente después de ${retryAttempt + 1} intentos para: "${phrase}"`);
    } else {
      console.log(`✅ Imagen generada exitosamente para: "${phrase}"`);
    }
    return imageBase64;
  } catch (error) {
    // Detectar errores de conexión que pueden ser recuperables
    const isConnectionError = 
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('fetch failed') ||
      error.message?.includes('ECONNRESET') ||
      error.name === 'AbortError';

    // Si es un error de conexión y aún tenemos reintentos disponibles, reintentar
    if (isConnectionError && retryAttempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryAttempt); // Backoff exponencial: 1s, 2s, 4s
      console.log(`⚠️ Error de conexión detectado (${error.code || error.message}). Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateAacImage(phrase, retryAttempt + 1);
    }

    console.error(`❌ Error generando imagen para "${phrase}" (intento ${retryAttempt + 1}):`, error);
    
    if (error.message?.includes('API Key') || error.message?.includes('no está configurada')) {
      throw new Error('Azure OpenAI API Key inválida o no configurada. Verifica AZURE_OPENAI_IMAGE_API_KEY en backend/.env');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
      throw new Error('Se ha excedido la cuota de Azure OpenAI. Verifica tu plan y límites.');
    }

    throw new Error(error.message || 'Error desconocido al generar imagen');
  }
}

// Variable global para rastrear el último tiempo de solicitud (para evitar saturar Azure)
let lastRequestTime = 0;
const MIN_DELAY_BETWEEN_REQUESTS = 300; // 300ms mínimo entre solicitudes

/**
 * Genera imágenes para múltiples frases en paralelo con delay escalonado
 * (evita rate limiting de Azure OpenAI usando delays entre llamadas)
 * @param {string[]} phrases Array de frases para las cuales generar imágenes
 * @returns {Promise<Array<{phrase: string, imageBase64: string}>>} Array de objetos con frase e imagen base64
 */
async function generateAacImagesForPhrases(phrases) {
  if (!phrases || phrases.length === 0) {
    return [];
  }

  console.log(`🎨 Generando ${phrases.length} imágenes en paralelo con delays escalonados...`);

  // Función helper para delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Generar imágenes en paralelo con delay escalonado para evitar rate limiting
  // Cada imagen se inicia con un delay de 500ms respecto a la anterior
  // Además, respetamos un delay mínimo desde la última solicitud
  const imagePromises = phrases.map(async (phrase, index) => {
    try {
      // Calcular delay escalonado: 500ms, 1000ms, 1500ms, etc.
      const baseDelay = index * 500;
      
      // Asegurar que haya un delay mínimo desde la última solicitud
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const additionalDelay = Math.max(0, MIN_DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
      
      const totalDelay = baseDelay + additionalDelay;
      
      if (totalDelay > 0) {
        await delay(totalDelay);
      }
      
      lastRequestTime = Date.now();
      
      console.log(`🖼️ Iniciando generación de imagen ${index + 1}/${phrases.length} para: "${phrase}"`);
      const imageBase64 = await generateAacImage(phrase);
      console.log(`✅ Imagen ${index + 1}/${phrases.length} completada`);
      return { phrase, imageBase64 };
    } catch (error) {
      console.error(`❌ Error generando imagen ${index + 1}/${phrases.length} para "${phrase}":`, error);
      // Retornar sin imagen en caso de error (después de todos los reintentos)
      return { phrase, imageBase64: '' };
    }
  });

  const results = await Promise.all(imagePromises);
  const successful = results.filter(r => r.imageBase64 !== '').length;
  console.log(`✅ ${successful}/${phrases.length} imágenes generadas exitosamente`);

  return results;
}

/**
 * Prueba la conexión con Azure OpenAI
 * @returns {Promise<boolean>}
 */
async function testOpenAIConnection() {
  try {
    const { endpoint, apiKey } = getAzureOpenAIConfig();
    
    // El endpoint ya viene completo con deploymentName y api-version
    const url = endpoint;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        prompt: 'A simple test image',
        size: '1024x1024',
        n: 1
      })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json() as AzureOpenAIImageResponse;
    return result.data && result.data.length > 0;
  } catch (error) {
    console.error('❌ Error probando conexión con Azure OpenAI:', error);
    return false;
  }
}

module.exports = {
  generateAacImage,
  generateAacImagesForPhrases,
  testOpenAIConnection
};
