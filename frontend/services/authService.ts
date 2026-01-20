import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Registers a new user with email and password
 */
export async function registerUser(email: string, password: string, fullName: string): Promise<FirebaseUser> {
  try {
    console.log('Registering new user:', email);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with name
    await updateProfile(user, {
      displayName: fullName
    });
    
    console.log('User registered successfully:', user.uid);
    return user;
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw handleAuthError(error);
  }
}

/**
 * Logs in with email and password
 */
export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  try {
    console.log('Logging in:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Session started successfully:', user.uid);
    return user;
  } catch (error: any) {
    console.error('Error logging in:', error);
    throw handleAuthError(error);
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<void> {
  try {
    console.log('Signing out');
    await firebaseSignOut(auth);
    console.log('Session closed successfully');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Gets the currently authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Subscribes to authentication state changes
 */
export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Handles Firebase authentication errors and converts them to readable messages
 */
function handleAuthError(error: any): Error {
  let message = 'Unknown authentication error';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email';
      break;
    case 'auth/operation-not-allowed':
      message = 'Operation not allowed';
      break;
    case 'auth/weak-password':
      message = 'Password must be at least 6 characters';
      break;
    case 'auth/user-disabled':
      message = 'This account has been disabled';
      break;
    case 'auth/user-not-found':
      message = 'User not found';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid credentials';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Try again later';
      break;
    case 'auth/network-request-failed':
      message = 'Connection error. Check your internet';
      break;
    default:
      message = error.message || 'Authentication error';
  }
  
  return new Error(message);
}

