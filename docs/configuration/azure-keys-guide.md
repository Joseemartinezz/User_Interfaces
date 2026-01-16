# Guía para Obtener Claves de Azure OpenAI

Esta guía te ayudará a obtener todas las claves necesarias de Azure OpenAI desde el portal de Azure para tu nueva cuenta.

## 📋 Claves Necesarias

Tu proyecto necesita las siguientes claves de Azure OpenAI:

### Para Generación de Frases y Sistema PCS Dinámica (Servicio Principal)
**Usa el mismo deployment de `gpt-5-mini` para:**
- Generación de frases naturales
- Generación de keywords y tags para categorías dinámicas
- Búsqueda inteligente de pictogramas

**Variables de entorno:**
- `AZURE_OPENAI_PHRASE_URL` - URL del endpoint
- `AZURE_OPENAI_PHRASE_KEY` - Clave API
- `AZURE_OPENAI_PHRASE_DEPLOYMENT` - Nombre del deployment (opcional, por defecto: `gpt-5-mini`)
- `AZURE_OPENAI_PHRASE_API_VERSION` - Versión de API (opcional, por defecto: `2023-03-15-preview`)

### Para Generación de Imágenes (DALL-E)
**Usa un deployment separado de `dall-e-3` para:**
- Generación de imágenes para frases AAC

**Variables de entorno:**
- `AZURE_OPENAI_IMAGE_ENDPOINT` - URL del endpoint
- `AZURE_OPENAI_IMAGE_API_KEY` - Clave API
- `AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME` - Nombre del deployment (opcional, por defecto: `dall-e-3`)
- `AZURE_OPENAI_IMAGE_API_VERSION` - Versión de API (opcional, por defecto: `2024-02-01`)

---

## 🚀 Paso 1: Crear un Recurso de Azure OpenAI

Si aún no tienes un recurso de Azure OpenAI:

1. En el portal de Azure, busca **"Azure OpenAI"** en la barra de búsqueda superior
2. Haz clic en **"Crear"** o **"Create"**
3. Completa el formulario:
   - **Suscripción**: Selecciona tu suscripción
   - **Grupo de recursos**: Crea uno nuevo o usa uno existente
   - **Región**: Elige una región cercana (ej: `West Europe`, `East US`)
   - **Nombre**: Dale un nombre descriptivo (ej: `aac-openai-resource`)
   - **Plan de tarifa**: Selecciona según tu presupuesto
4. Haz clic en **"Revisar y crear"** y luego **"Crear"**
5. Espera a que se complete la creación (puede tardar unos minutos)

---

## 🔑 Paso 2: Obtener Claves y Endpoint

Una vez que tengas el recurso creado (o si ya lo tienes):

### 2.1 Navegar al Recurso

1. En el portal de Azure, busca **"Azure OpenAI"** en la barra de búsqueda
2. Haz clic en tu recurso (el que acabas de crear o el que ya tenías)

### 2.2 Obtener Claves y Endpoint

1. En el menú lateral izquierdo, busca la sección **"Claves y punto de conexión"** o **"Keys and Endpoint"**
2. Haz clic en esa sección
3. Verás:
   - **Endpoint**: Una URL que termina en `.openai.azure.com` (ej: `https://tu-recurso.openai.azure.com`)
   - **KEY 1**: Una clave larga (copia esta)
   - **KEY 2**: Otra clave (puedes usar cualquiera de las dos)

**⚠️ Importante**: Copia el **Endpoint** y una de las **KEY** (KEY 1 o KEY 2). Guárdalos en un lugar seguro.

**💡 Nota**: Puedes usar el mismo Endpoint y la misma KEY para ambos servicios (frases/PCS e imágenes).

---

## 🤖 Paso 3: Crear Deployments (Modelos)

**¿Qué es un Deployment?** Un deployment es una instancia de un modelo de IA que puedes usar en tu aplicación. Necesitas crear deployments para poder usar los modelos.

Necesitas crear **2 deployments**:
1. **`gpt-5-mini`** - Para frases y sistema PCS dinámica
2. **`dall-e-3`** - Para generación de imágenes

---

