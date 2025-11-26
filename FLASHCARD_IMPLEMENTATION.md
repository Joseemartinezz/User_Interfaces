# Implementación de Flashcards con Imágenes Generadas por IA

## 📋 Resumen de Cambios

Se ha reimaginado completamente la pantalla de selección de frases (`PhraseSelectionScreen`) para mostrar las frases generadas como flashcards deslizables con imágenes generadas por DALL-E.

## ✨ Nuevas Características

### 1. **Flashcards Deslizables**
- Cada frase se muestra en una flashcard de pantalla completa
- Navegación horizontal mediante deslizamiento (swipe)
- Indicador de página (ej: "1 / 3")
- Diseño limpio y moderno con sombras y bordes redondeados

### 2. **Generación de Imágenes con IA**
- Cada frase incluye una imagen generada automáticamente con DALL-E 3
- Imágenes child-friendly y apropiadas para dispositivos AAC
- Indicador de carga mientras se generan las imágenes
- Placeholder en caso de error en la generación

### 3. **Modo Selección**
- Botón "Select Phrase" en cada flashcard
- Al seleccionar, la flashcard se amplía y el deslizamiento se bloquea
- Vista enfocada en la frase seleccionada
- Botón "Back to Phrases" para volver al carrusel

### 4. **Audio Mejorado**
- Volumen aumentado al máximo (volume: 1.0)
- Pitch ajustado a 1.2 para mayor claridad
- Botón de audio visible y accesible en cada flashcard
- Icono 🔊 para identificación visual rápida

### 5. **Generación Limitada**
- Solo 3 frases iniciales (optimizado para reducir costes de imágenes)
- Botón "Generate 3 More" para obtener más frases
- Cada nueva generación incluye sus imágenes correspondientes

## 📁 Archivos Modificados

### Backend

#### `backend/index.js`
- **Líneas 147-159**: Modificado el prompt para generar exactamente 3 frases
- **Líneas 342-406**: Nuevo endpoint `/api/generate-image` para DALL-E
  - Recibe: `{ prompt, phrase }`
  - Retorna: `{ imageBase64, phrase }`
  - Modelo: DALL-E 3
  - Tamaño: 1024x1024
  - Formato: base64

### Frontend

#### `frontend/services/imageService.ts` (NUEVO)
Servicio para generación de imágenes:
- `generateImageForPhrase(phrase)`: Genera una imagen para una frase
- `generateImagesForPhrases(phrases)`: Genera múltiples imágenes en paralelo
- Prompt optimizado para imágenes AAC child-friendly
- Manejo de errores con placeholders

#### `frontend/screens/PhraseSelectionScreen.tsx`
Completamente rediseñado:
- **FlatList horizontal** con paginación para el carrusel
- **Estado de carga** para imágenes individuales
- **Modo selección** que amplía la flashcard y bloquea scroll
- **useEffect** para cargar imágenes al montar el componente
- **Callbacks optimizados** con useCallback y useMemo
- **Dimensiones responsivas** usando Dimensions API

#### `frontend/screens/PhraseSelectionScreen.styles.ts`
Estilos completamente nuevos:
- `flashcardContainer`: Contenedor de pantalla completa
- `flashcard`: Card con sombras y bordes redondeados
- `imageContainer`: 60% de altura para la imagen
- `phraseTextContainer`: Área para el texto de la frase
- `audioButton`: Botón destacado para reproducir audio
- `selectButton`: Botón para modo selección
- `pageIndicator`: Indicador de posición en el carrusel
- Estilos para vista seleccionada (más grande)

## ⚙️ Configuración Requerida

### 1. Backend - OpenAI API Key

Edita `backend/.env` y agrega tu API key de OpenAI:

```env
OPENAI_API_KEY=sk-tu-clave-aqui
```

**Cómo obtener la API Key:**
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva clave o copia una existente
3. Pégala en el archivo `.env`

**Nota sobre costes:**
- DALL-E 3 (1024x1024): ~$0.04 por imagen
- 3 frases iniciales = ~$0.12 por sesión
- Genera solo las frases necesarias para optimizar costes

### 2. Instalación de Dependencias

El backend ya tiene `openai` instalado. Si no está, instálalo:

