# WizWords - Aplicación de Comunicación Aumentativa y Alternativa (AAC)

Aplicación móvil/tablet desarrollada con React Native y Expo para facilitar la comunicación mediante símbolos pictográficos ARASAAC.

## Características

- **Grid de símbolos ARASAAC**: Selección visual de pictogramas para construir frases
- **Entrada de texto**: Los cuidadores pueden escribir texto que se convierte automáticamente en símbolos
- **Área de visualización**: Muestra tanto texto como secuencias de símbolos
- **Integración con ARASAAC**: Utiliza la API oficial de ARASAAC para obtener pictogramas

## Tecnologías

- **React Native** con **Expo** (~51.0.0)
- **TypeScript**
- **ARASAAC API** para pictogramas
- **Expo Image** para renderizado optimizado de imágenes
- **Expo Linear Gradient** para efectos visuales

## Instalación

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI (se instala automáticamente con npm)

### Pasos

1. **Instalar dependencias**:
```bash
npm install
```

2. **Iniciar el servidor de desarrollo**:
```bash
npm start
```

3. **Ejecutar en dispositivo/emulador**:
   - Para Android: `npm run android` o escanea el código QR con Expo Go
   - Para iOS: `npm run ios` o escanea el código QR con Expo Go
   - Para web: `npm run web`

## Configuración de Emuladores (Windows)

### Android Emulator

**Paso 1: Instalar Android Studio**
1. Descarga Android Studio desde: https://developer.android.com/studio
2. Instala Android Studio y durante la instalación asegúrate de marcar:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

**Paso 2: Configurar Variables de Entorno**
1. Abre "Variables de entorno" en Windows
2. Crea una variable `ANDROID_HOME` apuntando a: `C:\Users\TuUsuario\AppData\Local\Android\Sdk`
3. Agrega al PATH:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

**Paso 3: Crear un Emulador Android**
1. Abre Android Studio
2. Ve a **More Actions** → **Virtual Device Manager**
3. Click en **Create Device**
4. Selecciona un dispositivo (ej: Pixel 5)
5. Selecciona una imagen del sistema (ej: Android 13 - API 33)
6. Descarga la imagen si es necesario
7. Finaliza la creación del AVD

**Paso 4: Ejecutar la App**
1. Inicia el emulador desde Android Studio o ejecuta:
```bash
emulator -avd NombreDeTuAVD
```
2. En otra terminal, ejecuta:
```bash
npm run android
```

**Nota:** Si el puerto 8081 está ocupado, usa:
```bash
npx expo start --android --port 8082
```

### iOS Emulator (Limitaciones en Windows)

⚠️ **Importante:** Los emuladores de iOS solo funcionan en macOS. En Windows tienes estas opciones:

**Opción 1: Usar Expo Go en dispositivo físico iOS**
1. Instala Expo Go desde la App Store en tu iPhone/iPad
2. Asegúrate de que tu dispositivo y tu PC estén en la misma red WiFi
3. Ejecuta `npm start` y escanea el código QR con Expo Go

**Opción 2: Usar servicios en la nube**
- Servicios como Appetize.io permiten probar apps iOS desde el navegador (requiere cuenta)

**Opción 3: Usar macOS**
- Si tienes acceso a una Mac, puedes usar `npm run ios` directamente

## Estructura del Proyecto

```
├── App.tsx                 # Componente principal
├── src/
│   ├── components/         # Componentes React Native
│   │   ├── SymbolGrid.tsx  # Grid de símbolos
│   │   ├── TextInput.tsx   # Input de texto para cuidadores
│   │   └── DisplayArea.tsx # Área de visualización
│   ├── services/           # Servicios y lógica de negocio
│   │   └── arasaacService.ts # Integración con API ARASAAC
│   └── types/              # Definiciones TypeScript
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Funcionalidades Implementadas

### 1. Integración ARASAAC ✅
- Descarga de 25 símbolos básicos más comunes
- Mapeo palabra → symbol ID
- Funciones para buscar y obtener símbolos de la API

### 2. UI Básica ✅
- Grid de símbolos con diseño responsive
- Campo de texto para entrada de cuidadores
- Área de visualización que muestra texto y símbolos
- Navegación simple y clara

## Uso

### Selección de Símbolos
1. Toca cualquier símbolo en el grid
2. El símbolo se agregará a la secuencia de visualización
3. El texto se actualizará automáticamente

### Entrada de Texto
1. Escribe texto en el campo inferior (ej: "quiero agua")
2. Presiona "Enviar"
3. El texto se convertirá automáticamente en símbolos si están disponibles

### Gestión de Símbolos
- Mantén presionado un símbolo en el área de visualización para eliminarlo
- Usa el botón "Limpiar" para borrar todo

## Símbolos Disponibles

La aplicación incluye 25 símbolos básicos:
- Saludos: hola, adiós
- Respuestas: sí, no, por favor, gracias
- Personas: yo, tú, mamá, papá
- Acciones: quiero, necesito, comer, beber, jugar, dormir
- Objetos: agua, comida, juguete, pelota, casa, escuela
- Emociones: feliz, triste
- Lugares: baño

## Próximos Pasos (Roadmap)

- [ ] Integración con LLM para traducción bidireccional avanzada
- [ ] Backend con Node.js/Express
- [ ] Integración con Firebase para almacenamiento
- [ ] Soporte para entrada de voz (Whisper)
- [ ] Soporte para entrada de imágenes
- [ ] Perfiles de usuario personalizados

## Notas

- La aplicación requiere conexión a internet para cargar los símbolos de ARASAAC
- Los IDs de símbolos en el mapeo son ejemplos; pueden necesitar ajustes según la base de datos ARASAAC actual
- Para producción, considera cachear los símbolos localmente

## Licencia

Este proyecto es parte de un trabajo académico para Advanced User Interfaces.

## Referencias

- [ARASAAC API](https://api.arasaac.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