### 3.1 Cómo Encontrar la Sección de Deployments

**Pasos detallados:**

1. **Asegúrate de estar en tu recurso Azure OpenAI:**
   - En el portal de Azure, busca **"Azure OpenAI"** en la barra de búsqueda superior
   - Haz clic en tu recurso (deberías ver el nombre que le diste, ej: `aac-openai-resource`)

2. **Busca el menú lateral izquierdo:**
   - En el menú lateral izquierdo, busca la sección **"Deployments"** o **"Implementaciones"**
   - También puede aparecer como **"Model deployments"** o **"Modelos"**
   - Si no lo ves, busca en la sección **"Recursos"** o **"Resources"** del menú

3. **Haz clic en "Deployments"**:
   - Deberías ver una página con una lista (probablemente vacía si es tu primer deployment)
   - En la parte superior, verás un botón **"+ Crear"** o **"+ Create deployment"**

**📸 Estructura visual del menú:**
```
Portal de Azure
└── Tu Recurso Azure OpenAI
    └── Menú Lateral Izquierdo:
        ├── Overview (Resumen)
        ├── Keys and Endpoint (Claves y punto de conexión) ← Ya lo usaste
        ├── Deployments (Implementaciones) ← AQUÍ ESTÁ
        ├── Models (Modelos)
        ├── Usage (Uso)
        └── ...
```

---

### 3.2 Crear el Primer Deployment: GPT-5-mini

Este deployment se usa para:
- ✅ Generar frases naturales a partir de palabras seleccionadas
- ✅ Generar keywords y tags para categorías dinámicas
- ✅ Búsqueda inteligente de pictogramas usando IA

**Pasos detallados:**

#### Paso 1: Abrir el formulario de creación

1. En la página de **"Deployments"**, haz clic en el botón **"+ Crear"** o **"+ Create deployment"**
2. Se abrirá un formulario o panel lateral

#### Paso 2: Seleccionar el modelo

1. En el campo **"Model"** o **"Modelo"**, haz clic en el menú desplegable
2. Busca y selecciona **"gpt-5-mini"** o **"gpt-4o"**
   - Si no ves estos modelos, busca **"gpt-4"** o **"gpt-35-turbo"** como alternativa
   - **Recomendación**: Usa `gpt-5-mini` porque es más económico

#### Paso 3: Configurar el deployment

Completa los siguientes campos:

1. **"Deployment name"** o **"Nombre del deployment"**:
   - Escribe: `gpt-5-mini` (o el nombre que prefieras)
   - **⚠️ IMPORTANTE**: Este nombre debe coincidir exactamente con lo que pongas en tu `.env`
   - El nombre debe ser único en tu recurso
   - Solo puede contener letras, números y guiones

2. **"Model"** o **"Modelo"**:
   - Ya lo seleccionaste en el paso anterior
   - Debería mostrar algo como: `gpt-5-mini` o `gpt-4o`

3. **"Model version"** o **"Versión del modelo"**:
   - Selecciona la versión más reciente disponible
   - Generalmente aparece como `1106-Preview` o similar
   - Si solo hay una opción, selecciónala

4. **"Capacity"** o **"Capacidad"**:
   - Deja el valor predeterminado (generalmente `1` o `10`)
   - No necesitas cambiarlo para uso básico

#### Paso 4: Crear el deployment

1. Revisa que todos los campos estén correctos
2. Haz clic en el botón **"Crear"** o **"Create"** (generalmente en la parte inferior del formulario)
3. Verás una notificación de que el deployment se está creando

#### Paso 5: Esperar a que se complete

1. El deployment puede tardar **2-5 minutos** en crearse
2. Verás el estado cambiar de **"Creating"** (Creando) a **"Succeeded"** (Exitoso)
3. Una vez completado, el deployment aparecerá en la lista con estado **"Deployed"** o **"Implementado"**

**💡 Nota**: Anota el nombre exacto del deployment que creaste (ej: `gpt-5-mini`). Este mismo deployment se usará tanto para frases como para el sistema de PCS dinámica.

---

### 3.3 Crear el Segundo Deployment: DALL-E 3

