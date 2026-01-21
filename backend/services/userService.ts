/**
 * User Service - Manages user data with proper isolation per userId
 * 
 * Simple in-memory storage for demo purposes.
 * Each user has their own data that doesn't interfere with others.
 */

// User data interface
export interface UserPreferences {
  language: string;
  theme: number;
  fontSize?: string;
}

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// Simple Map for user data storage (sufficient for demo)
const userCache = new Map<string, UserData>();

/**
 * Creates default user data for a new user
 */
function createDefaultUserData(userId: string): UserData {
  return {
    id: userId,
    email: '',
    fullName: '',
    preferences: {
      language: 'en',
      theme: 1,
      fontSize: 'medium'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Gets user data by userId
 * Creates default data if user doesn't exist
 */
export function getUserData(userId: string): UserData {
  let userData = userCache.get(userId);
  
  if (!userData) {
    // Create default user data for new users
    userData = createDefaultUserData(userId);
    userCache.set(userId, userData);
    console.log(`Created new user data for userId: ${userId}`);
  }
  
  return userData;
}

/**
 * Updates user data for a specific userId
 * @param userId - The user's unique identifier
 * @param updates - Partial user data to update
 * @returns Updated user data
 */
export function updateUserData(
  userId: string,
  updates: {
    email?: string;
    fullName?: string;
    preferences?: Partial<UserPreferences>;
  }
): UserData {
  const currentData = getUserData(userId);
  
  const updatedData: UserData = {
    ...currentData,
    email: updates.email !== undefined ? updates.email : currentData.email,
    fullName: updates.fullName !== undefined ? updates.fullName : currentData.fullName,
    preferences: updates.preferences 
      ? { ...currentData.preferences, ...updates.preferences }
      : currentData.preferences,
    updatedAt: new Date()
  };
  
  userCache.set(userId, updatedData);
  console.log(`Updated user data for userId: ${userId}`);
  
  return updatedData;
}

/**
 * Resets user data to default values
 * @param userId - The user's unique identifier
 * @returns Reset user data
 */
export function resetUserData(userId: string): UserData {
  const resetData = createDefaultUserData(userId);
  userCache.set(userId, resetData);
  console.log(`Reset user data for userId: ${userId}`);
  
  return resetData;
}

/**
 * Deletes user data from cache
 * @param userId - The user's unique identifier
 * @returns true if user was deleted, false if user didn't exist
 */
export function deleteUserData(userId: string): boolean {
  const existed = userCache.has(userId);
  userCache.delete(userId);
  
  if (existed) {
    console.log(`Deleted user data for userId: ${userId}`);
  }
  
  return existed;
}

/**
 * Checks if a user exists in the cache
 * @param userId - The user's unique identifier
 */
export function userExists(userId: string): boolean {
  return userCache.has(userId);
}

/**
 * Gets cache statistics for monitoring
 */
export function getCacheStats(): {
  size: number;
} {
  return {
    size: userCache.size
  };
}
