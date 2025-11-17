# 🚀 Guía de Inicio Rápido - Integración de ARASAAC

Esta guía te ayudará a empezar a usar el servicio de ARASAAC en tu aplicación AAC.

## ✅ ¿Qué se ha implementado?

1. **Servicio de ARASAAC** (`services/arasaacService.ts`) - Cliente TypeScript para interactuar con ARASAAC
2. **Endpoints en el backend** (`server/index.js`) - Proxy para evitar problemas de CORS
3. **Componente de ejemplo** (`components/PictogramExample.tsx`) - Demostración de uso
4. **Documentación completa** - Guías y ejemplos de uso

## 📦 Instalación

### Paso 1: Instalar dependencias del backend

```bash
cd server
npm install
```

Esto instalará automáticamente:
- `express` - Servidor web
- `cors` - Manejo de CORS
- `node-fetch` - Para peticiones HTTP a ARASAAC
- `@google/generative-ai` - Para Gemini
- `dotenv` - Variables de entorno

### Paso 2: Verificar variables de entorno

Asegúrate de que `.env` en la raíz del proyecto tenga:

```env
EXPO_PUBLIC_GEMINI_API_KEY=tu_api_key_de_gemini
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Nota para Android Emulator**: Cambia la URL a `http://10.0.2.2:3000`

### Paso 3: Iniciar el servidor backend

```bash
cd server
npm start
```

Deberías ver:

```
🚀 Servidor backend ejecutándose en http://localhost:3000
📡 API Key configurada: ✅ Sí
```

### Paso 4: Ejecutar las pruebas

En otra terminal, ejecuta:

```bash
cd server
node test-arasaac.js
```

Esto verificará que todos los endpoints de ARASAAC funcionan correctamente.

## 🧪 Pruebas rápidas

### Desde el navegador

Abre estas URLs en tu navegador:

1. **Health check**: http://localhost:3000/api/health
2. **Buscar "casa"**: http://localhost:3000/api/arasaac/search/es/casa
3. **Ver imagen de pictograma**: https://api.arasaac.org/api/pictograms/2

### Desde la terminal

```bash
# Buscar pictogramas para "perro"
curl http://localhost:3000/api/arasaac/search/es/perro

# Obtener pictograma específico
curl http://localhost:3000/api/arasaac/pictogram/es/2

# Búsqueda múltiple
curl -X POST http://localhost:3000/api/arasaac/search-multiple \
  -H "Content-Type: application/json" \
  -d '{"words": ["casa", "perro", "comer"], "language": "es"}'
```

## 📱 Uso en la aplicación

### Opción 1: Usar el componente de ejemplo

Para probar rápidamente la funcionalidad:

```tsx
// En App.tsx
import PictogramExample from './components/PictogramExample';

// Dentro de tu componente
export default function App() {
  return <PictogramExample />;
}
```

### Opción 2: Integrar en tu código existente

```tsx
import { 
  searchPictograms, 
  getPictogramImageUrl,
  convertWordsToPictograms 
} from './services/arasaacService';
import { Image } from 'react-native';

// Ejemplo 1: Buscar pictogramas
async function buscarPictograma() {
  const resultados = await searchPictograms('casa', 'es');
  console.log(`Encontrados ${resultados.length} pictogramas`);
  
  if (resultados.length > 0) {
    const primeraImagen = getPictogramImageUrl(resultados[0]._id);
    return <Image source={{ uri: primeraImagen }} style={{ width: 100, height: 100 }} />;
  }
}

// Ejemplo 2: Convertir frase en pictogramas
async function convertirFrase() {
  const palabras = ['yo', 'quiero', 'pizza'];
  const resultado = await convertWordsToPictograms(palabras, 'es');
  
  // resultado es un array de objetos: { word, pictogram, imageUrl }
  return resultado.map(item => (
    <View key={item.word}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={{ width: 80, height: 80 }} />
      )}
      <Text>{item.word}</Text>
    </View>
  ));
}
```

## 🔧 API del servicio

### Funciones principales

