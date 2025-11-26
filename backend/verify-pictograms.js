/**
 * Script para verificar que todos los pictogramas usados en la app existen y son válidos
 * 
 * Uso:
 * 1. Asegúrate de que el servidor esté ejecutándose (npm start)
 * 2. Ejecuta este script: node verify-pictograms.js
 */

const BASE_URL = 'http://localhost:3000';

// IDs de pictogramas usados en la app (actualizados y verificados)
const PICTOGRAMS_IN_APP = [
  { word: 'I', id: 6632 },
  { word: 'You', id: 6625 },
  { word: 'Not', id: 32308 },
  { word: 'Like', id: 37826 },
  { word: 'Want', id: 5441 },
  { word: 'Play', id: 23392 },
  { word: 'Football', id: 16743 },
  { word: 'Pizza', id: 2527 },
  { word: 'School', id: 32446 },
];

// Función auxiliar para hacer peticiones
async function request(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// Verificar pictogramas
async function verifyPictograms() {
  console.log('🔍 Verificando pictogramas usados en la app...\n');
  
  let allValid = true;
  const results = [];
  
  for (const pictogram of PICTOGRAMS_IN_APP) {
    const result = await request(`${BASE_URL}/api/arasaac/pictogram/en/${pictogram.id}`);
    
    if (result.ok && result.data._id) {
      console.log(`✅ ${pictogram.word.padEnd(10)} (ID ${pictogram.id}): Válido`);
      console.log(`   Keywords: ${result.data.keywords.map(k => k.keyword).slice(0, 3).join(', ')}`);
      results.push({
        word: pictogram.word,
        id: pictogram.id,
        valid: true,
        imageUrl: `https://api.arasaac.org/api/pictograms/${pictogram.id}`
      });
    } else {
      console.log(`❌ ${pictogram.word.padEnd(10)} (ID ${pictogram.id}): ERROR`);
      console.error(`   Error: ${result.error || result.data?.error || 'Desconocido'}`);
      allValid = false;
      results.push({
        word: pictogram.word,
        id: pictogram.id,
        valid: false,
        error: result.error || result.data?.error
      });
    }
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Resumen de Verificación');
  console.log('═══════════════════════════════════════');
  console.log(`Total de pictogramas: ${PICTOGRAMS_IN_APP.length}`);
  console.log(`Válidos: ${results.filter(r => r.valid).length}`);
  console.log(`Con errores: ${results.filter(r => !r.valid).length}`);
  
  if (allValid) {
    console.log('\n✅ ¡Todos los pictogramas son válidos y están listos para usar!');
    console.log('\n💡 Puedes ver cualquier pictograma en tu navegador:');
    console.log('   https://api.arasaac.org/api/pictograms/[ID]');
    console.log('\nEjemplo:');
    console.log(`   ${results[0].imageUrl}`);
  } else {
    console.log('\n⚠️ Algunos pictogramas tienen errores. Revisa los IDs en App.tsx');
  }
  
  console.log('\n📚 Para buscar pictogramas alternativos:');
  console.log('   http://localhost:3000/api/arasaac/search/en/PALABRA');
  console.log('   O visita: https://arasaac.org/pictograms/search');
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

  // Verificar conexión al servidor
  console.log('🔗 Verificando conexión con el servidor...');
  const healthCheck = await request(`${BASE_URL}/api/health`);
  
  if (!healthCheck.ok) {
    console.error('❌ No se pudo conectar al servidor backend');
    console.error('   Asegúrate de que el servidor esté ejecutándose: npm start');
    process.exit(1);
  }
  
  console.log('✅ Servidor conectado\n');
  
  // Ejecutar verificación
  await verifyPictograms();
})();

