# Technical Documentation - AAC App

## System Overview

The AAC (Augmentative and Alternative Communication) app is a React Native/Expo application designed to help children with special needs communicate using PCS (Picture Communication Symbols) and AI-powered language generation.

## Architecture

### Frontend Architecture

**Technology Stack:**
- React Native with Expo SDK 54
- TypeScript for type safety
- React Navigation for screen navigation
- React Context API for state management
- Expo Speech for text-to-speech

**Key Components:**
- `App.tsx`: Root component with navigation setup
- `screens/`: Screen components (WelcomeScreen, PCSScreen, PhraseSelectionScreen, etc.)
- `components/`: Reusable UI components
- `services/`: API service layer
- `context/`: React context providers (ThemeContext)
- `types/`: TypeScript type definitions
- `api.ts`: Centralized API client

**Screen Flow:**
1. WelcomeScreen → Initial greeting
2. PCSScreen → PCS symbol selection
3. PhraseSelectionScreen → Generated phrases display
4. ParentMenuScreen → Parent/caregiver interface
5. SettingsScreen → App configuration

### Backend Architecture

**Technology Stack:**
- Node.js (v18+)
- Express.js framework
- CORS middleware for cross-origin requests
- dotenv for environment configuration

**Key Files:**
- `backend/index.js`: Main server file with all routes
- `backend/services/`: Service modules (arasaacService.ts, geminiService.ts, openaiService.ts)
- `backend/utils/`: Utility functions (avatarGenerator.js)

**API Endpoints:**

**Gemini AI:**
- `POST /api/generate-phrases`: Generate natural phrases from selected words
- `POST /api/generate-more-phrases`: Generate additional phrases without repetition

**OpenAI:**
- `POST /api/openai/generate-phrases`: OpenAI phrase generation
- `POST /api/openai/generate-more-phrases`: Generate more phrases with OpenAI
- `POST /api/openai/text-to-pcs`: Convert text to PCS symbol sequence
- `POST /api/openai/pcs-to-text`: Convert PCS symbols to natural text

**ARASAAC:**
- `GET /api/arasaac/search/:language/:searchTerm`: Search pictograms
- `GET /api/arasaac/pictogram/:language/:idPictogram`: Get pictogram details
- `GET /api/arasaac/image/:idPictogram`: Get pictogram image (proxy)
- `POST /api/arasaac/search-multiple`: Search multiple pictograms

**System:**
- `GET /api/health`: Health check endpoint
- `POST /api/avatar`: Generate user avatar

## Data Flow

### PCS to Natural Language Flow

1. User selects PCS symbols on PCSScreen
2. Selected words are sent to backend: `POST /api/generate-phrases`
3. Backend calls Gemini/OpenAI API with prompt
4. AI generates natural language phrases
5. Phrases returned to frontend
6. User can select phrase to hear via text-to-speech

### Text to PCS Flow

1. Caregiver enters text in ParentMenuScreen
2. Text sent to backend: `POST /api/openai/text-to-pcs`
3. Backend uses OpenAI to extract key words
4. Backend searches ARASAAC for matching pictograms
5. PCS symbol sequence returned to frontend
6. Symbols displayed in grid format

## AI Integration

### Google Gemini

**Models Used:**
- `gemini-1.5-flash`: Fast, cost-effective (default)
- `gemini-1.5-pro`: More powerful for complex tasks

**Configuration:**
- API key stored in `backend/.env` as `GEMINI_API_KEY`
- Fallback mechanism: tries flash first, then pro if flash fails

**Prompts:**
- Phrase generation: Creates child-friendly, natural phrases from word lists
- Guidelines: Short, grammatically correct, natural-sounding

### OpenAI

**Models Used:**
- `gpt-4o-mini`: Cost-effective (default)
- `gpt-4o`: More powerful but expensive

**Configuration:**
- API key stored in `backend/.env` as `OPENAI_API_KEY`
- Optional: Can be used as alternative to Gemini

**Use Cases:**
- Text-to-PCS conversion
- PCS-to-text conversion
- Alternative phrase generation

### Azure OpenAI

**Configuration:**
- Endpoint URL stored in `backend/.env` as `AZURE_OPENAI_URL`
- API key stored in `backend/.env` as `AZURE_OPENAI_KEY`
- Deployment name stored in `backend/.env` as `AZURE_OPENAI_DEPLOYMENT` (default: `gpt-4o-mini`)
- API version: `2023-03-15-preview` (configurable via `AZURE_OPENAI_API_VERSION`)

