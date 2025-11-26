# 🔐 Configuración de Google Sign-In

## 📋 Resumen

Esta guía te ayudará a configurar el inicio de sesión con Google en tu aplicación AAC, tanto para web como para React Native (Android/iOS).

## 🚀 Pasos de Configuración

### 1. Configurar Google OAuth en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Build > Authentication**
4. En la pestaña **Sign-in method**, haz clic en **Google**
5. Habilita Google como método de inicio de sesión
6. Configura el **Email support** (puedes usar el email del proyecto)
7. Guarda los cambios

### 2. Configurar OAuth Consent Screen (IMPORTANTE - Resuelve el Error 400)

**Este paso es CRÍTICO para evitar el error "Access blocked: Authorization Error"**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el mismo proyecto que usas en Firebase
3. Ve a **APIs & Services > OAuth consent screen**
4. Selecciona **External** (para desarrollo) o **Internal** (solo para usuarios de tu organización)
5. Completa el formulario:
   - **App name**: "AAC App" (o el nombre que prefieras)
   - **User support email**: Tu email
   - **Developer contact information**: Tu email
6. Haz clic en **SAVE AND CONTINUE**
7. En **Scopes** (paso 2):
   - Haz clic en **ADD OR REMOVE SCOPES**
   - Selecciona: `openid`, `email`, `profile`
   - Haz clic en **UPDATE** y luego **SAVE AND CONTINUE**
8. En **Test users** (paso 3 - solo si seleccionaste External):
   - **AÑADE TU EMAIL** como test user: `pablojesus.herrero@mail.polimi.it`
   - Haz clic en **ADD USERS** y luego **SAVE AND CONTINUE**
9. En **Summary** (paso 4):
   - Revisa la información y haz clic en **BACK TO DASHBOARD**

**⚠️ IMPORTANTE**: Si seleccionaste "External", solo los usuarios añadidos como "Test users" podrán iniciar sesión hasta que la app esté verificada por Google.

### 3. Obtener el Web Client ID

1. En Google Cloud Console, ve a **APIs & Services > Credentials**
2. Busca el **OAuth 2.0 Client ID** con tipo "Web application"
3. Si no existe, crea uno:
   - Haz clic en **+ CREATE CREDENTIALS > OAuth client ID**
   - Tipo: **Web application**
   - Nombre: "AAC Web Client"
   - **Authorized JavaScript origins**: 
     - `http://localhost:19006` (para Expo web)
     - `http://localhost:3000` (si usas otro puerto)
     - `http://localhost` (genérico)
   - **Authorized redirect URIs**: 
     - `http://localhost:19006` (para Expo)
     - `https://auth.expo.io/@your-username/your-app` (para Expo AuthSession)
     - `http://localhost` (genérico)
4. Haz clic en **CREATE**
5. Copia el **Client ID** (tiene formato: `xxxxx.apps.googleusercontent.com`)

### 4. Obtener iOS Client ID (Opcional, solo para iOS)

1. En Google Cloud Console > Credentials
2. Crea un nuevo **OAuth 2.0 Client ID** con tipo "iOS"
3. Nombre: "AAC iOS Client"
4. Bundle ID: El bundle ID de tu app iOS (ej: `com.aac.app`)
5. Copia el **Client ID**

### 5. Obtener Android Client ID (Opcional, solo para Android)

1. En Google Cloud Console > Credentials
2. Crea un nuevo **OAuth 2.0 Client ID** con tipo "Android"
3. Nombre: "AAC Android Client"
4. Package name: El package name de tu app Android (ej: `com.aac.app`)
5. SHA-1 certificate fingerprint: Obtén el SHA-1 de tu keystore
6. Copia el **Client ID**

### 6. Configurar Variables de Entorno

Añade estas variables a tu archivo `frontend/.env`:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx.apps.googleusercontent.com  # Opcional
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxxx.apps.googleusercontent.com  # Opcional
```

**Nota**: El `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` es **obligatorio**. Los otros son opcionales pero recomendados para mejor experiencia en cada plataforma.

### 7. Obtener SHA-1 para Android (Solo si usas Android)

Para obtener el SHA-1 de tu keystore de desarrollo:

**En Windows (PowerShell):**
```powershell
# 1. Crear el directorio si no existe
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.android"

