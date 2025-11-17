# 🔧 Troubleshooting: Imágenes de Pictogramas No Se Muestran

## Problema
Las imágenes de los pictogramas aparecen en blanco en la UI aunque los tests pasan correctamente.

## ✅ Soluciones Implementadas

### 1. Componente PictogramImage Mejorado
- ✅ Manejo de errores con fallback visual
- ✅ Indicador de carga mientras se descarga la imagen
- ✅ Logging detallado para debug
- ✅ Cache de imágenes para mejor rendimiento

### 2. Función getPictogramImageUrl Corregida
- ✅ Construcción manual de URLs (sin URLSearchParams que puede fallar en RN)
- ✅ URLs simplificadas y compatibles con React Native
- ✅ Parámetros opcionales solo cuando son necesarios

## 🔍 Pasos de Diagnóstico

### Paso 1: Verificar Logs en la Consola

Cuando ejecutes la app, deberías ver logs como:

```
🖼️ Pictograma ID 6632
   URL: https://api.arasaac.org/api/pictograms/6632
⏳ Iniciando carga: ID 6632
✅ Imagen cargada: ID 6632
```

Si ves errores, copia el mensaje completo.

### Paso 2: Verificar URLs Manualmente

Abre estas URLs en tu navegador para verificar que las imágenes existen:

- https://api.arasaac.org/api/pictograms/6632 (I)
- https://api.arasaac.org/api/pictograms/6625 (You)
- https://api.arasaac.org/api/pictograms/5441 (Want)
- https://api.arasaac.org/api/pictograms/2527 (Pizza)

Si las imágenes se cargan en el navegador pero no en la app, puede ser un problema de:
- Configuración de red
- Permisos de la app
- CORS (aunque ARASAAC debería permitirlo)

### Paso 3: Verificar Configuración de la App

#### Para Expo/React Native

Asegúrate de que tu `app.json` o `app.config.js` tenga:

```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": false
    },
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": false
        }
      }
    }
  }
}
```

**Nota:** ARASAAC usa HTTPS, así que no deberías necesitar `usesCleartextTraffic: true`.

### Paso 4: Verificar Permisos de Red

En Android, verifica que `AndroidManifest.xml` tenga:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

En iOS, esto debería estar automáticamente con Expo.

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "Network request failed"

**Causa:** No hay conexión a internet o la URL no es accesible.

**Solución:**
1. Verifica tu conexión a internet
2. Prueba abrir la URL en el navegador
3. Verifica que no haya firewall bloqueando

### Problema 2: Imágenes se cargan pero aparecen en blanco

**Causa:** Problema con el estilo o el tamaño del contenedor.

**Solución:**
1. Verifica que `styles.symbolImage` tenga `width` y `height` definidos
2. Asegúrate de que el contenedor tenga espacio suficiente
3. Prueba cambiar `resizeMode` a `'cover'` o `'stretch'`

### Problema 3: Solo algunas imágenes se cargan

**Causa:** Algunos IDs pueden no existir o estar temporalmente no disponibles.

**Solución:**
1. Verifica los IDs en el navegador
2. Ejecuta `node server/verify-pictograms.js` para verificar todos los IDs
3. Si un ID no funciona, busca uno alternativo con `node server/find-pictogram-ids.js`

### Problema 4: Error de CORS

**Causa:** Aunque ARASAAC debería permitir CORS, puede haber problemas.

**Solución:**
1. Las imágenes de ARASAAC deberían funcionar directamente
2. Si hay problemas, podríamos implementar un proxy en el backend

### Problema 5: Cache de imágenes

**Causa:** Imágenes cacheadas incorrectamente.

**Solución:**
1. Limpia el cache de la app: `expo start --clear`
2. Reinicia el servidor de desarrollo
3. En Android, desinstala y reinstala la app

## 🔧 Soluciones Adicionales

### Opción 1: Usar Backend Proxy para Imágenes

Si las imágenes no cargan directamente, podemos crear un endpoint en el backend que sirva las imágenes:

```javascript
// En server/index.js
app.get('/api/arasaac/image/:id', async (req, res) => {
  const { id } = req.params;
  const imageUrl = `https://api.arasaac.org/api/pictograms/${id}`;
  
  try {
    const response = await fetch(imageUrl);
    const imageBuffer = await response.buffer();
    
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error loading image' });
  }
});
```

Luego en el componente:
```typescript
const imageUrl = `${API_BASE_URL}/api/arasaac/image/${arasaacId}`;
```

### Opción 2: Pre-descargar Imágenes

Para uso offline o mejor rendimiento, podrías pre-descargar las imágenes:

```typescript
import * as FileSystem from 'expo-file-system';

async function downloadPictogram(id: number) {
  const url = getPictogramImageUrl(id);
  const fileUri = `${FileSystem.cacheDirectory}pictogram-${id}.png`;
  
  const download = await FileSystem.downloadAsync(url, fileUri);
  return download.uri;
}
```

### Opción 3: Usar Componente de Terceros

Si el componente `Image` de React Native tiene problemas, podrías usar:

```bash
npm install react-native-fast-image
```

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={style}
  resizeMode={FastImage.resizeMode.contain}
/>
```

## 📊 Verificación Rápida

Ejecuta estos comandos para verificar todo:

```bash
# 1. Verificar que el servidor funciona
curl http://localhost:3000/api/health

# 2. Verificar que los pictogramas existen
curl http://localhost:3000/api/arasaac/pictogram/en/6632

# 3. Verificar URLs de imágenes (abre en navegador)
# https://api.arasaac.org/api/pictograms/6632

# 4. Verificar todos los IDs usados
cd server
node verify-pictograms.js
```

## 📝 Logs Útiles

Cuando ejecutes la app, revisa la consola para estos mensajes:

### ✅ Logs Normales (Todo Funciona)
```
🖼️ Pictograma ID 6632
   URL: https://api.arasaac.org/api/pictograms/6632
⏳ Iniciando carga: ID 6632
✅ Imagen cargada: ID 6632
```

### ❌ Logs de Error (Hay Problemas)
```
🖼️ Pictograma ID 6632
   URL: https://api.arasaac.org/api/pictograms/6632
⏳ Iniciando carga: ID 6632
❌ Error cargando pictograma ID 6632
   URL: https://api.arasaac.org/api/pictograms/6632
   Error: [detalles del error]
```

## 🆘 Si Nada Funciona

1. **Verifica la versión de React Native/Expo**
   ```bash
   npx expo --version
   ```

2. **Actualiza dependencias**
   ```bash
   npm update
   ```

3. **Limpia y reinstala**
   ```bash
   rm -rf node_modules
   npm install
   expo start --clear
   ```

4. **Verifica la documentación de ARASAAC**
   - https://arasaac.org/developers/api
   - Puede haber cambios en la API

5. **Contacta soporte**
   - Abre un issue en el repositorio
   - Incluye los logs completos de la consola
   - Especifica la plataforma (iOS/Android/Web)

## ✅ Checklist de Verificación

- [ ] URLs se generan correctamente (ver logs)
- [ ] URLs funcionan en el navegador
- [ ] Servidor backend está corriendo
- [ ] Conexión a internet activa
- [ ] Permisos de red configurados
- [ ] Cache limpiado (`expo start --clear`)
- [ ] Logs de consola revisados
- [ ] IDs de pictogramas verificados

---

**Última actualización:** Mejoras en manejo de errores y logging para diagnóstico

