// Frontend service to generate images with DALL-E for AAC phrases
// This service makes calls to the backend that handles all generation logic
// Avoids CORS issues and keeps API keys secure on the server

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface GeneratedImage {
  phrase: string;
  imageUrl: string;
  isBase64: boolean;
}

/**
 * Generates an image for a phrase using DALL-E through the backend
 * The backend handles prompt construction and the OpenAI call
 * @param phrase The phrase for which to generate the image
 * @returns Image URL in data:image/png;base64,... format
 */
export async function generateImageForPhrase(phrase: string): Promise<string> {
  if (!phrase || phrase.trim().length === 0) {
    throw new Error('The phrase cannot be empty');
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
      throw new Error('No image received in server response');
    }

    // Return the image in base64 with the data:image prefix
    return `data:image/png;base64,${data.imageBase64}`;
  } catch (error: any) {
    console.error('Error generating image:', error);
    
    if (error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      throw new Error('Could not connect to server. Verify that the backend is running.');
    }
    
    throw new Error(error.message || 'Error generating image for the phrase');
  }
}

/**
 * Generates images for multiple phrases in parallel using the backend batch endpoint
 * @param phrases Array of phrases for which to generate images
 * @returns Array of objects with phrase and image
 */
export async function generateImagesForPhrases(phrases: string[]): Promise<GeneratedImage[]> {
  if (!phrases || phrases.length === 0) {
    return [];
  }

  try {
    // Use the backend batch endpoint for better performance
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
    
    // Convert the backend responses to the expected format
    return data.images.map((img: { phrase: string; imageBase64: string }) => ({
      phrase: img.phrase,
      imageUrl: img.imageBase64 ? `data:image/png;base64,${img.imageBase64}` : '',
      isBase64: img.imageBase64 !== '',
    }));
  } catch (error: any) {
    console.error('Error generating images for phrases:', error);
    
    // Fallback: generate images one by one if batch endpoint fails
    console.log('Fallback: generating images individually...');
    const imagePromises = phrases.map(async (phrase) => {
      try {
        const imageUrl = await generateImageForPhrase(phrase);
        return { phrase, imageUrl, isBase64: true };
      } catch (error) {
        console.error(`Error generating image for phrase "${phrase}":`, error);
        // Return without image in case of error
        return { phrase, imageUrl: '', isBase64: false };
      }
    });

    return await Promise.all(imagePromises);
  }
}

