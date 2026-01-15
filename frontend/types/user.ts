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
 * Action button pictograms configuration
 * Allows users to customize pictograms used in action buttons
 */
export interface ActionButtonPictograms {
  generate?: number; // ARASAAC ID for "generate phrases" button (default: 9172)
  clear?: number; // ARASAAC ID for "clear" button (default: 37417)
  generateMore?: number; // ARASAAC ID for "generate more" button (default: 5270 - plus)
  back?: number; // ARASAAC ID for "back" button (default: 38195 - back arrow)
}

/**
 * User preferences
 */
export interface UserPreferences {
  language: string;
  theme: number;
  fontSize: string;
  // New preferences
  preferredFontSize: 'small' | 'medium' | 'large' | 'extra-large';
  customPCSSymbols: CustomPCSSymbol[];
  categories: UserCategory[];
  hiddenCategories?: string[]; // Names of default categories hidden by user
  // Action button customization
  actionButtonPictograms?: ActionButtonPictograms; // Custom pictograms for action buttons
  // Onboarding and initial setup
  hasCompletedOnboarding?: boolean; // Indicates if user completed initial setup
  childAge?: number; // Age of child using the app
  parentMenuPassword?: string; // Password to access parent menu
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