# 2. Generar el keystore si no existe
keytool -genkey -v -keystore "$env:USERPROFILE\.android\debug.keystore" -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"

# 3. Obtener el SHA-1
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

**En macOS/Linux:**
```bash
# Para debug keystore (desarrollo)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Para release keystore (producción)
keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
```

**Busca la línea que dice `SHA1:` y copia ese valor completo** (formato: `A1:B2:C3:D4:...`). Añádelo en Google Cloud Console cuando crees el Android Client ID.

## 🧪 Probar Google Sign-In

### En Web
1. Inicia la app: `npm start` y abre en navegador
2. Haz clic en "Continuar con Google"
3. Deberías ver el popup de Google para seleccionar cuenta

### En React Native (Android/iOS)
1. Inicia la app: `npm start` y selecciona tu dispositivo/emulador
2. Haz clic en "Continuar con Google"
3. Se abrirá el navegador o la app de Google para autenticación
4. Después de autenticar, volverás a la app

## 🔧 Solución de Problemas

### ❌ Error 400: "Access blocked: Authorization Error" / "invalid_request"

**Este es el error más común. Solución:**

1. **Configura el OAuth Consent Screen** (ver paso 2 arriba):
   - Ve a Google Cloud Console > APIs & Services > OAuth consent screen
   - Completa TODOS los campos requeridos
   - Si seleccionaste "External", **AÑADE TU EMAIL como Test User**
   - Guarda todos los cambios

2. **Verifica los Redirect URIs**:
   - Ve a Credentials > Tu OAuth Client ID
   - Asegúrate de que los redirect URIs incluyan:
     - `http://localhost:19006`
     - `http://localhost`
     - `https://auth.expo.io/@your-username/your-app` (si usas Expo)

3. **Espera unos minutos**: Los cambios pueden tardar 5-10 minutos en aplicarse

4. **Limpia la caché del navegador**: A veces el navegador guarda configuraciones antiguas

### Error: "Google Web Client ID no configurado"
- Verifica que `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` esté en tu archivo `.env`
- Reinicia el servidor de Expo después de añadir la variable

### Error: "Error al autenticar con Google"
- Verifica que Google Sign-In esté habilitado en Firebase Console
- Verifica que el Client ID sea correcto
- Verifica que el OAuth Consent Screen esté configurado
- En Android, verifica que el SHA-1 esté configurado correctamente

### El botón no funciona en React Native
- Verifica que `expo-auth-session` y `expo-web-browser` estén instalados
- Verifica que el Web Client ID esté configurado
- Revisa la consola para ver errores específicos

### Error en iOS: "redirect_uri_mismatch"
- Verifica que el Bundle ID en Google Cloud Console coincida con el de tu app
- Verifica que el redirect URI esté configurado correctamente

### "This app isn't verified" (App no verificada)
- Si seleccionaste "External" en OAuth Consent Screen, esto es normal
- Añade tu email como "Test User" para poder usarla
- Para producción, necesitarás verificar la app con Google (proceso más largo)

## 📚 Recursos Adicionales

- [Firebase Authentication - Google](https://firebase.google.com/docs/auth/web/google-signin)
- [Expo AuthSession](https://docs.expo.dev/guides/authentication/#google)
- [Google Cloud Console](https://console.cloud.google.com/)

## ✅ Checklist

- [ ] **OAuth Consent Screen configurado** (CRÍTICO - evita Error 400)
- [ ] **Email añadido como Test User** (si usas modo External)
- [ ] Google Sign-In habilitado en Firebase Console
- [ ] Web Client ID creado en Google Cloud Console
- [ ] Redirect URIs configurados correctamente
- [ ] iOS Client ID creado (opcional, solo iOS)
- [ ] Android Client ID creado (opcional, solo Android)
- [ ] SHA-1 configurado para Android (si usas Android)
- [ ] Variables de entorno añadidas en `.env`
- [ ] Servidor de Expo reiniciado
- [ ] Probado en web
- [ ] Probado en React Native (Android/iOS)

---

**¡Configuración completa!** 🎉 Ahora puedes usar Google Sign-In en todas las plataformas.

