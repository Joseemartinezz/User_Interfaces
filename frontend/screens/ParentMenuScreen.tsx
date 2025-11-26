import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { styles } from './ParentMenuScreen.styles';

/**
 * Parent/tutor menu screen
 * Contains all configuration and preference options
 * that children should not modify
 * Optimized with useCallback for better performance
 */
const ParentMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { logout } = useUser();

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings' as never);
  }, [navigation]);

  const handleProfile = useCallback(() => {
    navigation.navigate('Profile' as never);
  }, [navigation]);


  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al cerrar sesión');
            }
          },
        },
      ]
    );
  }, [logout]);

  // Navegar a categorías (Categories)
  const handleCategories = useCallback(() => {
    (navigation as any).navigate('Categories', { 
      selectedColor: theme.primary
    });
  }, [navigation, theme.primary]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header
          title="Parent Menu"
          subtitle="Configuration & Settings"
          showProfile={false}
        />

        {/* Main content */}
        <ScrollView 
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Configuration Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>⚙️ Configuration</Text>
            
            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.primary }]}
              onPress={handleProfile}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>👤</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    User Profile
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Edit name, email, and preferences
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.primary }]}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>🎨</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    Theme Settings
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Change colors and appearance
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Navigation Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🧭 Navigation</Text>
            
            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.secondary, marginTop: 0 }]}
              onPress={handleCategories}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>📂</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    Categories
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Manage categories and symbols
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🚪 Account</Text>
            
            <TouchableOpacity
              style={[styles.menuButton, { borderColor: '#e74c3c' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>🚪</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: '#e74c3c' }]}>
                    Cerrar Sesión
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: '#e74c3c' }]}>
                    Salir de tu cuenta
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: '#e74c3c' }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Information Section */}
          <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
            <Text style={[styles.infoTitle, { color: theme.primary }]}>ℹ️ About</Text>
            <Text style={[styles.infoText, { color: theme.primary }]}>
              This menu is designed for parents and tutors to configure the app.{'\n\n'}
              Children will directly access the word selection screen for simple communication.
            </Text>
          </View>

          {/* Coming Soon */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🔜 Coming Soon</Text>
            
            <View style={styles.featureList}>
              <Text style={[styles.featureItem, { color: theme.primary }]}>• User profiles</Text>
              <Text style={[styles.featureItem, { color: theme.primary }]}>• Custom word categories</Text>
              <Text style={[styles.featureItem, { color: theme.primary }]}>• Voice settings</Text>
              <Text style={[styles.featureItem, { color: theme.primary }]}>• Usage statistics</Text>
              <Text style={[styles.featureItem, { color: theme.primary }]}>• Parental controls</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(ParentMenuScreen);

