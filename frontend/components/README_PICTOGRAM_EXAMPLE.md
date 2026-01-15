# Example Component: PictogramExample

This is a demonstration component that shows how to integrate the ARASAAC service into your React Native application.

## Features

The `PictogramExample.tsx` component demonstrates:

1. **Pictogram search**: Search pictograms by word in the selected language
2. **Language selector**: Allows switching between Spanish, English, French, and Italian
3. **Phrase conversion**: Converts a complete phrase into a sequence of pictograms
4. **Results visualization**: Displays found pictograms in a scrollable gallery

## How to Use

### Option 1: Use as a standalone screen

You can add this component as a new screen in your app to test ARASAAC functionality:

```tsx
// In App.tsx or your navigation file
import PictogramExample from './components/PictogramExample';

// Inside your component
<PictogramExample />
```

### Option 2: Integrate functionalities into your existing app

You can take parts of the example code and adapt them to your application. For example, to display pictograms in your UI:

```tsx
import { searchPictograms, getPictogramImageUrl } from './services/arasaacService';
import { Image } from 'react-native';

// Search and display pictogram
async function showPictogramForWord(word: string) {
  const results = await searchPictograms(word, 'es');
  if (results.length > 0) {
    const imageUrl = getPictogramImageUrl(results[0]._id);
    return <Image source={{ uri: imageUrl }} style={{ width: 100, height: 100 }} />;
  }
}
```

## Prerequisites

1. **Backend running**: Make sure the backend server is running:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Environment variables configured**: Verify that `.env` has the backend URL configured:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```
   (Use `http://10.0.2.2:3000` for Android Emulator)

## Main Functions

### 1. Search pictograms

```typescript
const handleSearch = async () => {
  const results = await searchPictograms(searchTerm.trim(), language);
  setPictograms(results);
};
```

### 2. Convert phrase to pictograms

```typescript
const handleConvertPhrase = async () => {
  const words = phraseWords.trim().split(/\s+/);
  const results = await convertWordsToPictograms(words, language);
  setPhraseResult(results);
};
```

### 3. Get image URL

```typescript
const imageUrl = getPictogramImageUrl(pictogram._id, {
  color: true,
  backgroundColor: 'white',
});
```

## Customization

You can customize pictograms by modifying options in `getPictogramImageUrl`:

```typescript
// Black and white pictogram
getPictogramImageUrl(id, { color: false });

// Plural pictogram
getPictogramImageUrl(id, { plural: true });

// Pictogram with black background
getPictogramImageUrl(id, { backgroundColor: 'black' });

// Pictogram with custom skin color
getPictogramImageUrl(id, { skinColor: '#E2C4A8' });
```

## Styles

Styles are defined inline in the component using `StyleSheet.create()`. You can modify them to adapt to your app's design.

Some key styles:

- `pictogramCard`: Individual pictogram card
- `pictogramImage`: Pictogram image size (80x80 by default)
- `button`: Main button style
- `languageButton`: Language selection buttons

## Integration with Your AAC App

This component is a starting point. To integrate it into your complete AAC application, consider:

### 1. Replace placeholder symbols

In `App.tsx`, replace placeholder symbols with real ARASAAC pictograms:

```tsx
// Instead of this:
const WORD_SYMBOLS = [
  { id: 1, text: 'I', image: require('./assets/placeholder.png') },
  // ...
];

// Use this:
const WORD_SYMBOLS = [
  { 
    id: 1, 
    text: 'I', 
    arasaacId: 2318, // Pictogram ID in ARASAAC
    image: { uri: getPictogramImageUrl(2318) }
  },
  // ...
];
```

### 2. Dynamic pictogram search

Allow users to search and add their own symbols:

```tsx
const [customSymbols, setCustomSymbols] = useState([]);

async function addSymbolFromSearch(word: string) {
  const pictogram = await getBestPictogramForWord(word, 'es');
  if (pictogram) {
    setCustomSymbols([...customSymbols, {
      id: pictogram._id,
      text: word,
      image: { uri: getPictogramImageUrl(pictogram._id) }
    }]);
  }
}
```

### 3. Integrate with Gemini

Combine Gemini phrase generation with ARASAAC pictograms:

```tsx
async function generatePhrasesWithPictograms(words: string[]) {
  // 1. Generate phrases with Gemini
  const phrases = await generatePhrases(words);
  
  // 2. For each phrase, get pictograms for key words
  const phrasesWithPictograms = await Promise.all(
    phrases.map(async (phrase) => {
      const phraseWords = phrase.split(' ');
      const pictograms = await convertWordsToPictograms(phraseWords, 'es');
      return { phrase, pictograms };
    })
  );
  
  return phrasesWithPictograms;
}
```

## Troubleshooting

### Pictograms not loading

1. Verify that the backend server is running
2. Check the `EXPO_PUBLIC_API_URL` configuration in `.env`
3. Check the backend console to see request logs
4. Verify your internet connection (pictograms are downloaded from ARASAAC)

### "Failed to fetch" error

This usually indicates that it cannot connect to the backend:
- On Android Emulator, use `http://10.0.2.2:3000`
- On iOS Simulator, use `http://localhost:3000`
- On physical device, use your local IP (e.g., `http://192.168.1.100:3000`)

### Pictograms not found for certain words

Not all words have pictograms in ARASAAC. Some suggestions:
- Try synonyms
- Use simpler or more concrete words
- Verify the selected language
- Check the complete catalog at https://arasaac.org/

## Next Steps

1. **Pictogram cache**: Implement local cache to improve performance
2. **Offline download**: Download most used pictograms for offline use
3. **Favorites**: Allow users to mark favorite pictograms
4. **Categories**: Organize pictograms by categories (emotions, actions, objects, etc.)
5. **Custom boards**: Allow creating custom communication boards

## References

- [ARASAAC Service](../services/arasaacService.ts)
- [Service Documentation](../services/ARASAAC_README.md)
- [Backend README](../../backend/README.md)
- [ARASAAC API](https://arasaac.org/developers/api)
