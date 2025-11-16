const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('⚠️ ERROR: GEMINI_API_KEY no está configurada en las variables de entorno');
  console.error('   Agrega GEMINI_API_KEY=tu_clave_aqui al archivo .env');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Extrae frases numeradas del texto de respuesta
 */
function extractPhrases(text) {
  const lines = text.split('\n');
  const phrases = [];

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
 * Endpoint para generar frases
 */
app.post('/api/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY no está configurada');
      return res.status(500).json({ 
        error: 'API Key de Gemini no configurada en el servidor',
        message: 'Verifica que el archivo server/.env tenga GEMINI_API_KEY configurada'
      });
    }

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
    // Usar gemini-1.5-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    console.log('📡 Enviando prompt a Gemini con modelo gemini-1.5-pro...');
    const result = await model.generateContent(basePrompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Respuesta recibida de Gemini:', text.substring(0, 100) + '...');

    const phrases = extractPhrases(text);

    res.json({ phrases });
  } catch (error) {
    console.error('❌ Error generating phrases:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Endpoint para generar más frases
 */
app.post('/api/generate-more-phrases', async (req, res) => {
  try {
    const { words, existingPhrases } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY no está configurada');
      return res.status(500).json({ 
        error: 'API Key de Gemini no configurada en el servidor',
        message: 'Verifica que el archivo server/.env tenga GEMINI_API_KEY configurada'
      });
    }

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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(promptMore);
    const response = await result.response;
    const text = response.text();

    const phrases = extractPhrases(text);

    res.json({ phrases });
  } catch (error) {
    console.error('❌ Error generating more phrases:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Error al generar más frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Ruta raíz - Información del servidor
 */
app.get('/', (req, res) => {
  res.json({ 
    message: 'AAC Backend Server está funcionando correctamente',
    status: 'ok',
    endpoints: {
      health: '/api/health',
      generatePhrases: 'POST /api/generate-phrases',
      generateMorePhrases: 'POST /api/generate-more-phrases'
    },
    hasApiKey: !!GEMINI_API_KEY 
  });
});

/**
 * Endpoint de salud
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasApiKey: !!GEMINI_API_KEY 
  });
});

// Escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde emuladores y dispositivos
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`🌐 También disponible en http://127.0.0.1:${PORT}`);
  console.log(`📡 API Key configurada: ${GEMINI_API_KEY ? '✅ Sí' : '❌ No'}`);
  console.log(`\n💡 Para conectar desde:`);
  console.log(`   - Web/Navegador: http://localhost:${PORT} o http://127.0.0.1:${PORT}`);
  console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   - iOS Simulator: http://localhost:${PORT}`);
});

