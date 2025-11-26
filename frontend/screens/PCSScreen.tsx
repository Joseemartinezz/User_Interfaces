import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  InteractionManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generatePhrases, getPictogramImageUrl } from '../api';
import Header from '../components/common/Header';
import { SentenceType } from './SentenceTypeScreen';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import { styles } from './PCSScreen.styles';

// Component to display pictograms with error handling and loading
// Memoized to avoid unnecessary re-renders
interface PictogramImageProps {
  arasaacId: number;
  style?: any;
}

const PictogramImage: React.FC<PictogramImageProps> = React.memo(({ arasaacId, style }) => {
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Memoizar URL del pictograma
  const imageUrl = useMemo(() => 
    getPictogramImageUrl(arasaacId, { 
      color: true, 
      backgroundColor: 'white' 
    }),
    [arasaacId]
  );
  
  // Optimize useEffect with InteractionManager
  // CRITICAL: Do not block render during back navigation
  useEffect(() => {
    // Reset states immediately (does not block UI)
    setImageError(false);
    setErrorMessage(null);
    // DO NOT set imageLoading to true here - causes layout shift
    // Image will be displayed directly without ActivityIndicator
    
    // Execute logs after interactions to avoid blocking UI
    const task = InteractionManager.runAfterInteractions(() => {
      console.log(`🖼️ Pictograma ID ${arasaacId} - URL: ${imageUrl}`);
    });
    
    // Optimized cleanup - does not block during unmount
    return () => {
      // Cancel async tasks to avoid blocking
      task.cancel();
    };
  }, [arasaacId, imageUrl]);
  
  // Removed handleLoadStart - not needed since we don't show ActivityIndicator
  const handleLoad = useCallback(() => {
    // Image loaded successfully
  }, []);
  
  const handleError = useCallback((error: any) => {
    const errorDetails = error.nativeEvent || error;
    console.error(`❌ Error loading pictogram ID ${arasaacId}`);
    
    let finalErrorMessage = 'Error loading';
    if (errorDetails.error) {
      finalErrorMessage = String(errorDetails.error);
    } else if (typeof errorDetails === 'string') {
      finalErrorMessage = errorDetails;
    }
    
    setErrorMessage(finalErrorMessage);
    setImageError(true);
  }, [arasaacId]);
  
  if (imageError) {
    // Show a placeholder if there's an error with debug information
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={styles.errorText}>❓</Text>
        <Text style={styles.errorSubtext}>ID: {arasaacId}</Text>
        {errorMessage && (
          <Text style={styles.errorSubtext} numberOfLines={2}>
            {errorMessage.substring(0, 50)}...
          </Text>
        )}
      </View>
    );
  }
  
  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#f5f5f5' }]}>
      {/* CRITICAL: Do not show ActivityIndicator - causes layout shift and white flash */}
      <Image
        source={{ 
          uri: imageUrl,
          cache: 'default'
        }}
        style={style}
        resizeMode="contain"
        onLoad={handleLoad}
        onLoadEnd={handleLoad}
        onError={handleError}
        // CRITICAL: Smooth fade in without blocking initial render
        fadeDuration={150}
      />
    </View>
  );
});

