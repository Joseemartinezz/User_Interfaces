import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

// Importar pantallas desde frontend
import WelcomeScreen from './frontend/screens/WelcomeScreen';
import SentenceTypeScreen from './frontend/screens/SentenceTypeScreen';
import TopicSelectionScreen from './frontend/screens/TopicSelectionScreen';
import PCSScreen from './frontend/screens/PCSScreen';
import PhraseSelectionScreen from './frontend/screens/PhraseSelectionScreen';
import SettingsScreen from './frontend/screens/SettingsScreen';
import ParentMenuScreen from './frontend/screens/ParentMenuScreen';
import ProfileScreen from './frontend/screens/ProfileScreen';

// Importar Providers desde frontend
import { ThemeProvider } from './frontend/context/ThemeContext';
import { UserProvider } from './frontend/context/UserContext';

// Habilitar optimización nativa de pantallas para mejor rendimiento
// DEBE estar antes del NavigationContainer para evitar remounting
enableScreens(true);

// Crear el stack navigator
const Stack = createNativeStackNavigator();

/**
 * Aplicación principal con navegación configurada
 * Optimizada para transiciones suaves y mejor rendimiento
 * FIXED: Animaciones nativas para navegación hacia atrás sin pantalla blanca
 */
export default function App() {
    return (
    <ThemeProvider>
      <UserProvider>
        <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PCS"
        screenOptions={{
          headerShown: false,
          // NO especificar animation aquí - permite animación nativa hacia atrás
          // La animación hacia adelante será 'slide_from_right' por defecto
          // La animación hacia atrás será automática y nativa (sin pantalla blanca)
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
          presentation: 'card',
          animationTypeForReplace: 'push',
          // Optimizaciones adicionales para transiciones suaves
          statusBarAnimation: 'fade',
          // CRÍTICO: contentStyle asegura fondo consistente durante transiciones
          // El color de fondo se manejará dinámicamente con el tema
          contentStyle: { backgroundColor: '#f5f5f5' },
          // Habilitar optimizaciones de rendimiento
          freezeOnBlur: false, // Mantener pantallas en memoria para navegación rápida
        }}
      >
        {/* Pantalla de bienvenida */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{
            animation: 'fade',
            animationDuration: 250,
            gestureEnabled: false, // No permitir gesto en la pantalla inicial
          }}
        />

        {/* Pantalla de selección de tipo de oración */}
        <Stack.Screen 
          name="SentenceType" 
          component={SentenceTypeScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />

        {/* Pantalla de selección de tema */}
        <Stack.Screen 
          name="TopicSelection"
          component={TopicSelectionScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />

        {/* Pantalla de selección de palabras (PCS) - PANTALLA PRINCIPAL PARA NIÑOS */}
        <Stack.Screen 
          name="PCS" 
          component={PCSScreen}
          options={{
            animation: 'fade',
            animationDuration: 250,
          }}
        />

        {/* Pantalla de selección de frases */}
        <Stack.Screen 
          name="PhraseSelection" 
          component={PhraseSelectionScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />

        {/* Pantalla de menú para padres */}
        <Stack.Screen 
          name="ParentMenu" 
          component={ParentMenuScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />

        {/* Pantalla de ajustes */}
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />

        {/* Pantalla de perfil de usuario */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          // Sin animation explícita - usa animación nativa hacia atrás
        />
      </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </ThemeProvider>
  );
}
