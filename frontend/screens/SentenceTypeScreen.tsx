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
import { styles } from './SentenceTypeScreen.styles';

/**
 * Sentence type for context
 */
export type SentenceType = 'ask' | 'comment' | 'request' | 'agree';

/**
 * Sentence type selection screen
 * User chooses what type of communication they want to make
 * Optimized with useCallback for better performance
 */
const SentenceTypeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleSentenceType = useCallback((type: SentenceType, color: string) => {
    (navigation as any).navigate('TopicSelection', { sentenceType: type, selectedColor: color });
  }, [navigation]);

  const handleAsk = useCallback(() => handleSentenceType('ask', theme.primary), [handleSentenceType, theme.primary]);
  const handleComment = useCallback(() => handleSentenceType('comment', theme.secondary), [handleSentenceType, theme.secondary]);
  const handleRequest = useCallback(() => handleSentenceType('request', theme.tertiary), [handleSentenceType, theme.tertiary]);
  const handleAgree = useCallback(() => handleSentenceType('agree', theme.accent), [handleSentenceType, theme.accent]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <Header title="New Sentence" />

      {/* Contenido principal */}
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        <Text style={[styles.questionText, { color: theme.primary }]}>What do you want to say?</Text>

        {/* Botones de tipo de oración */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: 'white', borderColor: theme.primary, borderWidth: 3 }]}
            onPress={handleAsk}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>❓</Text>
            <Text style={[styles.buttonText, { color: theme.primary }]}>Ask</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: 'white', borderColor: theme.secondary, borderWidth: 3 }]}
            onPress={handleComment}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>💭</Text>
            <Text style={[styles.buttonText, { color: theme.secondary }]}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: 'white', borderColor: theme.tertiary, borderWidth: 3 }]}
            onPress={handleRequest}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>🙏</Text>
            <Text style={[styles.buttonText, { color: theme.tertiary }]}>Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, { backgroundColor: 'white', borderColor: theme.accent, borderWidth: 3 }]}
            onPress={handleAgree}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonIcon}>✅</Text>
            <Text style={[styles.buttonText, { color: theme.accent }]}>Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(SentenceTypeScreen);
