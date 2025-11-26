# ⚡ Comandos Rápidos - ARASAAC

## 🚀 Iniciar

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Iniciar servidor
npm start

# 3. En otra terminal - ejecutar pruebas
node test-arasaac.js
```

---

## 🧪 Tests desde Terminal

```bash
# Health check
curl http://localhost:3000/api/health

# Buscar "casa" en español
curl http://localhost:3000/api/arasaac/search/es/casa

# Buscar "house" en inglés
curl http://localhost:3000/api/arasaac/search/en/house

# Obtener pictograma ID 2
curl http://localhost:3000/api/arasaac/pictogram/es/2

# Búsqueda múltiple
curl -X POST http://localhost:3000/api/arasaac/search-multiple \
  -H "Content-Type: application/json" \
  -d '{"words": ["casa", "perro", "comer"], "language": "es"}'
```

---

## 🌐 URLs desde Navegador

```
http://localhost:3000/api/health
http://localhost:3000/
http://localhost:3000/api/arasaac/search/es/casa
http://localhost:3000/api/arasaac/search/en/house
https://api.arasaac.org/api/pictograms/2
```

---

## 💻 Código React Native

### Importar

```tsx
import {
  searchPictograms,
  getPictogramById,
  getPictogramImageUrl,
  getBestPictogramForWord,
  convertWordsToPictograms,
} from './services/arasaacService';
```

### Buscar pictogramas

```tsx
const pictograms = await searchPictograms('casa', 'es');
```

### Obtener URL de imagen

```tsx
const url = getPictogramImageUrl(2);
// O con opciones:
const url = getPictogramImageUrl(2, {
  color: true,
  plural: false,
  backgroundColor: 'white'
});
```

### Convertir palabras en pictogramas

```tsx
const result = await convertWordsToPictograms(['yo', 'quiero', 'pizza'], 'es');
// Resultado: [{ word, pictogram, imageUrl }, ...]
```

### Mostrar imagen

```tsx
<Image 
  source={{ uri: getPictogramImageUrl(2) }} 
  style={{ width: 100, height: 100 }}
/>
```

---

## 📋 IDs de Pictogramas Comunes

```javascript
casa: 2
escuela: 13216
yo: 2318
querer: 8866
comer: 11177
beber: 3823
agua: 628
pizza: 26187
perro: 7479
gato: 14507
feliz: 14325
triste: 35066
```

---

## 🔧 Configuración .env

### Web / iOS Simulator
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Android Emulator
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Dispositivo Físico
```
EXPO_PUBLIC_API_URL=http://TU_IP:3000
```

---

## 🌍 Idiomas

```
es - Español
en - Inglés
fr - Francés
it - Italiano
pt - Portugués
de - Alemán
ca - Catalán
```

---

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `setup-arasaac.md` | Setup en 3 pasos |
| `ARASAAC_QUICKSTART.md` | Guía completa de inicio |
| `INTEGRACION_ARASAAC_RESUMEN.md` | Resumen ejecutivo |
| `services/ARASAAC_README.md` | Documentación de la API |
| `components/README_PICTOGRAM_EXAMPLE.md` | Guía del componente |

---

## 🐛 Solución Rápida

| Problema | Solución |
|----------|----------|
| Failed to fetch | Verifica que el servidor esté corriendo |
| CORS error | Usa el servicio, no llames a ARASAAC directamente |
| Android no conecta | Usa `http://10.0.2.2:3000` en `.env` |
| Puerto 3000 ocupado | Cambia `PORT=3001` en `backend/.env` |
| node-fetch error | `cd backend && npm install node-fetch` |

---

## ✅ Verificación Rápida

```bash
# 1. ¿Servidor corriendo?
curl http://localhost:3000/api/health

# 2. ¿ARASAAC funciona?
curl http://localhost:3000/api/arasaac/search/es/casa

# 3. ¿Puedo ver imágenes?
# Abre en navegador: https://api.arasaac.org/api/pictograms/2
```

---

**¡Listo para usar!** 🎉

