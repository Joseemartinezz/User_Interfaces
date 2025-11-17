const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
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
    
    // Intentar con diferentes modelos en orden de preferencia
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Intentando con modelo: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Respuesta recibida de Gemini con modelo: ${modelName}`);
        console.log('📄 Texto completo:', text);
        break; // Si funciona, salir del loop
      } catch (modelError) {
        console.log(`❌ ${modelName} falló:`, modelError.message?.substring(0, 100));
        lastError = modelError;
        continue; // Intentar siguiente modelo
      }
    }
    
    if (!text) {
      throw lastError || new Error('Todos los modelos fallaron');
    }

    const phrases = extractPhrases(text);

    res.json({ phrases });
  } catch (error) {
    console.error('❌ Error generating phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Mensaje de error más útil
    let errorMessage = error.message || 'Error desconocido';
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'El modelo de Gemini no está disponible. Verifica tu API key y los modelos disponibles.';
    } else if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'API Key de Gemini inválida o sin permisos. Verifica tu API key.';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Se ha excedido la cuota de la API de Gemini. Verifica tu plan.';
    }
    
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        status: error.status
      } : undefined
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

    // Intentar con diferentes modelos en orden de preferencia
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Intentando con modelo: ${modelName} para generar más frases...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptMore);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Respuesta recibida de Gemini con modelo: ${modelName}`);
        console.log('📄 Texto completo:', text);
        break; // Si funciona, salir del loop
      } catch (modelError) {
        console.log(`❌ ${modelName} falló:`, modelError.message?.substring(0, 100));
        lastError = modelError;
        continue; // Intentar siguiente modelo
      }
    }
    
    if (!text) {
      throw lastError || new Error('Todos los modelos fallaron');
    }

    const phrases = extractPhrases(text);

    res.json({ phrases });
  } catch (error) {
    console.error('❌ Error generating more phrases:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    
    // Mensaje de error más útil
    let errorMessage = error.message || 'Error desconocido';
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'El modelo de Gemini no está disponible. Verifica tu API key y los modelos disponibles.';
    } else if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      errorMessage = 'API Key de Gemini inválida o sin permisos. Verifica tu API key.';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorMessage = 'Se ha excedido la cuota de la API de Gemini. Verifica tu plan.';
    }
    
    res.status(500).json({ 
      error: 'Error al generar más frases',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        status: error.status
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE ARASAAC
// ==========================================

/**
 * Base URL de la API de ARASAAC
 */
const ARASAAC_BASE_URL = 'https://api.arasaac.org/api';

/**
 * Endpoint para servir imágenes de pictogramas como proxy
 * GET /api/arasaac/image/:idPictogram
 * 
 * IMPORTANTE: Esta ruta debe ir ANTES de otras rutas de ARASAAC
 * para evitar conflictos de enrutamiento
 */
app.get('/api/arasaac/image/:idPictogram', async (req, res) => {
  try {
    const { idPictogram } = req.params;
    const { color, backgroundColor, plural, skin, hair, action } = req.query;

    if (!idPictogram) {
      return res.status(400).json({ error: 'Se requiere un ID de pictograma' });
    }

    console.log(`🖼️ Sirviendo imagen de pictograma ID: ${idPictogram}`);
    console.log(`   Request desde: ${req.headers['user-agent'] || 'Unknown'}`);

    // Construir URL de ARASAAC con parámetros opcionales
    let url = `${ARASAAC_BASE_URL}/pictograms/${idPictogram}`;
    const params = [];
    
    if (color !== undefined) {
      params.push(`color=${color}`);
    }
    if (backgroundColor) {
      params.push(`backgroundColor=${encodeURIComponent(backgroundColor)}`);
    }
    if (plural === 'true') {
      params.push('plural=true');
    }
    if (skin) {
      params.push(`skin=${encodeURIComponent(skin)}`);
    }
    if (hair) {
      params.push(`hair=${encodeURIComponent(hair)}`);
    }
    if (action) {
      params.push(`action=${encodeURIComponent(action)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    console.log(`📡 URL de ARASAAC: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/png,image/*,*/*',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error de ARASAAC: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Pictograma no encontrado',
          message: `No se encontró el pictograma con ID ${idPictogram}`
        });
      }
      
      return res.status(response.status).json({ 
        error: 'Error al obtener la imagen de ARASAAC',
        message: `Status ${response.status}: ${response.statusText}`
      });
    }

    // Obtener el buffer de la imagen
    // node-fetch v2 usa .buffer(), v3 usa .arrayBuffer()
    let imageBuffer;
    try {
      imageBuffer = await response.buffer();
    } catch (error) {
      // Si buffer() no está disponible, usar arrayBuffer()
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }
    
    const contentType = response.headers.get('content-type') || 'image/png';

    console.log(`✅ Imagen obtenida: ${imageBuffer.length} bytes, tipo: ${contentType}`);

    // Enviar la imagen con los headers correctos para React Native
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS para React Native
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.send(imageBuffer);
  } catch (error) {
    console.error('❌ Error obteniendo imagen de ARASAAC:', error);
    res.status(500).json({ 
      error: 'Error al obtener la imagen',
      message: error.message
    });
  }
});

