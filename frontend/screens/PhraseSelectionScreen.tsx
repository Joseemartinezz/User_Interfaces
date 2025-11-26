import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { generateMorePhrases } from '../api';
import Header from '../components/common/Header';
import { SentenceType } from './SentenceTypeScreen';
import { useTheme } from '../context/ThemeContext';
import { styles } from './PhraseSelectionScreen.styles';

type PhraseSelectionParams = {
  phrases: string[];
  words: string[];
  sentenceType: SentenceType;
  topic: string;
};

// Componente memoizado para cada botón de frase
const PhraseButton = React.memo<{ phrase: string; onPress: (phrase: string) => void }>(
  ({ phrase, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(phrase);
    }, [phrase, onPress]);

    const { theme } = useTheme();
    return (
      <TouchableOpacity
        style={[styles.phraseButton, { backgroundColor: theme.white, borderColor: theme.accent }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.phraseContent}>
          <Text style={styles.phraseIcon}>🔊</Text>
          <Text style={[styles.phraseText, { color: theme.primary }]}>{phrase}</Text>
        </View>
      </TouchableOpacity>
    );
  }
);

/**
 * Phrase selection screen
 * Shows AI-generated phrases and allows playing them with text-to-speech
 * Optimized with useCallback, useMemo and memoized components
 */
const PhraseSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: PhraseSelectionParams }, 'params'>>();
  const { theme } = useTheme();
  // CRITICAL: Ensure params always exist to avoid premature render
  const params = route.params;
  const initialPhrases = params?.phrases || [];
  const words = params?.words || [];
  const sentenceType = params?.sentenceType;
  const topic = params?.topic;

  const [phrases, setPhrases] = useState<string[]>(initialPhrases);
  const [allPhrases, setAllPhrases] = useState<string[]>(initialPhrases);
  const [isLoading, setIsLoading] = useState(false);

  // Clean phrase by removing leading numbers and dots (e.g., "1. " or "2. ")
  const cleanPhrase = useCallback((phrase: string): string => {
    return phrase.trim().replace(/^\d+\.\s*/, "");
  }, []);

  // Play phrase with text-to-speech
  const handleSpeakPhrase = useCallback((phrase: string) => {
    const cleaned = cleanPhrase(phrase);
    Speech.speak(cleaned, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  }, [cleanPhrase]);

  // Generate more phrases
  const handleGenerateMorePhrases = useCallback(async () => {
    if (!words || words.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const morePhrases = await generateMorePhrases(words, allPhrases);
      setPhrases(morePhrases);
      setAllPhrases(prev => [...prev, ...morePhrases]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not generate more phrases');
      console.error('Error generating more phrases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [words, allPhrases]);

  // Go back to home screen
  const handleBackToHome = useCallback(() => {
    navigation.navigate('Welcome' as never);
  }, [navigation]);

  // Memoize phrase buttons to avoid re-renders
  const phraseButtons = useMemo(() =>
    phrases.map((phrase, index) => (
      <PhraseButton
        key={`${phrase}-${index}`}
        phrase={phrase}
        onPress={handleSpeakPhrase}
      />
    )),
    [phrases, handleSpeakPhrase]
  );

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header
          title="Generated Phrases"
          subtitle="Tap a phrase to play it"
        />

        {/* Frases generadas */}
        <ScrollView style={[styles.phrasesContainer, { backgroundColor: theme.background }]} contentContainerStyle={styles.phrasesContent}>
          {phraseButtons}
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.generateButton, { backgroundColor: 'white', borderColor: theme.primary, borderWidth: 2 }, isLoading && styles.buttonDisabled]}
            onPress={handleGenerateMorePhrases}
            disabled={isLoading}
          >
          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={[styles.generateButtonText, { color: theme.primary }]}>Generate More Phrases</Text>
          )}
        </TouchableOpacity>
          
          <TouchableOpacity style={[styles.homeButton, { backgroundColor: 'white', borderColor: theme.tertiary, borderWidth: 2 }]} onPress={handleBackToHome}>
            <Text style={[styles.homeButtonText, { color: theme.tertiary }]}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(PhraseSelectionScreen);

