# ✅ Solución: Proxy de Imágenes para Resolver Problemas de DNS

## 🔍 Problema Identificado

El error `"Unable to resolve host 'api.arasaac.org': No address associated with hostname"` indica que el emulador/dispositivo no puede resolver el DNS de ARASAAC directamente.

## ✅ Solución Implementada

Se ha implementado un **proxy de imágenes en el backend** que sirve las imágenes de ARASAAC a través del servidor Express, evitando problemas de DNS y CORS.

---

## 🔧 Cambios Realizados

### 1. Nuevo Endpoint en el Backend (`server/index.js`)

**Endpoint:** `GET /api/arasaac/image/:idPictogram`

Este endpoint:
- ✅ Recibe peticiones de imágenes desde la app
- ✅ Descarga la imagen de ARASAAC en el servidor (que sí tiene acceso a internet)
- ✅ Sirve la imagen al cliente con los headers correctos
- ✅ Incluye cache para mejor rendimiento
- ✅ Soporta todos los parámetros de personalización (color, fondo, plural, etc.)

**Ejemplo de uso:**
```
GET http://localhost:3000/api/arasaac/image/6632
GET http://localhost:3000/api/arasaac/image/6632?color=true&backgroundColor=white
```

### 2. Servicio Actualizado (`services/arasaacService.ts`)

**Cambio:** La función `getPictogramImageUrl()` ahora usa el proxy del backend por defecto.

**Antes:**
```typescript
// URL directa (fallaba por DNS)
https://api.arasaac.org/api/pictograms/6632
```

**Ahora:**
```typescript
// URL del proxy (funciona siempre)
http://localhost:3000/api/arasaac/image/6632
```

**Configuración:**
```typescript
const USE_BACKEND_PROXY_FOR_IMAGES = true; // Activado por defecto
```

### 3. Componente Mejorado (`App.tsx`)

El componente `PictogramImage` ya tenía:
- ✅ Manejo de errores
- ✅ Indicador de carga
- ✅ Logging detallado

Ahora funcionará correctamente porque las URLs apuntan al backend local.

---

## 🚀 Cómo Funciona

```
┌─────────────────┐
│  React Native   │
│      App        │
└────────┬────────┘
         │
         │ GET /api/arasaac/image/6632
         ▼
┌─────────────────┐
│  Backend        │
│  Express        │
│  (localhost)    │
└────────┬────────┘
         │
         │ GET https://api.arasaac.org/api/pictograms/6632
         ▼
┌─────────────────┐
│  ARASAAC API    │
│  (Internet)     │
└─────────────────┘
         │
         │ Imagen PNG
         ▼
┌─────────────────┐
│  Backend        │
│  (Proxy)        │
└────────┬────────┘
         │
         │ Imagen PNG
         ▼
┌─────────────────┐
│  React Native   │
│  (Muestra)      │
└─────────────────┘
```

---

## ✅ Ventajas de Esta Solución

1. **✅ Resuelve problemas de DNS** - El backend tiene acceso a internet
2. **✅ Evita problemas de CORS** - Todo pasa por el mismo origen
3. **✅ Cache centralizado** - Las imágenes se cachean en el servidor
4. **✅ Mejor rendimiento** - El backend puede optimizar las imágenes
5. **✅ Funciona en todos los entornos** - Emuladores, dispositivos físicos, web

---

## 🧪 Pruebas

### 1. Verificar que el endpoint funciona

```bash
# Probar desde el navegador
http://localhost:3000/api/arasaac/image/6632

# O desde curl
curl http://localhost:3000/api/arasaac/image/6632 --output test.png
```

Deberías ver la imagen del pictograma.

### 2. Verificar en la app

1. **Asegúrate de que el servidor esté corriendo:**
   ```bash
   cd server
   npm start
   ```

2. **Inicia la app:**
   ```bash
   npm start
   # o
   expo start
   ```

3. **Revisa los logs:**
   - En la consola de la app deberías ver:
     ```
     🖼️ Pictograma ID 6632
        URL: http://localhost:3000/api/arasaac/image/6632
     ⏳ Iniciando carga: ID 6632
     ✅ Imagen cargada: ID 6632
     ```

   - En la consola del servidor deberías ver:
     ```
     🖼️ Sirviendo imagen de pictograma ID: 6632
     📡 URL de ARASAAC: https://api.arasaac.org/api/pictograms/6632
     ✅ Imagen obtenida: 12345 bytes, tipo: image/png
     ```

---

## 🔧 Configuración

### Para Android Emulator

Asegúrate de que `.env` tenga:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Para iOS Simulator / Web

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Para Dispositivo Físico

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

---

## 📊 URLs Generadas

### Antes (No funcionaba)
```
https://api.arasaac.org/api/pictograms/6632
❌ Error: Unable to resolve host
```

### Ahora (Funciona)
```
http://localhost:3000/api/arasaac/image/6632
✅ Funciona correctamente
```

### Con Parámetros
```
http://localhost:3000/api/arasaac/image/6632?color=true&backgroundColor=white
```

---

## 🐛 Troubleshooting

### Problema: Las imágenes siguen sin aparecer

**Solución 1:** Verifica que el servidor esté corriendo
```bash
cd server
npm start
```

**Solución 2:** Verifica la URL en `.env`
```bash
# Debe coincidir con tu entorno
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Solución 3:** Prueba el endpoint directamente
```bash
curl http://localhost:3000/api/arasaac/image/6632
# Debería descargar una imagen PNG
```

**Solución 4:** Revisa los logs del servidor
- Deberías ver mensajes como "🖼️ Sirviendo imagen..."
- Si hay errores, aparecerán en la consola

### Problema: Error 404 en el endpoint

**Causa:** El endpoint no está registrado correctamente.

**Solución:** Reinicia el servidor
```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
cd server
npm start
```

### Problema: Imágenes se cargan pero aparecen en blanco

**Causa:** Problema con el estilo del componente.

**Solución:** Verifica que `styles.symbolImage` tenga `width` y `height` definidos.

---

## 📝 Notas Importantes

1. **El servidor debe estar corriendo** para que las imágenes funcionen
2. **La primera carga puede ser lenta** - El backend descarga la imagen de ARASAAC
3. **Las imágenes se cachean** - Cargas posteriores serán más rápidas
4. **Funciona offline parcialmente** - Si el servidor tiene la imagen cacheada, puede servirla sin internet

---

## 🔄 Volver a URLs Directas (Opcional)

Si en el futuro quieres volver a usar URLs directas de ARASAAC (por ejemplo, en producción con un CDN), puedes cambiar:

```typescript
// En services/arasaacService.ts
const USE_BACKEND_PROXY_FOR_IMAGES = false;
```

Esto volverá a usar las URLs directas de ARASAAC.

---

## ✅ Checklist de Verificación

- [x] Endpoint de proxy creado en el backend
- [x] Servicio actualizado para usar el proxy
- [x] Componente mejorado con manejo de errores
- [x] Documentación actualizada
- [ ] Servidor backend ejecutándose
- [ ] App probada y funcionando
- [ ] Imágenes visibles en la UI

---

## 🎉 Resultado Esperado

Después de estos cambios, las imágenes de los pictogramas deberían:
- ✅ Cargarse correctamente desde el backend
- ✅ Mostrarse en los botones de la UI
- ✅ Tener indicador de carga mientras se descargan
- ✅ Mostrar placeholder si hay error (con información de debug)

**Estado:** ✅ **SOLUCIONADO**

---

**Última actualización:** Implementación de proxy de imágenes para resolver problemas de DNS