| Función | Descripción | Uso |
|---------|-------------|-----|
| `searchPictograms(word, language)` | Busca pictogramas para una palabra | `await searchPictograms('casa', 'es')` |
| `getPictogramById(id, language)` | Obtiene información de un pictograma | `await getPictogramById(2, 'es')` |
| `getPictogramImageUrl(id, options)` | Genera URL de imagen | `getPictogramImageUrl(2, { color: true })` |
| `getBestPictogramForWord(word, language)` | Obtiene el mejor pictograma | `await getBestPictogramForWord('casa', 'es')` |
| `convertWordsToPictograms(words, language)` | Convierte palabras en pictogramas | `await convertWordsToPictograms(['yo', 'quiero'], 'es')` |
| `searchMultiplePictograms(words, language)` | Busca múltiples palabras | `await searchMultiplePictograms(['casa', 'perro'], 'es')` |

### Opciones de personalización

```typescript
// Opciones disponibles para getPictogramImageUrl
const options = {
  size: 'medium',               // 'small' | 'medium' | 'large'
  color: true,                  // true (color) | false (blanco y negro)
  plural: false,                // true (plural) | false (singular)
  backgroundColor: 'white',     // 'white' | 'black' | 'transparent'
  skinColor: '#F5E6DE',        // Código hexadecimal
  hairColor: '#000000',        // Código hexadecimal
  action: 'present',           // 'present' | 'past' | 'future'
};

const url = getPictogramImageUrl(2, options);
```

## 🌍 Idiomas soportados

```typescript
// Idiomas principales
'es'  // Español
'en'  // Inglés
'fr'  // Francés
'it'  // Italiano
'pt'  // Portugués
'de'  // Alemán
'ca'  // Catalán
'eu'  // Euskera
'gl'  // Gallego

// Y muchos más en https://arasaac.org/
```

## 📊 Estructura de datos

### ArasaacPictogram

```typescript
{
  _id: 2,                          // ID único del pictograma
  keywords: [                      // Palabras clave
    { 
      keyword: 'casa', 
      hasLocution: true 
    }
  ],
  downloads: 12345,                // Popularidad (número de descargas)
  categories: ['vivienda'],        // Categorías
  schematic: false,                // ¿Es esquemático?
  sex: false,                      // ¿Tiene variación de género?
  violence: false,                 // ¿Contiene violencia?
  aac: true,                       // ¿Es para CAA?
  skin: false,                     // ¿Tiene variación de color de piel?
  hair: false                      // ¿Tiene variación de cabello?
}
```

## 🎨 Integración con tu UI actual

### Reemplazar los símbolos de placeholder

En lugar de usar imágenes locales de placeholder, usa pictogramas de ARASAAC:

**Antes:**
```tsx
const WORD_SYMBOLS = [
  { id: 1, text: 'I', image: require('./assets/placeholder.png') },
  { id: 2, text: 'Want', image: require('./assets/placeholder.png') },
];
```

**Después:**
```tsx
import { getPictogramImageUrl } from './services/arasaacService';

const WORD_SYMBOLS = [
  { 
    id: 1, 
    text: 'yo', 
    arasaacId: 2318,
    image: { uri: getPictogramImageUrl(2318) }
  },
  { 
    id: 2, 
    text: 'quiero', 
    arasaacId: 8866,
    image: { uri: getPictogramImageUrl(8866) }
  },
];
```

### Búsqueda dinámica de símbolos

Permite que el usuario agregue sus propios símbolos:

```tsx
const [symbols, setSymbols] = useState([]);

async function addNewSymbol(word: string) {
  const pictogram = await getBestPictogramForWord(word, 'es');
  
  if (pictogram) {
    setSymbols([...symbols, {
      id: pictogram._id,
      text: word,
      image: { uri: getPictogramImageUrl(pictogram._id) }
    }]);
  }
}
```

## 🔗 Integrar ARASAAC con Gemini

Combina ambos servicios para una experiencia completa:

```tsx
import { generatePhrases } from './services/geminiService';
import { convertWordsToPictograms } from './services/arasaacService';

async function generatePhrasesWithPictograms(words: string[]) {
  // 1. Generar frases con Gemini
  const phrases = await generatePhrases(words);
  
  // 2. Convertir cada frase en pictogramas
  const phrasesWithPictograms = await Promise.all(
    phrases.map(async (phrase) => {
      const phraseWords = phrase.split(' ');
      const pictograms = await convertWordsToPictograms(phraseWords, 'es');
      return {
        phrase,
        pictograms,
        words: phraseWords
      };
    })
  );
  
  return phrasesWithPictograms;
}
```

## 🐛 Solución de problemas

### Error: "Failed to fetch" o "Network request failed"

**Causa**: No se puede conectar al servidor backend

