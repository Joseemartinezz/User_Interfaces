import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definición de paletas de colores
export interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  background: string;
  white: string;
}

// Paleta 1 (por defecto)
const PALETTE_1: ColorPalette = {
  primary: '#8470e5',
  secondary: '#efbaf9',
  tertiary: '#e9a1f7',
  accent: '#daa5f3',
  background: '#ffffff',
  white: '#ffffff',
};

// Paleta 2
const PALETTE_2: ColorPalette = {
  primary: '#5b59c5',
  secondary: '#90B3F4',
  tertiary: '#81A0EE',
  accent: '#6481e3',
  background: '#fffff',
  white: '#ffffff',
};

// Mapeo de paletas
const PALETTES: Record<number, ColorPalette> = {
  1: PALETTE_1,
  2: PALETTE_2,
};

// Clave para almacenar la paleta seleccionada
const THEME_STORAGE_KEY = '@WizzWords:theme';

// Tipo del contexto
interface ThemeContextType {
  theme: ColorPalette;
  currentPalette: number;
  setTheme: (paletteNumber: number) => Promise<void>;
}

// Crear el contexto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Props del provider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider de tema que gestiona las paletas de colores dinámicas
 * Permite cambiar entre paletas y persiste la selección en AsyncStorage
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<number>(1); // Por defecto paleta 1
  const [theme, setThemeState] = useState<ColorPalette>(PALETTE_1);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          const paletteNumber = parseInt(savedTheme, 10);
          if (paletteNumber === 1 || paletteNumber === 2) {
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

  // Función para cambiar el tema
  const setTheme = async (paletteNumber: number) => {
    if (paletteNumber !== 1 && paletteNumber !== 2) {
      console.warn(`Invalid palette number: ${paletteNumber}. Using palette 1.`);
      paletteNumber = 1;
    }

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, paletteNumber.toString());
      setCurrentPalette(paletteNumber);
      setThemeState(PALETTES[paletteNumber]);
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
 * Hook para usar el tema en componentes
 * @throws Error si se usa fuera del ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

