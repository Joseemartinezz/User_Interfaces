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
 * Creates or updates user document in Firestore
 */
export async function createUserDocument(
  userId: string, 
  email: string, 
  fullName: string
): Promise<void> {
  try {
    console.log('📄 Creating user document:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userData: UserData = {
      id: userId,
      email,
      fullName,
      preferences: {
        language: 'en',
        theme: 1,
        customPCSSymbols: [],
        categories: [],
        hiddenCategories: [],
        hasCompletedOnboarding: false, // New user needs to complete onboarding
        // childAge and parentMenuPassword will be configured later in onboarding
        // We don't include them here to avoid undefined values that Firestore doesn't allow
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    await setDoc(userRef, userData);
    console.log('✅ User document created');
  } catch (error: any) {
    console.error('❌ Error creating user document:', error);
    throw error;
  }
}

/**
 * Gets user data from Firestore
 */
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    console.log('🔍 Getting user data:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data() as UserData;
      console.log('✅ User data obtained');
      return data;
    } else {
      console.log('⚠️ User document not found');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error getting user data:', error);
    throw error;
  }
}

/**
 * Updates user data in Firestore
 */
export async function updateUserData(
  userId: string, 
  updates: Partial<Omit<UserData, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    console.log('✏️ Updating user:', userId);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ User updated');
  } catch (error: any) {
    console.error('❌ Error updating user:', error);
    throw error;
  }
}

/**
 * Updates user preferences
 */
export async function updateUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<void> {
  try {
    console.log('⚙️ Updating preferences:', userId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentPrefs = userSnap.data().preferences || {};
      await updateDoc(userRef, {
        preferences: { ...currentPrefs, ...preferences },
        updatedAt: Timestamp.now()
      });
      
      console.log('✅ Preferences updated');
    }
  } catch (error: any) {
    console.error('❌ Error updating preferences:', error);
    throw error;
  }
}

/**
 * Adds a custom PCS symbol
 */
export async function addCustomPCSSymbol(
  userId: string,
  symbol: CustomPCSSymbol
): Promise<void> {
  try {
    console.log('➕ Adding custom PCS symbol:', symbol.word);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentSymbols = userSnap.data().preferences?.customPCSSymbols || [];
      
      // Avoid duplicates
      const exists = currentSymbols.some((s: CustomPCSSymbol) => 
        s.word === symbol.word && s.imageUrl === symbol.imageUrl
      );
      
      if (!exists) {
        await updateUserPreferences(userId, {
          customPCSSymbols: [...currentSymbols, symbol]
        });
        console.log('✅ PCS symbol added');
      } else {
        console.log('⚠️ PCS symbol already exists');
      }
    }
  } catch (error: any) {
    console.error('❌ Error adding PCS symbol:', error);
    throw error;
  }
}

/**
 * Removes a custom PCS symbol
 */
export async function removeCustomPCSSymbol(
  userId: string,
  symbolId: string
): Promise<void> {
  try {
    console.log('➖ Removing PCS symbol:', symbolId);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentSymbols = userSnap.data().preferences?.customPCSSymbols || [];
      const updatedSymbols = currentSymbols.filter((s: CustomPCSSymbol) => s.id !== symbolId);
      
      await updateUserPreferences(userId, {
        customPCSSymbols: updatedSymbols
      });
      
      console.log('✅ PCS symbol removed');
    }
  } catch (error: any) {
    console.error('❌ Error removing PCS symbol:', error);
    throw error;
  }
}

/**
 * Gets all custom PCS symbols for the user
 */
export async function getCustomPCSSymbols(userId: string): Promise<CustomPCSSymbol[]> {
  try {
    const userData = await getUserData(userId);
    return userData?.preferences?.customPCSSymbols || [];
  } catch (error: any) {
    console.error('❌ Error getting PCS symbols:', error);
    return [];
  }
}

