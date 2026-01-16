// Azure OpenAI API service for generating phrases
// Backend service that proxies Azure OpenAI API calls

// Note: fetch is available globally in Node.js 18+, no need to import it

// It's recommended to place sensitive keys and endpoints in environment variables!
// Helper function to get env vars (reads them at runtime, not module load time)
function getAzureConfig() {
  return {
    url: process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL || '',
    key: process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY || '',
    model: process.env.AZURE_OPENAI_PHRASE_DEPLOYMENT || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_DEPLOYMENT || 'gpt-5-mini'
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

  return fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.key,
    },
    body: JSON.stringify({
      model: config.model,
      instructions: 'You are a helpful assistant.',
      input: 'ping',
      max_output_tokens: 10,
      reasoning: {
        effort: 'minimal'
      }
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
async function generateAzurePhrases(words, childAge) {
  if (!words || words.length === 0) return [];

  const config = getAzureConfig();
  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI no está configurado. Verifica las variables de entorno AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY.');
  }

  try {
    // Build age-specific context for the prompt
    const ageContext = childAge 
      ? `The child is ${childAge} years old. Adjust the language complexity, vocabulary, and sentence structure to be age-appropriate for a ${childAge}-year-old child.`
      : 'Adjust the language complexity and vocabulary to be appropriate for a child.';

    const instructions = 'You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.';
    const input = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
${ageContext}
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

IMPORTANT: You MUST generate EXACTLY 3 phrases. No more, no less. Generate exactly 3 phrases.

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- Use vocabulary and sentence complexity appropriate for the child's age.
- Generate EXACTLY 3 different phrases. Do not generate 1, 2, 4, 5, or any other number. Only 3.
- Return exactly 3 phrases, one per line, numbered starting from 1.
`;

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        model: config.model,
        instructions: instructions,
        input: input,
        max_output_tokens: 500,
        reasoning: {
          effort: 'minimal'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: { message?: string } | string; message?: string };
      const errorMessage = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error;
      throw new Error(errorMessage || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
    
    // Extract text from output array
    let output = '';
    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              output = contentItem.text;
              break;
            }
          }
          if (output) break;
        }
      }
    }
    
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

    const extractedPhrases = phrases.length > 0 ? phrases : [output.trim()];
    // Limitar a exactamente 3 frases para la generación inicial
    return extractedPhrases.slice(0, 3);
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    throw new Error(error.message || 'Error al generar frases con Azure OpenAI.');
  }
}

/**
 * Generate more Azure phrases not repeating existing ones
 */
async function generateMoreAzurePhrases(words, existingPhrases, childAge) {
  if (!words || words.length === 0) return [];

  const config = getAzureConfig();
  if (!config.url || !config.key) {
    throw new Error('Azure OpenAI no está configurado. Verifica las variables de entorno AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY.');
  }

  try {
    // Build age-specific context for the prompt
    const ageContext = childAge 
      ? `The child is ${childAge} years old. Adjust the language complexity, vocabulary, and sentence structure to be age-appropriate for a ${childAge}-year-old child.`
      : 'Adjust the language complexity and vocabulary to be appropriate for a child.';

    const instructions = 'You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.';
    const input = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
${ageContext}
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

IMPORTANT: You MUST generate EXACTLY 1 phrase. No more, no less. Just one single phrase.

Guidelines:
- The phrase must be short but contain ALL information provided.
- It should sound natural when spoken aloud.
- It must be grammatically correct and easy for a child.
- Use vocabulary and sentence complexity appropriate for the child's age.
- Generate EXACTLY 1 phrase. No more, no less. Just one single phrase.
- Return exactly 1 phrase.

Do NOT repeat these already generated phrases: ${existingPhrases.join(', ')}.

Remember: Generate EXACTLY 1 new phrase only.`;

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.key,
      },
      body: JSON.stringify({
        model: config.model,
        instructions: instructions,
        input: input,
        max_output_tokens: 500,
        reasoning: {
          effort: 'minimal'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: { message?: string } | string; message?: string };
      const errorMessage = typeof errorData.error === 'object' ? errorData.error?.message : errorData.error;
      throw new Error(errorMessage || errorData.message || `Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as { output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
    
    // Extract text from output array
    let output = '';
    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === 'message' && item.content && Array.isArray(item.content)) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              output = contentItem.text;
              break;
            }
          }
          if (output) break;
        }
      }
    }
    
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

    const extractedPhrases = phrases.length > 0 ? phrases : [output.trim()];
    // Limitar a exactamente 1 frase para "Generate More"
    return extractedPhrases.slice(0, 1);
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
