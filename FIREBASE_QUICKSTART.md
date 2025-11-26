# 🚀 Firebase - Inicio Rápido

## ✅ ¿Qué se ha integrado?

Firebase está completamente integrado con:
- 🔐 **Autenticación** de usuarios (email/contraseña)
- 📊 **Firestore Database** para guardar datos de usuarios
- ⚙️ **Preferencias personalizables**:
  - Nombre del usuario
  - Paleta de colores preferida (default, high-contrast, pastel, vibrant)
  - Tamaño de letra (small, medium, large, extra-large)
  - Símbolos PCS personalizados (imágenes, categorías)

## 🎯 Pasos Rápidos (5 minutos)

### 1️⃣ Crear Proyecto Firebase
```
1. Ve a https://console.firebase.google.com/
2. Clic en "Agregar proyecto"
3. Nombre: "aac-app" (o el que prefieras)
4. Clic en "Crear proyecto"
```

### 2️⃣ Habilitar Autenticación
```
1. En Firebase Console → Build → Authentication
2. Clic en "Comenzar"
3. Habilita "Email/Password"
4. Guarda
```

### 3️⃣ Crear Firestore Database
```
1. En Firebase Console → Build → Firestore Database
2. Clic en "Crear base de datos"
3. Selecciona "Modo de producción"
4. Elige ubicación (ej: europe-west1)
5. Clic en "Habilitar"
```

### 4️⃣ Configurar Reglas de Firestore
```
1. En Firestore → Reglas
2. Reemplaza el contenido con:
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

```
3. Clic en "Publicar"
```

### 5️⃣ Obtener Configuración
```
1. Firebase Console → ⚙️ Project Settings
2. En "Tus apps" → Clic en icono Web (</>)
3. Nickname: "AAC Web App"
4. NO habilites Hosting
5. Copia los valores del objeto firebaseConfig
```

### 6️⃣ Configurar Variables de Entorno
```bash
# En el directorio frontend/, crea o edita el archivo .env
# Añade tus valores de Firebase:
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 7️⃣ Iniciar la App
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

## 🧪 Probar

1. Abre la app en tu navegador/emulador
2. Verás la pantalla de **Login**
3. Haz clic en **"Crear una cuenta"**
4. Completa:
   - Nombre: "Usuario Prueba"
   - Email: "test@example.com"
   - Contraseña: "123456"
5. Clic en **"Crear Cuenta"**
6. ¡Listo! Deberías estar dentro de la app

## 📁 Archivos Creados

### Configuración
- ✅ `frontend/config/firebase.ts` - Configuración de Firebase
- ✅ `frontend/.env` - Variables de entorno (crear manualmente)

### Servicios
- ✅ `frontend/services/authService.ts` - Autenticación
- ✅ `frontend/services/firestoreService.ts` - Base de datos

### Tipos
- ✅ `frontend/types/user.ts` - Interfaces de Usuario

### Pantallas
- ✅ `frontend/screens/LoginScreen.tsx` - Inicio de sesión
- ✅ `frontend/screens/RegisterScreen.tsx` - Registro

### Contexto
- ✅ `frontend/context/UserContext.tsx` - Estado global (actualizado con Firebase)

### Navegación
- ✅ `frontend/App.tsx` - Navegación con flujo de auth

### Configuración
- ✅ `frontend/screens/SettingsScreen.tsx` - Preferencias (actualizado)

## 🎨 Nuevas Preferencias de Usuario

### En Firestore se guardan:
```typescript
{
  email: string
  fullName: string
  preferences: {
    language: "es"
    theme: 1 | 2
    fontSize: "medium"
    voiceSpeed: 1.0
    // NUEVAS:
    colorPalette: "default" | "high-contrast" | "pastel" | "vibrant"
    preferredFontSize: "small" | "medium" | "large" | "extra-large"
    customPCSSymbols: [{
      id: string
      word: string
      imageUrl: string
      category?: string
      addedAt: Timestamp
    }]
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## 🔑 Funcionalidades Disponibles

### UserContext
```typescript
const {
  user,                           // Usuario actual
  isAuthenticated,                // ¿Está autenticado?
  isLoading,                      // ¿Cargando?
  loginWithEmailAndPassword,      // Login
  registerWithEmailAndPassword,   // Registro
  logout,                         // Cerrar sesión
  updateUser,                     // Actualizar nombre/email
  updatePreferences,              // Actualizar preferencias
  addCustomSymbol,                // Añadir símbolo PCS
  removeCustomSymbol,             // Eliminar símbolo PCS
  refreshUser,                    // Recargar datos
} = useUser();
```

## ❓ Problemas Comunes

### "Firebase: Error (auth/invalid-api-key)"
→ Verifica que `.env` tenga las claves correctas

### "Missing or insufficient permissions"
→ Revisa las reglas de Firestore

### No aparece pantalla de login
→ Reinicia el servidor de Expo (Ctrl+C y `npm start`)

### No se guardan las preferencias
→ Verifica que el usuario esté autenticado en Firebase Console

## 📚 Documentación Completa

Para más detalles, consulta: **`FIREBASE_SETUP.md`**

---

**¡Listo para usar!** 🎉

