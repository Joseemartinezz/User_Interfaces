// Azure OpenAI DALL-E Image Generation Service for AAC Phrases
// Backend service that handles image generation with DALL-E 3 via Azure OpenAI

/**
 * Construye el prompt optimizado para generar imágenes AAC child-friendly
 */
function buildAacImagePrompt(phrase) {
  return `
Create a simple, clear, family-friendly, inclusive illustration for a child who uses an AAC (Augmentative and Alternative Communication) device.

Requirements:
- The image must be easy for a child to recognize and understand instantly.
- Show ONE main subject or action, centered and uncluttered.
- Use flat colors, soft shapes, minimal detail, and a friendly style.
- Inclusive representation: neutral skin tones or varied tones depending on the phrase.
- No text, no letters, no symbols, no numbers anywhere in the image.
- Background should be simple or minimal, only when helpful for understanding.
- Absolutely no violent, scary, or adult content.
- The image should directly communicate the meaning of the phrase.

Phrase to illustrate:
“${phrase}”
  `.trim();
}

/**
 * Obtiene la configuración de Azure OpenAI para imágenes desde variables de entorno
 */
function getAzureOpenAIConfig() {
  const endpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_IMAGE_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME || 'dall-e-3';
  const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION || '2024-02-01';

  if (!endpoint) {
    throw new Error('AZURE_OPENAI_IMAGE_ENDPOINT no está configurada en las variables de entorno');
  }
  if (!apiKey) {
    throw new Error('AZURE_OPENAI_IMAGE_API_KEY no está configurada en las variables de entorno');
  }

  return { endpoint, apiKey, deploymentName, apiVersion };
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
 * @param {string} phrase La frase para la cual generar la imagen
 * @returns {Promise<string>} La imagen en formato base64
 */
async function generateAacImage(phrase) {
  if (!phrase || phrase.trim().length === 0) {
    throw new Error('La frase no puede estar vacía');
  }

  try {
    const { endpoint, apiKey, deploymentName, apiVersion } = getAzureOpenAIConfig();
    const prompt = buildAacImagePrompt(phrase);

    console.log(`🎨 Generando imagen con Azure OpenAI DALL-E 3 para frase: "${phrase}"`);

    // Limpiar endpoint y construir URL (siguiendo la lógica de prototype.py)
    const cleanEndpoint = endpoint.replace(/\/$/, '').replace('/models', '');
    const url = `${cleanEndpoint}/openai/deployments/${deploymentName}/images/generations?api-version=${apiVersion}`;

    const headers = {
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const body = {
      prompt: prompt,
      size: '1024x1024',
      n: 1
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

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
        throw new Error('Se ha excedido la cuota de Azure OpenAI. Verifica tu plan y límites.');
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      throw new Error('No se recibió imagen en la respuesta de Azure OpenAI');
    }

    const imageUrl = result.data[0].url;
    if (!imageUrl) {
      throw new Error('La imagen recibida no contiene URL');
    }

    // Convertir la URL a base64 para mantener compatibilidad
    const imageBase64 = await urlToBase64(imageUrl);

    console.log(`✅ Imagen generada exitosamente para: "${phrase}"`);
    return imageBase64;
  } catch (error) {
    console.error(`❌ Error generando imagen para "${phrase}":`, error);
    
    if (error.message?.includes('API Key') || error.message?.includes('no está configurada')) {
      throw new Error('Azure OpenAI API Key inválida o no configurada. Verifica AZURE_OPENAI_IMAGE_API_KEY en backend/.env');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('429')) {
      throw new Error('Se ha excedido la cuota de Azure OpenAI. Verifica tu plan y límites.');
    }

    throw new Error(error.message || 'Error desconocido al generar imagen');
  }
}

/**
 * Genera imágenes para múltiples frases en paralelo
 * @param {string[]} phrases Array de frases para las cuales generar imágenes
 * @returns {Promise<Array<{phrase: string, imageBase64: string}>>} Array de objetos con frase e imagen base64
 */
async function generateAacImagesForPhrases(phrases) {
  if (!phrases || phrases.length === 0) {
    return [];
  }

  console.log(`🎨 Generando ${phrases.length} imágenes en paralelo...`);

  const imagePromises = phrases.map(async (phrase) => {
    try {
      const imageBase64 = await generateAacImage(phrase);
      return { phrase, imageBase64 };
    } catch (error) {
      console.error(`❌ Error generando imagen para "${phrase}":`, error);
      // Retornar sin imagen en caso de error
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
    const { endpoint, apiKey, deploymentName, apiVersion } = getAzureOpenAIConfig();
    
    // Intentar generar una imagen de prueba simple para verificar la conexión
    const cleanEndpoint = endpoint.replace(/\/$/, '').replace('/models', '');
    const url = `${cleanEndpoint}/openai/deployments/${deploymentName}/images/generations?api-version=${apiVersion}`;

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

    const result = await response.json();
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
