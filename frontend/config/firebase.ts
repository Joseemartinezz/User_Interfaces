import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
// Los puedes obtener en: Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEMO_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
// NOTA: La advertencia sobre AsyncStorage es esperada en algunos entornos.
// Firebase Auth funcionará correctamente, pero la persistencia entre sesiones
// se manejará a través del UserContext que usa AsyncStorage directamente.
// Para una solución completa, considera usar @react-native-firebase/auth
export const auth = getAuth(app);
export const db = getFirestore(app);

// Inicializar Analytics de forma segura
// Solo se inicializa si está soportado en la plataforma
let analytics = null;
(async () => {
  try {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics inicializado');
    } else {
      console.log('⚠️ Analytics no soportado en esta plataforma');
    }
  } catch (error) {
    console.log('⚠️ Analytics no disponible:', error);
  }
})();

export { analytics };

// Log para debugging
console.log('🔥 Firebase inicializado');
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   Platform:', Platform.OS);

export default app;

