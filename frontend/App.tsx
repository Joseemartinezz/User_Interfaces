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
import PhraseSelectionScreen from './screens/PhraseSelectionScreen';
import SettingsScreen from './screens/SettingsScreen';
import ParentMenuScreen from './screens/ParentMenuScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Importar Providers
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';

// Enable native screen optimization for better performance
// MUST be before NavigationContainer to avoid remounting
enableScreens(true);

// Create the stack navigator
const Stack = createNativeStackNavigator();

/**
 * Authentication navigator (Login/Register)
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
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

/**
 * Main application navigator (requires authentication)
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
          animation: 'fade',
          animationDuration: 250,
        }}
      />

      {/* Phrase selection screen */}
      <Stack.Screen 
        name="PhraseSelection" 
        component={PhraseSelectionScreen}
      />

      {/* Parent menu screen */}
      <Stack.Screen 
        name="ParentMenu" 
        component={ParentMenuScreen}
      />

      {/* Settings screen */}
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
      />

      {/* User profile screen */}
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Stack.Navigator>
  );
}

/**
 * Component that decides which navigator to show based on authentication state
 */
function RootNavigator() {
  const { isAuthenticated, isLoading } = useUser();

  // Show loading while verifying authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Show AuthNavigator if not authenticated, or AppNavigator if authenticated
  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

/**
 * Main application with configured navigation
 * Integrated with Firebase Authentication
 */
export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
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