**Solución**:
1. Verifica que el servidor esté ejecutándose: `cd server && npm start`
2. Comprueba la URL en `.env`:
   - Web/iOS Simulator: `http://localhost:3000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Dispositivo físico: `http://TU_IP_LOCAL:3000`

### No se encuentran pictogramas para ciertas palabras

**Causa**: La palabra no existe en ARASAAC o está en un idioma diferente

**Solución**:
1. Verifica el idioma seleccionado
2. Prueba con sinónimos
3. Usa palabras más simples o concretas
4. Busca en el catálogo: https://arasaac.org/

### Las imágenes no se cargan

**Causa**: Problemas de conexión o URLs incorrectas

**Solución**:
1. Verifica tu conexión a internet
2. Prueba abriendo una URL de imagen directamente en el navegador:
   https://api.arasaac.org/api/pictograms/2
3. Comprueba los logs del backend para ver errores

### Error CORS en el navegador

**Causa**: Estás intentando acceder a ARASAAC directamente desde el frontend

**Solución**:
- ✅ **Correcto**: Usa el servicio `arasaacService.ts` que hace peticiones al backend
- ❌ **Incorrecto**: No hagas peticiones directas a `https://api.arasaac.org` desde el frontend

## 📚 Recursos adicionales

### Documentación

- **Servicio completo**: `services/ARASAAC_README.md`
- **Componente de ejemplo**: `components/README_PICTOGRAM_EXAMPLE.md`
- **Backend**: `server/README.md`

### Enlaces externos

- [API de ARASAAC](https://arasaac.org/developers/api)
- [Portal de ARASAAC](https://arasaac.org/)
- [Catálogo de pictogramas](https://arasaac.org/pictograms/search)

### IDs útiles de pictogramas comunes

```javascript
const COMMON_PICTOGRAMS = {
  // Pronombres
  yo: 2318,
  tu: 35509,
  el: 11493,
  ella: 11492,
  nosotros: 23934,
  
  // Verbos comunes
  querer: 8866,
  comer: 11177,
  beber: 3823,
  jugar: 17768,
  ir: 16825,
  ver: 36496,
  hacer: 15482,
  
  // Objetos comunes
  agua: 628,
  comida: 11264,
  casa: 2,
  escuela: 13216,
  
  // Emociones
  feliz: 14325,
  triste: 35066,
  enfadado: 13121,
  asustado: 2825,
};
```

## 🚀 Próximos pasos

1. **Prueba el componente de ejemplo**: Ejecuta `PictogramExample.tsx` para ver la funcionalidad
2. **Integra en tu app**: Reemplaza los placeholders con pictogramas reales
3. **Personaliza**: Ajusta colores, tamaños y opciones según tus necesidades
4. **Optimiza**: Implementa caché para pictogramas frecuentes
5. **Expande**: Agrega más idiomas y funcionalidades

## 💡 Consejos

1. **Caché local**: Guarda los pictogramas más usados localmente para uso offline
2. **Búsqueda inteligente**: Usa Gemini para sugerir palabras relacionadas
3. **Categorización**: Organiza los pictogramas por categorías (emociones, acciones, objetos)
4. **Favoritos**: Permite que cada usuario tenga sus pictogramas favoritos
5. **Tableros personalizados**: Crea tableros de comunicación específicos para cada contexto

## ✨ Ejemplo completo

```tsx
import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { 
  searchPictograms, 
  getPictogramImageUrl 
} from './services/arasaacService';
import { generatePhrases } from './services/geminiService';
import * as Speech from 'expo-speech';

function AACDemo() {
  const [selectedWords, setSelectedWords] = useState([]);
  const [phrases, setPhrases] = useState([]);

  // Seleccionar palabra
  const selectWord = (word) => {
    setSelectedWords([...selectedWords, word]);
  };

  // Generar frases
  const generatePhrasesHandler = async () => {
    const result = await generatePhrases(selectedWords);
    setPhrases(result);
  };

  // Hablar frase
  const speakPhrase = (phrase) => {
    Speech.speak(phrase, { language: 'es' });
  };

  return (
    <View>
      <Text>Palabras seleccionadas: {selectedWords.join(' ')}</Text>
      
      {phrases.map((phrase, index) => (
        <TouchableOpacity key={index} onPress={() => speakPhrase(phrase)}>
          <Text>{phrase}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

¿Necesitas ayuda? Consulta la documentación completa en `services/ARASAAC_README.md` o abre un issue en el repositorio.

