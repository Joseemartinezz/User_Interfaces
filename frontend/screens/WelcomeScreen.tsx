import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { styles } from './WelcomeScreen.styles';

/**
 * Welcome/home screen of the application
 * Shows 4 options: Favorites, Most Used, History, New Sentence
 * Currently only "New Sentence" is navigable
 * Optimized with useCallback for better performance
 */
const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleNewSentence = useCallback(() => {
    navigation.navigate('SentenceType' as never);
  }, [navigation]);

  const handleComingSoon = useCallback((feature: string) => {
    // These functions are not yet implemented
    console.log(`${feature} - Coming Soon`);
  }, []);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <Header
        title="WizzWords"
        showBackButton={false}
      />

      {/* Contenido principal */}
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        <Text style={[styles.welcomeText, { color: theme.primary }]}>What do you want to do?</Text>

        {/* Grid de botones principales - 2x2 */}
        <View style={styles.buttonGrid}>
          {/* New Sentence Button - ACTIVE */}
          <TouchableOpacity
            style={[styles.mainButton, { borderColor: theme.primary, backgroundColor: 'white' }]}
            onPress={handleNewSentence}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>➕</Text>
            <Text style={[styles.buttonText, { color: theme.primary }]}>New Sentence</Text>
          </TouchableOpacity>

          {/* Favorites Button - Disabled */}
          <TouchableOpacity
            style={[styles.mainButton, styles.disabledButton, { borderColor: theme.accent }]}
            onPress={() => handleComingSoon('Favorites')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>⭐</Text>
            <Text style={[styles.buttonText, { color: theme.primary }]}>Favorites</Text>
          </TouchableOpacity>

          {/* Most Used Button - Disabled */}
          <TouchableOpacity
            style={[styles.mainButton, styles.disabledButton, { borderColor: theme.accent }]}
            onPress={() => handleComingSoon('Most Used')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>🔥</Text>
            <Text style={[styles.buttonText, { color: theme.primary }]}>Most Used</Text>
          </TouchableOpacity>

          {/* History Button - Disabled */}
          <TouchableOpacity
            style={[styles.mainButton, styles.disabledButton, { borderColor: theme.accent }]}
            onPress={() => handleComingSoon('History')}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>⏪</Text>
            <Text style={[styles.buttonText, { color: theme.primary }]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(WelcomeScreen);

