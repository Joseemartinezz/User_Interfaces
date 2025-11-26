// Azure OpenAI API service for generating phrases
// Backend service that proxies Azure OpenAI API calls

// Note: fetch is available globally in Node.js 18+, no need to import it

// It's recommended to place sensitive keys and endpoints in environment variables!
// Helper function to get env vars (reads them at runtime, not module load time)
function getAzureConfig() {
  return {
    url: process.env.AZURE_OPENAI_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_URL || '',
    key: process.env.AZURE_OPENAI_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_KEY || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2023-03-15-preview'
  };
}

/**
 * Checks connectivity to Azure OpenAI deployment endpoint.
 */
function testAzureConnection() {
  const config = getAzureConfig();
  if (!config.url || !config.key) {
    return false;
  }

  return fetch(`${config.url}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.key,
    },
    body: JSON.stringify({
      messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }],
      max_tokens: 5,
    }),
  })
    .then(response => response.ok)
    .catch(error => {
      console.error('❌ No se pudo conectar a Azure OpenAI:', error);
      return false;
    });
}

/**
 * Generates natural phrases from selected words using Azure OpenAI
 */
async function generateAzurePhrases(words) {
  if (!words || words.length === 0) return [];

  const config = getAzureConfig();
  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI no está configurado. Verifica las variables de entorno AZURE_OPENAI_URL y AZURE_OPENAI_KEY.');
  }

  try {
    const prompt = `
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

    const response = await fetch(`${config.url}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error?.message || errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;
    if (!output) return [];

    // Extract phrases from numbered list
    const lines = output.split('\n');
    /** @type {string[]} */
    const phrases = [];
    for (const line of lines) {
      const cleaned = String(line).replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned && cleaned.length > 0) {
        // @ts-ignore - phrases is typed as string[] via JSDoc
        phrases.push(cleaned);
      }
    }

    return phrases.length > 0 ? phrases : [output.trim()];
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    throw new Error(error.message || 'Error al generar frases con Azure OpenAI.');
  }
}

/**
 * Generate more Azure phrases not repeating existing ones
 */
async function generateMoreAzurePhrases(words, existingPhrases) {
  if (!words || words.length === 0) return [];

  const config = getAzureConfig();
  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI no está configurado. Verifica las variables de entorno AZURE_OPENAI_URL y AZURE_OPENAI_KEY.');
  }

  try {
    const prompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- Return one phrase per line, numbered starting from 1.
Don't repeat these already generated phrases: ${existingPhrases.join(', ')}.`;

    const response = await fetch(`${config.url}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.9,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error?.message || errorData.error || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content;
    if (!output) return [];

    // Extract phrases from numbered list
    const lines = output.split('\n');
    /** @type {string[]} */
    const phrases = [];
    for (const line of lines) {
      const cleaned = String(line).replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned && cleaned.length > 0) {
        // @ts-ignore - phrases is typed as string[] via JSDoc
        phrases.push(cleaned);
      }
    }

    return phrases.length > 0 ? phrases : [output.trim()];
  } catch (error) {
    console.error('❌ Error generating more phrases with Azure OpenAI:', error);
    throw new Error(error.message || 'Error al generar más frases con Azure OpenAI.');
  }
}

module.exports = {
  testAzureConnection,
  generateAzurePhrases,
  generateMoreAzurePhrases
};
