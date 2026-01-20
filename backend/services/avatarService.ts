// Avatar Generation Service using DiceBear
// Backend service that generates unique avatars for users

// Lazy require dicebear only when needed
let dicebearCore: typeof import('@dicebear/core') | null = null;
let dicebearCollection: typeof import('@dicebear/collection') | null = null;
let sharp: typeof import('sharp') | null = null;

interface AvatarOptions {
  seed: string;
  radius: number;
  backgroundColor: string[];
  backgroundType: string[];
  randomizeIds: boolean;
}

function ensureDicebear(): void {
  if (!dicebearCore) {
    try {
      dicebearCore = require('@dicebear/core');
      if (!dicebearCore || typeof dicebearCore.createAvatar !== 'function') {
        throw new Error('@dicebear/core does not have the createAvatar method');
      }
    } catch (error: any) {
      console.error('Error loading @dicebear/core:', error.message);
      console.error('   Make sure dependencies are installed: npm install');
      throw new Error(`Could not load @dicebear/core: ${error.message}`);
    }
  }
  if (!dicebearCollection) {
    try {
      dicebearCollection = require('@dicebear/collection');
      if (!dicebearCollection || !dicebearCollection.botttsNeutral) {
        throw new Error('@dicebear/collection does not have botttsNeutral');
      }
    } catch (error: any) {
      console.error('Error loading @dicebear/collection:', error.message);
      console.error('   Make sure dependencies are installed: npm install');
      throw new Error(`Could not load @dicebear/collection: ${error.message}`);
    }
  }
}

function ensureSharp(): typeof import('sharp') {
  if (!sharp) {
    sharp = require('sharp');
  }
  return sharp!;
}

/**
 * Computes a deterministic hash in base36 from input text
 * @param inputText - The text to hash
 * @returns Base36 hash string
 */
function computeDeterministicHashBase36(inputText: string): string {
  let hashNumber = 0;
  for (let index = 0; index < inputText.length; index++) {
    const charCode = inputText.charCodeAt(index);
    hashNumber = ((hashNumber << 5) - hashNumber) + charCode;
    hashNumber |= 0; // Convert to 32-bit integer
  }
  const positiveHash = Math.abs(hashNumber);
  return positiveHash.toString(36);
}

/**
 * Generates a unique avatar for a user using DiceBear
 * @param seed - Unique seed for the user
 * @returns SVG string of the generated avatar
 */
function generateUserAvatar(seed: string): string {
  // Ensure we have a valid seed
  const cleanSeed = seed || Math.random().toString(36).substring(2, 11);
  
  ensureDicebear();
  const avatar = dicebearCore!.createAvatar(dicebearCollection!.botttsNeutral, {
    seed: cleanSeed,
    radius: 50,
    backgroundColor: [
      "00897b",
      "00acc1", 
      "039be5",
      "1e88e5",
      "3949ab",
      "43a047",
      "546e7a",
      "5e35b1",
      "6d4c41",
      "757575",
      "7cb342",
      "8e24aa",
      "c0ca33",
      "d81b60",
      "e53935",
      "f4511e",
      "fb8c00",
      "fdd835",
      "ffb300",
      "ffdfbf",
      "ffd5dc",
      "c0aede",
      "b6e3f4",
      "d1d4f9"
    ],
    backgroundType: ["gradientLinear"],
    randomizeIds: true
  } as any);

  return avatar.toString();
}

// Caches for generated avatars
const svgCache = new Map<string, string>();
const pngCache = new Map<string, string>();

/**
 * Generates a data URL for the avatar as PNG (React Native compatible)
 * @param seed - Unique seed for the user
 * @returns Data URL string (PNG base64) for use in img src
 */
async function generateAvatarDataUrl(seed: string): Promise<string> {
  // Return immediately if cached
  if (pngCache.has(seed)) {
    return pngCache.get(seed)!;
  }
  
  try {
    // Generate SVG first
    const svg = generateUserAvatar(seed);
    
    // Convert SVG to PNG using sharp
    const sharpInstance = ensureSharp();
    const pngBuffer = await sharpInstance(Buffer.from(svg))
      .resize(200, 200) // Fixed size for avatars
      .png()
      .toBuffer();
    
    // Convert PNG buffer to base64 data URL
    const base64 = pngBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Save to cache
    pngCache.set(seed, dataUrl);
    svgCache.set(seed, `data:image/svg+xml,${encodeURIComponent(svg)}`);
    
    return dataUrl;
  } catch (error: any) {
    console.error('Error generating avatar:', error);
    throw error;
  }
}

/**
 * Creates a consistent seed for avatar generation based on user data
 * @param userId - User ID (string or number)
 * @param email - User email
 * @param fullName - User full name
 * @returns Consistent seed for avatar generation
 */
function createUserSeed(userId: string | number | undefined, email?: string, fullName?: string): string {
  // Convert userId to string if it's a number
  const userIdStr = userId ? String(userId) : '';
  
  // Create a consistent seed using multiple user properties
  const combinedString = `${userIdStr}${email || ''}${fullName || ''}`;
  
  // If we have user data, create a hash-like seed
  if (combinedString.length > 0) {
    // Remove special characters and normalize
    const cleanString = combinedString
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    // If the clean string is too short, pad it with the original string hash
    if (cleanString.length < 8) {
      const hash = computeDeterministicHashBase36(combinedString);
      return (cleanString + hash).substring(0, 15);
    }
    
    return cleanString;
  }
  
  // Fallback to random seed (should not happen in normal usage)
  return Math.random().toString(36).substring(2, 14);
}

/**
 * Extracts the initial letter(s) from a name for fallback display
 * @param fullName - User full name
 * @param email - User email (fallback if no name)
 * @returns Initial letter(s) for avatar fallback
 */
function getInitials(fullName?: string, email?: string): string {
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      // First letter of first name + first letter of last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1) {
      // First letter of the name
      return names[0][0].toUpperCase();
    }
  }
  
  // Fallback to email initial
  if (email && email.trim()) {
    return email.trim()[0].toUpperCase();
  }
  
  // Ultimate fallback
  return '?';
}

/**
 * Clears the avatar caches (useful for testing or memory management)
 */
function clearAvatarCache(): void {
  svgCache.clear();
  pngCache.clear();
  console.log('Avatar cache cleared');
}

/**
 * Gets cache statistics
 */
function getCacheStats(): { svgCount: number; pngCount: number } {
  return {
    svgCount: svgCache.size,
    pngCount: pngCache.size
  };
}

module.exports = {
  generateUserAvatar,
  generateAvatarDataUrl,
  createUserSeed,
  getInitials,
  clearAvatarCache,
  getCacheStats
};
