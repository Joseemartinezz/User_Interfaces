// Azure OpenAI API service for generating phrases

// It's recommended to place sensitive keys and endpoints in environment variables!
const AZURE_OPENAI_URL = process.env.EXPO_PUBLIC_AZURE_OPENAI_URL || '';
const AZURE_OPENAI_KEY = process.env.EXPO_PUBLIC_AZURE_OPENAI_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.EXPO_PUBLIC_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

/**
 * Checks connectivity to Azure OpenAI deployment endpoint.
 */
export async function testAzureConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${AZURE_OPENAI_URL}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('❌ No se pudo conectar a Azure OpenAI:', error);
    return false;
  }
}

/**
 * Generates natural phrases from selected words using Azure OpenAI
 */
export async function generateAzurePhrases(words: string[]): Promise<string[]> {
  if (!words || words.length === 0) return [];

  try {
    const prompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
`;
    const response = await fetch(`${AZURE_OPENAI_URL}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Eres un asistente de AAC para personas con discapacidad.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // Assuming output in data.choices[0].message.content with alternatives separated by newlines or similar.
    const output = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!output) return [];
    // Simple split (adjust as needed if alternate formatting)
    return output.split('\n').filter(Boolean).map((s: string) => s.trim());
  } catch (error: any) {
    // Network guidance similar to your Gemini file
    if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
      const errorMsg = `No se pudo conectar a Azure OpenAI en ${AZURE_OPENAI_URL}.\n¿Están las variables de entorno correctas y tienes conectividad?\n`;
      throw new Error(errorMsg);
    }
    throw new Error(error.message || 'Error al generar frases con Azure OpenAI.');
  }
}

/**
 * Generate more Azure phrases not repeating existing ones
 */
export async function generateMoreAzurePhrases(
  words: string[],
  existingPhrases: string[]
): Promise<string[]> {
  if (!words || words.length === 0) return [];
  try {
    // Prompt to avoid duplicating existing phrases
    const prompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- Return one phrase per line, numbered starting from 1.
Don't repeat these already generated phrases ${existingPhrases.join(', ')}.`;
    const response = await fetch(`${AZURE_OPENAI_URL}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2023-03-15-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Eres un asistente de AAC para personas con discapacidad.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.9,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const output = data.choices && data.choices[0]?.message?.content;
    if (!output) return [];
    return output.split('\n').filter(Boolean).map((s: string) => s.trim());
  } catch (error: any) {
    throw new Error(error.message || 'Error al generar más frases con Azure OpenAI.');
  }
}