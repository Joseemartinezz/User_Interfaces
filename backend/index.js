// Cargar variables de entorno PRIMERO, antes de cualquier otro require
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const { generateAzurePhrases, generateMoreAzurePhrases, testAzureConnection } = require('./services/azureService.ts');
const { generateAacImage, generateAacImagesForPhrases } = require('./services/imageService.ts');
const {
  getAllCategories,
  getCategoryPictograms,
  createCategory,
  deleteCategory,
  initializePredefinedCategories,
  isPredefinedCategory,
  PREDEFINED_CATEGORIES
} = require('./services/categoryService.ts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware que se ejecuta en todas las peticiones
// 1. CORS - Permite peticiones desde el frontend
app.use(cors());

// 2. JSON Parser - Convierte el body de JSON a objeto JavaScript
app.use(express.json());

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] ${req.method} ${req.path}`);
  console.log(`   Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'N/A'}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  if (Object.keys(req.body).length > 0 && req.method !== 'GET') {
    console.log(`   Body:`, JSON.stringify(req.body).substring(0, 200));
  }
  
  // Interceptar la respuesta para loggear el status
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 [${timestamp}] ${req.method} ${req.path} → ${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});


// Configuración de Azure OpenAI (Proveedor Principal) - Para generación de frases
const AZURE_OPENAI_PHRASE_URL = process.env.AZURE_OPENAI_PHRASE_URL || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_URL;
const AZURE_OPENAI_PHRASE_KEY = process.env.AZURE_OPENAI_PHRASE_KEY || process.env.EXPO_PUBLIC_AZURE_OPENAI_PHRASE_KEY;

if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
  console.warn('⚠️ ADVERTENCIA: Azure OpenAI para frases no está configurado en las variables de entorno');
  console.warn('   Agrega AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY al archivo backend/.env');
  console.warn('   Azure OpenAI es el proveedor principal de IA');
} else {
  console.log('✅ Azure OpenAI configurado (Proveedor Principal)');
}

