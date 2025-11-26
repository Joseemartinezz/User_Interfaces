# ARASAAC Setup Guide

ARASAAC is an open-source pictogram library used for PCS (Picture Communication Symbols) in the AAC app.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Server

```bash
npm start
```

### 3. Test ARASAAC Integration

```bash
# Health check
curl http://localhost:3000/api/health

# Search for "casa" in Spanish
curl http://localhost:3000/api/arasaac/search/es/casa
```

## API Endpoints

### Search Pictograms

**GET** `/api/arasaac/search/:language/:searchTerm`

Search for pictograms by term.

**Example:**
```bash
# Search "casa" in Spanish
curl http://localhost:3000/api/arasaac/search/es/casa

# Search "house" in English
curl http://localhost:3000/api/arasaac/search/en/house
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

### Get Pictogram by ID

**GET** `/api/arasaac/pictogram/:language/:idPictogram`

Get detailed information about a specific pictogram.

**Example:**
```bash
curl http://localhost:3000/api/arasaac/pictogram/es/2
```

### Get Pictogram Image

**GET** `/api/arasaac/image/:idPictogram`

Get the image URL for a pictogram (proxy endpoint to avoid CORS).

**Query Parameters:**
- `color`: Boolean - Color version
- `backgroundColor`: String - Background color (e.g., "white")
- `plural`: Boolean - Plural form
- `skin`: String - Skin color variation
- `hair`: String - Hair color variation
- `action`: String - Action variation

**Example:**
```bash
# Basic image
curl http://localhost:3000/api/arasaac/image/2

# Colored image with white background
curl "http://localhost:3000/api/arasaac/image/2?color=true&backgroundColor=white"
```

### Search Multiple Words

**POST** `/api/arasaac/search-multiple`

Search for pictograms for multiple words at once.

**Request Body:**
```json
{
  "words": ["casa", "perro", "comer"],
  "language": "es"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/arasaac/search-multiple \
  -H "Content-Type: application/json" \
  -d '{"words": ["casa", "perro", "comer"], "language": "es"}'
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

## Supported Languages

- `es` - Spanish
- `en` - English
- `fr` - French
- `it` - Italian
- `pt` - Portuguese
- `de` - German
- `ca` - Catalan

## Using in React Native

### Import Service

```typescript
import {
  searchPictograms,
  getPictogramById,
  getPictogramImageUrl,
  getBestPictogramForWord,
  convertWordsToPictograms,
} from './services/arasaacService';
```

### Search Pictograms

```typescript
const pictograms = await searchPictograms('casa', 'es');
```

### Get Image URL

```typescript
// Basic URL
const url = getPictogramImageUrl(2);

// With options
const url = getPictogramImageUrl(2, {
  color: true,
  plural: false,
  backgroundColor: 'white'
});
```

### Convert Words to Pictograms

```typescript
const result = await convertWordsToPictograms(['yo', 'quiero', 'pizza'], 'es');
// Result: [{ word, pictogram, imageUrl }, ...]
```

### Display Image

```tsx
import { Image } from 'react-native';
import { getPictogramImageUrl } from './services/arasaacService';

<Image 
  source={{ uri: getPictogramImageUrl(2) }} 
  style={{ width: 100, height: 100 }}
/>
```

## Common Pictogram IDs

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

## Troubleshooting

### Failed to Fetch
- Verify the backend server is running
- Check the API URL in your frontend configuration
- Ensure CORS is properly configured

### CORS Error
- Always use the backend proxy endpoints
- Never call ARASAAC API directly from frontend
- Use `/api/arasaac/*` endpoints instead

### Android Connection Issues
- Use `http://10.0.2.2:3000` instead of `localhost` for Android emulator
- Update `EXPO_PUBLIC_API_URL` in `.env`

### Port Already in Use
- Change `PORT=3001` in `backend/.env`
- Update frontend API URL accordingly

### Images Not Loading
- Check if pictogram ID exists
- Verify image URL format
- Check network connectivity
- Try accessing image URL directly in browser

## Quick Verification

```bash
# 1. Is server running?
curl http://localhost:3000/api/health

# 2. Does ARASAAC work?
curl http://localhost:3000/api/arasaac/search/es/casa

# 3. Can I see images?
# Open in browser: https://api.arasaac.org/api/pictograms/2
```

## Direct ARASAAC API

The ARASAAC API base URL is: `https://api.arasaac.org/api`

**Important:** Always use the backend proxy endpoints to avoid CORS issues. The backend handles all communication with ARASAAC.

## Image Customization Options

When getting pictogram images, you can customize:

- **Color**: Boolean - Get colored version
- **Background Color**: String - Set background color (e.g., "white", "transparent")
- **Plural**: Boolean - Get plural form
- **Skin**: String - Skin color variation
- **Hair**: String - Hair color variation
- **Action**: String - Action variation

Example:
```typescript
const url = getPictogramImageUrl(2, {
  color: true,
  backgroundColor: 'white',
  plural: false
});
```

## Best Practices

1. **Cache Results**: Cache frequently used pictograms locally
2. **Batch Requests**: Use `search-multiple` for multiple words
3. **Error Handling**: Always handle cases where pictograms aren't found
4. **Language Selection**: Use appropriate language code for better results
5. **Image Optimization**: Use appropriate image sizes for your UI

## Resources

- [ARASAAC Official Website](https://arasaac.org/)
- [ARASAAC API Documentation](https://api.arasaac.org/)
- [Backend ARASAAC Service](../backend/services/ARASAAC_README.md)

