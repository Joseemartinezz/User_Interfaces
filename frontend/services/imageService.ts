// Servicio frontend para generar imágenes con DALL-E para frases AAC
// Este servicio hace llamadas al backend que maneja toda la lógica de generación
// Evita problemas de CORS y mantiene las API keys seguras en el servidor

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface GeneratedImage {
  phrase: string;
  imageUrl: string;
  isBase64: boolean;
}

/**
 * Genera una imagen para una frase usando DALL-E a través del backend
 * El backend maneja la construcción del prompt y la llamada a OpenAI
 * @param phrase La frase para la cual generar la imagen
 * @returns URL de la imagen en formato data:image/png;base64,...
 */
export async function generateImageForPhrase(phrase: string): Promise<string> {
  if (!phrase || phrase.trim().length === 0) {
    throw new Error('La frase no puede estar vacía');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phrase: phrase.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.imageBase64) {
      throw new Error('No se recibió imagen en la respuesta del servidor');
    }

    // Retornar la imagen en base64 con el prefijo data:image
    return `data:image/png;base64,${data.imageBase64}`;
  } catch (error: any) {
    console.error('Error generating image:', error);
    
    if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar al servidor. Verifica que el backend esté ejecutándose.');
    }
    
    throw new Error(error.message || 'Error generando imagen para la frase');
  }
}

/**
 * Genera imágenes para múltiples frases en paralelo usando el endpoint batch del backend
 * @param phrases Array de frases para las cuales generar imágenes
 * @returns Array de objetos con frase e imagen
 */
export async function generateImagesForPhrases(phrases: string[]): Promise<GeneratedImage[]> {
  if (!phrases || phrases.length === 0) {
    return [];
  }

  try {
    // Usar el endpoint batch del backend para mejor performance
    const response = await fetch(`${API_BASE_URL}/api/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phrases }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.message || errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    
    // Convertir las respuestas del backend al formato esperado
    return data.images.map((img: { phrase: string; imageBase64: string }) => ({
      phrase: img.phrase,
      imageUrl: img.imageBase64 ? `data:image/png;base64,${img.imageBase64}` : '',
      isBase64: img.imageBase64 !== '',
    }));
  } catch (error: any) {
    console.error('Error generating images for phrases:', error);
    
    // Fallback: generar imágenes una por una si el endpoint batch falla
    console.log('⚠️ Fallback: generando imágenes individualmente...');
    const imagePromises = phrases.map(async (phrase) => {
      try {
        const imageUrl = await generateImageForPhrase(phrase);
        return { phrase, imageUrl, isBase64: true };
      } catch (error) {
        console.error(`Error generating image for phrase "${phrase}":`, error);
        // Retornar sin imagen en caso de error
        return { phrase, imageUrl: '', isBase64: false };
      }
    });

    return await Promise.all(imagePromises);
  }
}