**Use Cases:**
- Alternative phrase generation
- Enterprise-grade AI with Azure infrastructure

**Endpoints:**
- `POST /api/azure/generate-phrases`: Generate phrases with Azure OpenAI
- `POST /api/azure/generate-more-phrases`: Generate more phrases

## ARASAAC Integration

**API Base URL:** `https://api.arasaac.org/api`

**Supported Languages:**
- `es`: Spanish
- `en`: English
- `fr`: French
- `it`: Italian
- `pt`: Portuguese
- `de`: German
- `ca`: Catalan

**Image Customization:**
- `color`: Boolean - Color version
- `backgroundColor`: String - Background color
- `plural`: Boolean - Plural form
- `skin`: String - Skin color variation
- `hair`: String - Hair color variation
- `action`: String - Action variation

**Implementation:**
- All ARASAAC requests go through backend proxy to avoid CORS
- Pictogram IDs are used for consistent references
- Search results cached when possible

## Type Definitions

### Frontend Types

```typescript
// Navigation types
interface RootStackParamList {
  Welcome: undefined;
  PCS: undefined;
  PhraseSelection: { words: string[] };
  ParentMenu: undefined;
  Settings: undefined;
}

// Pictogram types
interface Pictogram {
  id: number;
  word: string;
  imageUrl: string;
}

// Phrase types
interface Phrase {
  text: string;
  words: string[];
}
```

### Backend Types

```typescript
// ARASAAC types
interface ArasaacPictogram {
  _id: number;
  keywords: Array<{ keyword: string; hasLocution: boolean }>;
  synsets?: string[];
  categories?: string[];
  // ... other fields
}

// API Request/Response types
interface GeneratePhrasesRequest {
  words: string[];
  model?: string;
}

interface GeneratePhrasesResponse {
  phrases: string[];
}
```

## Environment Configuration

### Backend (.env)

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional
PORT=3000
```

### Frontend (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Platform-specific URLs:**
- Web/iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`
- Physical Device: `http://YOUR_LOCAL_IP:3000`

## Error Handling

### Frontend Error Handling

- Network errors: Show user-friendly messages
- API errors: Display error details when available
- Loading states: Show loading indicators during API calls
- Retry mechanisms: Allow users to retry failed operations

### Backend Error Handling

- API key validation: Check keys before making requests
- Error responses: Consistent error format
- Fallback models: Try alternative models on failure
- Logging: Console logs for debugging

## Performance Considerations

1. **Image Loading:**
   - Cache pictogram images when possible
   - Use appropriate image sizes
   - Lazy load images in grids

2. **API Calls:**
   - Batch requests when possible (search-multiple)
   - Implement request debouncing
   - Cache frequently used data

3. **React Native:**
   - Use FlatList for large lists
   - Optimize re-renders with React.memo
   - Use useCallback for event handlers

## Security Considerations

1. **API Keys:**
   - Never commit .env files
   - Use environment variables only
   - Rotate keys regularly

2. **CORS:**
   - Backend handles CORS for all external APIs
   - Frontend only calls backend, not external APIs directly

3. **Input Validation:**
   - Validate all user inputs
   - Sanitize text inputs
   - Check array lengths and types

## Testing Strategy

### Unit Tests
- Service functions
- Utility functions
- Component logic

### Integration Tests
- API endpoints
- Service integrations
- Navigation flows

### Manual Testing
- Test on different platforms (iOS, Android, Web)
- Test with different network conditions
- Test error scenarios

## Future Enhancements

1. **Firebase Integration:**
   - User profiles and authentication
   - Data persistence
   - Real-time synchronization

2. **On-device ML:**
   - TensorFlow.js for local inference
   - Next-word prediction
   - Offline capabilities

3. **Additional Input Methods:**
   - Voice input with Whisper
   - Image input with vision models
   - Gesture recognition

4. **Accessibility:**
   - Screen reader support
   - Voice commands
   - Customizable UI sizes

## Development Workflow

1. **Starting Development:**
   ```bash
   # Install dependencies
   npm run install:all
   
   # Start backend
   npm run server:dev
   
   # Start frontend (in another terminal)
   npm start
   ```

2. **Making Changes:**
   - Update docs/status.md with task progress
   - Follow TypeScript/JavaScript guidelines
   - Test on target platform
   - Update documentation if needed

3. **Code Review Checklist:**
   - TypeScript types are correct
   - Error handling is implemented
   - API responses are validated
   - UI is accessible
   - Code follows style guidelines