Este deployment se usa para:
- ✅ Generar imágenes para frases AAC usando DALL-E 3

**Pasos detallados:**

#### Paso 1: Abrir el formulario de nuevo

1. En la misma página de **"Deployments"**, haz clic nuevamente en **"+ Crear"** o **"+ Create deployment"**

#### Paso 2: Seleccionar el modelo DALL-E

1. En el campo **"Model"** o **"Modelo"**, haz clic en el menú desplegable
2. Busca y selecciona **"DALL-E 3"** o **"dall-e-3"**
   - Si no ves DALL-E 3, busca **"DALL-E"** o **"dall-e-2"** como alternativa
   - **Nota**: DALL-E 3 es más reciente y de mejor calidad

#### Paso 3: Configurar el deployment

Completa los siguientes campos:

1. **"Deployment name"** o **"Nombre del deployment"**:
   - Escribe: `dall-e-3` (o el nombre que prefieras)
   - **⚠️ IMPORTANTE**: Este nombre debe coincidir exactamente con lo que pongas en tu `.env`
   - El nombre debe ser único (diferente al anterior)

2. **"Model"** o **"Modelo"**:
   - Debería mostrar: `DALL-E 3` o `dall-e-3`

3. **"Model version"** o **"Versión del modelo"**:
   - Selecciona la versión más reciente disponible

4. **"Capacity"** o **"Capacidad"**:
   - Deja el valor predeterminado

#### Paso 4: Crear el deployment

1. Revisa que todos los campos estén correctos
2. Haz clic en **"Crear"** o **"Create"**
3. Espera a que se complete (puede tardar unos minutos)

**💡 Nota**: Anota el nombre exacto del deployment que creaste (ej: `dall-e-3`).

---

### 3.4 Verificar que los Deployments Están Creados

Después de crear ambos deployments:

1. En la página de **"Deployments"**, deberías ver una lista con ambos deployments
2. Cada uno debería mostrar:
   - **Nombre**: `gpt-5-mini` y `dall-e-3`
   - **Estado**: **"Deployed"** o **"Implementado"** (con un check verde ✓)
   - **Modelo**: El modelo que seleccionaste

**Ejemplo de cómo debería verse:**
```
Deployments
┌─────────────────────────────────────────────────┐
│ Deployment Name    │ Model        │ Status      │
├─────────────────────────────────────────────────┤
│ gpt-5-mini       │ gpt-5-mini  │ ✓ Deployed  │
│ dall-e-3          │ DALL-E 3     │ ✓ Deployed  │
└─────────────────────────────────────────────────┘
```

---

### 3.5 Problemas Comunes y Soluciones

#### ❌ No veo el botón "Crear" o "Create deployment"

**Posibles causas:**
- No tienes permisos suficientes en el recurso
- El recurso aún se está creando (espera unos minutos)
- Estás en la página incorrecta

**Solución:**
- Verifica que estás en la sección **"Deployments"** del menú lateral
- Refresca la página (F5)
- Verifica que el recurso esté completamente creado

#### ❌ No veo el modelo "gpt-5-mini" en la lista

**Posibles causas:**
- El modelo no está disponible en tu región
- Tu suscripción no tiene acceso a ese modelo

**Solución:**
- Busca **"gpt-4"** o **"gpt-35-turbo"** como alternativa
- Verifica que tu suscripción tenga acceso a Azure OpenAI
- Considera cambiar la región del recurso

#### ❌ No veo el modelo "DALL-E 3" en la lista

**Posibles causas:**
- DALL-E 3 no está disponible en tu región
- Tu suscripción no tiene acceso a DALL-E

**Solución:**
- Busca **"DALL-E 2"** o **"dall-e-2"** como alternativa
- Verifica que tu suscripción tenga acceso a modelos de imagen
- Considera cambiar la región del recurso

#### ❌ El deployment está en estado "Failed" (Fallido)

**Posibles causas:**
- Error en la configuración
- Cuota excedida
- Problema con el modelo seleccionado

**Solución:**
- Haz clic en el deployment para ver los detalles del error
- Intenta crear el deployment nuevamente
- Verifica tu cuota en Azure Portal
- Prueba con un modelo diferente

