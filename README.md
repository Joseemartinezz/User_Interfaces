# AAC App - Versión Móvil

Esta es la versión móvil de la aplicación AAC (Augmentative and Alternative Communication) que funciona directamente desde el dispositivo móvil sin necesidad de un servidor backend.

## Características

- ✅ Funciona directamente en dispositivos móviles (iOS y Android)
- ✅ No requiere servidor backend
- ✅ Sin problemas de CORS
- ✅ Llamadas directas a la API de Google Gemini desde el cliente
- ✅ Text-to-speech integrado

## Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar API Key de Gemini

Crea un archivo `.env` en la raíz del proyecto con tu API key de Gemini:

```
EXPO_PUBLIC_GEMINI_API_KEY=tu_api_key_aqui
```

Puedes obtener tu API key en: https://makersuite.google.com/app/apikey

## Ejecución

### Desarrollo

```bash
# Iniciar Expo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web
```

## Diferencias con la versión con servidor

- **No requiere servidor backend**: Todas las llamadas a Gemini se hacen directamente desde el cliente móvil
- **Sin problemas de CORS**: Al ejecutarse en móvil nativo, no hay restricciones CORS
- **Más simple**: No necesitas ejecutar un servidor separado
- **Menos archivos**: No incluye la carpeta `server/`

## Estructura del proyecto

```
AAC-mobile/
├── App.tsx                 # Componente principal
├── services/
│   └── geminiService.ts    # Servicio para llamar a Gemini directamente
├── assets/                 # Imágenes y recursos
├── package.json
├── tsconfig.json
├── babel.config.js
├── app.json
└── .env                    # Variables de entorno (no incluido en git)
```

## Notas

- Esta versión está optimizada para ejecutarse en dispositivos móviles nativos
- La API key de Gemini se almacena en el cliente (asegúrate de no exponerla públicamente en producción)
- Para producción, considera usar variables de entorno seguras o un servicio de gestión de secretos

