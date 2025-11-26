# 🚨 Solución Rápida: Error 400 "Access blocked: Authorization Error"

## ❌ El Problema

Estás viendo este error al intentar iniciar sesión con Google:
- **"Access blocked: Authorization Error"**
- **Error 400: invalid_request**
- **"This app doesn't comply with Google's OAuth 2.0 policy"**

## ✅ Solución Paso a Paso (5 minutos)

### Paso 1: Configurar OAuth Consent Screen

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (el mismo que usas en Firebase)
3. En el menú lateral, ve a **APIs & Services > OAuth consent screen**

### Paso 2: Completar el Formulario

1. **User Type**: Selecciona **External** (para desarrollo) o **Internal** (solo usuarios de tu organización)
2. Haz clic en **CREATE**

3. **App information** (Paso 1):
   - **App name**: `AAC App` (o el nombre que prefieras)
   - **User support email**: Tu email (`pablojesus.herrero@mail.polimi.it`)
   - **App logo**: (Opcional, puedes saltarlo)
   - **App domain**: (Opcional, puedes saltarlo)
   - **Application home page**: (Opcional)
   - **Application privacy policy link**: (Opcional)
   - **Application terms of service link**: (Opcional)
   - **Authorized domains**: (Opcional)
   - **Developer contact information**: Tu email (`pablojesus.herrero@mail.polimi.it`)

4. Haz clic en **SAVE AND CONTINUE**

### Paso 3: Configurar Scopes

1. En **Scopes** (Paso 2):
   - Haz clic en **ADD OR REMOVE SCOPES**
   - Busca y selecciona:
     - ✅ `openid`
     - ✅ `email`
     - ✅ `profile`
   - Haz clic en **UPDATE**
   - Haz clic en **SAVE AND CONTINUE**

### Paso 4: Añadir Test Users (CRÍTICO si seleccionaste "External")

1. En **Test users** (Paso 3):
   - Haz clic en **+ ADD USERS**
   - Añade tu email: `pablojesus.herrero@mail.polimi.it`
   - Haz clic en **ADD**
   - Haz clic en **SAVE AND CONTINUE**

**⚠️ IMPORTANTE**: Si seleccionaste "External", **SOLO los usuarios añadidos aquí podrán iniciar sesión** hasta que la app esté verificada.

### Paso 5: Revisar y Finalizar

1. En **Summary** (Paso 4):
   - Revisa la información
   - Haz clic en **BACK TO DASHBOARD**

### Paso 6: Verificar Redirect URIs

1. Ve a **APIs & Services > Credentials**
2. Haz clic en tu **OAuth 2.0 Client ID** (el Web Client ID)
3. Verifica que en **Authorized redirect URIs** tengas:
   - `http://localhost:19006`
   - `http://localhost`
   - `https://auth.expo.io/@your-username/your-app` (si usas Expo)
4. Si falta alguno, añádelo y haz clic en **SAVE**

### Paso 7: Esperar y Probar

1. **Espera 5-10 minutos** para que los cambios se apliquen
2. **Limpia la caché del navegador** (Ctrl+Shift+Delete)
3. **Reinicia tu servidor de Expo**:
   ```powershell
   # Detén el servidor (Ctrl+C) y reinicia
   npm start
   ```
4. Intenta iniciar sesión con Google de nuevo

## 🔍 Verificación Rápida

Asegúrate de tener:

- ✅ OAuth Consent Screen configurado (con todos los campos requeridos)
- ✅ Tu email añadido como Test User (si usas modo External)
- ✅ Scopes configurados: `openid`, `email`, `profile`
- ✅ Redirect URIs correctos en el OAuth Client ID
- ✅ Esperado 5-10 minutos después de los cambios

## 🆘 Si Sigue Sin Funcionar

1. **Verifica que estás usando el email correcto**:
   - El email debe estar en la lista de "Test users"
   - Debe ser exactamente el mismo que usas para iniciar sesión

2. **Verifica el Client ID**:
   - Asegúrate de que `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` en tu `.env` sea el correcto
   - Debe ser el Client ID del tipo "Web application"

3. **Revisa la consola del navegador**:
   - Abre las herramientas de desarrollador (F12)
   - Ve a la pestaña "Console"
   - Busca errores específicos

4. **Intenta en modo incógnito**:
   - A veces la caché del navegador causa problemas
   - Abre una ventana de incógnito y prueba ahí

## 📝 Notas Importantes

- **Modo External**: Permite que cualquier usuario use la app, pero requiere verificación de Google para producción
- **Modo Internal**: Solo usuarios de tu organización pueden usar la app
- **Test Users**: En modo External, solo los usuarios añadidos como "Test users" pueden usar la app hasta que esté verificada
- **Verificación**: Para producción, necesitarás verificar la app con Google (proceso más largo, requiere revisión)

---

**¿Sigue sin funcionar?** Revisa la sección "Solución de Problemas" en `GOOGLE_SIGNIN_SETUP.md` para más detalles.

