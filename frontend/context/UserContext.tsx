import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as FirebaseUser } from 'firebase/auth';
import {
  registerUser,
  loginUser,
  signOut as firebaseSignOut,
  subscribeToAuthChanges,
  getCurrentUser
} from '../services/authService';
import {
  createUserDocument,
  getUserData,
  updateUserData,
  updateUserPreferences
} from '../services/firestoreService';
import { User, UserPreferences, CustomPCSSymbol } from '../types/user';
import { Timestamp } from 'firebase/firestore';

// Key para AsyncStorage
const USER_STORAGE_KEY = '@aac_user_data';

/**
 * Contexto de usuario con Firebase
 */
interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  // Authentication
  loginWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailAndPassword: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  // Data updates
  updateUser: (updates: Partial<Omit<User, 'id' | 'preferences'>>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  // Custom PCS symbols
  addCustomSymbol: (symbol: Omit<CustomPCSSymbol, 'id' | 'addedAt'>) => Promise<void>;
  removeCustomSymbol: (symbolId: string) => Promise<void>;
  // Utilities
  refreshUser: () => Promise<void>;
}

// Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider props
interface UserProviderProps {
  children: ReactNode;
}

/**
 * Provider de usuario que gestiona el estado global con Firebase
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Converts a Firebase + Firestore user to our User type
   */
  const convertToUser = (firebaseUser: FirebaseUser, userData: any): User => {
    return {
      id: firebaseUser.uid,
      email: userData.email || firebaseUser.email || '',
      fullName: userData.fullName || firebaseUser.displayName || '',
      preferences: userData.preferences || {
        language: 'en',
        theme: 1,
        customPCSSymbols: [],
        categories: [],
        hiddenCategories: [],
        hasCompletedOnboarding: false,
        // childAge and parentMenuPassword will be configured later in onboarding
        // We don't include them here to maintain consistency
      }
    };
  };

  /**
   * Carga los datos del usuario desde Firestore
   */
  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📥 Cargando datos del usuario:', firebaseUser.uid);

      // Obtener datos de Firestore
      const userData = await getUserData(firebaseUser.uid);
      
      if (userData) {
        const user = convertToUser(firebaseUser, userData);
        setUser(user);
        
        // Save to cache
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        console.log('✅ User data loaded and saved to cache');
      } else {
        console.log('⚠️ Usuario sin datos en Firestore, creando documento...');
        // Si no existe el documento, crearlo
        await createUserDocument(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || 'Usuario'
        );
        // Recargar datos
        await loadUserData(firebaseUser);
      }
    } catch (err: any) {
      console.error('❌ Error loading user data:', err);
      setError(err.message || 'Error loading user data');
      
      // Try loading from cache as fallback
      try {
        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          console.log('⚠️ Using cached data');
        }
      } catch (cacheErr) {
        console.error('❌ Error loading cache:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles authentication state changes
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 User authenticated:', firebaseUser.uid);
        await loadUserData(firebaseUser);
      } else {
        console.log('👋 User not authenticated');
        setUser(null);
        setIsLoading(false);
        // Clear cache
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  /**
   * Registers a new user
   */
  const registerWithEmailAndPassword = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    try {
      setError(null);
      console.log('📝 Registering user:', email);

      const firebaseUser = await registerUser(email, password, fullName);
      
      // Crear documento en Firestore
      await createUserDocument(firebaseUser.uid, email, fullName);
      
      // Data will be loaded automatically by the listener
      console.log('✅ Usuario registrado exitosamente');
    } catch (err: any) {
      console.error('❌ Error registrando usuario:', err);
      setError(err.message || 'Error al registrar usuario');
      throw err;
    }
  };

  /**
   * Logs in
   */
  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('🔐 Logging in:', email);

      await loginUser(email, password);
      
      // Data will be loaded automatically by the listener
      console.log('✅ Session started successfully');
    } catch (err: any) {
      console.error('❌ Error logging in:', err);
      setError(err.message || 'Error logging in');
      throw err;
    }
  };

  /**
   * Logs out
   */
  const logout = async () => {
    try {
      setError(null);
      console.log('👋 Logging out');

      await firebaseSignOut();
      setUser(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      console.log('✅ Session closed');
    } catch (err: any) {
      console.error('❌ Error logging out:', err);
      setError(err.message || 'Error logging out');
      throw err;
    }
  };

  /**
   * Actualiza datos del usuario (nombre, email)
   */
  const updateUser = async (updates: Partial<Omit<User, 'id' | 'preferences'>>) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      console.log('✏️ Updating user');

      await updateUserData(user.id, updates);
      
      // Actualizar estado local
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      console.log('✅ Usuario actualizado');
    } catch (err: any) {
      console.error('❌ Error actualizando usuario:', err);
      setError(err.message || 'Error al actualizar usuario');
      throw err;
    }
  };

  /**
   * Updates user preferences
   */
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      console.log('⚙️ Updating preferences');

      await updateUserPreferences(user.id, preferences);
      
      // Actualizar estado local
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, ...preferences }
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      console.log('✅ Preferencias actualizadas');
    } catch (err: any) {
      console.error('❌ Error actualizando preferencias:', err);
      setError(err.message || 'Error al actualizar preferencias');
      throw err;
    }
  };

  /**
   * Adds a custom PCS symbol
   */
  const addCustomSymbol = async (symbol: Omit<CustomPCSSymbol, 'id' | 'addedAt'>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      setError(null);
      console.log('➕ Adding custom symbol:', symbol.word);

      const newSymbol: CustomPCSSymbol = {
        ...symbol,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Timestamp.now()
      };

      const updatedSymbols = [...user.preferences.customPCSSymbols, newSymbol];
      await updatePreferences({ customPCSSymbols: updatedSymbols });
      
      console.log('✅ Symbol added');
    } catch (err: any) {
      console.error('❌ Error adding symbol:', err);
      setError(err.message || 'Error adding symbol');
      throw err;
    }
  };

  /**
   * Removes a custom PCS symbol
   */
  const removeCustomSymbol = async (symbolId: string) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      setError(null);
      console.log('➖ Removing symbol:', symbolId);

      const updatedSymbols = user.preferences.customPCSSymbols.filter(
        (s) => s.id !== symbolId
      );
      await updatePreferences({ customPCSSymbols: updatedSymbols });
      
      console.log('✅ Symbol removed');
    } catch (err: any) {
      console.error('❌ Error removing symbol:', err);
      setError(err.message || 'Error removing symbol');
      throw err;
    }
  };

  /**
   * Refresca los datos del usuario desde Firestore
   */
  const refreshUser = async () => {
    const firebaseUser = getCurrentUser();
    if (firebaseUser) {
      await loadUserData(firebaseUser);
    }
  };

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    loginWithEmailAndPassword,
    registerWithEmailAndPassword,
    logout,
    updateUser,
    updatePreferences,
    addCustomSymbol,
    removeCustomSymbol,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Hook to use user context
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  
  if (context === undefined) {
      throw new Error('useUser must be used within a UserProvider');
  }
  
  return context;
};
