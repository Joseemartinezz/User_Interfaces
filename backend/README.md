# Backend Proxy for AAC App

This server acts as a proxy between the React Native app and the Azure OpenAI API, avoiding CORS issues.

## 🚀 Installation

1. Install dependencies:
```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copy `.env` and configure your Azure OpenAI API:
```bash
# The .env file should already exist with the configuration
# If not, create one with:
PORT=3000

# Azure OpenAI (Required for AI features)
AZURE_OPENAI_PHRASE_URL=https://your-resource.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
AZURE_OPENAI_PHRASE_KEY=your_azure_key
AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-5-mini
```

## ▶️ Execution

Start the server:
```bash
npm start
```

Or in development mode with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## 📡 Endpoints

### Azure OpenAI
- `POST /api/generate-phrases` - Generate phrases from words
- `POST /api/generate-more-phrases` - Generate more phrases without repeating

### ARASAAC (Pictograms)
- `GET /api/arasaac/search/:language/:searchTerm` - Search pictograms by term
- `GET /api/arasaac/pictogram/:language/:idPictogram` - Get a pictogram by ID
- `POST /api/arasaac/search-multiple` - Search pictograms for multiple words

### System
- `GET /api/health` - Check server status
- `GET /` - Server information and list of endpoints

## 🔧 Configuration for Emulators

### Android Emulator
The frontend should use: `http://10.0.2.2:3000` (10.0.2.2 is the alias for localhost on Android)

### iOS Simulator
The frontend should use: `http://localhost:3000`

### Web Browser
The frontend should use: `http://localhost:3000`

### Physical Device
The frontend should use: `http://YOUR_LOCAL_IP:3000` (e.g., `http://192.168.1.100:3000`)

To find your local IP:
- Windows: `ipconfig` (look for IPv4)
- Mac/Linux: `ifconfig` or `ip addr`

## 📖 Usage Examples

### Search pictograms

```bash
# Search pictograms for "casa" in Spanish
curl http://localhost:3000/api/arasaac/search/es/casa

# Search pictograms for "house" in English
curl http://localhost:3000/api/arasaac/search/en/house
```

### Get a specific pictogram

```bash
# Get pictogram with ID 2 in Spanish
curl http://localhost:3000/api/arasaac/pictogram/es/2
```

### Search multiple words

```bash
curl -X POST http://localhost:3000/api/arasaac/search-multiple \
  -H "Content-Type: application/json" \
  -d '{"words": ["casa", "perro", "comer"], "language": "es"}'
```

### Generate phrases with Azure OpenAI

```bash
curl -X POST http://localhost:3000/api/generate-phrases \
  -H "Content-Type: application/json" \
  -d '{"words": ["I", "want", "pizza"]}'
```

## 📚 Additional Documentation

- See `services/ARASAAC_README.md` for more information about the ARASAAC service
- Official ARASAAC API documentation: https://arasaac.org/developers/api
