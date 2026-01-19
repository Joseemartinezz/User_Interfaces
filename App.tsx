import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

// Import screens from frontend
import PCSScreen from './frontend/screens/PCSScreen';
import FlashcardSelectionScreen from './frontend/screens/FlashcardSelectionScreen';
import ColorSettingsScreen from './frontend/screens/ColorSettingsScreen';
import ParentMenuScreen from './frontend/screens/ParentMenuScreen';
import ProfileScreen from './frontend/screens/ProfileScreen';

// Import Providers from frontend
import { ThemeProvider } from './frontend/context/ThemeContext';
import { UserProvider } from './frontend/context/UserContext';

// Enable native screen optimization for better performance
// MUST be before NavigationContainer to avoid remounting
enableScreens(true);

// Create the stack navigator
const Stack = createNativeStackNavigator();

/**
 * Main application with configured navigation
 * Optimized for smooth transitions and better performance
 * FIXED: Native animations for back navigation without white screen
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
          // DO NOT specify animation here - allows native back animation
          // Forward animation will be 'slide_from_right' by default
          // Back animation will be automatic and native (no white screen)
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
          presentation: 'card',
          animationTypeForReplace: 'push',
          // Additional optimizations for smooth transitions
          statusBarAnimation: 'fade',
          // CRITICAL: contentStyle ensures consistent background during transitions
          // Background color will be handled dynamically with the theme
          contentStyle: { backgroundColor: '#f5f5f5' },
          // Enable performance optimizations
          freezeOnBlur: false, // Keep screens in memory for fast navigation
        }}
      >
        {/* Word selection screen (PCS) - MAIN SCREEN FOR CHILDREN */}
        <Stack.Screen 
          name="PCS" 
          component={PCSScreen}
          options={{
            animation: 'fade',
            animationDuration: 250,
          }}
        />

        {/* Phrase selection screen */}
        <Stack.Screen 
          name="PhraseSelection" 
          component={FlashcardSelectionScreen}
          // No explicit animation - uses native back animation
        />

        {/* Parent menu screen */}
        <Stack.Screen 
          name="ParentMenu" 
          component={ParentMenuScreen}
          // No explicit animation - uses native back animation
        />

        {/* Settings screen */}
        <Stack.Screen 
          name="Settings" 
          component={ColorSettingsScreen}
          // No explicit animation - uses native back animation
        />

        {/* User profile screen */}
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          // No explicit animation - uses native back animation
        />
      </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    </ThemeProvider>
  );
}
