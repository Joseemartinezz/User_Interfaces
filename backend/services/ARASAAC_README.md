# ARASAAC Service

This service provides integration with the ARASAAC API to obtain augmentative and alternative communication (AAC) pictograms.

## What is ARASAAC?

ARASAAC (Aragonese Center for Augmentative and Alternative Communication) is a free resource that offers pictograms and materials to facilitate communication for people with communication difficulties.

- **Official website**: https://arasaac.org/
- **API documentation**: https://arasaac.org/developers/api

## Features

The `arasaacService.ts` service provides the following functionalities:

### 1. Search pictograms

```typescript
import { searchPictograms } from './services/arasaacService';

// Search pictograms for the word "casa" in Spanish
const pictograms = await searchPictograms('casa', 'es');
```

### 2. Get pictogram by ID

```typescript
import { getPictogramById } from './services/arasaacService';

// Get information for pictogram with ID 2
const pictogram = await getPictogramById(2, 'es');
```

### 3. Generate image URL

```typescript
import { getPictogramImageUrl } from './services/arasaacService';

// Generate image URL with custom options
const imageUrl = getPictogramImageUrl(2, {
  size: 'medium',
  color: true,
  plural: false,
  backgroundColor: 'white',
});
```

### 4. Search multiple pictograms

```typescript
import { searchMultiplePictograms } from './services/arasaacService';

// Search pictograms for multiple words
const results = await searchMultiplePictograms(['casa', 'perro', 'comer'], 'es');
```

### 5. Get the best pictogram for a word

```typescript
import { getBestPictogramForWord } from './services/arasaacService';

// Gets the most popular/relevant pictogram
const bestPictogram = await getBestPictogramForWord('casa', 'es');
```

### 6. Convert words to pictograms

```typescript
import { convertWordsToPictograms } from './services/arasaacService';

// Converts an array of words into pictograms
const result = await convertWordsToPictograms(['I', 'want', 'pizza'], 'en');
// Result: Array of objects with { word, pictogram, imageUrl }
```

## Supported Languages

ARASAAC supports multiple languages, including:

- `es` - Spanish
- `en` - English
- `fr` - French
- `it` - Italian
- `pt` - Portuguese
- `de` - German
- `ca` - Catalan
- `eu` - Basque
- `gl` - Galician
- And many more...

## Image Customization Options

When generating image URLs with `getPictogramImageUrl`, you can customize:

| Option | Type | Values | Description |
|--------|------|--------|-------------|
| `size` | string | 'small', 'medium', 'large' | Image size |
| `color` | boolean | true, false | Color or black and white |
| `plural` | boolean | true, false | Plural version of the pictogram |
| `backgroundColor` | string | 'white', 'black', 'transparent' | Background color |
| `skinColor` | string | Hexadecimal code | Skin color (if applicable) |
| `hairColor` | string | Hexadecimal code | Hair color (if applicable) |
| `action` | string | 'present', 'past', 'future' | Verb tense (if applicable) |

### Customization Examples

```typescript
// Black and white pictogram
const bwUrl = getPictogramImageUrl(2, { color: false });

// Plural pictogram with black background
const pluralUrl = getPictogramImageUrl(2, { 
  plural: true, 
  backgroundColor: 'black' 
});

// Pictogram with custom skin color
const skinUrl = getPictogramImageUrl(2, { 
  skinColor: '#E2C4A8' 
});
```

## Data Structure

### ArasaacPictogram

```typescript
interface ArasaacPictogram {
  _id: number;                    // Unique pictogram ID
  keywords: Array<{               // Associated keywords
    keyword: string;
    hasLocution: boolean;
  }>;
  synsets?: string[];            // Synonym sets
  categories?: string[];         // Pictogram categories
  schematic?: boolean;           // Is schematic
  sex?: boolean;                 // Has gender variation
  violence?: boolean;            // Contains violence
  aac?: boolean;                 // Is for AAC
  aacColor?: boolean;            // Has color version for AAC
  skin?: boolean;                // Has skin color variation
  hair?: boolean;                // Has hair color variation
  downloads?: number;            // Number of downloads
  variations?: any;              // Available variations
}
```

## Backend Endpoints

The Express backend provides the following endpoints as a proxy to avoid CORS issues:

### GET `/api/arasaac/search/:language/:searchTerm`

Search pictograms by search term.

**Example:**
```
GET http://localhost:3000/api/arasaac/search/es/casa
```

**Response:**
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

Get information for a specific pictogram.

**Example:**
```
GET http://localhost:3000/api/arasaac/pictogram/es/2
```

### POST `/api/arasaac/search-multiple`

Search pictograms for multiple words at once.

**Body:**
```json
{
  "words": ["casa", "perro", "comer"],
  "language": "es"
}
```

**Response:**
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

## React Native Usage Example

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
        // Search pictograms for "casa"
        const results = await searchPictograms('casa', 'es');
        
        if (results.length > 0) {
          // Get URL of first result
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

## Configuration

The service uses the Express backend as a proxy to avoid CORS issues. Make sure:

1. The backend server is running: `npm run server` (in the `backend/` folder)
2. The environment variable `EXPO_PUBLIC_API_URL` is configured correctly in `.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

For Android Emulator:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

## Dependency Installation

### Backend (folder `backend/`)

```bash
cd backend
npm install
```

This will automatically install `node-fetch` which is required for ARASAAC requests.

## Important Notes

1. **CORS**: Requests to ARASAAC are made through the backend to avoid CORS issues in the browser and React Native.

2. **Rate limiting**: The ARASAAC API is free but may have rate limits. Consider implementing caching in production.

3. **Images**: Image URLs point directly to the ARASAAC API and do not go through the backend, for better performance.

4. **Default language**: If no language is specified, the service uses Spanish ('es') as default.

5. **Error handling**: All functions throw descriptive errors that you must catch with try-catch.

## Next Steps

1. **Implement caching**: Store results of frequent searches
2. **Download pictograms locally**: For offline use
3. **Integrate with LLM**: So Gemini can suggest appropriate pictograms
4. **Add favorites**: Allow users to save favorite pictograms

## Additional Resources

- [Official ARASAAC API documentation](https://arasaac.org/developers/api)
- [ARASAAC Portal](https://arasaac.org/)
- [Complete list of supported languages](https://arasaac.org/developers/api#/Languages)
