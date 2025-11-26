# Configuración de OpenAI API

Esta guía te ayudará a configurar y usar la API de OpenAI (GPT-4o / GPT-4o-mini) en tu aplicación AAC.

## 🚀 Configuración Rápida

### 1. Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Crea una nueva API key
4. Copia la clave (empieza con `sk-`)

### 2. Configurar la API Key

**En el backend (`server/.env`):**
```env
OPENAI_API_KEY=sk-tu_clave_aqui
```

**En el frontend (`.env`):**
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-tu_clave_aqui
```

### 3. Reiniciar el servidor

Después de agregar la clave, reinicia el servidor:
```bash
npm run server
```

El servidor mostrará si la API key está configurada correctamente:
```
📡 API Keys configuradas:
   - Gemini: ✅ Sí
   - OpenAI: ✅ Sí
```

## 📝 Endpoints Disponibles

### 1. Generar Frases
```typescript
POST /api/openai/generate-phrases
Body: {
  words: string[],
  model?: string // Opcional, por defecto: 'gpt-4o-mini'
}
```

### 2. Generar Más Frases
```typescript
POST /api/openai/generate-more-phrases
Body: {
  words: string[],
  existingPhrases: string[],
  model?: string
}
```

### 3. Convertir Texto a PCS Symbols
```typescript
POST /api/openai/text-to-pcs
Body: {
  text: string,
  model?: string
}
```

### 4. Convertir PCS Symbols a Texto
```typescript
POST /api/openai/pcs-to-text
Body: {
  symbols: string[],
  model?: string
}
```

## 🎨 Probar Prompts en OpenAI Playground

Puedes probar y refinar tus prompts en [OpenAI Playground](https://platform.openai.com/playground) antes de implementarlos en el código.

### Ejemplo: Generar Frases

**System Message:**
```
You are a helpful assistant that creates natural, child-friendly phrases for AAC communication devices.
```

**User Message:**
```
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
Your task is to create simple, natural, child-friendly spoken phrases that include the following words:
I, want, play, football

Guidelines:
- The phrases must be short but contain ALL information provided.
- They should sound natural when spoken aloud.
- They must be grammatically correct and easy for a child.
- If one phrase is enough, return one.
- If more than one makes sense, return multiple (up to 5).
- Return one phrase per line, numbered starting from 1.
```

**Configuración recomendada:**
- Model: `gpt-4o-mini` (más económico) o `gpt-4o` (más potente)
- Temperature: `0.7`
- Max tokens: `200`

### Ejemplo: Texto a PCS

**System Message:**
```
You are a helpful assistant that converts natural language text into PCS symbol sequences for AAC devices.
```

**User Message:**
```
You are helping a child who uses an Augmentative and Alternative Communication (AAC) device.
A caregiver wrote this text: "I want to play football"

Your task is to break down this text into individual words that can be represented by PCS (Picture Communication Symbols).

Return ONLY a comma-separated list of the key words (nouns, verbs, important adjectives/adverbs).
Do not include articles (a, an, the), prepositions, or conjunctions unless they are essential.
Keep the words in their base form (e.g., "play" not "playing", "want" not "wanted").

Example:
Input: "I want to play football"
Output: I, want, play, football

Input: "Do you like pizza?"
Output: you, like, pizza

Now process this text: "I want to play football"
```

**Configuración recomendada:**
- Model: `gpt-4o-mini`
- Temperature: `0.3` (más determinista)
- Max tokens: `100`

## 💻 Uso en el Código

### Frontend (React Native)

```typescript
import { generatePhrases, textToPCSSequence, pcsSequenceToText } from './services/openaiService';

// Generar frases
const phrases = await generatePhrases(['I', 'want', 'play', 'football'], 'gpt-4o-mini');

// Convertir texto a PCS
const symbols = await textToPCSSequence('I want to play football');

// Convertir PCS a texto
const text = await pcsSequenceToText(['I', 'want', 'play', 'football']);
```

### Cambiar el Modelo

Puedes cambiar el modelo en cada llamada:

```typescript
// Usar GPT-4o (más potente pero más caro)
const phrases = await generatePhrases(words, 'gpt-4o');

// Usar GPT-4o-mini (más económico)
const phrases = await generatePhrases(words, 'gpt-4o-mini');
```

## 🔧 Personalizar Prompts

Los prompts están definidos en `server/index.js`. Puedes modificarlos directamente o:

1. **Probar en OpenAI Playground** primero
2. **Copiar el prompt que funciona mejor**
3. **Pegarlo en el código** en el endpoint correspondiente

### Ubicación de los Prompts

- **Generar frases**: Línea ~329 en `server/index.js`
- **Generar más frases**: Línea ~414 en `server/index.js`
- **Texto a PCS**: Línea ~501 en `server/index.js`
- **PCS a texto**: Línea ~590 en `server/index.js`

## 📊 Modelos Disponibles

| Modelo | Descripción | Uso Recomendado |
|--------|-------------|-----------------|
| `gpt-4o` | Modelo más potente, multimodal | Cuando necesitas mejor calidad |
| `gpt-4o-mini` | Modelo más económico y rápido | Uso general (recomendado) |
| `gpt-4-turbo` | Versión anterior | Si tienes acceso |
| `gpt-3.5-turbo` | Modelo más antiguo | No recomendado para este proyecto |

## ⚠️ Notas Importantes

1. **Costos**: GPT-4o es más caro que GPT-4o-mini. Usa `gpt-4o-mini` para desarrollo.
2. **Rate Limits**: OpenAI tiene límites de uso. Verifica tu plan en [OpenAI Dashboard](https://platform.openai.com/usage).
3. **API Key Security**: Nunca subas tu API key a Git. Los archivos `.env` están en `.gitignore`.

## 🐛 Troubleshooting

### Error: "API Key de OpenAI inválida"
- Verifica que la clave empiece con `sk-`
- Asegúrate de haberla agregado en `server/.env`
- Reinicia el servidor después de agregar la clave

### Error: "Se ha excedido la cuota"
- Verifica tu plan en [OpenAI Dashboard](https://platform.openai.com/usage)
- Considera usar `gpt-4o-mini` en lugar de `gpt-4o`

### Error: "El modelo no está disponible"
- Verifica que el nombre del modelo sea correcto
- Algunos modelos requieren acceso especial (contacta a OpenAI)

## 📚 Recursos

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Playground](https://platform.openai.com/playground)
- [OpenAI Pricing](https://openai.com/pricing)