/**
 * Busca pictogramas de ARASAAC por término de búsqueda
 * GET /api/arasaac/search/:language/:searchTerm
 */
app.get('/api/arasaac/search/:language/:searchTerm', async (req, res) => {
  try {
    const { language, searchTerm } = req.params;

    if (!searchTerm || searchTerm.trim() === '') {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }

    console.log(`🔍 Buscando pictogramas ARASAAC: "${searchTerm}" en idioma: ${language}`);

    const url = `${ARASAAC_BASE_URL}/pictograms/${language}/search/${encodeURIComponent(searchTerm)}`;
    console.log(`📡 URL de ARASAAC: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error de ARASAAC: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: 'Error al buscar en ARASAAC',
        message: `Status ${response.status}: ${response.statusText}`
      });
    }

    const pictograms = await response.json();
    console.log(`✅ Se encontraron ${pictograms.length} pictogramas en ARASAAC`);

    res.json(pictograms);
  } catch (error) {
    console.error('❌ Error buscando pictogramas en ARASAAC:', error);
    res.status(500).json({ 
      error: 'Error al buscar pictogramas',
      message: error.message
    });
  }
});

/**
 * Obtiene información de un pictograma específico por ID
 * GET /api/arasaac/pictogram/:language/:idPictogram
 */
app.get('/api/arasaac/pictogram/:language/:idPictogram', async (req, res) => {
  try {
    const { language, idPictogram } = req.params;

    if (!idPictogram) {
      return res.status(400).json({ error: 'Se requiere un ID de pictograma' });
    }

    console.log(`🔍 Obteniendo pictograma ARASAAC ID: ${idPictogram} en idioma: ${language}`);

    const url = `${ARASAAC_BASE_URL}/pictograms/${language}/${idPictogram}`;
    console.log(`📡 URL de ARASAAC: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Error de ARASAAC: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'Pictograma no encontrado',
          message: `No se encontró el pictograma con ID ${idPictogram}`
        });
      }
      
      return res.status(response.status).json({ 
        error: 'Error al obtener el pictograma de ARASAAC',
        message: `Status ${response.status}: ${response.statusText}`
      });
    }

    const pictogram = await response.json();
    console.log(`✅ Pictograma obtenido: ${pictogram._id}`);

    res.json(pictogram);
  } catch (error) {
    console.error('❌ Error obteniendo pictograma de ARASAAC:', error);
    res.status(500).json({ 
      error: 'Error al obtener el pictograma',
      message: error.message
    });
  }
});

/**
 * Endpoint para buscar pictogramas para múltiples palabras
 * POST /api/arasaac/search-multiple
 */
app.post('/api/arasaac/search-multiple', async (req, res) => {
  try {
    const { words, language = 'es' } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    console.log(`🔍 Buscando pictogramas para ${words.length} palabras en idioma: ${language}`);

    // Buscar pictogramas para cada palabra en paralelo
    const searchPromises = words.map(async (word) => {
      try {
        const url = `${ARASAAC_BASE_URL}/pictograms/${language}/search/${encodeURIComponent(word)}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error(`❌ Error buscando "${word}": ${response.status}`);
          return { word, pictograms: [], error: true };
        }

        const pictograms = await response.json();
        return { word, pictograms, error: false };
      } catch (error) {
        console.error(`❌ Error buscando "${word}":`, error.message);
        return { word, pictograms: [], error: true };
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Convertir a objeto para facilitar el acceso
    const resultsMap = {};
    results.forEach(({ word, pictograms, error }) => {
      resultsMap[word] = { pictograms, error };
    });

    console.log(`✅ Búsqueda completada para ${words.length} palabras`);

    res.json(resultsMap);
  } catch (error) {
    console.error('❌ Error en búsqueda múltiple:', error);
    res.status(500).json({ 
      error: 'Error al buscar múltiples pictogramas',
      message: error.message
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
      generateMorePhrases: 'POST /api/generate-more-phrases',
      arasaacSearch: 'GET /api/arasaac/search/:language/:searchTerm',
      arasaacPictogram: 'GET /api/arasaac/pictogram/:language/:idPictogram',
      arasaacImage: 'GET /api/arasaac/image/:idPictogram',
      arasaacSearchMultiple: 'POST /api/arasaac/search-multiple'
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

