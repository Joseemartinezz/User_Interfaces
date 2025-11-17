# Servicio de ARASAAC

Este servicio proporciona integración con la API de ARASAAC para obtener pictogramas de comunicación aumentativa y alternativa (CAA).

## ¿Qué es ARASAAC?

ARASAAC (Centro Aragonés para la Comunicación Aumentativa y Alternativa) es un recurso gratuito que ofrece pictogramas y materiales para facilitar la comunicación de personas con dificultades en este ámbito.

- **Web oficial**: https://arasaac.org/
- **Documentación de API**: https://arasaac.org/developers/api

## Características

El servicio `arasaacService.ts` proporciona las siguientes funcionalidades:

### 1. Buscar pictogramas

```typescript
import { searchPictograms } from './services/arasaacService';

// Buscar pictogramas para la palabra "casa" en español
const pictograms = await searchPictograms('casa', 'es');
```

### 2. Obtener pictograma por ID

```typescript
import { getPictogramById } from './services/arasaacService';

// Obtener información del pictograma con ID 2
const pictogram = await getPictogramById(2, 'es');
```

### 3. Generar URL de imagen

```typescript
import { getPictogramImageUrl } from './services/arasaacService';

// Generar URL de imagen con opciones personalizadas
const imageUrl = getPictogramImageUrl(2, {
  size: 'medium',
  color: true,
  plural: false,
  backgroundColor: 'white',
});
```

### 4. Buscar múltiples pictogramas

```typescript
import { searchMultiplePictograms } from './services/arasaacService';

// Buscar pictogramas para varias palabras
const results = await searchMultiplePictograms(['casa', 'perro', 'comer'], 'es');
```

### 5. Obtener el mejor pictograma para una palabra

```typescript
import { getBestPictogramForWord } from './services/arasaacService';

// Obtiene el pictograma más popular/relevante
const bestPictogram = await getBestPictogramForWord('casa', 'es');
```

### 6. Convertir palabras en pictogramas

```typescript
import { convertWordsToPictograms } from './services/arasaacService';

// Convierte un array de palabras en pictogramas
const result = await convertWordsToPictograms(['I', 'want', 'pizza'], 'en');
// Resultado: Array de objetos con { word, pictogram, imageUrl }
```

## Idiomas soportados

ARASAAC soporta múltiples idiomas, incluyendo:

- `es` - Español
- `en` - Inglés
- `fr` - Francés
- `it` - Italiano
- `pt` - Portugués
- `de` - Alemán
- `ca` - Catalán
- `eu` - Euskera
- `gl` - Gallego
- Y muchos más...

## Opciones de personalización de imágenes

Al generar URLs de imágenes con `getPictogramImageUrl`, puedes personalizar:

| Opción | Tipo | Valores | Descripción |
|--------|------|---------|-------------|
| `size` | string | 'small', 'medium', 'large' | Tamaño de la imagen |
| `color` | boolean | true, false | Color o blanco y negro |
| `plural` | boolean | true, false | Versión plural del pictograma |
| `backgroundColor` | string | 'white', 'black', 'transparent' | Color de fondo |
| `skinColor` | string | Código hexadecimal | Color de piel (si aplica) |
| `hairColor` | string | Código hexadecimal | Color de cabello (si aplica) |
| `action` | string | 'present', 'past', 'future' | Tiempo verbal (si aplica) |

### Ejemplos de personalización

```typescript
// Pictograma en blanco y negro
const bwUrl = getPictogramImageUrl(2, { color: false });

// Pictograma en plural con fondo negro
const pluralUrl = getPictogramImageUrl(2, { 
  plural: true, 
  backgroundColor: 'black' 
});

// Pictograma con color de piel personalizado
const skinUrl = getPictogramImageUrl(2, { 
  skinColor: '#E2C4A8' 
});
```

## Estructura de datos

### ArasaacPictogram

