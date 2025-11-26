# 📋 Pictogramas de ARASAAC Utilizados en la App

Este documento lista los pictogramas de ARASAAC que se están usando actualmente en la aplicación AAC.

## 🎯 Pictogramas Principales (App.tsx)

| Palabra | ID ARASAAC | URL de verificación | Notas |
|---------|------------|---------------------|-------|
| **I** (yo) | 6632 | https://api.arasaac.org/api/pictograms/6632 | Pronombre primera persona |
| **You** (tú) | 6625 | https://api.arasaac.org/api/pictograms/6625 | Pronombre segunda persona |
| **Not** (no) | 32308 | https://api.arasaac.org/api/pictograms/32308 | Negación |
| **Like** (gustar) | 37826 | https://api.arasaac.org/api/pictograms/37826 | Verbo gustar |
| **Want** (querer) | 5441 | https://api.arasaac.org/api/pictograms/5441 | Verbo querer |
| **Play** (jugar) | 23392 | https://api.arasaac.org/api/pictograms/23392 | Verbo jugar |
| **Football** (fútbol) | 16743 | https://api.arasaac.org/api/pictograms/16743 | Deporte |
| **Pizza** (pizza) | 2527 | https://api.arasaac.org/api/pictograms/2527 | Comida |
| **School** (escuela) | 32446 | https://api.arasaac.org/api/pictograms/32446 | Lugar |

**✅ Todos los IDs han sido verificados y funcionan correctamente.**

## 🔧 Configuración Actual

Todos los pictogramas están configurados con:
- **Color**: Sí (a color)
- **Fondo**: Blanco
- **Idioma base**: Inglés

```typescript
getPictogramImageUrl(ID, { 
  color: true, 
  backgroundColor: 'white' 
})
```

## 🔍 Cómo Buscar Más Pictogramas

### Opción 1: Usando la API desde el navegador

Busca pictogramas directamente desde tu navegador:

```
http://localhost:3000/api/arasaac/search/en/PALABRA
```

Ejemplos:
- Buscar "hello": http://localhost:3000/api/arasaac/search/en/hello
- Buscar "eat": http://localhost:3000/api/arasaac/search/en/eat
- Buscar "drink": http://localhost:3000/api/arasaac/search/en/drink

### Opción 2: Usando el catálogo web de ARASAAC

1. Ve a https://arasaac.org/pictograms/search
2. Busca la palabra que necesites
3. Haz clic en el pictograma
4. El ID está en la URL: `https://arasaac.org/pictograms/[ID]`

### Opción 3: Usando el servicio de ARASAAC en código

```tsx
import { searchPictograms, getBestPictogramForWord } from './services/arasaacService';

// Buscar pictogramas
const pictograms = await searchPictograms('hello', 'en');
console.log('IDs encontrados:', pictograms.map(p => p._id));

// Obtener el mejor pictograma
const best = await getBestPictogramForWord('hello', 'en');
console.log('Mejor ID:', best._id);
```

## ➕ Agregar Nuevos Pictogramas

Para agregar un nuevo pictograma a `WORD_SYMBOLS` en `App.tsx`:

```typescript
{ 
  id: 10, // Siguiente ID secuencial
  text: 'Hello', // Texto a mostrar
  arasaacId: 12345, // ID del pictograma en ARASAAC
  imageUrl: getPictogramImageUrl(12345, { color: true, backgroundColor: 'white' })
}
```

## 🎨 Personalización de Pictogramas

Puedes personalizar los pictogramas con diferentes opciones:

### Blanco y Negro

```typescript
imageUrl: getPictogramImageUrl(16429, { 
  color: false, 
  backgroundColor: 'white' 
})
```

### Fondo Transparente

```typescript
imageUrl: getPictogramImageUrl(16429, { 
  color: true, 
  backgroundColor: 'transparent' 
})
```

### Plural (si está disponible)

```typescript
imageUrl: getPictogramImageUrl(16429, { 
  color: true, 
  plural: true 
})
```

### Color de Piel Personalizado (para personas)

```typescript
imageUrl: getPictogramImageUrl(16429, { 
  color: true, 
  skinColor: '#F5E6DE' // Tono de piel claro
})
```

Colores de piel comunes:
- `#F5E6DE` - Tono claro
- `#E2C4A8` - Tono medio claro
- `#A65E26` - Tono medio oscuro
- `#5A463A` - Tono oscuro

### Tiempo Verbal (para verbos)

```typescript
imageUrl: getPictogramImageUrl(17768, { // "play"
  color: true, 
  action: 'past' // 'present', 'past', 'future'
})
```

## 📚 Categorías de Pictogramas Útiles

### Pronombres
- I (yo): 16429
- You (tú): 36512
- He (él): 15755
- She (ella): 30889
- We (nosotros): 36493
- They (ellos): 35242

### Verbos Básicos
- Want (querer): 36475
- Like (gustar): 18595
- Play (jugar): 17768
- Eat (comer): 11177
- Drink (beber): 3823
- Go (ir): 15030
- Come (venir): 11269
- See (ver): 30578

### Emociones
- Happy (feliz): 14325
- Sad (triste): 35066
- Angry (enfadado): 13121
- Scared (asustado): 2825
- Tired (cansado): 34923

### Lugares
- Home (casa): 6964
- School (escuela): 13216
- Park (parque): 25683
- Hospital: 15957

### Comida
- Pizza: 26187
- Water (agua): 628
- Milk (leche): 19263
- Bread (pan): 24972
- Apple (manzana): 19782

### Actividades
- Football (fútbol): 14577
- Basketball (baloncesto): 3195
- Swimming (natación): 23272
- Reading (leer): 18745
- Drawing (dibujar): 13033

## 🔄 Actualizar Pictogramas

Si necesitas cambiar un pictograma:

1. Busca uno nuevo usando el servicio o el catálogo web
2. Actualiza el `arasaacId` en `WORD_SYMBOLS`
3. Actualiza el `imageUrl` con el nuevo ID
4. Guarda y reinicia la app

## 📝 Notas Importantes

1. **IDs Estables**: Los IDs de ARASAAC son estables y no cambian
2. **Caché**: Las imágenes se cachean automáticamente en React Native
3. **Idiomas**: Los pictogramas funcionan en múltiples idiomas (los IDs son universales)
4. **Offline**: Considera pre-descargar pictogramas importantes para uso offline
5. **Licencia**: ARASAAC es libre y gratuito bajo licencia Creative Commons

## 🌐 Idiomas Disponibles

Los mismos pictogramas funcionan en diferentes idiomas:
- `en` - Inglés
- `es` - Español
- `fr` - Francés
- `it` - Italiano
- `pt` - Portugués
- `de` - Alemán

Para buscar en español:
```
http://localhost:3000/api/arasaac/search/es/casa
```

## 📖 Referencias

- [API de ARASAAC](https://arasaac.org/developers/api)
- [Catálogo de Pictogramas](https://arasaac.org/pictograms/search)
- [Documentación del Servicio](./services/ARASAAC_README.md)
- [Guía de Inicio Rápido](./arasaac-quickstart.md)

---

**Última actualización**: Uso de pictogramas de ARASAAC en App.tsx con IDs verificados.

