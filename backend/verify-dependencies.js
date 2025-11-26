/**
 * Script para verificar que todas las dependencias necesarias estén instaladas
 * Ejecutar con: node verify-dependencies.js
 */

console.log('🔍 Verificando dependencias...\n');

const dependencies = [
  '@dicebear/core',
  '@dicebear/collection',
  'sharp',
  'express',
  'cors'
];

let allOk = true;

for (const dep of dependencies) {
  try {
    require(dep);
    console.log(`✅ ${dep} - OK`);
  } catch (error) {
    console.error(`❌ ${dep} - NO ENCONTRADO`);
    console.error(`   Error: ${error.message}`);
    allOk = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allOk) {
  console.log('✅ Todas las dependencias están instaladas correctamente');
  console.log('\n💡 Si el servidor sigue dando error, reinícialo:');
  console.log('   - Detén el servidor (Ctrl+C)');
  console.log('   - Reinícialo: npm start o npm run dev');
} else {
  console.log('❌ Faltan algunas dependencias');
  console.log('\n💡 Instala las dependencias faltantes:');
  console.log('   npm install');
  process.exit(1);
}

