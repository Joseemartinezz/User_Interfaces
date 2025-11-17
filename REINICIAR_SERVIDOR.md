# 🔄 IMPORTANTE: Reiniciar el Servidor

## ⚠️ Problema Actual

Estás viendo errores 404 en el endpoint `/api/arasaac/image/:idPictogram` porque el servidor necesita reiniciarse después de agregar el nuevo endpoint.

## ✅ Solución

### Paso 1: Detener el servidor actual

Si el servidor está corriendo, deténlo con:
- **Ctrl + C** en la terminal donde está corriendo

### Paso 2: Reiniciar el servidor

```bash
cd server
npm start
```

O si estás usando nodemon:
```bash
cd server
npm run dev
```

### Paso 3: Verificar que el endpoint funciona

Abre en tu navegador:
```
http://localhost:3000/api/arasaac/image/6632
```

Deberías ver la imagen del pictograma "I".

### Paso 4: Reiniciar la app

En otra terminal:
```bash
expo start --clear
```

## 🔍 Verificación

Después de reiniciar, deberías ver en los logs del servidor:

```
🚀 Servidor backend ejecutándose en http://localhost:3000
```

Y cuando la app intente cargar una imagen:

```
🖼️ Sirviendo imagen de pictograma ID: 6632
📡 URL de ARASAAC: https://api.arasaac.org/api/pictograms/6632
✅ Imagen obtenida: 12345 bytes, tipo: image/png
```

## ❌ Si Sigue Sin Funcionar

1. **Verifica que el servidor esté corriendo:**
   ```bash
   # Deberías ver el mensaje de inicio
   ```

2. **Verifica la URL en .env:**
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
   ```
   (Para Android Emulator)

3. **Prueba el endpoint directamente:**
   - Abre: `http://localhost:3000/api/arasaac/image/6632`
   - Debería descargar una imagen PNG

4. **Revisa los logs del servidor:**
   - Deberías ver mensajes cuando se hace una petición
   - Si no ves nada, el servidor no está recibiendo las peticiones

## 📝 Nota

El endpoint `/api/arasaac/image/:idPictogram` fue movido al **principio** de las rutas de ARASAAC para asegurar que se registre correctamente antes que otras rutas.

---

**Después de reiniciar el servidor, las imágenes deberían cargarse correctamente.** ✅

