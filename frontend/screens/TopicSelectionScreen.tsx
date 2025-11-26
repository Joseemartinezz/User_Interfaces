import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/common/Header';
import { SentenceType } from './SentenceTypeScreen';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { styles } from './TopicSelectionScreen.styles';

type TopicSelectionParams = {
  sentenceType: SentenceType;
  selectedColor?: string;
};

// Predefined topics to select with emojis
const TOPICS = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Games', emoji: '🎮' },
  { name: 'School', emoji: '🏫' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Animals', emoji: '🐾' },
  { name: 'Transport', emoji: '🚗' },
];

/**
 * Topic selection screen
 * Allows user to choose a topic for their message
 * Optimized with useCallback for better performance
 */
const TopicSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: TopicSelectionParams }, 'params'>>();
  const { theme } = useTheme();
  const params = route.params;
  const sentenceType = params?.sentenceType;
  const selectedColor = params?.selectedColor || theme.primary;

  const handleTopicSelect = useCallback((topic: string) => {
    navigation.navigate('PCS', {
      sentenceType,
      topic,
    });
  }, [navigation, sentenceType]);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header title="Select a Topic" backgroundColor={selectedColor} />

        {/* Contenido principal */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <Text style={[styles.questionText, { color: selectedColor }]}>What do you want to talk about?</Text>

          {/* Grid de temas */}
          <ScrollView 
            style={styles.topicsContainer}
            contentContainerStyle={styles.topicsGrid}
            showsVerticalScrollIndicator={false}
          >
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.name}
                style={[
                  styles.topicButton,
                  { 
                    backgroundColor: 'white',
                    borderColor: selectedColor,
                  }
                ]}
                onPress={() => handleTopicSelect(topic.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.topicEmoji}>{topic.emoji}</Text>
                <Text style={[styles.topicText, { color: selectedColor }]}>{topic.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(TopicSelectionScreen);

