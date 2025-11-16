# AAC App - Comunicación Aumentativa y Alternativa

Aplicación de comunicación aumentativa usando React Native y Expo para ayudar a niños con necesidades especiales a comunicarse mediante símbolos PCS.

## 🚀 Primeros Pasos

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn

### Instalación

1. Instala las dependencias:
```bash
npm install
```

### Ejecución

Para iniciar la app en modo desarrollo:

```bash
npm start
```

Esto abrirá Expo Dev Tools. Desde ahí puedes:
- Presionar `w` para abrir en el navegador web
- Escanear el código QR con la app Expo Go en tu móvil (Android/iOS)
- Presionar `a` para abrir en emulador Android (si tienes Android Studio)
- Presionar `i` para abrir en simulador iOS (solo en Mac con Xcode)

### Opción más rápida: Web

```bash
npm run web
```

## ✨ Características Implementadas (v1.0)

✅ **Interfaz Básica** (Punto 1 del Roadmap)
- Pantalla principal con grilla de símbolos grandes para selección PCS
- Campo de entrada de texto para cuidadores
- Área de visualización mostrando la salida traducida
- Navegación simple y clara

### Componentes Principales

1. **Grilla de Símbolos (Niño)**: 12 símbolos de comunicación básicos con emojis
2. **Entrada de Texto (Cuidador)**: Campo de texto para que los cuidadores escriban
3. **Área de Traducción**: Muestra el resultado en tiempo real
4. **Símbolos Seleccionados**: Visualización de la secuencia de símbolos elegidos

## 🎯 Próximos Pasos

- [ ] Integración con pictogramas ARASAAC
- [ ] Conexión con LLM (GPT-4o-mini/Gemini)
- [ ] Backend con Node.js y Firebase
- [ ] Entrada de voz con Whisper
- [ ] Procesamiento de imágenes

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript**
- Diseño con componentes nativos para máximo rendimiento

## 📱 Uso de la App

### Para el Niño:
1. Toca los símbolos grandes de la grilla
2. La traducción aparece en tiempo real arriba
3. Continúa seleccionando símbolos para formar frases

### Para el Cuidador:
1. Escribe texto en el campo de entrada
2. Presiona "Enviar" 
3. (Próximamente: verás los símbolos PCS correspondientes)

## 📄 Licencia

Este proyecto es un prototipo académico para Advanced User Interfaces - Polimi.

