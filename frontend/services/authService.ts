import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { Platform } from 'react-native';

/**
 * Registra un nuevo usuario con email y contraseña
 */
export async function registerUser(email: string, password: string, fullName: string): Promise<FirebaseUser> {
  try {
    console.log('📝 Registrando nuevo usuario:', email);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Actualizar el perfil con el nombre
    await updateProfile(user, {
      displayName: fullName
    });
    
    console.log('✅ Usuario registrado exitosamente:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ Error registrando usuario:', error);
    throw handleAuthError(error);
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  try {
    console.log('🔐 Iniciando sesión:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sesión iniciada exitosamente:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ Error iniciando sesión:', error);
    throw handleAuthError(error);
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut(): Promise<void> {
  try {
    console.log('👋 Cerrando sesión');
    await firebaseSignOut(auth);
    console.log('✅ Sesión cerrada exitosamente');
  } catch (error: any) {
    console.error('❌ Error cerrando sesión:', error);
    throw error;
  }
}

/**
 * Obtiene el usuario actualmente autenticado
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Inicia sesión con Google en web
 */
export async function loginWithGoogleWeb(): Promise<FirebaseUser> {
  try {
    console.log('🔐 Iniciando sesión con Google (web)...');
    
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Sesión con Google iniciada exitosamente:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('❌ Error iniciando sesión con Google:', error);
    throw handleAuthError(error);
  }
}

/**
 * Inicia sesión con Google en React Native usando un token ID
 * @param idToken - Token ID de Google obtenido de expo-auth-session
 */
export async function loginWithGoogleNative(idToken: string): Promise<FirebaseUser> {
  try {
    console.log('🔐 Iniciando sesión con Google (React Native)...');
    
    if (!idToken) {
      throw new Error('Token ID de Google no proporcionado');
    }

    // Crear credencial de Google para Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    
    console.log('✅ Sesión con Google iniciada exitosamente:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Error iniciando sesión con Google:', error);
    throw handleAuthError(error);
  }
}

/**
 * Suscribe a cambios en el estado de autenticación
 */
export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Maneja errores de autenticación de Firebase y los convierte a mensajes legibles
 */
function handleAuthError(error: any): Error {
  let message = 'Error de autenticación desconocido';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'Este email ya está registrado';
      break;
    case 'auth/invalid-email':
      message = 'Email inválido';
      break;
    case 'auth/operation-not-allowed':
      message = 'Operación no permitida';
      break;
    case 'auth/weak-password':
      message = 'La contraseña debe tener al menos 6 caracteres';
      break;
    case 'auth/user-disabled':
      message = 'Esta cuenta ha sido deshabilitada';
      break;
    case 'auth/user-not-found':
      message = 'Usuario no encontrado';
      break;
    case 'auth/wrong-password':
      message = 'Contraseña incorrecta';
      break;
    case 'auth/invalid-credential':
      message = 'Credenciales inválidas';
      break;
    case 'auth/too-many-requests':
      message = 'Demasiados intentos fallidos. Intenta más tarde';
      break;
    case 'auth/network-request-failed':
      message = 'Error de conexión. Verifica tu internet';
      break;
    default:
      message = error.message || 'Error de autenticación';
  }
  
  return new Error(message);
}

