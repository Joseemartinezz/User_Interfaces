# 🚀 Setup Rápido de ARASAAC

## Instalación en 3 pasos

### 1️⃣ Instalar dependencias del backend

```bash
cd server
npm install
```

### 2️⃣ Iniciar el servidor

```bash
npm start
```

Deberías ver:
```
🚀 Servidor backend ejecutándose en http://localhost:3000
📡 API Key configurada: ✅ Sí
```

### 3️⃣ Probar los endpoints (en otra terminal)

```bash
cd server
node test-arasaac.js
```

---

## ✅ Verificación Rápida

### Desde el navegador

Abre estas URLs para verificar que todo funciona:

1. **Health check**: http://localhost:3000/api/health
2. **Información del servidor**: http://localhost:3000/
3. **Buscar "casa"**: http://localhost:3000/api/arasaac/search/es/casa
4. **Ver imagen de pictograma**: https://api.arasaac.org/api/pictograms/2

### Desde la terminal

```bash
# Test 1: Health check
curl http://localhost:3000/api/health

# Test 2: Buscar pictogramas
curl http://localhost:3000/api/arasaac/search/es/perro

# Test 3: Obtener pictograma específico
curl http://localhost:3000/api/arasaac/pictogram/es/2
```

---

## 🎯 Probar en la app

### Opción A: Componente de ejemplo completo

```tsx
// En App.tsx
import PictogramExample from './components/PictogramExample';

export default function App() {
  return <PictogramExample />;
}
```

### Opción B: Ejemplo rápido inline

```tsx
import React, { useState, useEffect } from 'react';
import { View, Image, Text, ActivityIndicator } from 'react-native';
import { searchPictograms, getPictogramImageUrl } from './services/arasaacService';

export default function App() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPictogram() {
      try {
        // Buscar pictogramas para "casa"
        const results = await searchPictograms('casa', 'es');
        
        if (results.length > 0) {
          // Obtener URL del primer resultado
          const url = getPictogramImageUrl(results[0]._id);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPictogram();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {imageUrl && (
        <>
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: 150, height: 150, marginBottom: 20 }}
          />
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Casa</Text>
        </>
      )}
    </View>
  );
}
```

---

## 📱 Configuración para diferentes entornos

### Web / iOS Simulator

`.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Android Emulator

`.env`:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Dispositivo Físico

Encuentra tu IP local:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

Luego en `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
```

---

## 🔍 Comandos útiles de prueba

### Buscar por diferentes idiomas

```bash
# Español
curl http://localhost:3000/api/arasaac/search/es/casa

# Inglés
curl http://localhost:3000/api/arasaac/search/en/house

# Francés
curl http://localhost:3000/api/arasaac/search/fr/maison

# Italiano
curl http://localhost:3000/api/arasaac/search/it/casa
```

### Búsqueda múltiple

```bash
curl -X POST http://localhost:3000/api/arasaac/search-multiple \
  -H "Content-Type: application/json" \
  -d '{"words": ["casa", "perro", "comer"], "language": "es"}'
```

### Obtener pictograma por ID

```bash
curl http://localhost:3000/api/arasaac/pictogram/es/2
```

---

## 🎨 IDs de Pictogramas Comunes

Para tus pruebas iniciales, aquí hay algunos IDs útiles:

```javascript
const PICTOGRAMAS_COMUNES = {
  // Básicos
  casa: 2,
  escuela: 13216,
  
  // Pronombres
  yo: 2318,
  tu: 35509,
  
  // Verbos
  querer: 8866,
  comer: 11177,
  beber: 3823,
  jugar: 17768,
  
  // Objetos
  agua: 628,
  pizza: 26187,
  
  // Animales
  perro: 7479,
  gato: 14507,
  
  // Emociones
  feliz: 14325,
  triste: 35066,
};

// Uso:
const url = getPictogramImageUrl(PICTOGRAMAS_COMUNES.casa);
```

---

## 📚 Siguiente paso

Una vez que verifiques que todo funciona, consulta:

- **Guía completa**: Ver [arasaac-setup.md](./arasaac-setup.md)
- **Documentación API**: `services/ARASAAC_README.md`
- **Componente ejemplo**: `components/README_PICTOGRAM_EXAMPLE.md`
- **Resumen ejecutivo**: Ver [arasaac-integration-summary.md](../arasaac-integration-summary.md)

---

## ❓ Troubleshooting

### El servidor no inicia

```bash
# Asegúrate de instalar dependencias
cd server
npm install

# Verifica que no haya otro proceso en el puerto 3000
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000
```

### Error "node-fetch not found"

```bash
cd server
npm install node-fetch
```

### No se conecta desde la app

1. Verifica que el servidor esté corriendo
2. Comprueba la URL en `.env`
3. Para Android Emulator, usa `http://10.0.2.2:3000`
4. Reinicia el servidor Expo: `expo start --clear`

---

## ✅ Checklist de Verificación

- [ ] Backend instalado (`cd server && npm install`)
- [ ] Servidor ejecutándose (`npm start`)
- [ ] Tests pasando (`node test-arasaac.js`)
- [ ] Health check responde: http://localhost:3000/api/health
- [ ] Búsqueda funciona: http://localhost:3000/api/arasaac/search/es/casa
- [ ] URL en `.env` configurada correctamente
- [ ] App React Native puede conectarse al backend

---

**¡Listo! 🎉** Ahora puedes empezar a usar ARASAAC en tu aplicación AAC.

