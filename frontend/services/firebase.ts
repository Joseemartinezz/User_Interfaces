import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { Platform } from 'react-native';

// Firebase configuration
// IMPORTANT: Replace these values with your Firebase project values
// You can get them at: Firebase Console > Project Settings > General
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
// NOTE: The AsyncStorage warning is expected in some environments.
// Firebase Auth will work correctly, but persistence between sessions
// will be handled through UserContext which uses AsyncStorage directly.
// For a complete solution, consider using @react-native-firebase/auth
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics safely
// Only initializes if supported on the platform
let analytics = null;
(async () => {
  try {
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Analytics not supported on this platform');
    }
  } catch (error) {
    console.log('Analytics not available:', error);
  }
})();

export { analytics };

// Log for debugging
console.log('Firebase initialized');
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   Platform:', Platform.OS);

export default app;
