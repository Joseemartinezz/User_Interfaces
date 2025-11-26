# AAC App - Comunicación Aumentativa y Alternativa

Aplicación de comunicación aumentativa usando React Native y Expo para ayudar a niños con necesidades especiales a comunicarse mediante símbolos PCS.

## 📁 Estructura del Proyecto

El proyecto está organizado en dos partes principales:

```
AAC/
├── frontend/          # Aplicación React Native/Expo
│   ├── App.tsx
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── screens/
│   ├── services/
│   ├── types/
│   └── package.json
├── backend/           # Servidor Node.js/Express
│   ├── index.js
│   ├── package.json
│   └── ...
└── package.json       # Scripts principales del proyecto
```

## 🚀 Primeros Pasos

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- API Key de Google Gemini (obtén una en [Google AI Studio](https://makersuite.google.com/app/apikey))

### Instalación

**Opción 1: Instalar todo de una vez**
```bash
npm run install:all
```

**Opción 2: Instalar por separado**

1. Instala las dependencias del frontend:
```bash
cd frontend
npm install
cd ..
```

2. Instala las dependencias del backend:
```bash
cd backend
npm install
cd ..
```

3. Configura tu API Key de Gemini:
   - El archivo `.env` en la raíz ya tiene tu API key configurada
   - El archivo `backend/.env` también tiene la misma clave
   - **IMPORTANTE**: La API key está en `.env` que está en `.gitignore` (no se subirá al repositorio)

### ⚡ Inicio Rápido

**Paso 1: Inicia el servidor backend** (en una terminal):
```bash
npm run server
# O para desarrollo con auto-reload:
npm run server:dev
```

El servidor se ejecutará en `http://localhost:3000`

**Paso 2: Inicia la app React Native** (en otra terminal):
```bash
npm start
```

**Paso 3: Configura la URL del backend según tu plataforma:**

- **Web/Navegador**: Ya está configurado para `http://localhost:3000` ✅
- **Android Emulator**: Edita `frontend/services/geminiService.ts` línea 6 y cambia a `http://10.0.2.2:3000`
- **iOS Simulator**: Ya está configurado para `http://localhost:3000` ✅
- **Dispositivo Físico**: Cambia a `http://TU_IP_LOCAL:3000` (ej: `http://192.168.1.100:3000`)

### Ejecución

**Desde la raíz del proyecto:**

Para iniciar la app en modo desarrollo:
```bash
npm start
# o específicamente:
npm run frontend:start
```

Para iniciar el backend:
```bash
npm run server
# o para desarrollo con auto-reload:
npm run server:dev
```

**Desde las carpetas individuales:**

Frontend:
```bash
cd frontend
npm start
```

Backend:
```bash
cd backend
npm start
```

Esto abrirá Expo Dev Tools. Desde ahí puedes:
- Presionar `w` para abrir en el navegador web
- Escanear el código QR con la app Expo Go en tu móvil (Android/iOS)
- Presionar `a` para abrir en emulador Android (si tienes Android Studio)
- Presionar `i` para abrir en simulador iOS (solo en Mac con Xcode)

### Opción más rápida: Web

```bash
npm run frontend:web
```

## ✨ Características Implementadas

✅ **Interfaz Básica** (Punto 1 del Roadmap)
- Pantalla principal con grilla de símbolos grandes para selección PCS
- Campo de entrada de texto para cuidadores
- Área de visualización mostrando la salida traducida
- Navegación simple y clara

✅ **Integración con Gemini AI** (Basado en prototype.py)
- Selección de palabras mediante símbolos
- Generación de frases naturales usando Gemini 2.0 Flash
- Text-to-Speech para reproducir las frases generadas
- Generación de más frases sin repetir las existentes

### Componentes Principales

1. **Selección de Palabras**: 9 palabras básicas (I, You, Not, Like, Want, Play, Football, Pizza, School) con imágenes placeholder
2. **Generación de Frases**: Usa Gemini AI para crear frases naturales y gramaticalmente correctas
3. **Reproducción de Voz**: Text-to-speech integrado con expo-speech
4. **Interfaz Dual**: Dos pantallas - selección de palabras y selección de frases

## 🎯 Próximos Pasos

- [ ] Integración con pictogramas ARASAAC reales
- [ ] Backend con Node.js y Firebase
- [ ] Entrada de voz con Whisper
- [ ] Procesamiento de imágenes
- [ ] Perfiles de usuario personalizados

## 🛠️ Tecnologías

- **React Native** con Expo SDK 54
- **TypeScript**
- **Google Gemini AI** (@google/generative-ai)
- **Expo Speech** para text-to-speech
- Diseño con componentes nativos para máximo rendimiento

## 📱 Uso de la App

### Flujo Principal:

1. **Selección de Palabras**:
   - Toca los símbolos para seleccionar palabras
   - Las palabras seleccionadas aparecen en la parte superior
   - Presiona "Generar Frases" para crear frases naturales

2. **Selección de Frases**:
   - Se muestran las frases generadas por Gemini
   - Toca una frase para reproducirla con text-to-speech
   - Presiona "Generar Más Frases" para obtener alternativas

3. **Navegación**:
   - Usa "Volver" para regresar a la selección de palabras
   - Usa "Limpiar" para resetear todo

## ⚙️ Configuración

### API Key de Gemini

La API key ya está configurada en:
- `.env` (raíz del proyecto) - para el frontend
- `backend/.env` - para el backend

Si necesitas cambiarla, edita ambos archivos.

### URL del Backend

Por defecto, la app está configurada para usar `http://localhost:3000`. 

**Para cambiar la URL del backend según tu plataforma:**

Edita `frontend/services/geminiService.ts` línea 6:

```typescript
// Para Android Emulator:
const API_BASE_URL = 'http://10.0.2.2:3000';

// Para iOS Simulator o Web:
const API_BASE_URL = 'http://localhost:3000';

// Para dispositivo físico (reemplaza con tu IP local):
const API_BASE_URL = 'http://192.168.1.100:3000';
```

**Para encontrar tu IP local:**
- Windows: Ejecuta `ipconfig` y busca "IPv4"
- Mac/Linux: Ejecuta `ifconfig` o `ip addr`

## 📄 Licencia

Este proyecto es un prototipo académico para Advanced User Interfaces - Polimi.
