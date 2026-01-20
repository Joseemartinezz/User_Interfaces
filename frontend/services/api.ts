// API helper functions - HTTP calls to backend only
// All business logic is in the backend

import { auth } from './firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Gets Firebase authentication token
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting authentication token:', error);
    return null;
  }
}

/**
 * Gets the current user's userId
 */
function getCurrentUserId(): string | null {
  const currentUser = auth.currentUser;
  return currentUser?.uid || null;
}

// Log API URL for debugging
console.log('API_BASE_URL configured:', API_BASE_URL);
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || 'not configured (using default)');

/**
 * Tests connection with backend server
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log(`Connection test: Attempting to connect to ${API_BASE_URL}/api/health`);
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const isOk = response.ok;
    console.log(`Connection test: ${isOk ? 'SUCCESS' : 'FAILED'} - Status: ${response.status}`);
    return isOk;
  } catch (error: any) {
    console.error('Connection test FAILED:', error);
    console.error('   Type:', error.name);
    console.error('   Message:', error.message);
    console.error('   Attempted URL:', `${API_BASE_URL}/api/health`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   WARNING: Backend is not accessible at:', API_BASE_URL);
      console.error('   TIP: Verify that the backend is running: npm run server');
    }
    return false;
  }
}

/**
 * Generates natural phrases from selected words using Gemini
 */
export async function generatePhrases(words: string[], childAge?: number): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, childAge }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating phrases:', error);
    throw new Error(error.message || 'Error generating phrases. Verify that the backend server is running.');
  }
}

/**
 * Generates more phrases without repeating existing ones
 */
export async function generateMorePhrases(
  words: string[],
  existingPhrases: string[],
  childAge?: number
): Promise<string[]> {
  if (!words || words.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-more-phrases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ words, existingPhrases, childAge }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.phrases || [];
  } catch (error: any) {
    console.error('Error generating more phrases:', error);
    throw new Error(error.message || 'Error generating more phrases. Verify that the backend server is running.');
  }
}

// ============================================================================
// USER & PROFILE API
// ============================================================================

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  preferences: {
    theme: number;
  };
}

/**
 * Gets the current user's data
 */
export async function getUser(): Promise<User | null> {
  try {
    console.log(`Attempting to connect to: ${API_BASE_URL}/api/user`);
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response received: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('Error getting user:', error);
    console.error('   Error type:', error.name);
    console.error('   Message:', error.message);
    console.error('   Attempted URL:', `${API_BASE_URL}/api/user`);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      console.error('   CONNECTION PROBLEM: Backend is not accessible');
      console.error('   Verify that:');
      console.error('      1. Backend is running (npm run server)');
      console.error('      2. URL is correct for your platform');
      console.error('      3. No firewall is blocking the connection');
    }
    return null;
  }
}

/**
 * Updates the user's data
 */
export async function updateUser(updates: {
  email?: string;
  fullName?: string;
  preferences?: Partial<User['preferences']>;
}): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Resets user to default values
 */
export async function resetUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.user || null;
  } catch (error: any) {
    console.error('Error resetting user:', error);
    throw error;
  }
}

/**
 * Gets the avatar URL for a user
 */
export async function getUserAvatarUrl(user: {
  id?: string | number;
  email?: string;
  fullName?: string;
}): Promise<string | null> {
  if (!user) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.avatarUrl || null;
  } catch (error: any) {
    console.error('Error getting user avatar URL:', error);
    return null;
  }
}

// ============================================================================
// CATEGORIES API
// ============================================================================

/**
 * Gets all categories (predefined + custom)
 * If userId is provided, returns only the user's categories
 */
export async function getAllCategories(userId?: string): Promise<Record<string, number[]>> {
  try {
    const url = userId 
      ? `${API_BASE_URL}/api/categories?userId=${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/api/categories`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return data.categories || {};
  } catch (error: any) {
    console.error('Error getting categories:', error);
    throw new Error(error.message || 'Error getting categories. Verify that the backend server is running.');
  }
}

/**
 * Gets pictogram IDs for a specific category
 * If userId is provided, searches in user's categories
 */
export async function getCategoryPictogramIds(categoryName: string, userId?: string): Promise<number[]> {
  const baseUrl = `${API_BASE_URL}/api/categories/${encodeURIComponent(categoryName)}`;
  const url = userId ? `${baseUrl}?userId=${encodeURIComponent(userId)}` : baseUrl;
  
  try {
    console.log(`Getting pictogram IDs for category "${categoryName}"${userId ? ` (user: ${userId})` : ''}`);
    console.log(`   Calling: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`   Error ${response.status}:`, errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    const ids = data.pictogramIds || [];
    console.log(`   Obtained ${ids.length} pictogram IDs for "${categoryName}"`);
    if (ids.length > 0) {
      console.log(`   First IDs: ${ids.slice(0, 10).join(', ')}${ids.length > 10 ? '...' : ''}`);
    }
    return ids;
  } catch (error: any) {
    console.error(`Error getting pictogram IDs for category "${categoryName}":`, error);
    if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
      throw new Error(`Could not connect to backend. Verify it is running at ${API_BASE_URL}`);
    }
    throw new Error(error.message || 'Error getting pictograms from category.');
  }
}

/**
 * Creates a new category with pictograms using AI
 * @param categoryName Category name
 * @param description Optional description of what the category encompasses
 * @param maxResults Maximum number of pictograms to include (default 50)
 * @param userId User ID (optional, obtained automatically if not provided)
 */
export async function createCategoryWithPictograms(
  categoryName: string,
  description?: string,
  maxResults: number = 50,
  userId?: string
): Promise<{ category: string; pictogramIds: number[]; count: number }> {
  try {
    // Get userId if not provided
    const finalUserId = userId || getCurrentUserId();
    if (!finalUserId) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Could not get authentication token.');
    }

    const body: { categoryName: string; maxResults: number; description?: string; userId: string } = {
      categoryName,
      maxResults,
      userId: finalUserId,
    };

    if (description && description.trim()) {
      body.description = description.trim();
    }

    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalUserId}`, // Send userId as token (backend extracts it)
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const data = await response.json();
    return {
      category: data.category,
      pictogramIds: data.pictogramIds || [],
      count: data.count || 0,
    };
  } catch (error: any) {
    console.error('Error creating category with pictograms:', error);
    throw new Error(error.message || 'Error creating category with pictograms. Verify that the backend server is running.');
  }
}

/**
 * Deletes a user's custom category
 * @param categoryName Name of category to delete
 * @param userId User ID
 */
export async function deleteCategoryWithPictograms(
  categoryName: string,
  userId?: string
): Promise<void> {
  try {
    // Get userId if not provided
    const finalUserId = userId || getCurrentUserId();
    if (!finalUserId) {
      throw new Error('User not authenticated. Please log in.');
    }

    // Get authentication token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Could not get authentication token.');
    }

    const response = await fetch(`${API_BASE_URL}/api/categories/${encodeURIComponent(categoryName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalUserId}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    console.log(`Category "${categoryName}" deleted successfully from backend`);
  } catch (error: any) {
    console.error('Error deleting category with pictograms:', error);
    throw new Error(error.message || 'Error deleting category from backend.');
  }
}
