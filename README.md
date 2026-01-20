# 🗣️ WizzWords - Augmentative and Alternative Communication Platform

<div align="center">

**Augmentative and Alternative Communication (AAC) platform that helps children with special needs communicate through ARASAAC pictograms and AI-powered phrase generation.**

[Features](#-features) • [Installation](#-installation) • [API Configuration](#-api-configuration) • [Usage](#-usage) • [Architecture](#-architecture) • [Technologies](#-technologies)

</div>

---

## 📖 About the Project

**WizzWords** is a mobile application designed to facilitate communication for children with special needs through the use of ARASAAC pictograms (Augmentative and Alternative Communication system). The application uses artificial intelligence to generate natural phrases from selected symbols, enabling more fluid and effective communication.

### 🎯 Objectives

- **Translate** PCS symbols, text, speech, or images into natural language
- **Convert** caregiver speech or text into PCS symbol sequences
- **Adapt** to each child's communication profile and privacy constraints
- **Provide** an accessible and easy-to-use interface

---

## ✨ Features

### 🎨 User Interface
- ✅ **Accessible design** with large buttons and high readability
- ✅ **6 customizable color palettes** with WCAG AA contrast compliance
- ✅ **Dual mode**: Interface for children and menu for parents/caregivers
- ✅ **Custom notification system** (Toast)
- ✅ **Clear visual indicators** for all actions

### 🖼️ ARASAAC Pictograms
- ✅ **Complete integration** with ARASAAC library
- ✅ **Smart pictogram search** by categories
- ✅ **User-customizable categories**
- ✅ **Dynamic pictogram loading** with progress indicators
- ✅ **Multi-language support** (es, en, fr, it, pt, de, ca)

### 🤖 Artificial Intelligence
- ✅ **Natural phrase generation** using Google Gemini AI
- ✅ **Azure OpenAI support** as alternative
- ✅ **Bidirectional translation**: Symbols → Text and Text → Symbols
- ✅ **Multiple phrase variants** generation

### 🔊 Text-to-Speech
- ✅ **Voice playback** integrated with Expo Speech
- ✅ **Interactive flashcards** with audio indicator
- ✅ **Tap to play** generated phrases

### 👤 User Management
- ✅ **Firebase authentication**
- ✅ **Personalized user profiles**
- ✅ **User-scoped categories** (data isolation)
- ✅ **Onboarding system** for new users
- ✅ **Custom avatar generation**

### 🔒 Security and Accessibility
- ✅ **Protected parent mode** with password and 5-attempt lockout
- ✅ **Robust password validation**
- ✅ **Screen reader support**
- ✅ **High contrast themes** for better visibility

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Expo CLI** (installed automatically)
- **Google Gemini API Key** ([get it here](https://makersuite.google.com/app/apikey))
- **Firebase** (optional, for authentication and storage)

### Quick Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pablojhdcoder/wizzwords-aac-platform.git
   cd wizzwords-aac-platform
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   
   Create `frontend/.env` file:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   
   # Firebase Configuration
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
   
   Create `backend/.env` file:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key
   
   # Azure OpenAI (Primary) - Optional
   AZURE_OPENAI_PHRASE_URL=https://your-resource.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
   AZURE_OPENAI_PHRASE_KEY=your_azure_key
   AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-5-mini
   
   # Azure OpenAI Image Generation (DALL-E) - Optional
   AZURE_OPENAI_IMAGE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01
   AZURE_OPENAI_IMAGE_API_KEY=your_azure_image_key
   ```

4. **Start the backend server** (Terminal 1)
   ```bash
   npm run server
   # Or for development with auto-reload:
   npm run server:dev
   ```

5. **Start the application** (Terminal 2)
   ```bash
   npm start
   ```

### Platform Configuration

#### Android Emulator
- Set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` in `frontend/.env`

#### iOS Simulator
- ✅ Already configured for `http://localhost:3000`

#### Physical Device
- Set `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000` in `frontend/.env`
- Find your local IP:
  - **Windows**: `ipconfig` → look for "IPv4"
  - **Mac/Linux**: `ifconfig` or `ip addr`

---

## 🔧 API Configuration

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in and create a new API key
3. Add to `backend/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

**Available Models:**
- `gemini-1.5-flash`: Fast and cost-effective (default)
- `gemini-1.5-pro`: More powerful for complex tasks

### Azure OpenAI API (Optional)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure OpenAI resource
3. Go to "Keys and Endpoint" section
4. Copy the complete endpoint URL and API key

**Configuration:**
```env
# Phrase Generation
AZURE_OPENAI_PHRASE_URL=https://your-resource.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview
AZURE_OPENAI_PHRASE_KEY=your_key
AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-5-mini

# Image Generation (DALL-E)
AZURE_OPENAI_IMAGE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/openai/deployments/dall-e-3/images/generations?api-version=2024-02-01
AZURE_OPENAI_IMAGE_API_KEY=your_key
```

**Available Models:**
- `gpt-5-mini`: Cost-effective (default)
- `gpt-4o`: More powerful but expensive

### Verifying Configuration

After starting the backend, you'll see:
```
📡 API Keys configured:
   - Azure OpenAI (Primary): ✅ Yes (or ❌ No)
   - Gemini (Secondary/Fallback): ✅ Yes (or ❌ No)
```

---

## 🖼️ ARASAAC Integration

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/arasaac/search/:language/:searchTerm` | GET | Search pictograms |
| `/api/arasaac/pictogram/:language/:idPictogram` | GET | Get pictogram details |
| `/api/arasaac/image/:idPictogram` | GET | Get pictogram image |
| `/api/arasaac/search-multiple` | POST | Search multiple words |

### Image Customization Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `color` | Boolean | Color version |
| `backgroundColor` | String | Background color (e.g., "white") |
| `plural` | Boolean | Plural form |
| `skin` | String | Skin color variation |
| `hair` | String | Hair color variation |

**Example:**
```bash
curl "http://localhost:3000/api/arasaac/image/2?color=true&backgroundColor=white"
```

### Common Pictogram IDs

| Category | Word | ID |
|----------|------|----|
| **Pronouns** | I (yo) | 6632 |
| | You (tú) | 6625 |
| **Verbs** | Want (querer) | 5441 |
| | Like (gustar) | 37826 |
| | Play (jugar) | 23392 |
| **Food** | Pizza | 2527 |
| **Places** | School | 32446 |
| **Emotions** | Happy | 14325 |
| | Sad | 35066 |

### Using in React Native

```typescript
import { getPictogramImageUrl } from './services/arasaacService';

// Basic image
const url = getPictogramImageUrl(2);

// With customization
const url = getPictogramImageUrl(2, {
  color: true,
  backgroundColor: 'white',
  plural: false
});
```

---

## 📱 Usage

### Main Flow

1. **Pictogram Selection**
   - Navigate through categories (Food, Games, School, Family, etc.)
   - Select pictograms by tapping the symbols
   - Selected symbols appear in the top bar
   - Tap a selected symbol to remove it

2. **Phrase Generation**
   - Press "Generate Phrases" to create natural phrases
   - Phrases are generated using AI and displayed as flashcards
   - Tap a phrase to hear it with text-to-speech
   - Press "Generate More" to get variants

3. **Parent Menu**
   - Access the password-protected menu
   - Manage custom categories
   - Configure user preferences
   - Edit profile and settings

### Advanced Features

- **Custom Categories**: Create and manage your own pictogram categories
- **Customizable Themes**: Choose from 6 accessible color palettes
- **User Profile**: Customize name, email, and preferences
- **Onboarding**: Initial guide for new users

---

## 🏛️ Architecture

```mermaid
graph TB
    subgraph "Frontend Layer - React Native/Expo"
        A[App.tsx] --> B[Navigation]
        B --> C[WelcomeScreen]
        B --> D[PCSScreen]
        B --> E[PhraseSelectionScreen]
        B --> F[ParentMenuScreen]
        B --> G[ColorSettingsScreen]
        
        D --> H[Pictogram Grid]
        E --> J[Phrase List]
        E --> K[Text-to-Speech]
        
        L[ThemeContext] --> A
        M[API Client] --> N[Services]
    end
    
    subgraph "API Gateway - Express.js"
        O[Express Server] --> P[CORS Middleware]
        O --> Q[Route Handlers]
        
        Q --> R[/api/generate-phrases]
        Q --> S[/api/arasaac/*]
        Q --> V[/api/health]
    end
    
    subgraph "Services Layer"
        X[Gemini Service] --> Y[Google Gemini API]
        Z[Azure Service] --> AA[Azure OpenAI API]
        AB[ARASAAC Service] --> AC[ARASAAC API]
    end
    
    subgraph "Data Layer"
        AF[Firebase Firestore] --> AG[User Profiles]
        AK[Firebase Auth] --> AL[Authentication]
    end
    
    N --> O
```

### Project Structure

```
wizzwords-aac-platform/
├── frontend/                 # React Native/Expo application
│   ├── screens/              # Application screens
│   ├── components/           # Reusable components
│   ├── services/             # Services (Firebase, API, etc.)
│   ├── context/              # Context providers (Theme, User, Toast)
│   ├── types/                # TypeScript definitions
│   └── assets/               # Images and resources
│
├── backend/                  # Node.js/Express server
│   ├── services/             # Services (ARASAAC, Gemini, Azure, etc.)
│   ├── data/                 # Data and categories
│   └── index.js              # Main server
│
├── docs/                     # Documentation
│   └── images/               # Documentation images
│
└── README.md                 # This file
```

---

## 🛠️ Technologies

### Frontend
- **React Native** with Expo SDK 54
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Firebase** for authentication and storage
- **Expo Speech** for text-to-speech
- **React Context API** for state management

### Backend
- **Node.js** (v18+)
- **Express.js** framework
- **TypeScript** for services
- **CORS** middleware

### AI Services
- **Google Gemini AI** (Gemini 1.5 Flash/Pro)
- **Azure OpenAI** (GPT-5-mini as alternative)
- **Azure OpenAI DALL-E 3** for image generation
- **ARASAAC API** for pictograms

### Storage
- **Firebase Firestore** for user data
- **Firebase Storage** for files
- **AsyncStorage** for local data

---

## 🧪 Development

### Available Scripts

```bash
# Installation
npm run install:all          # Install all dependencies
npm run frontend:install     # Install frontend only
npm run backend:install      # Install backend only

# Development
npm start                    # Start frontend (Expo)
npm run frontend:start       # Start frontend specifically
npm run frontend:android     # Start on Android
npm run frontend:ios         # Start on iOS

# Backend
npm run server               # Start backend server
npm run server:dev           # Start with auto-reload
```

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/generate-phrases` | POST | Generate phrases (Azure primary, Gemini fallback) |
| `/api/generate-more-phrases` | POST | Generate additional phrases |
| `/api/azure/generate-phrases` | POST | Direct Azure OpenAI call |
| `/api/generate-image` | POST | Generate image with DALL-E |
| `/api/arasaac/search/:lang/:term` | GET | Search pictograms |
| `/api/arasaac/image/:id` | GET | Get pictogram image |
| `/api/categories` | GET/POST | Manage categories |
| `/api/avatar` | POST | Generate user avatar |

### Troubleshooting

**"API Key not configured"**
- Verify the key is in the correct `.env` file
- Restart the server after adding the key

**"Cannot connect to backend"**
- Verify backend server is running
- Check `EXPO_PUBLIC_API_URL` matches your platform

**"CORS Error"**
- Always use backend proxy endpoints for ARASAAC
- Never call external APIs directly from frontend

**Android connection issues**
- Use `http://10.0.2.2:3000` instead of `localhost`

---

## 🤝 Contributing

This is an academic project developed for **Advanced User Interfaces** at **Politecnico di Milano (Polimi)**.

If you want to contribute:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is an academic prototype developed for the **Advanced User Interfaces** course at:

<div align="center">

![Politecnico di Milano](./assets/PolimiLogo.png)

**Politecnico di Milano (Polimi)**

</div>

---

## 👥 Authors

Developed as part of the Advanced User Interfaces academic project.

---

## 🙏 Acknowledgments

- **ARASAAC** for providing the open-source pictogram library
- **Google Gemini** for the AI API
- **Azure OpenAI** for the enterprise AI services
- **Expo** for the React Native framework
- **Firebase** for backend services
