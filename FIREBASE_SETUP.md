# 🔥 Guía de Configuración de Firebase

## 📋 Resumen

Este proyecto ahora está integrado con Firebase para gestionar:
- ✅ Autenticación de usuarios (email/contraseña)
- ✅ Base de datos Firestore para preferencias y datos de usuario
- ✅ Almacenamiento de símbolos PCS personalizados

## 🚀 Pasos de Configuración

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Ingresa un nombre para tu proyecto (ej: "aac-app")
4. (Opcional) Habilita Google Analytics
5. Haz clic en "Crear proyecto"

### 2. Configurar Autenticación

1. En la consola de Firebase, ve a **Build > Authentication**
2. Haz clic en "Comenzar" o "Get started"
3. En la pestaña **Sign-in method**, habilita:
   - ✅ **Email/Password** (sin necesidad de verificación de email)
4. Guarda los cambios

### 3. Configurar Firestore Database

1. En la consola de Firebase, ve a **Build > Firestore Database**
2. Haz clic en "Crear base de datos" o "Create database"
3. Selecciona **Modo de producción** (production mode)
4. Selecciona una ubicación (elige la más cercana a tus usuarios)
5. Haz clic en "Habilitar"

#### Configurar Reglas de Seguridad de Firestore

Reemplaza las reglas por defecto con estas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla para colección de usuarios
    match /users/{userId} {
      // Los usuarios solo pueden leer y escribir sus propios datos
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Denegar acceso a todas las demás colecciones por defecto
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4. Obtener Configuración de Firebase

1. En la consola de Firebase, ve a **Project Settings** (⚙️ icono arriba a la izquierda)
2. En la sección **General**, desplázate hasta **Tus apps**
3. Si no hay apps registradas, haz clic en el icono **Web** (`</>`)
4. Registra una app con un nickname (ej: "AAC Web App")
5. **NO** necesitas configurar Firebase Hosting
6. Copia los valores de configuración que se muestran

### 5. Configurar Variables de Entorno

1. En el directorio `frontend/`, crea un archivo `.env`:

```bash
cd frontend
# Crea el archivo .env (puedes usar tu editor favorito)
```

2. Añade al archivo `.env` los valores con tu configuración de Firebase:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_real
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

EXPO_PUBLIC_API_URL=http://localhost:3000
```

⚠️ **Importante**: El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)

## 📊 Estructura de Datos en Firestore

La colección `users` tiene la siguiente estructura:

```typescript
users/
  {userId}/  // UID del usuario de Firebase Auth
    email: string
    fullName: string
    preferences: {
      language: string (default: "es")
      theme: number (default: 1)
      fontSize: string (default: "medium")
      voiceSpeed: number (default: 1.0)
      colorPalette: "default" | "high-contrast" | "pastel" | "vibrant"
      preferredFontSize: "small" | "medium" | "large" | "extra-large"
      customPCSSymbols: Array<{
        id: string
        word: string
        imageUrl: string
        category?: string
        addedAt: Timestamp
      }>
    }
    createdAt: Timestamp
    updatedAt: Timestamp
```

## 🔐 Flujo de Autenticación

1. **Usuario nuevo**: 
   - Pantalla de registro → Crea cuenta en Firebase Auth
   - Se crea documento en Firestore automáticamente
   - Redirige a la app principal

2. **Usuario existente**:
   - Pantalla de login → Verifica credenciales en Firebase Auth
   - Carga datos desde Firestore
   - Redirige a la app principal

3. **Sesión persistente**:
   - Firebase mantiene la sesión activa
   - Los datos se guardan en AsyncStorage como caché
   - Al abrir la app, se restaura la sesión automáticamente

## 🧪 Probar la Integración

### 1. Iniciar el Backend

```bash
cd backend
npm start
```

### 2. Iniciar el Frontend

```bash
cd frontend
npm start
```

### 3. Crear un Usuario de Prueba

1. Abre la app
2. Verás la pantalla de Login
3. Haz clic en "Crear una cuenta"
4. Completa el formulario:
   - Nombre: "Usuario Prueba"
   - Email: "test@example.com"
   - Contraseña: "123456" (mínimo 6 caracteres)
5. Haz clic en "Crear Cuenta"

### 4. Verificar en Firebase Console

1. Ve a **Authentication > Users** en Firebase Console
2. Deberías ver el usuario recién creado
3. Ve a **Firestore Database** y verifica que existe el documento del usuario

## 📱 Funcionalidades Implementadas

### Autenticación
- ✅ Registro con email/contraseña
- ✅ Login con email/contraseña
- ✅ Logout (cierre de sesión)
- ✅ Sesión persistente
- ✅ Manejo de errores de autenticación

### Gestión de Usuario
- ✅ Actualizar nombre y email
- ✅ Guardar preferencias (tema, idioma, tamaño de letra)
- ✅ Paleta de colores personalizable
- ✅ Tamaño de letra ajustable
- ✅ Símbolos PCS personalizados

### Pantallas
- ✅ LoginScreen: Inicio de sesión
- ✅ RegisterScreen: Registro de usuarios
- ✅ SettingsScreen: Configuración y preferencias
- ✅ ProfileScreen: Perfil del usuario (existente)

## 🔧 Solución de Problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que el `EXPO_PUBLIC_FIREBASE_API_KEY` en `.env` sea correcto
- Asegúrate de haber guardado el archivo `.env`
- Reinicia el servidor de Expo

### Error: "Missing or insufficient permissions"
- Verifica que las reglas de seguridad de Firestore estén configuradas correctamente
- Asegúrate de estar autenticado antes de intentar acceder a Firestore

### La app no muestra las pantallas de login
- Verifica que el `UserProvider` esté envolviendo la navegación en `App.tsx`
- Revisa la consola para ver errores de Firebase

### No se guardan las preferencias
- Verifica que el usuario esté autenticado (`user !== null`)
- Revisa las reglas de seguridad de Firestore
- Verifica la consola del navegador/terminal para errores

## 📚 Recursos Adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)

## 🎯 Próximos Pasos (Opcional)

- [ ] Agregar autenticación con Google/Facebook
- [ ] Implementar recuperación de contraseña
- [ ] Agregar verificación de email
- [ ] Implementar storage para imágenes personalizadas
- [ ] Agregar notificaciones push
- [ ] Implementar sincronización offline mejorada

## ✅ Checklist de Configuración

- [ ] Proyecto creado en Firebase Console
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Database creado
- [ ] Reglas de seguridad configuradas
- [ ] Variables de entorno configuradas en `.env`
- [ ] Dependencias instaladas (`npm install` en frontend)
- [ ] Backend iniciado y funcionando
- [ ] Frontend iniciado correctamente
- [ ] Usuario de prueba creado exitosamente
- [ ] Datos visibles en Firestore Console

---

**¡Configuración completa!** 🎉 Tu app ahora tiene autenticación y gestión de usuarios con Firebase.

