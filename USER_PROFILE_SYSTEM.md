# Sistema de Usuarios y Perfil

## 📋 Descripción General

Sistema completo de gestión de usuarios y perfil con generación de avatares personalizados. Incluye backend API, contexto global de usuario, pantalla de perfil editable, y integración con el generador de avatares DiceBear.

## 🎯 Características Implementadas

### 1. **Backend API (Node.js/Express)**

#### Endpoints de Usuario:
- `GET /api/user` - Obtiene datos del usuario actual
- `PUT /api/user` - Actualiza datos del usuario
- `POST /api/user/reset` - Resetea el usuario a valores por defecto
- `POST /api/avatar` - Genera avatar basado en datos del usuario
- `GET /api/user/initials` - Obtiene iniciales del usuario

#### Almacenamiento:
- Almacenamiento en memoria (para prototipo)
- Datos por defecto: `{ id: 'default-user', email: 'user@example.com', fullName: 'Usuario' }`

### 2. **Generador de Avatares**

**Archivo:** `backend/utils/avatarGenerator.js`

#### Características:
- **Generación Determinística**: Mismo usuario = mismo avatar
- **Lazy Loading**: DiceBear se carga solo cuando es necesario
- **Caché en Memoria**: Evita regeneraciones innecesarias
- **Estilo**: `botttsNeutral` con gradientes lineales
- **24 Colores de Fondo**: Paleta predefinida de colores vibrantes

#### Funciones Principales:
```javascript
generateUserAvatar(seed)          // Genera SVG del avatar
generateAvatarDataUrl(seed)       // Genera Data URL para uso en img
createUserSeed(userId, email, fullName)  // Crea seed consistente
getInitials(fullName, email)      // Obtiene iniciales para fallback
```

### 3. **Frontend - Contexto de Usuario**

**Archivo:** `frontend/context/UserContext.tsx`

#### Características:
- **Estado Global**: Gestiona el usuario en toda la app
- **Persistencia**: Usa AsyncStorage para guardar datos localmente
- **Sincronización**: Se sincroniza con el backend automáticamente
- **Manejo de Errores**: Estados de loading y error

#### Hook:
```typescript
const { user, isLoading, error, updateUser, resetUser, refreshUser } = useUser();
```

### 4. **Frontend - API Client**

**Archivo:** `frontend/api.ts`

#### Funciones Agregadas:
```typescript
getUser(): Promise<User | null>
updateUser(updates): Promise<User | null>
resetUser(): Promise<User | null>
getUserAvatarUrl(user): Promise<string | null>
```