// Prototype words with ARASAAC pictograms
const WORD_SYMBOLS = [
  { 
    id: 1, 
    text: 'I', 
    arasaacId: 6632,
    imageUrl: getPictogramImageUrl(6632, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 2, 
    text: 'You', 
    arasaacId: 6625,
    imageUrl: getPictogramImageUrl(6625, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 3, 
    text: 'Not', 
    arasaacId: 32308,
    imageUrl: getPictogramImageUrl(32308, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 4, 
    text: 'Like', 
    arasaacId: 37826,
    imageUrl: getPictogramImageUrl(37826, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 5, 
    text: 'Want', 
    arasaacId: 5441,
    imageUrl: getPictogramImageUrl(5441, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 6, 
    text: 'Play', 
    arasaacId: 23392,
    imageUrl: getPictogramImageUrl(23392, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 7, 
    text: 'Football', 
    arasaacId: 16743,
    imageUrl: getPictogramImageUrl(16743, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 8, 
    text: 'Pizza', 
    arasaacId: 2527,
    imageUrl: getPictogramImageUrl(2527, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 9, 
    text: 'School', 
    arasaacId: 32446,
    imageUrl: getPictogramImageUrl(32446, { color: true, backgroundColor: 'white' })
  },
];

type PCSScreenParams = {
  sentenceType?: SentenceType;
  topic?: string;
};

/**
 * PCS symbol selection screen
 * Allows user to select words through pictograms
 * MAIN SCREEN: Children access directly here
 * Also accessible from guided flow (with sentenceType and topic)
 * Optimized with useCallback, useMemo and InteractionManager
 */
const PCSScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: PCSScreenParams }, 'params'>>();
  const { theme } = useTheme();
  // Params are optional - they may come from guided flow or not
  const params = route.params;
  const sentenceType = params?.sentenceType;
  const topic = params?.topic;

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Optimized function to select/deselect words
  const handleWordPress = useCallback((word: string) => {
    setSelectedWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      } else {
        return [...prev, word];
      }
    });
  }, []);

  // Generate phrases with Gemini
  const handleGeneratePhrases = useCallback(async () => {
    if (selectedWords.length === 0) {
      Alert.alert('Error', 'Please select at least one word');
      return;
    }

    setIsLoading(true);
    try {
      const generatedPhrases = await generatePhrases(selectedWords);
      // Navigate to phrase selection screen
      navigation.navigate('PhraseSelection', {
        phrases: generatedPhrases,
        words: selectedWords,
        sentenceType,
        topic,
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Could not generate phrases. Check your Gemini API key.'
      );
      console.error('Error generating phrases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWords, navigation, sentenceType, topic]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedWords([]);
  }, []);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <Header
          title="Word Selection"
          showBackButton={!!sentenceType}
        />

        {/* Selected words with pictograms */}
        {/* CRITICAL: Avoid layout shift - always render container with fixed height */}
        <View style={[styles.outputArea, { backgroundColor: theme.white }]}>
          <View style={styles.selectedWordsWrapper}>
            {selectedWords.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.selectedWordsContainer}
                style={styles.selectedWordsScrollView}
                nestedScrollEnabled={true}
              >
                {selectedWords.map((word) => {
                  const symbol = WORD_SYMBOLS.find(s => s.text === word);
                  if (!symbol) return null;
                  
                  return (
                    <View key={word} style={styles.selectedWordItem}>
                      <PictogramImage 
                        arasaacId={symbol.arasaacId}
                        style={styles.selectedWordImage}
                      />
                      <Text style={styles.selectedWordText}>{word}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.emptySelectionText}>No words selected</Text>
            )}
          </View>
        </View>

      {/* Word grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Select Words</Text>
        <ScrollView 
          style={[styles.symbolGrid, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {WORD_SYMBOLS.map((symbol) => {
            const isSelected = selectedWords.includes(symbol.text);
            return (
              <TouchableOpacity
                key={symbol.id}
                style={[
                  styles.symbolButton,
                  { backgroundColor: 'white', borderColor: theme.accent },
                  isSelected && { borderColor: theme.primary, backgroundColor: 'white', borderWidth: 3 }
                ]}
                onPress={() => handleWordPress(symbol.text)}
                activeOpacity={0.7}
              >
                <PictogramImage 
                  arasaacId={symbol.arasaacId}
                  style={styles.symbolImage}
                />
                <Text style={styles.symbolText}>{symbol.text}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.generateButton, { backgroundColor: 'white', borderColor: theme.primary, borderWidth: 2 }, isLoading && styles.buttonDisabled]}
          onPress={handleGeneratePhrases}
          disabled={isLoading || selectedWords.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <Text style={[styles.generateButtonText, { color: theme.primary }]}>Generate Phrases</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.clearButton, { backgroundColor: 'white', borderColor: theme.tertiary, borderWidth: 2 }]} onPress={handleClear}>
          <Text style={[styles.clearButtonText, { color: theme.tertiary }]}>Clear</Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(PCSScreen);

