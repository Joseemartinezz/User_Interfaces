# 🔍 Diagnóstico: Variable `imageError` y Por Qué Se Activa

## 📍 Dónde Se Cambia `imageError`

La variable `imageError` se maneja en el componente `PictogramImage` en `App.tsx`:

### 1. **Inicialización** (línea 25)
```typescript
const [imageError, setImageError] = useState(false);
```
- Se inicia en `false` (sin error)

### 2. **Se Resetea a `false`** (línea 40)
```typescript
React.useEffect(() => {
  setImageError(false);  // ← Se resetea cuando cambia el ID o URL
  setErrorMessage(null);
  setImageLoading(true);
}, [arasaacId, imageUrl]);
```
- Se resetea cuando cambia el `arasaacId` o la `imageUrl`

### 3. **Se Resetea a `false` en `onLoadStart`** (línea 79)
```typescript
onLoadStart={() => {
  setImageError(false);  // ← Se resetea cuando inicia la carga
  setImageLoading(true);
}}
```
- Se resetea cuando la imagen empieza a cargar

### 4. **Se Establece a `true` en `onError`** (línea 116) ⚠️
```typescript
onError={(error) => {
  // ... código de logging ...
  setImageError(true);  // ← AQUÍ SE ACTIVA EL ERROR
  setImageLoading(false);
}}
```
- **Este es el lugar donde se activa el error** cuando la imagen falla al cargar

---

## 🔴 Por Qué Se Está Activando

`imageError` se activa cuando el componente `Image` de React Native dispara el evento `onError`. Esto significa que:

1. ✅ La URL se está generando correctamente
2. ✅ El componente intenta cargar la imagen
3. ❌ **La carga falla** por alguna razón

---

## 🔍 Cómo Diagnosticar

### Paso 1: Revisar los Logs de la Consola

Cuando `onError` se dispara, verás logs como:

```
❌ Error cargando pictograma ID 6632
   URL: http://10.0.2.2:3000/api/arasaac/image/6632
   Error tipo: object
   Error keys: [...]
   Error completo: {...}
   Mensaje final: [mensaje del error]
```

**El mensaje final te dirá exactamente qué está fallando.**

### Paso 2: Verificar el Mensaje de Error

Los errores comunes son:

#### Error 1: "Unable to resolve host"
```
Mensaje final: Unable to resolve host "10.0.2.2": No address associated with hostname
```
**Causa:** El emulador/dispositivo no puede conectar al servidor  
**Solución:** Verifica que:
- El servidor esté corriendo
- La URL en `.env` sea correcta (`http://10.0.2.2:3000` para Android)

#### Error 2: "Unexpected HTTP code 404"
```
Mensaje final: Unexpected HTTP code Response{protocol=http/1.1, code=404, message=Not Found}
```
**Causa:** El endpoint no existe o el servidor no está corriendo  
**Solución:** 
- Reinicia el servidor: `cd server && npm start`
- Verifica que el endpoint esté registrado

#### Error 3: "Network request failed"
```
Mensaje final: Network request failed
```
**Causa:** Problema de red o CORS  
**Solución:** Verifica conexión y headers CORS

#### Error 4: "Failed to load image"
```
Mensaje final: Failed to load image
```
**Causa:** La imagen no es válida o el formato no es compatible  
**Solución:** Verifica que el servidor esté devolviendo una imagen PNG válida

---

## 🛠️ Soluciones por Tipo de Error

### Si el Error es de Conexión (404, Network failed, etc.)

1. **Verifica que el servidor esté corriendo:**
   ```bash
   cd server
   npm start
   ```

2. **Prueba el endpoint directamente:**
   ```bash
   # Abre en el navegador:
   http://localhost:3000/api/arasaac/image/6632
   ```
   Deberías ver la imagen del pictograma.

3. **Verifica la URL en `.env`:**
   ```env
   # Para Android Emulator:
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
   
   # Para iOS Simulator:
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

### Si el Error es de Formato de Imagen

1. **Verifica que el servidor devuelva una imagen:**
   ```bash
   curl http://localhost:3000/api/arasaac/image/6632 -I
   ```
   Debería mostrar `Content-Type: image/png`

2. **Revisa los logs del servidor:**
   Deberías ver:
   ```
   🖼️ Sirviendo imagen de pictograma ID: 6632
   ✅ Imagen obtenida: 14811 bytes, tipo: image/png
   ```

---

## 🔧 Mejoras Implementadas

### 1. Mensaje de Error Visible

Ahora cuando hay error, además del ❓ verás:
- El ID del pictograma
- El mensaje de error (primeros 50 caracteres)

Esto te ayudará a identificar el problema rápidamente.

### 2. Logging Mejorado

El componente ahora muestra:
- Tipo del error
- Todas las keys del objeto de error
- El error completo
- El mensaje final extraído

### 3. Reset Automático

El error se resetea automáticamente cuando:
- Cambia el `arasaacId`
- Cambia la `imageUrl`
- Inicia una nueva carga (`onLoadStart`)

---

## 📊 Flujo de Estados

```
Inicio
  ↓
imageError = false
imageLoading = true
  ↓
onLoadStart() → imageError = false (reset)
  ↓
[Intentando cargar imagen]
  ↓
  ├─→ onLoad() → imageLoading = false ✅ ÉXITO
  │
  └─→ onError() → imageError = true ❌ ERROR
                  imageLoading = false
                  [Muestra ❓]
```

---

## ✅ Checklist de Diagnóstico

Cuando veas ❓ en lugar de imágenes:

1. [ ] **Revisa los logs de la consola** - Busca el mensaje de error
2. [ ] **Verifica el mensaje final** - Te dirá qué está fallando
3. [ ] **Comprueba que el servidor esté corriendo** - `npm start` en server/
4. [ ] **Prueba el endpoint en el navegador** - Debería mostrar la imagen
5. [ ] **Verifica la URL en `.env`** - Debe coincidir con tu entorno
6. [ ] **Revisa los logs del servidor** - Deberías ver peticiones llegando

---

## 🎯 Próximos Pasos

1. **Ejecuta la app y revisa los logs**
2. **Busca el mensaje de error** en la consola
3. **Comparte el mensaje de error** para diagnosticar específicamente

El mensaje de error te dirá exactamente qué está fallando y cómo solucionarlo.

---

**Ubicación del código:**
- `App.tsx` líneas 24-118 (componente `PictogramImage`)
- `imageError` se establece en `true` en la línea 116 dentro de `onError`

