// Script simple para verificar que el servidor está funcionando
const http = require('http');

const testUrl = 'http://127.0.0.1:3000';

console.log('🔍 Verificando servidor en', testUrl);

const req = http.get(testUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Servidor está funcionando!');
    console.log('Respuesta:', data);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error conectando al servidor:', error.message);
  console.log('\n💡 Asegúrate de que el servidor esté ejecutándose:');
  console.log('   npm run server');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('❌ Timeout: El servidor no respondió en 5 segundos');
  req.destroy();
  process.exit(1);
});

