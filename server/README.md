# Backend Proxy para AAC App

Este servidor actúa como proxy entre la app React Native y la API de Gemini, evitando problemas de CORS.

## 🚀 Instalación

1. Instala las dependencias:
```bash
cd server
npm install
```

## ⚙️ Configuración

1. Copia `.env` y configura tu API key de Gemini:
```bash
# El archivo .env ya debería existir con la configuración
# Si no, crea uno con:
GEMINI_API_KEY=tu_api_key_aqui
PORT=3000
```

## ▶️ Ejecución

Inicia el servidor:
```bash
npm start
```

O en modo desarrollo con auto-reload:
```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

## 📡 Endpoints

- `POST /api/generate-phrases` - Genera frases a partir de palabras
- `POST /api/generate-more-phrases` - Genera más frases sin repetir
- `GET /api/health` - Verifica el estado del servidor

## 🔧 Configuración para Emuladores

### Android Emulator
El frontend debe usar: `http://10.0.2.2:3000` (10.0.2.2 es el alias de localhost en Android)

### iOS Simulator
El frontend debe usar: `http://localhost:3000`

### Web Browser
El frontend debe usar: `http://localhost:3000`

### Dispositivo Físico
El frontend debe usar: `http://TU_IP_LOCAL:3000` (ej: `http://192.168.1.100:3000`)

Para encontrar tu IP local:
- Windows: `ipconfig` (busca IPv4)
- Mac/Linux: `ifconfig` o `ip addr`