```bash
cd backend
npm install openai
```

## 🚀 Cómo Usar

### 1. Iniciar el Backend
```bash
cd backend
npm start
```

### 2. Iniciar el Frontend
```bash
cd frontend
npm start
```

### 3. Flujo de Uso
1. En PCS Screen, selecciona palabras
2. Presiona "Generate Phrases"
3. Espera mientras se generan 3 frases con sus imágenes
4. Desliza horizontalmente para ver cada flashcard
5. Toca el botón 🔊 para escuchar la frase
6. Presiona "Select Phrase" para enfocarte en una frase
7. Presiona "Generate 3 More" para más opciones

## 🎨 Diseño Visual

### Estructura de una Flashcard
```
┌─────────────────────────┐
│                         │
│      [IMAGEN IA]        │  60% altura
│                         │
├─────────────────────────┤
│   "I want to play"      │  Texto grande
├─────────────────────────┤
│   🔊 Play Audio         │  Botón audio
├─────────────────────────┤
│   Select Phrase         │  Botón selección
└─────────────────────────┘
       1 / 3               ← Indicador
```

### Colores y Estilos
- **Fondo flashcard**: Blanco con sombras elegantes
- **Texto**: Color primario del tema
- **Botón audio**: Color primario con texto blanco
- **Botón selección**: Color accent con texto blanco
- **Bordes**: Redondeados (20px)
- **Sombras**: Profundas para efecto de elevación

## 🐛 Manejo de Errores

### Error en Generación de Imagen
- Se muestra un placeholder con emoji 🖼️
- La frase sigue siendo funcional
- Se registra el error en consola

### Error de API Key
```json
{
  "error": "OpenAI API Key no configurada",
  "message": "Configura OPENAI_API_KEY en backend/.env"
}
```

### Error de Conexión
- Alert al usuario con mensaje descriptivo
- Las frases sin imágenes usan placeholder
- No bloquea la funcionalidad de audio

## 📱 Optimizaciones

### Performance
- **Carga paralela**: Imágenes se generan en paralelo con `Promise.all`
- **Estado de carga individual**: Cada imagen tiene su propio loading state
- **FlatList optimizado**: Con `getItemLayout` para mejor scroll
- **Memoización**: Componentes y callbacks memoizados

### UX
- **Feedback visual**: Spinners durante carga de imágenes
- **Paginación suave**: Snap automático a cada flashcard
- **Bloqueo de scroll**: Cuando se selecciona una frase
- **Navegación clara**: Indicadores y botones descriptivos

## 🔄 Próximas Mejoras (Opcionales)

- [ ] Cache de imágenes generadas
- [ ] Animaciones de transición entre flashcards
- [ ] Opción de guardar frases favoritas
- [ ] Compartir flashcards
- [ ] Modo offline con imágenes pre-generadas
- [ ] Personalización de estilos de imagen

## 📝 Notas Técnicas

### Por qué DALL-E 3
- Mejor calidad de imagen para contextos educativos
- Mejor comprensión de prompts en inglés
- Imágenes más child-friendly y apropiadas
- Mayor consistencia en el estilo

### Por qué FlatList en vez de Carousel Library
- Nativo de React Native (sin dependencias extra)
- Mejor performance y menor tamaño del bundle
- Mayor control sobre el comportamiento
- Más fácil de mantener y personalizar

### Estructura de Datos
```typescript
interface PhraseWithImage {
  phrase: string;      // Texto de la frase
  imageUrl: string;    // URL base64 de la imagen
  isLoading: boolean;  // Estado de carga
}
```

## ✅ Checklist de Implementación

- [x] Modificar backend para generar 3 frases
- [x] Crear endpoint de generación de imágenes
- [x] Crear servicio de imágenes en frontend
- [x] Rediseñar PhraseSelectionScreen con flashcards
- [x] Implementar carrusel con FlatList
- [x] Crear estilos para flashcards
- [x] Ajustar volumen del audio
- [x] Implementar modo selección
- [x] Agregar indicadores de carga
- [x] Documentar configuración

---

**Autor**: AI Assistant  
**Fecha**: Noviembre 2025  
**Versión**: 1.0

