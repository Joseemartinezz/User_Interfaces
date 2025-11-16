# 🔧 Guía de Solución de Problemas - Backend

## Problema: "No se pudo conectar al servidor backend"

### Paso 1: Verificar que el servidor esté corriendo

1. Abre una terminal y ejecuta:
```bash
npm run server
```

2. Deberías ver este mensaje:
```
🚀 Servidor backend ejecutándose en http://localhost:3000
🌐 También disponible en http://127.0.0.1:3000
📡 API Key configurada: ✅ Sí
```

Si NO ves este mensaje, el servidor no está corriendo. Asegúrate de:
- Estar en el directorio correcto del proyecto
- Haber ejecutado `cd server && npm install` primero

### Paso 2: Probar el servidor en el navegador

1. Abre tu navegador
2. Ve a: `http://localhost:3000`
3. Deberías ver un JSON con información del servidor

Si ves "No se puede obtener /" o un error:
- El servidor NO está corriendo
- O hay un problema de firewall

### Paso 3: Verificar la URL en el código

Edita `services/geminiService.ts` línea 7 y prueba estas opciones:

**Opción 1: localhost (para web/iOS)**
```typescript
const API_BASE_URL = 'http://localhost:3000';
```

**Opción 2: 127.0.0.1 (alternativa para web)**
```typescript
const API_BASE_URL = 'http://127.0.0.1:3000';
```

**Opción 3: IP local (para Android emulator o dispositivo físico)**
```typescript
// Primero encuentra tu IP con: ipconfig (Windows) o ifconfig (Mac/Linux)
const API_BASE_URL = 'http://192.168.1.XXX:3000'; // Reemplaza XXX con tu IP
```

**Opción 4: 10.0.2.2 (solo para Android Emulator)**
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000';
```

### Paso 4: Verificar el puerto

Si el puerto 3000 está ocupado, el servidor usará otro puerto. Verifica en la consola del servidor qué puerto está usando.

### Paso 5: Verificar firewall

Windows puede estar bloqueando el puerto 3000. Prueba:
1. Desactivar temporalmente el firewall
2. O agregar una excepción para Node.js

### Paso 6: Reiniciar todo

1. Detén el servidor (Ctrl+C)
2. Detén la app Expo (Ctrl+C)
3. Reinicia el servidor: `npm run server`
4. Reinicia la app: `npm start`

## Solución Rápida

Si nada funciona, prueba esto:

1. **Encuentra tu IP local:**
   ```bash
   ipconfig
   ```
   Busca "IPv4" y copia la dirección (ej: 192.168.1.100)

2. **Edita `services/geminiService.ts` línea 7:**
   ```typescript
   const API_BASE_URL = 'http://TU_IP:3000'; // ej: http://192.168.1.100:3000
   ```

3. **Reinicia el servidor y la app**

## Verificación Final

En la consola de la app deberías ver:
```
🔄 Intentando conectar a: http://localhost:3000/api/generate-phrases
```

Si ves este mensaje pero sigue fallando, el problema es de red/firewall.

