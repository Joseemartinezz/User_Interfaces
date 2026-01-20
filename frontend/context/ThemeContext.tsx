import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Color palette interface with accessibility-compliant contrast ratios
 * All text colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */
export interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  background: string;
  white: string;
  text: string; // Main text color (dark for good contrast)
  textSecondary: string; // Secondary text color (gray)
}

/**
 * Palette 1 - Purple Harmony (default)
 * Calm and friendly, suitable for children with special needs
 * Enhanced contrast for better readability
 */
const PALETTE_1: ColorPalette = {
  primary: '#6B4FD6', // Darker purple for better contrast (was #8470e5)
  secondary: '#D8A7F9', // Softer lavender for accents
  tertiary: '#C77FE8', // Medium purple for actions
  accent: '#B88FE5', // Muted purple for highlights
  background: '#FAFAFA', // Slightly off-white to reduce eye strain
  white: '#FFFFFF',
  text: '#1A1A1A', // Near-black for maximum contrast (was #333333)
  textSecondary: '#4A4A4A', // Darker gray for better readability (was #666666)
};

/**
 * Palette 2 - Ocean Blue
 * Soothing and clear, good for focus
 * Improved contrast ratios
 */
const PALETTE_2: ColorPalette = {
  primary: '#3D3BA8', // Darker blue for better contrast (was #5b59c5)
  secondary: '#6B8FE8', // Brighter blue for accents
  tertiary: '#5579D9', // Medium blue for actions
  accent: '#4568D6', // Deep blue for highlights
  background: '#FAFAFA', // Consistent off-white background
  white: '#FFFFFF',
  text: '#1A1A1A', // Maximum contrast
  textSecondary: '#4A4A4A', // Improved secondary text contrast
};

/**
 * Palette 3 - Forest Green
 * Natural and calming, nature-inspired
 * High contrast for accessibility
 */
const PALETTE_3: ColorPalette = {
  primary: '#0A3335', // Darker teal for better contrast (was #0E4749)
  secondary: '#7BAD1D', // Slightly darker green for better visibility
  tertiary: '#CC4910', // Darker red for better contrast (was #E55812)
  accent: '#00494B', // Rich teal for accents
  background: '#F5F0E8', // Warmer off-white background
  white: '#FFFFFF',
  text: '#0A3335', // Dark teal for maximum contrast
  textSecondary: '#3D3D3D', // Darker gray for better readability
};

/**
 * Palette 4 - Sunshine Bright
 * Cheerful and energetic, optimistic feel
 * Optimized contrast ratios
 */
const PALETTE_4: ColorPalette = {
  primary: '#0D7585', // Darker cyan for better contrast (was #189AAA)
  secondary: '#06B589', // Slightly darker emerald
  tertiary: '#D63C5E', // Darker pink for better visibility (was #EF476F)
  accent: '#E6A527', // Darker gold for better contrast (was #FFC43D)
  background: '#FDFEF5', // Very light warm background
  white: '#FFFFFF',
  text: '#0D7585', // Dark cyan for excellent contrast
  textSecondary: '#3D3D3D', // Consistent dark gray
};

/**
 * Palette 5 - Soft Pastel
 * Gentle and warm, reduced visual stress
 * Enhanced text contrast
 */
const PALETTE_5: ColorPalette = {
  primary: '#3FA693', // Darker aqua for better contrast (was #7FD8BE)
  secondary: '#5DD6B7', // Slightly darker aquamarine
  tertiary: '#E6943D', // Darker sandy brown for visibility (was #FCAB64)
  accent: '#E6A570', // Deeper apricot for better contrast
  background: '#FDF8F8', // Very light warm pink
  white: '#FFFFFF',
  text: '#1D4239', // Very dark green for maximum contrast (was #2D5A4A)
  textSecondary: '#3D3D3D', // Consistent dark gray
};

/**
 * Palette 6 - Earthy Tones
 * Warm and grounded, natural feel
 * Improved readability
 */
const PALETTE_6: ColorPalette = {
  primary: '#234029', // Darker green for better contrast (was #32533D)
  secondary: '#E54F96', // Slightly darker pink for visibility (was #F374AE)
  tertiary: '#D96F6D', // Darker coral for better contrast (was #ED9390)
  accent: '#CC956D', // Deeper desert sand for accents
  background: '#E8E0C5', // Lighter beige for better contrast
  white: '#FFFFFF',
  text: '#234029', // Very dark green for maximum contrast
  textSecondary: '#3D3D3D', // Consistent dark gray
};

// Palette mapping
const PALETTES: Record<number, ColorPalette> = {
  1: PALETTE_1,
  2: PALETTE_2,
  3: PALETTE_3,
  4: PALETTE_4,
  5: PALETTE_5,
  6: PALETTE_6,
};

// Palette names for user-friendly notifications
const PALETTE_NAMES: Record<number, string> = {
  1: 'Purple Harmony',
  2: 'Ocean Blue',
  3: 'Forest Green',
  4: 'Sunshine Bright',
  5: 'Soft Pastel',
  6: 'Earthy Tones',
};

// Storage key for selected palette
const THEME_STORAGE_KEY = '@WizzWords:theme';

// Context type
interface ThemeContextType {
  theme: ColorPalette;
  currentPalette: number;
  setTheme: (paletteNumber: number, showNotification?: boolean) => Promise<void>;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider that manages dynamic color palettes
 * Allows switching between palettes and persists selection in AsyncStorage
 * Shows toast notification when palette changes (if enabled)
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<number>(1); // Default to palette 1
  const [theme, setThemeState] = useState<ColorPalette>(PALETTE_1);
  const [showToastCallback, setShowToastCallback] = useState<((message: string) => void) | null>(null);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          const paletteNumber = parseInt(savedTheme, 10);
          if (paletteNumber >= 1 && paletteNumber <= 6 && PALETTES[paletteNumber]) {
            setCurrentPalette(paletteNumber);
            setThemeState(PALETTES[paletteNumber]);
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Function to change theme with optional toast notification
  const setTheme = async (paletteNumber: number, showNotification: boolean = true) => {
    const previousPalette = currentPalette;
    
    if (paletteNumber < 1 || paletteNumber > 6 || !PALETTES[paletteNumber]) {
      console.warn(`Invalid palette number: ${paletteNumber}. Using palette 1.`);
      paletteNumber = 1;
    }

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, paletteNumber.toString());
      setCurrentPalette(paletteNumber);
      setThemeState(PALETTES[paletteNumber]);
      
      // Show toast notification if enabled and palette actually changed
      if (showNotification && previousPalette !== paletteNumber && showToastCallback) {
        const paletteName = PALETTE_NAMES[paletteNumber] || `Palette ${paletteNumber}`;
        showToastCallback(`Theme changed to ${paletteName}`);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, currentPalette, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme in components
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

