import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserData, UserPreferences, CustomPCSSymbol } from '../types/user';

/**
 * Crea o actualiza el documento de usuario en Firestore
 */
export async function createUserDocument(
  userId: string, 
  email: string, 
  fullName: string
): Promise<void> {
  try {
    console.log('📄 Creando documento de usuario:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userData: UserData = {
      id: userId,
      email,
      fullName,
      preferences: {
        language: 'es',
        theme: 1,
        fontSize: 'medium',
        voiceSpeed: 1.0,
        colorPalette: 'default',
        preferredFontSize: 'medium',
        customPCSSymbols: [],
        categories: [],
        hiddenCategories: []
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(userRef, userData);
    console.log('✅ Documento de usuario creado');
  } catch (error: any) {
    console.error('❌ Error creando documento de usuario:', error);
    throw error;
  }
}

/**
 * Obtiene los datos del usuario desde Firestore
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    console.log('🔍 Obteniendo datos del usuario:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data() as UserData;
      console.log('✅ Datos del usuario obtenidos');
      return data;
    } else {
      console.log('⚠️ Documento de usuario no encontrado');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error obteniendo datos del usuario:', error);
    throw error;
  }
}

/**
 * Actualiza los datos del usuario en Firestore
 */
export async function updateUserData(
  userId: string, 
  updates: Partial<Omit<UserData, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('✏️ Actualizando usuario:', userId);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Usuario actualizado');
  } catch (error: any) {
    console.error('❌ Error actualizando usuario:', error);
    throw error;
  }
}

/**
 * Actualiza las preferencias del usuario
 */
export async function updateUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    console.log('⚙️ Actualizando preferencias:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentPrefs = userSnap.data().preferences || {};
      await updateDoc(userRef, {
        preferences: { ...currentPrefs, ...preferences },
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ Preferencias actualizadas');
    }
  } catch (error: any) {
    console.error('❌ Error actualizando preferencias:', error);
    throw error;
  }
}

/**
 * Añade un símbolo PCS personalizado
 */
export async function addCustomPCSSymbol(
  userId: string,
  symbol: CustomPCSSymbol
): Promise<void> {
  try {
    console.log('➕ Añadiendo símbolo PCS personalizado:', symbol.word);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentSymbols = userSnap.data().preferences?.customPCSSymbols || [];
      
      // Evitar duplicados
      const exists = currentSymbols.some((s: CustomPCSSymbol) => 
        s.word === symbol.word && s.imageUrl === symbol.imageUrl
      );
      
      if (!exists) {
        await updateUserPreferences(userId, {
          customPCSSymbols: [...currentSymbols, symbol]
        });
        console.log('✅ Símbolo PCS añadido');
      } else {
        console.log('⚠️ Símbolo PCS ya existe');
      }
    }
  } catch (error: any) {
    console.error('❌ Error añadiendo símbolo PCS:', error);
    throw error;
  }
}

/**
 * Elimina un símbolo PCS personalizado
 */
export async function removeCustomPCSSymbol(
  userId: string,
  symbolId: string
): Promise<void> {
  try {
    console.log('➖ Eliminando símbolo PCS:', symbolId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentSymbols = userSnap.data().preferences?.customPCSSymbols || [];
      const updatedSymbols = currentSymbols.filter((s: CustomPCSSymbol) => s.id !== symbolId);
      
      await updateUserPreferences(userId, {
        customPCSSymbols: updatedSymbols
      });
      
      console.log('✅ Símbolo PCS eliminado');
    }
  } catch (error: any) {
    console.error('❌ Error eliminando símbolo PCS:', error);
    throw error;
  }
}

/**
 * Obtiene todos los símbolos PCS personalizados del usuario
 */
export async function getCustomPCSSymbols(userId: string): Promise<CustomPCSSymbol[]> {
  try {
    const userData = await getUserData(userId);
    return userData?.preferences?.customPCSSymbols || [];
  } catch (error: any) {
    console.error('❌ Error obteniendo símbolos PCS:', error);
    return [];
  }
}

