import { Timestamp } from 'firebase/firestore';

/**
 * Categoría de usuario
 */
export interface UserCategory {
  id: string;
  name: string;
  emoji: string;
  createdAt: Timestamp;
}

/**
 * Símbolo PCS personalizado
 */
export interface CustomPCSSymbol {
  id: string;
  word: string;
  imageUrl: string;
  category?: string;
  addedAt: Timestamp;
}

/**
 * Preferencias del usuario
 */
export interface UserPreferences {
  language: string;
  theme: number;
  fontSize: string;
  voiceSpeed: number;
  // Nuevas preferencias
  colorPalette: 'default' | 'high-contrast' | 'pastel' | 'vibrant';
  preferredFontSize: 'small' | 'medium' | 'large' | 'extra-large';
  customPCSSymbols: CustomPCSSymbol[];
  categories: UserCategory[];
  hiddenCategories?: string[]; // Nombres de categorías por defecto que el usuario ha ocultado
}

/**
 * Datos completos del usuario en Firestore
 */
export interface UserData {
  id: string;
  email: string;
  fullName: string;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Usuario para el contexto (versión simplificada para el frontend)
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  preferences: UserPreferences;
}

