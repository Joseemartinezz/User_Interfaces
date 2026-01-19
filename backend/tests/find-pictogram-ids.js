/**
 * Script para encontrar IDs de pictogramas válidos en ARASAAC
 * 
 * Uso: node find-pictogram-ids.js
 */

const BASE_URL = 'http://localhost:3000';

// Palabras que necesitamos buscar
const WORDS_TO_FIND = [
  'I',
  'you',
  'not',
  'like',
  'want',
  'play',
  'football',
  'pizza',
  'school',
];

async function request(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function findPictogramIds() {
  console.log('🔍 Buscando IDs de pictogramas en ARASAAC...\n');
  
  const results = [];
  
  for (const word of WORDS_TO_FIND) {
    console.log(`Buscando "${word}"...`);
    
    const result = await request(`${BASE_URL}/api/arasaac/search/en/${encodeURIComponent(word)}`);
    
    if (result.ok && result.data && result.data.length > 0) {
      // Ordenar por popularidad (descargas)
      const sorted = result.data.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      const best = sorted[0];
      
      console.log(`  ✅ Encontrados ${result.data.length} pictogramas`);
      console.log(`  🏆 Mejor: ID ${best._id} (${best.downloads || 0} descargas)`);
      console.log(`     Keywords: ${best.keywords.map(k => k.keyword).slice(0, 3).join(', ')}`);
      console.log(`     URL: https://api.arasaac.org/api/pictograms/${best._id}`);
      
      results.push({
        word,
        id: best._id,
        downloads: best.downloads || 0,
        keywords: best.keywords.map(k => k.keyword),
        found: true
      });
    } else {
      console.log(`  ❌ No se encontraron resultados`);
      results.push({
        word,
        found: false
      });
    }
    console.log('');
  }
  
  // Generar código para App.tsx
  console.log('\n═══════════════════════════════════════');
  console.log('📋 Código para copiar en App.tsx');
  console.log('═══════════════════════════════════════\n');
  
  console.log('const WORD_SYMBOLS = [');
  results.forEach((result, index) => {
    if (result.found) {
      console.log(`  {`);
      console.log(`    id: ${index + 1},`);
      console.log(`    text: '${result.word.charAt(0).toUpperCase() + result.word.slice(1)}',`);
      console.log(`    arasaacId: ${result.id}, // ${result.downloads} descargas`);
      console.log(`    imageUrl: getPictogramImageUrl(${result.id}, { color: true, backgroundColor: 'white' })`);
      console.log(`  },`);
    } else {
      console.log(`  // ⚠️ No se encontró pictograma para "${result.word}"`);
    }
  });
  console.log('];');
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Resumen');
  console.log('═══════════════════════════════════════');
  console.log(`Total de palabras: ${WORDS_TO_FIND.length}`);
  console.log(`Pictogramas encontrados: ${results.filter(r => r.found).length}`);
  console.log(`Sin pictogramas: ${results.filter(r => !r.found).length}`);
}

// Ejecutar
(async () => {
  if (typeof fetch === 'undefined') {
    try {
      const nodeFetch = await import('node-fetch');
      global.fetch = nodeFetch.default;
    } catch (error) {
      console.error('❌ Error: Este script requiere Node.js 18+ o node-fetch instalado');
      process.exit(1);
    }
  }
  
  // Verificar conexión
  console.log('🔗 Verificando conexión...');
  const health = await request(`${BASE_URL}/api/health`);
  if (!health.ok) {
    console.error('❌ No se pudo conectar al servidor. Asegúrate de que esté ejecutándose.');
    process.exit(1);
  }
  console.log('✅ Conectado\n');
  
  await findPictogramIds();
})();

