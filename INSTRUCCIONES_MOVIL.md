# Instrucciones para ejecutar en móvil físico

## Paso 1: Identificar tu IP de WiFi

Ejecuta en PowerShell:
```powershell
ipconfig | findstr /i "IPv4"
```

De las IPs que aparecen, la de tu WiFi local es probablemente:
- `10.0.0.250` (si tu red es 10.0.0.x)
- O alguna `192.168.x.x` que NO sea `.1` (las que terminan en .1 suelen ser de VMs)

## Paso 2: Actualizar `.env` del frontend

Edita `AAC/frontend/.env` y cambia:
```env
EXPO_PUBLIC_API_URL=http://TU_IP_WIFI:3000
```

Por ejemplo, si tu IP es `10.0.0.250`:
```env
EXPO_PUBLIC_API_URL=http://10.0.0.250:3000
```

## Paso 3: Iniciar el backend

En una terminal:
```bash
cd AAC/backend
npm start
```

Deberías ver:
```
Server running on http://0.0.0.0:3000
```

## Paso 4: Iniciar el frontend

En otra terminal:
```bash
cd AAC/frontend
npm start
```

## Paso 5: Conectar desde tu móvil

1. Abre la app **Expo Go** en tu móvil
2. Escanea el código QR que aparece en la terminal
3. O presiona:
   - `a` para Android
   - `i` para iOS

## Solución de problemas

### Si no se conecta al backend:

1. **Verifica el firewall de Windows:**
   - Abre "Firewall de Windows Defender"
   - Permite Node.js a través del firewall
   - O desactiva temporalmente el firewall para probar

2. **Verifica que la IP sea correcta:**
   - En tu móvil, ve a Configuración > WiFi
   - Verifica que esté en la misma red que tu computadora
   - La IP debe ser la de tu computadora en esa red

3. **Prueba desde el navegador del móvil:**
   - Abre: `http://TU_IP:3000/api/health`
   - Debería responder con `{"status":"ok"}`

4. **Si usas un antivirus:**
   - Puede estar bloqueando el puerto 3000
   - Agrega una excepción para Node.js

### Si cambias de red WiFi:

Solo necesitas actualizar `EXPO_PUBLIC_API_URL` en `AAC/frontend/.env` con la nueva IP.
