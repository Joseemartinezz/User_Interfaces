# Componente de Ejemplo: PictogramExample

Este es un componente de demostración que muestra cómo integrar el servicio de ARASAAC en tu aplicación React Native.

## Características

El componente `PictogramExample.tsx` demuestra:

1. **Búsqueda de pictogramas**: Busca pictogramas por palabra en el idioma seleccionado
2. **Selector de idioma**: Permite cambiar entre español, inglés, francés e italiano
3. **Conversión de frases**: Convierte una frase completa en una secuencia de pictogramas
4. **Visualización de resultados**: Muestra los pictogramas encontrados en una galería desplazable

## Cómo usarlo

### Opción 1: Usar como pantalla independiente

Puedes agregar este componente como una nueva pantalla en tu app para probar la funcionalidad de ARASAAC:

```tsx
// En App.tsx o tu archivo de navegación
import PictogramExample from './components/PictogramExample';

// Dentro de tu componente
<PictogramExample />
```

### Opción 2: Integrar las funcionalidades en tu app existente

Puedes tomar partes del código de ejemplo y adaptarlas a tu aplicación. Por ejemplo, para mostrar pictogramas en tu UI:

```tsx
import { searchPictograms, getPictogramImageUrl } from './services/arasaacService';
import { Image } from 'react-native';

// Buscar y mostrar pictograma
async function showPictogramForWord(word: string) {
  const results = await searchPictograms(word, 'es');
  if (results.length > 0) {
    const imageUrl = getPictogramImageUrl(results[0]._id);
    return <Image source={{ uri: imageUrl }} style={{ width: 100, height: 100 }} />;
  }
}
```

## Requisitos previos

1. **Backend ejecutándose**: Asegúrate de que el servidor backend esté corriendo:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Variables de entorno configuradas**: Verifica que `.env` tenga configurada la URL del backend:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```
   (Usa `http://10.0.2.2:3000` para Android Emulator)

## Funciones principales

### 1. Buscar pictogramas

```typescript
const handleSearch = async () => {
  const results = await searchPictograms(searchTerm.trim(), language);
  setPictograms(results);
};
```

### 2. Convertir frase en pictogramas

```typescript
const handleConvertPhrase = async () => {
  const words = phraseWords.trim().split(/\s+/);
  const results = await convertWordsToPictograms(words, language);
  setPhraseResult(results);
};
```

### 3. Obtener URL de imagen

```typescript
const imageUrl = getPictogramImageUrl(pictogram._id, {
  color: true,
  backgroundColor: 'white',
});
```

## Personalización

Puedes personalizar los pictogramas modificando las opciones en `getPictogramImageUrl`:

```typescript
// Pictograma en blanco y negro
getPictogramImageUrl(id, { color: false });

// Pictograma en plural
getPictogramImageUrl(id, { plural: true });

// Pictograma con fondo negro
getPictogramImageUrl(id, { backgroundColor: 'black' });

// Pictograma con color de piel personalizado
getPictogramImageUrl(id, { skinColor: '#E2C4A8' });
```

## Estilos

Los estilos están definidos inline en el componente usando `StyleSheet.create()`. Puedes modificarlos para adaptarlos al diseño de tu app.

Algunos estilos clave:

- `pictogramCard`: Tarjeta de pictograma individual
- `pictogramImage`: Tamaño de imagen del pictograma (80x80 por defecto)
- `button`: Estilo del botón principal
- `languageButton`: Botones de selección de idioma

## Integración con tu App AAC

Este componente es un punto de partida. Para integrarlo en tu aplicación AAC completa, considera:

### 1. Reemplazar los símbolos de placeholder

En `App.tsx`, reemplaza los símbolos de placeholder con pictogramas reales de ARASAAC:

```tsx
// En lugar de esto:
const WORD_SYMBOLS = [
  { id: 1, text: 'I', image: require('./assets/placeholder.png') },
  // ...
];

// Usa esto:
const WORD_SYMBOLS = [
  { 
    id: 1, 
    text: 'I', 
    arasaacId: 2318, // ID del pictograma en ARASAAC
    image: { uri: getPictogramImageUrl(2318) }
  },
  // ...
];
```

### 2. Búsqueda dinámica de pictogramas

Permite que el usuario busque y agregue sus propios símbolos:

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

### 3. Integrar con Gemini

Combina la generación de frases de Gemini con los pictogramas de ARASAAC:

```tsx
async function generatePhrasesWithPictograms(words: string[]) {
  // 1. Generar frases con Gemini
  const phrases = await generatePhrases(words);
  
  // 2. Para cada frase, obtener pictogramas para las palabras clave
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

### No se cargan los pictogramas

1. Verifica que el servidor backend esté ejecutándose
2. Revisa la configuración de `EXPO_PUBLIC_API_URL` en `.env`
3. Comprueba la consola del backend para ver los logs de las peticiones
4. Verifica tu conexión a internet (los pictogramas se descargan desde ARASAAC)

### Error "Failed to fetch"

Esto suele indicar que no se puede conectar al backend:
- En Android Emulator, usa `http://10.0.2.2:3000`
- En iOS Simulator, usa `http://localhost:3000`
- En dispositivo físico, usa tu IP local (ej: `http://192.168.1.100:3000`)

### Pictogramas no encontrados para ciertas palabras

No todas las palabras tienen pictogramas en ARASAAC. Algunas sugerencias:
- Prueba con sinónimos
- Usa palabras más simples o concretas
- Verifica el idioma seleccionado
- Consulta el catálogo completo en https://arasaac.org/

## Próximos pasos

1. **Caché de pictogramas**: Implementa caché local para mejorar el rendimiento
2. **Descarga offline**: Descarga los pictogramas más usados para uso offline
3. **Favoritos**: Permite que el usuario marque pictogramas favoritos
4. **Categorías**: Organiza los pictogramas por categorías (emociones, acciones, objetos, etc.)
5. **Tableros personalizados**: Permite crear tableros de comunicación personalizados

## Referencias

- [Servicio ARASAAC](../services/arasaacService.ts)
- [Documentación del servicio](../services/ARASAAC_README.md)
- [Backend README](../server/README.md)
- [API de ARASAAC](https://arasaac.org/developers/api)

