import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import screens
import CategoriesScreen from './screens/CategoriesScreen';
import CategoryDetailScreen from './screens/CategoryDetailScreen';
import PCSScreen from './screens/PCSScreen';
import FlashcardSelectionScreen from './screens/FlashcardSelectionScreen';
import ColorSettingsScreen from './screens/ColorSettingsScreen';
import ParentMenuScreen from './screens/ParentMenuScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import WelcomeOnboardingScreen from './screens/WelcomeOnboardingScreen';

// Importar Providers
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';

// Enable native screen optimization for better performance
// MUST be before NavigationContainer to avoid remounting
enableScreens(true);

// Create the stack navigator
const Stack = createNativeStackNavigator();

/**
 * Authentication navigator (Login/Register)
 * Smooth fade from bottom transitions for intuitive navigation
 */
function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
        presentation: 'card',
        animation: 'fade_from_bottom',
        animationDuration: 300,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animation: 'fade_from_bottom', // Fade from bottom for initial screen
          animationDuration: 250,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Onboarding navigator for new users
 * Progressive reveal with smooth transitions
 */
function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="WelcomeOnboarding"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent going back from onboarding
        presentation: 'card',
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen
        name="WelcomeOnboarding"
        component={WelcomeOnboardingScreen}
        options={{
          animation: 'fade',
          animationDuration: 300,
        }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          animation: 'slide_from_right',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main application navigator (requires authentication)
 * Unified transitions: smooth slide animations for better UX
 * Modal presentations for parent/profile screens to maintain context
 */
function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PCS"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
        presentation: 'card',
        animation: 'slide_from_right', // Unified smooth transition
        animationDuration: 300, // Consistent timing
        animationTypeForReplace: 'push',
        statusBarAnimation: 'fade',
        contentStyle: { backgroundColor: '#f5f5f5' },
        freezeOnBlur: false,
      }}
    >
      {/* Categories management screen */}
      <Stack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 250,
          presentation: 'modal',
        }}
      />

      {/* Category detail screen */}
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
      />

      {/* Word selection screen (PCS) - MAIN SCREEN FOR CHILDREN */}
      <Stack.Screen
        name="PCS"
        component={PCSScreen}
        options={{
          animation: 'fade', // Gentle fade for main screen to avoid distraction
          animationDuration: 250,
        }}
      />

      {/* Phrase selection screen */}
      <Stack.Screen
        name="PhraseSelection"
        component={FlashcardSelectionScreen}
        options={{
          animation: 'slide_from_bottom', // Natural forward flow
          animationDuration: 300,
        }}
      />

      {/* Parent menu screen - Modal to maintain child screen context */}
      <Stack.Screen
        name="ParentMenu"
        component={ParentMenuScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 250,
          presentation: 'transparentModal',
        }}
      />

      {/* Settings screen */}
      <Stack.Screen
        name="Settings"
        component={ColorSettingsScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 250,
          presentation: 'modal',
        }}
      />

      {/* User profile screen - Modal for quick access */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          animation: 'fade_from_bottom',
          animationDuration: 250,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Component that decides which navigator to show based on authentication state
 * and onboarding status
 */
function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useUser();

  // Show loading while verifying authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Not authenticated: show login/register screens
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Authenticated but hasn't completed onboarding: show onboarding
  if (!user?.preferences?.hasCompletedOnboarding) {
    return <OnboardingNavigator />;
  }

  // Authenticated and onboarding completed: show main app
  return <AppNavigator />;
}

/**
 * Main application with configured navigation
 * Integrated with Firebase Authentication
 */
export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
