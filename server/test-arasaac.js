/**
 * Script de prueba para verificar que los endpoints de ARASAAC funcionan correctamente
 * 
 * Uso:
 * 1. Asegúrate de que el servidor esté ejecutándose (npm start)
 * 2. Ejecuta este script: node test-arasaac.js
 */

const BASE_URL = 'http://localhost:3000';

// Función auxiliar para hacer peticiones
async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Pruebas
async function runTests() {
  console.log('🧪 Iniciando pruebas de ARASAAC...\n');

  // Test 1: Health check
  console.log('Test 1: Health check');
  const healthCheck = await request(`${BASE_URL}/api/health`);
  if (healthCheck.ok) {
    console.log('✅ Servidor funcionando correctamente');
  } else {
    console.log('❌ Error en health check');
    console.error(healthCheck);
    return;
  }
  console.log('');

  // Test 2: Buscar pictograma (español)
  console.log('Test 2: Buscar "casa" en español');
  const searchEs = await request(`${BASE_URL}/api/arasaac/search/es/casa`);
  let validPictogramId = null; // Guardar ID válido para Test 4
  if (searchEs.ok && Array.isArray(searchEs.data) && searchEs.data.length > 0) {
    console.log(`✅ Se encontraron ${searchEs.data.length} pictogramas`);
    validPictogramId = searchEs.data[0]._id; // Guardar el ID del primer resultado
    console.log(`   Primer resultado: ID ${validPictogramId}, keyword: ${searchEs.data[0].keywords[0]?.keyword}`);
  } else {
    console.log('❌ Error buscando pictogramas en español');
    console.error(searchEs);
  }
  console.log('');

  // Test 3: Buscar pictograma (inglés)
  console.log('Test 3: Buscar "house" en inglés');
  const searchEn = await request(`${BASE_URL}/api/arasaac/search/en/house`);
  if (searchEn.ok && Array.isArray(searchEn.data) && searchEn.data.length > 0) {
    console.log(`✅ Se encontraron ${searchEn.data.length} pictogramas`);
    console.log(`   Primer resultado: ID ${searchEn.data[0]._id}`);
  } else {
    console.log('❌ Error buscando pictogramas en inglés');
    console.error(searchEn);
  }
  console.log('');

  // Test 4: Obtener pictograma específico
  // Usar un ID válido conocido o el encontrado en la búsqueda anterior
  const testPictogramId = validPictogramId || 6964; // 6964 es un ID válido común para "casa"
  console.log(`Test 4: Obtener pictograma ID ${testPictogramId}`);
  const getPictogram = await request(`${BASE_URL}/api/arasaac/pictogram/es/${testPictogramId}`);
  if (getPictogram.ok && getPictogram.data._id) {
    console.log(`✅ Pictograma obtenido: ID ${getPictogram.data._id}`);
    console.log(`   Keywords: ${getPictogram.data.keywords.map(k => k.keyword).join(', ')}`);
    console.log(`   Descargas: ${getPictogram.data.downloads || 0}`);
  } else {
    console.log('❌ Error obteniendo pictograma específico');
    console.error(getPictogram);
    console.log('   💡 Nota: El ID puede no existir en ARASAAC. Prueba con otro ID válido.');
  }
  console.log('');

  // Test 5: Búsqueda múltiple
  console.log('Test 5: Buscar múltiples palabras ["perro", "gato", "comer"]');
  const searchMultiple = await request(`${BASE_URL}/api/arasaac/search-multiple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      words: ['perro', 'gato', 'comer'],
      language: 'es'
    })
  });
  if (searchMultiple.ok) {
    console.log('✅ Búsqueda múltiple exitosa');
    for (const [word, result] of Object.entries(searchMultiple.data)) {
      console.log(`   "${word}": ${result.pictograms.length} pictogramas encontrados`);
    }
  } else {
    console.log('❌ Error en búsqueda múltiple');
    console.error(searchMultiple);
  }
  console.log('');

  // Test 6: Palabra que no existe
  console.log('Test 6: Buscar palabra inexistente');
  const searchNotFound = await request(`${BASE_URL}/api/arasaac/search/es/xyzabc123notfound`);
  if (searchNotFound.ok && Array.isArray(searchNotFound.data) && searchNotFound.data.length === 0) {
    console.log('✅ Correctamente retorna array vacío para palabras no encontradas');
  } else {
    console.log('⚠️ Comportamiento inesperado para palabra no encontrada');
  }
  console.log('');

  // Resumen
  console.log('═══════════════════════════════════════');
  console.log('📊 Resumen de pruebas completado');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('URLs de ejemplo de imágenes:');
  // Usar IDs válidos conocidos
  const casaId = validPictogramId || 6964;
  console.log(`  Casa (ID ${casaId}): https://api.arasaac.org/api/pictograms/${casaId}`);
  console.log(`  Perro (ID 7479): https://api.arasaac.org/api/pictograms/7479`);
  console.log(`  Comer (ID 11177): https://api.arasaac.org/api/pictograms/11177`);
  console.log('');
  console.log('💡 Para ver una imagen, abre una URL en tu navegador');
  console.log('📚 Documentación completa en services/ARASAAC_README.md');
}

// Importar fetch (Node.js < 18 necesita node-fetch)
(async () => {
  // Intentar usar fetch nativo o importar node-fetch
  if (typeof fetch === 'undefined') {
    try {
      const nodeFetch = await import('node-fetch');
      global.fetch = nodeFetch.default;
    } catch (error) {
      console.error('❌ Error: Este script requiere Node.js 18+ o node-fetch instalado');
      console.error('   Instala node-fetch: npm install node-fetch');
      process.exit(1);
    }
  }

  // Ejecutar pruebas
  await runTests();
})();

