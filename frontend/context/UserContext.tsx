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
  // Autenticación
  loginWithEmailAndPassword: (email: string, password: string) => Promise<void>;
  registerWithEmailAndPassword: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  // Actualización de datos
  updateUser: (updates: Partial<Omit<User, 'id' | 'preferences'>>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  // Símbolos PCS personalizados
  addCustomSymbol: (symbol: Omit<CustomPCSSymbol, 'id' | 'addedAt'>) => Promise<void>;
  removeCustomSymbol: (symbolId: string) => Promise<void>;
  // Utilidades
  refreshUser: () => Promise<void>;
}

// Crear el contexto
const UserContext = createContext<UserContextType | undefined>(undefined);

// Props del provider
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
   * Convierte un usuario de Firebase + Firestore a nuestro tipo User
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
        // childAge y parentMenuPassword se configurarán más tarde en el onboarding
        // No los incluimos aquí para mantener consistencia
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
        
        // Guardar en caché
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        console.log('✅ Datos del usuario cargados y guardados en caché');
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
      console.error('❌ Error cargando datos del usuario:', err);
      setError(err.message || 'Error al cargar datos del usuario');
      
      // Intentar cargar desde caché como fallback
      try {
        const cachedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          console.log('⚠️ Usando datos del caché');
        }
      } catch (cacheErr) {
        console.error('❌ Error cargando caché:', cacheErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔐 Usuario autenticado:', firebaseUser.uid);
        await loadUserData(firebaseUser);
      } else {
        console.log('👋 Usuario no autenticado');
        setUser(null);
        setIsLoading(false);
        // Limpiar caché
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, []);

  /**
   * Registra un nuevo usuario
   */
  const registerWithEmailAndPassword = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    try {
      setError(null);
      console.log('📝 Registrando usuario:', email);

      const firebaseUser = await registerUser(email, password, fullName);
      
      // Crear documento en Firestore
      await createUserDocument(firebaseUser.uid, email, fullName);
      
      // Los datos se cargarán automáticamente por el listener
      console.log('✅ Usuario registrado exitosamente');
    } catch (err: any) {
      console.error('❌ Error registrando usuario:', err);
      setError(err.message || 'Error al registrar usuario');
      throw err;
    }
  };

  /**
   * Inicia sesión
   */
  const loginWithEmailAndPassword = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('🔐 Iniciando sesión:', email);

      await loginUser(email, password);
      
      // Los datos se cargarán automáticamente por el listener
      console.log('✅ Sesión iniciada exitosamente');
    } catch (err: any) {
      console.error('❌ Error iniciando sesión:', err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  /**
   * Cierra sesión
   */
  const logout = async () => {
    try {
      setError(null);
      console.log('👋 Cerrando sesión');

      await firebaseSignOut();
      setUser(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      
      console.log('✅ Sesión cerrada');
    } catch (err: any) {
      console.error('❌ Error cerrando sesión:', err);
      setError(err.message || 'Error al cerrar sesión');
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
      console.log('✏️ Actualizando usuario');

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
   * Actualiza preferencias del usuario
   */
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      console.log('⚙️ Actualizando preferencias');

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
   * Añade un símbolo PCS personalizado
   */
  const addCustomSymbol = async (symbol: Omit<CustomPCSSymbol, 'id' | 'addedAt'>) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      console.log('➕ Añadiendo símbolo personalizado:', symbol.word);

      const newSymbol: CustomPCSSymbol = {
        ...symbol,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Timestamp.now()
      };

      const updatedSymbols = [...user.preferences.customPCSSymbols, newSymbol];
      await updatePreferences({ customPCSSymbols: updatedSymbols });
      
      console.log('✅ Símbolo añadido');
    } catch (err: any) {
      console.error('❌ Error añadiendo símbolo:', err);
      setError(err.message || 'Error al añadir símbolo');
      throw err;
    }
  };

  /**
   * Elimina un símbolo PCS personalizado
   */
  const removeCustomSymbol = async (symbolId: string) => {
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      console.log('➖ Eliminando símbolo:', symbolId);

      const updatedSymbols = user.preferences.customPCSSymbols.filter(
        (s) => s.id !== symbolId
      );
      await updatePreferences({ customPCSSymbols: updatedSymbols });
      
      console.log('✅ Símbolo eliminado');
    } catch (err: any) {
      console.error('❌ Error eliminando símbolo:', err);
      setError(err.message || 'Error al eliminar símbolo');
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
 * Hook para usar el contexto de usuario
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error('useUser debe usarse dentro de un UserProvider');
  }
  
  return context;
};