#### Tipo de Usuario:
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  preferences: {
    language: string;
    theme: number;
    fontSize: string;
    voiceSpeed: number;
  };
}
```

### 5. **Frontend - Utilidades**

**Archivo:** `frontend/utils/index.ts`

#### Funciones:
- `getInitials(fullName, email)` - Extrae iniciales para fallback
- `isValidEmail(email)` - Valida formato de email
- `isValidName(name)` - Valida nombre (mínimo 2 caracteres, solo letras)
- `truncateText(text, maxLength)` - Trunca texto con elipsis

### 6. **ProfileScreen - Pantalla de Perfil**

**Archivo:** `frontend/screens/ProfileScreen.tsx`

#### Características:
- ✅ Edición de nombre y email con validación
- ✅ Visualización de avatar generado automáticamente
- ✅ Fallback a iniciales si falla la carga del avatar
- ✅ Visualización de preferencias (solo lectura)
- ✅ Botón de guardar cambios
- ✅ Botón de resetear perfil (con confirmación)
- ✅ Estados de carga y manejo de errores
- ✅ Diseño responsive con ScrollView
- ✅ Integración completa con tema

### 7. **ProfileButton - Botón de Perfil Actualizado**

**Archivo:** `frontend/components/common/ProfileButton.tsx`

#### Mejoras:
- ✅ Integración con UserContext (datos reales del usuario)
- ✅ Carga dinámica de avatar desde backend
- ✅ Fallback a iniciales cuando falla la carga
- ✅ Estados de carga con ActivityIndicator
- ✅ Manejo de errores graceful
- ✅ Actualización automática cuando cambia el usuario

### 8. **Integración en la App**

**Archivo:** `App.tsx`

#### Cambios:
- ✅ Agregado `UserProvider` envolviendo la navegación
- ✅ Nueva ruta `Profile` en el stack navigator
- ✅ Ruta agregada a tipos de navegación (`RootStackParamList`)

**Archivo:** `frontend/screens/ParentMenuScreen.tsx`
- ✅ Botón para acceder al perfil de usuario agregado

## 🚀 Uso

### Acceder al Perfil:
1. Hacer clic en el botón de perfil (esquina superior derecha)
2. Ir a "Parent Menu"
3. Seleccionar "User Profile"

### Editar Perfil:
1. Modificar nombre y/o email
2. Hacer clic en "Guardar Cambios"
3. El avatar se regenerará automáticamente

### Resetear Perfil:
1. Hacer clic en "Resetear Perfil"
2. Confirmar en el diálogo
3. Los datos volverán a los valores por defecto

## 📁 Estructura de Archivos

```
AAC/
├── backend/
│   ├── utils/
│   │   └── avatarGenerator.js       # Generador de avatares (DiceBear)
│   └── index.js                      # API endpoints de usuario
├── frontend/
│   ├── api.ts                        # Cliente API
│   ├── utils/
│   │   └── index.ts                  # Funciones auxiliares
│   ├── context/
│   │   ├── UserContext.tsx           # Contexto de usuario
│   │   └── ThemeContext.tsx          # Contexto de tema (existente)
│   ├── components/
│   │   └── common/
│   │       └── ProfileButton.tsx     # Botón de perfil actualizado
│   ├── screens/
│   │   ├── ProfileScreen.tsx         # Pantalla de perfil (NUEVA)
│   │   └── ParentMenuScreen.tsx      # Menú de padres (actualizado)
│   └── types/
│       └── navigation.ts             # Tipos de navegación (actualizado)
└── App.tsx                           # App principal (actualizado)
```

## 🔧 Dependencias

### Backend:
- `@dicebear/core@^9.2.3` ✅
- `@dicebear/collection@^9.2.3` ✅

### Frontend:
- `@react-native-async-storage/async-storage` (ya instalado)
- Todas las demás son dependencias existentes

## 🎨 Flujo de Datos

```
ProfileScreen (edita)
    ↓
UserContext.updateUser()
    ↓
API.updateUser() → Backend /api/user
    ↓
Backend actualiza userData
    ↓
Response con usuario actualizado
    ↓
UserContext actualiza estado
    ↓
AsyncStorage persiste datos
    ↓
ProfileButton reacciona al cambio
    ↓
Avatar se regenera con nuevos datos
```

## 🔒 Validaciones

### Nombre:
- Mínimo 2 caracteres
- Solo letras y espacios
- No puede estar vacío

### Email:
- Formato válido (regex)
- No puede estar vacío

## 🎯 Próximas Mejoras Posibles

1. **Base de Datos Real**: Reemplazar almacenamiento en memoria con MongoDB/PostgreSQL
2. **Autenticación**: Agregar login/registro con JWT
3. **Múltiples Usuarios**: Soporte para cambiar entre usuarios
4. **Edición de Preferencias**: Hacer editables los campos de preferencias
5. **Cambio de Avatar**: Permitir seleccionar avatar personalizado
6. **Validación de Email**: Agregar verificación de email real
7. **Historial**: Guardar historial de cambios del perfil

## 📱 Capturas de Flujo

1. **ProfileButton** → Muestra avatar generado o iniciales
2. **ParentMenu** → Botón "User Profile"
3. **ProfileScreen** → Formulario de edición completo
4. **Avatar** → Generado automáticamente basado en datos

## 🐛 Manejo de Errores

- ✅ Validación de formularios con mensajes claros
- ✅ Fallback a iniciales si avatar falla
- ✅ Estados de carga en todas las operaciones
- ✅ Mensajes de error informativos
- ✅ Confirmación antes de operaciones destructivas

## ✅ Estado: COMPLETO

Todos los componentes están implementados y funcionando. El sistema está listo para usar en desarrollo.

