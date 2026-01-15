# 🗣️ WizzWords - Augmentative and Alternative Communication Platform

<div align="center">

**Augmentative and Alternative Communication (AAC) platform that helps children with special needs communicate through ARASAAC pictograms and AI-powered phrase generation.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Technologies](#-technologies)

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
   
   Create `.env` file in the root:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
   
   Create `backend/.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   AZURE_OPENAI_API_KEY=your_azure_key_optional
   AZURE_OPENAI_URL=your_azure_url_optional
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
- Edit `frontend/api.ts` and change `API_BASE_URL` to `http://10.0.2.2:3000`

#### iOS Simulator
- ✅ Already configured for `http://localhost:3000`

#### Physical Device
- Change `API_BASE_URL` in `frontend/api.ts` to `http://YOUR_LOCAL_IP:3000`
- Find your local IP:
  - **Windows**: `ipconfig` → look for "IPv4"
  - **Mac/Linux**: `ifconfig` or `ip addr`

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

## 🏗️ Project Structure

```
wizzwords-aac-platform/
├── frontend/                 # React Native/Expo application
│   ├── screens/              # Application screens
│   ├── components/           # Reusable components
│   ├── services/            # Services (Firebase, API, etc.)
│   ├── context/             # Context providers (Theme, User, Toast)
│   ├── types/               # TypeScript definitions
│   └── assets/             # Images and resources
│
├── backend/                 # Node.js/Express server
│   ├── services/            # Services (ARASAAC, Gemini, Azure, etc.)
│   ├── data/               # Data and categories
│   ├── utils/              # Utilities
│   └── index.js            # Main server
│
├── docs/                    # Complete documentation
│   ├── configuration/      # Configuration guides
│   ├── development/        # Development documentation
│   └── technical.md        # Technical documentation
│
└── README.md                # This file
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
- **Azure OpenAI** (GPT-4o-mini as alternative)
- **ARASAAC API** for pictograms

### Storage
- **Firebase Firestore** for user data
- **Firebase Storage** for files
- **AsyncStorage** for local data

---

## 📚 Documentation

Complete documentation is available in the [`docs/`](./docs/) folder:

- **[Configuration Guide](./docs/configuration/)** - API and service configuration
- **[Technical Documentation](./docs/technical.md)** - Architecture and technical details
- **[Project Brief](./docs/project-brief.md)** - Project overview
- **[Project Status](./docs/status.md)** - Current status and roadmap

### Quick Guides

- [API Configuration](./docs/configuration/api-setup.md)
- [ARASAAC Configuration](./docs/configuration/arasaac-setup.md)
- [Environment Variables Configuration](./docs/configuration/env-config.md)
- [Firebase Configuration](./docs/configuration/platform-setup.md)

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

### Code Structure

- **Frontend**: TypeScript with functional components and hooks
- **Backend**: TypeScript with modular services
- **Styles**: React Native StyleSheet with dynamic themes
- **Navigation**: React Navigation with custom transitions

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

![Politecnico di Milano](./docs/images/PolimiLogo.png)

**Politecnico di Milano (Polimi)**

</div>

---

## 👥 Authors

Developed as part of the Advanced User Interfaces academic project.

---

## 🙏 Acknowledgments

- **ARASAAC** for providing the open-source pictogram library
- **Google Gemini** for the AI API
- **Expo** for the React Native framework
- **Firebase** for backend services