#### ❌ El deployment tarda mucho en crearse

**Normal:**
- Los deployments pueden tardar **2-5 minutos** en crearse
- DALL-E puede tardar un poco más que GPT

**Si tarda más de 10 minutos:**
- Refresca la página
- Verifica que no haya errores en el estado
- Intenta cancelar y crear nuevamente

---

### 3.6 Alternativa: Usar Azure OpenAI Studio

Si tienes problemas con el portal, puedes usar **Azure OpenAI Studio**:

1. En tu recurso Azure OpenAI, busca **"Go to Azure OpenAI Studio"** o **"Ir a Azure OpenAI Studio"**
2. En el estudio, ve a la sección **"Deployments"**
3. Sigue los mismos pasos para crear los deployments

**Ventaja**: Azure OpenAI Studio tiene una interfaz más moderna y clara.

---

## 📝 Paso 4: Configurar Variables de Entorno

Ahora que tienes todas las claves, actualiza tu archivo `backend/.env`:

### 4.1 Abrir el archivo .env

Abre el archivo `backend/.env` en tu editor de código.

### 4.2 Agregar las Variables

Agrega o actualiza las siguientes variables:

```env
# ============================================
# AZURE OPENAI - Frases y Sistema PCS Dinámica
# (Usa el mismo deployment para ambos)
# ============================================
AZURE_OPENAI_PHRASE_URL=https://tu-recurso.openai.azure.com
AZURE_OPENAI_PHRASE_KEY=tu-clave-api-aqui
AZURE_OPENAI_PHRASE_DEPLOYMENT=gpt-5-mini
AZURE_OPENAI_PHRASE_API_VERSION=2023-03-15-preview

# ============================================
# AZURE OPENAI - Generación de Imágenes
# ============================================
AZURE_OPENAI_IMAGE_ENDPOINT=https://tu-recurso.openai.azure.com
AZURE_OPENAI_IMAGE_API_KEY=tu-clave-api-aqui
AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME=dall-e-3
AZURE_OPENAI_IMAGE_API_VERSION=2024-02-01
```

### 4.3 Reemplazar los Valores

Reemplaza los siguientes valores con los que obtuviste:

- `https://tu-recurso.openai.azure.com` → Tu **Endpoint** del Paso 2.2
- `tu-clave-api-aqui` → Tu **KEY 1** o **KEY 2** del Paso 2.2
- `gpt-5-mini` → El nombre exacto del deployment que creaste en el Paso 3.1
- `dall-e-3` → El nombre exacto del deployment que creaste en el Paso 3.2

**⚠️ Importante**: 
- Puedes usar la misma KEY para ambas configuraciones (frases/PCS e imágenes)
- Puedes usar el mismo Endpoint para ambas configuraciones
- Los nombres de los deployments deben coincidir exactamente con los que creaste
- El mismo deployment `gpt-5-mini` se usa para frases Y para el sistema de PCS dinámica (keywords y categorías)

---

## ✅ Paso 5: Verificar la Configuración

### 5.1 Reiniciar el Servidor

Después de actualizar el archivo `.env`, reinicia tu servidor backend:

```bash
cd backend
npm run server
```

### 5.2 Verificar en los Logs

El servidor debería mostrar algo como:

```
✅ Azure OpenAI configurado (Proveedor Principal)
```

Si ves advertencias, verifica que:
- Los nombres de las variables estén correctos (sin espacios, sin errores tipográficos)
- Los valores no tengan comillas extra
- El archivo `.env` esté en la carpeta `backend/`

### 5.3 Probar la Conexión (Opcional)

Puedes ejecutar el script de prueba:

```bash
cd backend
node test-azure-direct.js
```

Este script verificará que las claves funcionen correctamente.

---

## 🔍 Resumen: Qué Usa Cada Deployment

### Deployment `gpt-5-mini` (Frases y PCS Dinámica)

Este deployment se usa en:
- **`backend/services/azureService.ts`**: Generación de frases naturales
- **`backend/services/categoryService.ts`**: 
  - Generación de keywords para categorías dinámicas
  - Generación de tags para categorías dinámicas
  - Búsqueda inteligente de pictogramas usando IA

