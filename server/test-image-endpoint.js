/**
 * Script para probar el endpoint de imágenes y verificar qué devuelve ARASAAC
 * 
 * Uso: node test-image-endpoint.js
 */

const BASE_URL = 'http://localhost:3000';
const ARASAAC_DIRECT = 'https://api.arasaac.org/api/pictograms';

// IDs de prueba
const TEST_IDS = [6632, 6625, 2527];

async function testImageEndpoint(id) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Probando pictograma ID: ${id}`);
  console.log('='.repeat(60));

  // Test 1: Probar endpoint del backend
  console.log('\n1️⃣ Probando endpoint del backend:');
  console.log(`   GET ${BASE_URL}/api/arasaac/image/${id}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/arasaac/image/${id}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        console.log(`   ✅ ÉXITO: Se recibió una imagen (${contentType})`);
        const buffer = await response.arrayBuffer();
        console.log(`   Tamaño: ${buffer.byteLength} bytes`);
      } else {
        const text = await response.text();
        console.log(`   ⚠️ ADVERTENCIA: No es una imagen, respuesta:`);
        console.log(`   ${text.substring(0, 200)}...`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ERROR: ${errorText}`);
    }
  } catch (error) {
    console.error(`   ❌ EXCEPCIÓN: ${error.message}`);
  }

  // Test 2: Probar ARASAAC directamente
  console.log('\n2️⃣ Probando ARASAAC directamente:');
  console.log(`   GET ${ARASAAC_DIRECT}/${id}`);
  
  try {
    const response = await fetch(`${ARASAAC_DIRECT}/${id}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        console.log(`   ✅ ÉXITO: ARASAAC devuelve una imagen (${contentType})`);
        const buffer = await response.arrayBuffer();
        console.log(`   Tamaño: ${buffer.byteLength} bytes`);
      } else {
        const text = await response.text();
        console.log(`   ⚠️ ADVERTENCIA: ARASAAC no devuelve una imagen:`);
        console.log(`   ${text.substring(0, 200)}...`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ERROR: ${errorText}`);
    }
  } catch (error) {
    console.error(`   ❌ EXCEPCIÓN: ${error.message}`);
  }

  // Test 3: Probar con parámetros
  console.log('\n3️⃣ Probando ARASAAC con parámetros:');
  const urlWithParams = `${ARASAAC_DIRECT}/${id}?download=false`;
  console.log(`   GET ${urlWithParams}`);
  
  try {
    const response = await fetch(urlWithParams);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        console.log(`   ✅ ÉXITO: Con parámetros funciona (${contentType})`);
      } else {
        console.log(`   ⚠️ ADVERTENCIA: Con parámetros no devuelve imagen`);
      }
    }
  } catch (error) {
    console.error(`   ❌ EXCEPCIÓN: ${error.message}`);
  }
}

async function runTests() {
  console.log('🔍 Verificando conexión con el servidor...');
  
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (healthCheck.ok) {
      console.log('✅ Servidor conectado\n');
    } else {
      console.error('❌ Servidor no responde correctamente');
      console.error('   Asegúrate de que el servidor esté ejecutándose: npm start');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ No se pudo conectar al servidor');
    console.error('   Asegúrate de que el servidor esté ejecutándose: npm start');
    process.exit(1);
  }

  console.log('🧪 Iniciando pruebas de endpoints de imágenes...\n');

  for (const id of TEST_IDS) {
    await testImageEndpoint(id);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Resumen de Pruebas Completado');
  console.log('='.repeat(60));
  console.log('\n💡 Si ARASAAC devuelve imágenes pero el backend no,');
  console.log('   hay un problema en el código del proxy.');
  console.log('\n💡 Si ARASAAC no devuelve imágenes,');
  console.log('   puede ser que la URL o el formato sean incorrectos.');
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

  await runTests();
})();