// Configuración de Gemini (Proveedor Secundario/Fallback)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ ADVERTENCIA: GEMINI_API_KEY no está configurada en las variables de entorno');
  console.warn('   Agrega GEMINI_API_KEY=tu_clave_aqui al archivo backend/.env');
  console.warn('   Gemini se usará como fallback si Azure OpenAI falla');
} else {
  console.log('✅ Gemini configurado (Proveedor Secundario/Fallback)');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

/**
 * Lista los modelos disponibles de Gemini
 * Útil para debugging
 */
async function listAvailableModels() {
  try {
    // Intentar listar modelos si el método está disponible
    if (typeof genAI.listModels === 'function') {
      const models = await genAI.listModels();
      const modelNames = Array.isArray(models) 
        ? models.map(model => model.name || model)
        : [];
      console.log('📋 Modelos disponibles:', modelNames);
      return modelNames;
    } else {
      console.log('⚠️ listModels() no está disponible en esta versión del SDK');
      return [];
    }
  } catch (error) {
    console.error('❌ Error listando modelos:', error.message);
    return [];
  }
}

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
 * Usa Azure OpenAI como proveedor principal, Gemini como fallback
 */
app.post('/api/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    // Intentar primero con Azure OpenAI (Proveedor Principal)
    if (AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) {
      try {
        console.log('🔄 Intentando generar frases con Azure OpenAI (Proveedor Principal)...');
        const phrases = await generateAzurePhrases(words);
        console.log('✅ Frases generadas exitosamente con Azure OpenAI');
        return res.json({ phrases });
      } catch (azureError) {
        console.error('❌ Azure OpenAI falló:', azureError.message);
        console.log('⚠️ Intentando con Gemini como fallback...');
      }
    } else {
      console.log('⚠️ Azure OpenAI no está configurado, usando Gemini como proveedor principal...');
    }

    // Si Azure falló o no está configurado, intentar con Gemini (Proveedor Secundario)
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Ningún proveedor de IA está configurado',
        message: 'Configura AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY, o GEMINI_API_KEY en backend/.env'
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
- Generate exactly 3 different phrases.
- Return one phrase per line, numbered starting from 1.
`;

    console.log('🔄 Llamando a Gemini API con palabras:', words);
    
    // Intentar con diferentes modelos de Gemini en orden de preferencia
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Intentando con modelo Gemini: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Respuesta recibida de Gemini con modelo: ${modelName}`);
        console.log('📄 Texto completo:', text);
        break; // Si funciona, salir del loop
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.log(`❌ ${modelName} falló:`, errorMsg.substring(0, 150));
        lastError = modelError;
        continue; // Intentar siguiente modelo
      }
    }
    
    if (!text) {
      // Si todos los modelos de Gemini fallaron
      console.log('⚠️ Todos los modelos de Gemini fallaron. Listando modelos disponibles...');
      await listAvailableModels();
      throw lastError || new Error('Todos los proveedores de IA fallaron. Verifica tu configuración.');
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
 * Usa Azure OpenAI como proveedor principal, Gemini como fallback
 */
app.post('/api/generate-more-phrases', async (req, res) => {
  try {
    const { words, existingPhrases } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!existingPhrases || !Array.isArray(existingPhrases)) {
      return res.status(400).json({ error: 'Se requiere un array de frases existentes' });
    }

    // Intentar primero con Azure OpenAI (Proveedor Principal)
    if (AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) {
      try {
        console.log('🔄 Intentando generar más frases con Azure OpenAI (Proveedor Principal)...');
        const phrases = await generateMoreAzurePhrases(words, existingPhrases);
        // Limitar a exactamente 3 frases como medida de seguridad (doble verificación)
        const limitedPhrases = phrases.slice(0, 3);
        console.log(`📊 Frases de Azure: ${phrases.length}, limitadas a: ${limitedPhrases.length}`);
        if (limitedPhrases.length !== 3) {
          console.warn(`⚠️ Advertencia: Se esperaban 3 frases pero se obtuvieron ${limitedPhrases.length}`);
        }
        console.log('✅ Frases generadas exitosamente con Azure OpenAI');
        return res.json({ phrases: limitedPhrases });
      } catch (azureError) {
        console.error('❌ Azure OpenAI falló:', azureError.message);
        console.log('⚠️ Intentando con Gemini como fallback...');
      }
    } else {
      console.log('⚠️ Azure OpenAI no está configurado, usando Gemini como proveedor principal...');
    }

    // Si Azure falló o no está configurado, intentar con Gemini (Proveedor Secundario)
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Ningún proveedor de IA está configurado',
        message: 'Configura AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY, o GEMINI_API_KEY en backend/.env'
      });
    }

    const basePrompt = `
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
${words.join(', ')}

IMPORTANT: You MUST generate EXACTLY 3 phrases. No more, no less. Generate exactly 3 phrases.

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- Generate EXACTLY 3 different phrases. Do not generate 4, 5, or any other number. Only 3.
- Return exactly 3 phrases, one per line, numbered starting from 1.
`;

    const promptMore = basePrompt + '\n\nDo NOT repeat any of these phrases:\n' + existingPhrases.join('\n') + '\n\nRemember: Generate EXACTLY 3 new phrases, no more, no less.';

    // Intentar con diferentes modelos de Gemini en orden de preferencia
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    let text = null;
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`📡 Intentando con modelo Gemini: ${modelName} para generar más frases...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(promptMore);
        const response = await result.response;
        text = response.text();
        console.log(`✅ Respuesta recibida de Gemini con modelo: ${modelName}`);
        console.log('📄 Texto completo:', text);
        break; // Si funciona, salir del loop
      } catch (modelError) {
        const errorMsg = modelError.message || String(modelError);
        console.log(`❌ ${modelName} falló:`, errorMsg.substring(0, 150));
        lastError = modelError;
        continue; // Intentar siguiente modelo
      }
    }
    
    if (!text) {
      // Si todos los modelos de Gemini fallaron
      console.log('⚠️ Todos los modelos de Gemini fallaron. Listando modelos disponibles...');
      await listAvailableModels();
      throw lastError || new Error('Todos los proveedores de IA fallaron. Verifica tu configuración.');
    }

    const phrases = extractPhrases(text);
    // Limitar a exactamente 3 frases como medida de seguridad
    const limitedPhrases = phrases.slice(0, 3);
    console.log(`📊 Frases extraídas: ${phrases.length}, limitadas a: ${limitedPhrases.length}`);
    if (limitedPhrases.length !== 3) {
      console.warn(`⚠️ Advertencia: Se esperaban 3 frases pero se obtuvieron ${limitedPhrases.length}`);
    }
    res.json({ phrases: limitedPhrases });
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
// ENDPOINT DE GENERACIÓN DE IMÁGENES
// ==========================================

/**
 * Endpoint para generar una imagen con DALL-E para una frase AAC
 * POST /api/generate-image
 * Body: { phrase: string }
 */
app.post('/api/generate-image', async (req, res) => {
  try {
    const { phrase } = req.body;

    if (!phrase || typeof phrase !== 'string' || phrase.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere una frase válida',
        message: 'El campo "phrase" es obligatorio y debe ser un string no vacío'
      });
    }

    const imageBase64 = await generateAacImage(phrase.trim());
    
    res.json({ 
      imageBase64, 
      phrase: phrase.trim() 
    });
  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    let statusCode = 500;
    let errorMessage = error.message || 'Error desconocido al generar imagen';
    
    if (error.message?.includes('API key') || error.message?.includes('API Key') || error.message?.includes('no está configurada')) {
      statusCode = 500;
      errorMessage = 'Azure OpenAI API Key no configurada. Configura AZURE_OPENAI_IMAGE_API_KEY en backend/.env';
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      statusCode = 429;
      errorMessage = 'Se ha excedido la cuota de Azure OpenAI. Verifica tu plan.';
    }
    
    res.status(statusCode).json({ 
      error: 'Error al generar imagen',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      } : undefined
    });
  }
});

/**
 * Endpoint para generar múltiples imágenes en paralelo
 * POST /api/generate-images
 * Body: { phrases: string[] }
 */
app.post('/api/generate-images', async (req, res) => {
  try {
    const { phrases } = req.body;

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({ 
        error: 'Se requiere un array de frases',
        message: 'El campo "phrases" debe ser un array no vacío'
      });
    }

    // Validar que todas las frases sean strings
    const validPhrases = phrases
      .filter(p => typeof p === 'string' && p.trim().length > 0)
      .map(p => p.trim());

    if (validPhrases.length === 0) {
      return res.status(400).json({ 
        error: 'No hay frases válidas',
        message: 'Todas las frases deben ser strings no vacíos'
      });
    }

    const results = await generateAacImagesForPhrases(validPhrases);
    
    res.json({ 
      images: results,
      total: results.length,
      successful: results.filter(r => r.imageBase64 !== '').length
    });
  } catch (error) {
    console.error('❌ Error generating images:', error);
    
    res.status(500).json({ 
      error: 'Error al generar imágenes',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE AZURE OPENAI (Directos - no usados por los endpoints principales)
// ==========================================

/**
 * Endpoint directo para generar frases con Azure OpenAI
 * POST /api/azure/generate-phrases
 * Nota: Los endpoints principales /api/generate-phrases ya usan Azure primero
 */
app.post('/api/azure/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI no está configurado',
        message: 'Agrega AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY al archivo backend/.env'
      });
    }

    console.log('🔄 Llamando a Azure OpenAI API con palabras:', words);
    
    try {
      const phrases = await generateAzurePhrases(words);
      console.log(`✅ Respuesta recibida de Azure OpenAI`);
      console.log('📄 Frases generadas:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Error de Azure OpenAI:', azureError);
      
      let errorMessage = azureError.message || 'Error desconocido';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'API Key de Azure OpenAI inválida. Verifica tu API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Se ha excedido la cuota de la API de Azure OpenAI. Verifica tu plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'El deployment de Azure OpenAI no está disponible. Verifica la configuración.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

// ==========================================
// ENDPOINTS DE AZURE OPENAI (Directos - no usados por los endpoints principales)
// ==========================================

/**
 * Endpoint directo para generar frases con Azure OpenAI
 * POST /api/azure/generate-phrases
 * Nota: Los endpoints principales /api/generate-phrases ya usan Azure primero
 */
app.post('/api/azure/generate-phrases', async (req, res) => {
  try {
    const { words } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI no está configurado',
        message: 'Agrega AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY al archivo backend/.env'
      });
    }

    console.log('🔄 Llamando a Azure OpenAI API con palabras:', words);
    
    try {
      const phrases = await generateAzurePhrases(words);
      console.log(`✅ Respuesta recibida de Azure OpenAI`);
      console.log('📄 Frases generadas:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Error de Azure OpenAI:', azureError);
      
      let errorMessage = azureError.message || 'Error desconocido';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'API Key de Azure OpenAI inválida. Verifica tu API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Se ha excedido la cuota de la API de Azure OpenAI. Verifica tu plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'El deployment de Azure OpenAI no está disponible. Verifica la configuración.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error al generar frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
      } : undefined
    });
  }
});

/**
 * Endpoint para generar más frases con Azure OpenAI
 * POST /api/azure/generate-more-phrases
 */
app.post('/api/azure/generate-more-phrases', async (req, res) => {
  try {
    const { words, existingPhrases } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de palabras' });
    }

    if (!existingPhrases || !Array.isArray(existingPhrases)) {
      return res.status(400).json({ error: 'Se requiere un array de frases existentes' });
    }

    if (!AZURE_OPENAI_PHRASE_URL || !AZURE_OPENAI_PHRASE_KEY) {
      return res.status(500).json({
        error: 'Azure OpenAI no está configurado',
        message: 'Agrega AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_PHRASE_KEY al archivo backend/.env'
      });
    }

    console.log('🔄 Llamando a Azure OpenAI API para generar más frases...');
    console.log('   Palabras:', words);
    console.log('   Frases existentes:', existingPhrases);
    
    try {
      const phrases = await generateMoreAzurePhrases(words, existingPhrases);
      console.log(`✅ Respuesta recibida de Azure OpenAI`);
      console.log('📄 Frases generadas:', phrases);

      res.json({ phrases });
    } catch (azureError) {
      console.error('❌ Error de Azure OpenAI:', azureError);
      
      let errorMessage = azureError.message || 'Error desconocido';
      if (azureError.message?.includes('401') || azureError.message?.includes('Unauthorized')) {
        errorMessage = 'API Key de Azure OpenAI inválida. Verifica tu API key.';
      } else if (azureError.message?.includes('429') || azureError.message?.includes('rate limit')) {
        errorMessage = 'Se ha excedido la cuota de la API de Azure OpenAI. Verifica tu plan.';
      } else if (azureError.message?.includes('404') || azureError.message?.includes('Not Found')) {
        errorMessage = 'El deployment de Azure OpenAI no está disponible. Verifica la configuración.';
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error generating more phrases with Azure OpenAI:', error);
    
    res.status(500).json({ 
      error: 'Error al generar más frases',
      message: error.message || 'Error desconocido',
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message
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
      // Gemini endpoints
      generatePhrases: 'POST /api/generate-phrases',
      generateMorePhrases: 'POST /api/generate-more-phrases',
      // Azure OpenAI endpoints (directos)
      azureGeneratePhrases: 'POST /api/azure/generate-phrases',
      azureGenerateMorePhrases: 'POST /api/azure/generate-more-phrases',
      // ARASAAC endpoints
      arasaacSearch: 'GET /api/arasaac/search/:language/:searchTerm',
      arasaacPictogram: 'GET /api/arasaac/pictogram/:language/:idPictogram',
      arasaacImage: 'GET /api/arasaac/image/:idPictogram',
      arasaacSearchMultiple: 'POST /api/arasaac/search-multiple',
      // User & Profile endpoints
      userGet: 'GET /api/user',
      userUpdate: 'PUT /api/user',
      userReset: 'POST /api/user/reset',
      avatar: 'POST /api/avatar',
      userInitials: 'GET /api/user/initials'
    },
    hasGeminiApiKey: !!GEMINI_API_KEY,
    hasAzureOpenAI: !!(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY)
  });
});

// ============================================================================
// USER & PROFILE MANAGEMENT API
// ============================================================================

// In-memory user storage (for prototype - replace with database in production)
let userData = {
  id: 'default-user',
  email: 'user@example.com',
  fullName: 'Usuario',
  preferences: {
    language: 'es',
    theme: 1,
    fontSize: 'medium',
    voiceSpeed: 1.0
  }
};

/**
 * GET /api/user - Obtiene datos del usuario actual
 */
app.get('/api/user', (req, res) => {
  try {
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener usuario',
      message: error.message
    });
  }
});

/**
 * PUT /api/user - Actualiza datos del usuario
 */
app.put('/api/user', (req, res) => {
  try {
    const { email, fullName, preferences } = req.body;
    
    // Validar datos
    if (!email && !fullName && !preferences) {
      return res.status(400).json({ 
        error: 'Se requiere al menos un campo para actualizar' 
      });
    }
    
    // Actualizar datos
    if (email !== undefined) userData.email = email;
    if (fullName !== undefined) userData.fullName = fullName;
    if (preferences !== undefined) {
      userData.preferences = { ...userData.preferences, ...preferences };
    }
    
    console.log('✅ Usuario actualizado:', userData);
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({ 
      error: 'Error al actualizar usuario',
      message: error.message
    });
  }
});

/**
 * POST /api/user/reset - Resetea el usuario a valores por defecto
 */
app.post('/api/user/reset', (req, res) => {
  try {
    userData = {
      id: 'default-user',
      email: 'user@example.com',
      fullName: 'Usuario',
      preferences: {
        language: 'es',
        theme: 1,
        fontSize: 'medium',
        voiceSpeed: 1.0
      }
    };
    
    console.log('🔄 Usuario reseteado a valores por defecto');
    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Error reseteando usuario:', error);
    res.status(500).json({ 
      error: 'Error al resetear usuario',
      message: error.message
    });
  }
});

/**
 * Endpoint para generar avatares de usuario
 * POST /api/avatar
 * Retorna PNG base64 data URL (compatible con React Native)
 */
app.post('/api/avatar', async (req, res) => {
  try {
    const { userId, email, fullName } = req.body;
    
    // Importar el generador de avatares
    const avatarGenerator = require('./utils/avatarGenerator.js');
    
    // Crear seed consistente
    const seed = avatarGenerator.createUserSeed(userId, email, fullName);
    
    // Generar avatar (ahora es asíncrono porque convierte SVG a PNG)
    const avatarUrl = await avatarGenerator.generateAvatarDataUrl(seed);
    
    console.log(`✅ Avatar generado para seed: ${seed.substring(0, 10)}...`);
    res.json({ avatarUrl, seed });
  } catch (error) {
    console.error('❌ Error generando avatar:', error);
    res.status(500).json({ 
      error: 'Error al generar avatar',
      message: error.message
    });
  }
});

/**
 * GET /api/user/initials - Obtiene las iniciales del usuario
 */
app.get('/api/user/initials', (req, res) => {
  try {
    const avatarGenerator = require('./utils/avatarGenerator.js');
    const initials = avatarGenerator.getInitials(userData.fullName, userData.email);
    
    res.json({ initials });
  } catch (error) {
    console.error('❌ Error obteniendo iniciales:', error);
    res.status(500).json({ 
      error: 'Error al obtener iniciales',
      message: error.message
    });
  }
});

/**
 * ========================================
 * CATEGORY MANAGEMENT ENDPOINTS
 * ========================================
 */

/**
 * GET /api/categories
 * Get all categories with their pictogram IDs
 */
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({ categories });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      error: 'Error al obtener categorías',
      message: error.message
    });
  }
});

/**
 * GET /api/categories/:categoryName
 * Get pictogram IDs for a specific category
 */
app.get('/api/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const pictogramIds = await getCategoryPictograms(categoryName);
    
    res.json({
      category: categoryName,
      pictogramIds,
      count: pictogramIds.length,
      isPredefined: isPredefinedCategory(categoryName)
    });
  } catch (error) {
    console.error('❌ Error getting category pictograms:', error);
    res.status(500).json({
      error: 'Error al obtener pictogramas de la categoría',
      message: error.message
    });
  }
});

/**
 * POST /api/categories
 * Create a new custom category
 * Body: { categoryName: string, maxResults?: number }
 */
app.post('/api/categories', async (req, res) => {
  try {
    const { categoryName, maxResults = 50 } = req.body;

    if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
      return res.status(400).json({
        error: 'Se requiere un nombre de categoría válido'
      });
    }

    const trimmedName = categoryName.trim();

    // Validate category name
    if (isPredefinedCategory(trimmedName)) {
      return res.status(400).json({
        error: `La categoría "${trimmedName}" es una categoría predefinida y no puede ser recreada`
      });
    }

    // Create category using AI
    const pictogramIds = await createCategory(trimmedName, maxResults);

    res.json({
      category: trimmedName,
      pictogramIds,
      count: pictogramIds.length,
      message: `Categoría "${trimmedName}" creada exitosamente con ${pictogramIds.length} pictogramas`
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    
    // Check if it's a duplicate error
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Error al crear categoría',
      message: error.message
    });
  }
});

/**
 * DELETE /api/categories/:categoryName
 * Delete a custom category (cannot delete predefined categories)
 */
app.delete('/api/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;

    if (isPredefinedCategory(categoryName)) {
      return res.status(400).json({
        error: `No se puede eliminar la categoría predefinida "${categoryName}"`
      });
    }

    await deleteCategory(categoryName);

    res.json({
      message: `Categoría "${categoryName}" eliminada exitosamente`
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    
    if (error.message.includes('does not exist')) {
      return res.status(404).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Error al eliminar categoría',
      message: error.message
    });
  }
});

/**
 * POST /api/categories/initialize
 * Initialize predefined categories (useful for first-time setup)
 */
app.post('/api/categories/initialize', async (req, res) => {
  try {
    const categories = await initializePredefinedCategories();
    
    res.json({
      message: 'Categorías predefinidas inicializadas exitosamente',
      categories,
      predefinedCategories: PREDEFINED_CATEGORIES
    });
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    res.status(500).json({
      error: 'Error al inicializar categorías',
      message: error.message
    });
  }
});

/**
 * Endpoint de salud
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasGeminiApiKey: !!GEMINI_API_KEY,
    hasAzureOpenAI: !!(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY)
  });
});

// Escuchar en todas las interfaces (0.0.0.0) para permitir conexiones desde emuladores y dispositivos
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
  console.log(`🌐 También disponible en http://127.0.0.1:${PORT}`);
  console.log(`\n📡 API Keys configuradas:`);
  console.log(`   - Azure OpenAI (Principal): ${(AZURE_OPENAI_PHRASE_URL && AZURE_OPENAI_PHRASE_KEY) ? '✅ Sí' : '❌ No'}`);
  console.log(`   - Gemini (Secundario/Fallback): ${GEMINI_API_KEY ? '✅ Sí' : '❌ No'}`);
  console.log(`\n💡 Para conectar desde:`);
  console.log(`   - Web/Navegador: http://localhost:${PORT} o http://127.0.0.1:${PORT}`);
  console.log(`   - Android Emulator: http://10.0.2.2:${PORT}`);
  console.log(`   - iOS Simulator: http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`   - GET  /api/health - Verificar estado del servidor`);
  console.log(`   - GET  / - Información del servidor`);
  console.log(`   - POST /api/generate-phrases - Generar frases`);
  console.log(`   - GET  /api/arasaac/image/:id - Obtener imagen de pictograma`);
  console.log(`   - GET  /api/categories - Obtener todas las categorías`);
  console.log(`   - GET  /api/categories/:name - Obtener pictogramas de una categoría`);
  console.log(`   - POST /api/categories - Crear nueva categoría personalizada`);
  console.log(`   - DELETE /api/categories/:name - Eliminar categoría personalizada`);
  console.log(`   - POST /api/categories/initialize - Inicializar categorías predefinidas`);
  console.log(`\n🔍 Logging activado: Todas las peticiones se registrarán aquí`);
  console.log(`${'='.repeat(60)}\n`);
});

