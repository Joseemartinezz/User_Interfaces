// Lazy require dicebear only when needed
let dicebearCore = null;
let dicebearCollection = null;
let sharp = null;

function ensureDicebear() {
  if (!dicebearCore) {
    try {
      dicebearCore = require('@dicebear/core');
      if (!dicebearCore || typeof dicebearCore.createAvatar !== 'function') {
        throw new Error('@dicebear/core no tiene el método createAvatar');
      }
    } catch (error) {
      console.error('❌ Error cargando @dicebear/core:', error.message);
      console.error('   Asegúrate de que las dependencias estén instaladas: npm install');
      throw new Error(`No se pudo cargar @dicebear/core: ${error.message}`);
    }
  }
  if (!dicebearCollection) {
    try {
      dicebearCollection = require('@dicebear/collection');
      if (!dicebearCollection || !dicebearCollection.botttsNeutral) {
        throw new Error('@dicebear/collection no tiene botttsNeutral');
      }
    } catch (error) {
      console.error('❌ Error cargando @dicebear/collection:', error.message);
      console.error('   Asegúrate de que las dependencias estén instaladas: npm install');
      throw new Error(`No se pudo cargar @dicebear/collection: ${error.message}`);
    }
  }
}

function ensureSharp() {
  if (!sharp) {
    sharp = require('sharp');
  }
  return sharp;
}

function computeDeterministicHashBase36(inputText) {
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
 * @param {string} seed - Unique seed for the user
 * @returns {string} SVG string of the generated avatar
 */
function generateUserAvatar(seed) {
  // Ensure we have a valid seed
  const cleanSeed = seed || Math.random().toString(36).substr(2, 9);
  
  ensureDicebear();
  const avatar = dicebearCore.createAvatar(dicebearCollection.botttsNeutral, {
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
  });

  return avatar.toString();
}

/**
 * Generates a data URL for the avatar as PNG (React Native compatible)
 * @param {string} seed - Unique seed for the user
 * @returns {Promise<string>} Data URL string (PNG base64) for use in img src
 */
const svgCache = new Map(); // seed -> dataUrl
const pngCache = new Map(); // seed -> pngDataUrl

async function generateAvatarDataUrl(seed) {
  // Return immediately if cached
  if (pngCache.has(seed)) {
    return pngCache.get(seed);
  }
  
  try {
    // Generar SVG primero
    const svg = generateUserAvatar(seed);
    
    // Convertir SVG a PNG usando sharp
    const sharpInstance = ensureSharp();
    const pngBuffer = await sharpInstance(Buffer.from(svg))
      .resize(200, 200) // Tamaño fijo para avatares
      .png()
      .toBuffer();
    
    // Convertir PNG buffer a base64 data URL
    const base64 = pngBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    // Guardar en caché
    pngCache.set(seed, dataUrl);
    svgCache.set(seed, `data:image/svg+xml,${encodeURIComponent(svg)}`); // También cachear SVG por si acaso
    
    return dataUrl;
  } catch (error) {
    console.error('Error generating avatar:', error);
    throw error;
  }
}

/**
 * Creates a consistent seed for avatar generation based on user data
 * @param {string|number} userId - User ID
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @returns {string} Consistent seed for avatar generation
 */
function createUserSeed(userId, email, fullName) {
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
      .substr(0, 20);
    
    // If the clean string is too short, pad it with the original string hash
    if (cleanString.length < 8) {
      const hash = computeDeterministicHashBase36(combinedString);
      return (cleanString + hash).substr(0, 15);
    }
    
    return cleanString;
  }
  
  // Fallback to random seed (should not happen in normal usage)
  return Math.random().toString(36).substr(2, 12);
}

/**
 * Extracts the initial letter(s) from a name for fallback display
 * @param {string} fullName - User full name
 * @param {string} email - User email (fallback if no name)
 * @returns {string} Initial letter(s) for avatar fallback
 */
function getInitials(fullName, email) {
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

// Exportar funciones para uso en el backend
module.exports = {
  generateUserAvatar,
  generateAvatarDataUrl,
  createUserSeed,
  getInitials,
};