```typescript
interface ArasaacPictogram {
  _id: number;                    // ID único del pictograma
  keywords: Array<{               // Palabras clave asociadas
    keyword: string;
    hasLocution: boolean;
  }>;
  synsets?: string[];            // Conjuntos de sinónimos
  categories?: string[];         // Categorías del pictograma
  schematic?: boolean;           // Es esquemático
  sex?: boolean;                 // Tiene variación de sexo
  violence?: boolean;            // Contiene violencia
  aac?: boolean;                 // Es para CAA
  aacColor?: boolean;            // Tiene versión en color para CAA
  skin?: boolean;                // Tiene variación de color de piel
  hair?: boolean;                // Tiene variación de color de cabello
  downloads?: number;            // Número de descargas
  variations?: any;              // Variaciones disponibles
}
```

## Backend Endpoints

El backend de Express proporciona los siguientes endpoints como proxy para evitar problemas de CORS:

### GET `/api/arasaac/search/:language/:searchTerm`

Busca pictogramas por término de búsqueda.

**Ejemplo:**
```
GET http://localhost:3000/api/arasaac/search/es/casa
```

**Respuesta:**
```json
[
  {
    "_id": 2,
    "keywords": [
      { "keyword": "casa", "hasLocution": true }
    ],
    "downloads": 12345,
    ...
  }
]
```

### GET `/api/arasaac/pictogram/:language/:idPictogram`

Obtiene información de un pictograma específico.

**Ejemplo:**
```
GET http://localhost:3000/api/arasaac/pictogram/es/2
```

### POST `/api/arasaac/search-multiple`

Busca pictogramas para múltiples palabras a la vez.

**Body:**
```json
{
  "words": ["casa", "perro", "comer"],
  "language": "es"
}
```

**Respuesta:**
```json
{
  "casa": {
    "pictograms": [...],
    "error": false
  },
  "perro": {
    "pictograms": [...],
    "error": false
  },
  "comer": {
    "pictograms": [...],
    "error": false
  }
}
```

## Ejemplo de uso en React Native

```tsx
import React, { useState, useEffect } from 'react';
import { View, Image, Text, ActivityIndicator } from 'react-native';
import { 
  searchPictograms, 
  getPictogramImageUrl 
} from './services/arasaacService';

function PictogramExample() {
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState(null);

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
    return <ActivityIndicator />;
  }

  return (
    <View>
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={{ width: 100, height: 100 }}
        />
      )}
      <Text>Casa</Text>
    </View>
  );
}
```

## Configuración

El servicio utiliza el backend de Express como proxy para evitar problemas de CORS. Asegúrate de que:

1. El servidor backend esté ejecutándose: `npm run server` (en la carpeta `server/`)
2. La variable de entorno `EXPO_PUBLIC_API_URL` esté configurada correctamente en `.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Para Android Emulator:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Instalación de dependencias

### Backend (carpeta `server/`)

```bash
cd server
npm install
```

Esto instalará automáticamente `node-fetch` que es necesario para las peticiones a ARASAAC.

## Notas importantes

1. **CORS**: Las peticiones a ARASAAC se hacen a través del backend para evitar problemas de CORS en el navegador y React Native.

2. **Rate limiting**: La API de ARASAAC es gratuita pero puede tener límites de tasa. Considera implementar caché en producción.

3. **Imágenes**: Las URLs de imágenes apuntan directamente a la API de ARASAAC y no pasan por el backend, para mejor rendimiento.

4. **Idioma por defecto**: Si no se especifica idioma, el servicio usa español ('es') por defecto.

5. **Manejo de errores**: Todas las funciones lanzan errores descriptivos que debes capturar con try-catch.

## Próximos pasos

1. **Implementar caché**: Almacenar resultados de búsquedas frecuentes
2. **Descargar pictogramas localmente**: Para uso offline
3. **Integrar con el LLM**: Para que Gemini sugiera pictogramas apropiados
4. **Añadir favoritos**: Permitir guardar pictogramas favoritos del usuario

## Recursos adicionales

- [Documentación oficial de ARASAAC API](https://arasaac.org/developers/api)
- [Portal de ARASAAC](https://arasaac.org/)
- [Lista completa de idiomas soportados](https://arasaac.org/developers/api#/Languages)