**Variables de entorno relacionadas:**
- `AZURE_OPENAI_PHRASE_URL`
- `AZURE_OPENAI_PHRASE_KEY`
- `AZURE_OPENAI_PHRASE_DEPLOYMENT`
- `AZURE_OPENAI_PHRASE_API_VERSION`

### Deployment `dall-e-3` (Imágenes)

Este deployment se usa en:
- **`backend/services/imageService.ts`**: Generación de imágenes para frases AAC

**Variables de entorno relacionadas:**
- `AZURE_OPENAI_IMAGE_ENDPOINT`
- `AZURE_OPENAI_IMAGE_API_KEY`
- `AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME`
- `AZURE_OPENAI_IMAGE_API_VERSION`

---

## 🔍 Ubicación de las Claves en el Portal

### Resumen Visual de Dónde Encontrar Todo:

```
Portal de Azure
└── Azure OpenAI (tu recurso)
    ├── Claves y punto de conexión (Keys and Endpoint)
    │   ├── Endpoint → AZURE_OPENAI_PHRASE_URL y AZURE_OPENAI_IMAGE_ENDPOINT
    │   └── KEY 1 o KEY 2 → AZURE_OPENAI_PHRASE_KEY y AZURE_OPENAI_IMAGE_API_KEY
    │
    └── Deployments (Implementaciones)
        ├── gpt-5-mini → AZURE_OPENAI_PHRASE_DEPLOYMENT
        │   └── Usado para: Frases + Keywords/Tags de PCS dinámica
        └── dall-e-3 → AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME
            └── Usado para: Generación de imágenes
```

---

## 🆘 Solución de Problemas

### Error: "Azure OpenAI no está configurado"

- Verifica que el archivo `backend/.env` existe
- Verifica que las variables tienen los nombres exactos (sin espacios, sin errores)
- Reinicia el servidor después de cambiar el `.env`

### Error: "API Key inválida" o "401 Unauthorized"

- Verifica que copiaste la clave completa (son muy largas)
- Asegúrate de no tener espacios extra al inicio o final
- Verifica que estás usando KEY 1 o KEY 2 (no el Endpoint como clave)

### Error: "Deployment no encontrado" o "404 Not Found"

- Verifica que el nombre del deployment coincide exactamente
- Verifica que el deployment está completamente creado (puede tardar unos minutos)
- Ve a la sección "Deployments" y verifica que existe
- Recuerda que `gpt-5-mini` se usa tanto para frases como para keywords/tags

### Error: "Se ha excedido la cuota"

- Verifica tu plan de tarifa en Azure
- Revisa el uso en el portal de Azure
- Considera actualizar tu plan si es necesario

### Error al crear categorías dinámicas

- Verifica que `AZURE_OPENAI_PHRASE_URL` y `AZURE_OPENAI_PHRASE_KEY` estén configuradas
- Verifica que el deployment `gpt-5-mini` existe y está activo
- Revisa los logs del servidor para ver errores específicos

---

## 📚 Recursos Adicionales

- [Documentación de Azure OpenAI](https://learn.microsoft.com/azure/ai-services/openai/)
- [Guía de Deployments](https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource?pivots=web-portal)
- [Precios de Azure OpenAI](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)

---

## ✨ Notas Finales

- **Seguridad**: Nunca compartas tus claves API ni las subas a Git
- **Mismo Recurso**: Puedes usar el mismo recurso de Azure OpenAI para frases/PCS e imágenes
- **Misma Clave**: Puedes usar la misma KEY para ambas configuraciones
- **Mismo Endpoint**: Puedes usar el mismo Endpoint para ambas configuraciones
- **Deployments Separados**: Necesitas deployments separados para GPT (frases/PCS) y DALL-E (imágenes)
- **Un Deployment, Múltiples Usos**: El deployment `gpt-5-mini` se usa tanto para generar frases como para generar keywords/tags del sistema PCS dinámica

¡Listo! Con estos pasos deberías tener todas las claves configuradas correctamente. 🎉
