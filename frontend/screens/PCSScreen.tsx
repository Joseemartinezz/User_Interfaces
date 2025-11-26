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
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generatePhrases, getPictogramImageUrl } from '../api';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
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

// Componente para mostrar símbolos personalizados
interface CustomSymbolImageProps {
  imageUrl: string;
  style?: any;
}

const CustomSymbolImage: React.FC<CustomSymbolImageProps> = React.memo(({ imageUrl, style }) => {
  const [imageError, setImageError] = useState(false);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={styles.errorText}>❓</Text>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#f5f5f5' }]}>
      <Image
        source={{ uri: imageUrl }}
        style={style}
        resizeMode="contain"
        onError={handleError}
        fadeDuration={150}
      />
    </View>
  );
});

// Categorías por defecto (mismo que CategoriesScreen)
const DEFAULT_CATEGORIES = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Games', emoji: '🎮' },
  { name: 'School', emoji: '🏫' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Animals', emoji: '🐾' },
  { name: 'Transport', emoji: '🚗' },
];

// Símbolos organizados por categorías (con más símbolos de prueba)
const SYMBOLS_BY_CATEGORY: Record<string, Array<{ id: number; text: string; arasaacId: number }>> = {
  'Food': [
    { id: 1, text: 'Pizza', arasaacId: 2527 },
    { id: 2, text: 'Apple', arasaacId: 2528 },
    { id: 3, text: 'Bread', arasaacId: 2529 },
    { id: 4, text: 'Water', arasaacId: 2530 },
    { id: 5, text: 'Milk', arasaacId: 2531 },
    { id: 6, text: 'Banana', arasaacId: 2532 },
    { id: 7, text: 'Orange', arasaacId: 2533 },
    { id: 8, text: 'Cake', arasaacId: 2534 },
    { id: 9, text: 'Soup', arasaacId: 2535 },
    { id: 10, text: 'Rice', arasaacId: 2536 },
    { id: 11, text: 'Meat', arasaacId: 2537 },
    { id: 12, text: 'Fish', arasaacId: 2538 },
    { id: 13, text: 'Egg', arasaacId: 2539 },
    { id: 14, text: 'Cheese', arasaacId: 2540 },
    { id: 15, text: 'Cookie', arasaacId: 2541 },
    { id: 16, text: 'Juice', arasaacId: 2542 },
  ],
  'Games': [
    { id: 13, text: 'Play', arasaacId: 23392 },
    { id: 14, text: 'Ball', arasaacId: 16743 },
    { id: 15, text: 'Toy', arasaacId: 16744 },
    { id: 16, text: 'Puzzle', arasaacId: 16745 },
    { id: 17, text: 'Doll', arasaacId: 16746 },
    { id: 18, text: 'Car', arasaacId: 16747 },
    { id: 19, text: 'Blocks', arasaacId: 16748 },
    { id: 20, text: 'Cards', arasaacId: 16749 },
    { id: 21, text: 'Board', arasaacId: 16750 },
    { id: 22, text: 'Video', arasaacId: 16751 },
    { id: 23, text: 'Console', arasaacId: 16752 },
    { id: 24, text: 'Game', arasaacId: 16753 },
    { id: 25, text: 'Fun', arasaacId: 16754 },
    { id: 26, text: 'Win', arasaacId: 16755 },
    { id: 27, text: 'Lose', arasaacId: 16756 },
    { id: 28, text: 'Team', arasaacId: 16757 },
  ],
  'School': [
    { id: 25, text: 'School', arasaacId: 32446 },
    { id: 26, text: 'Book', arasaacId: 32447 },
    { id: 27, text: 'Pencil', arasaacId: 32448 },
    { id: 28, text: 'Teacher', arasaacId: 32449 },
    { id: 29, text: 'Student', arasaacId: 32450 },
    { id: 30, text: 'Desk', arasaacId: 32451 },
    { id: 31, text: 'Chair', arasaacId: 32452 },
    { id: 32, text: 'Backpack', arasaacId: 32453 },
    { id: 33, text: 'Homework', arasaacId: 32454 },
    { id: 34, text: 'Test', arasaacId: 32455 },
    { id: 35, text: 'Learn', arasaacId: 32456 },
    { id: 36, text: 'Read', arasaacId: 32457 },
    { id: 37, text: 'Write', arasaacId: 32458 },
    { id: 38, text: 'Draw', arasaacId: 32459 },
    { id: 39, text: 'Class', arasaacId: 32460 },
    { id: 40, text: 'Friend', arasaacId: 32461 },
  ],
  'Family': [
    { id: 37, text: 'I', arasaacId: 6632 },
    { id: 38, text: 'You', arasaacId: 6625 },
    { id: 39, text: 'Mom', arasaacId: 6626 },
    { id: 40, text: 'Dad', arasaacId: 6627 },
    { id: 41, text: 'Brother', arasaacId: 6628 },
    { id: 42, text: 'Sister', arasaacId: 6629 },
    { id: 43, text: 'Baby', arasaacId: 6630 },
    { id: 44, text: 'Grandma', arasaacId: 6631 },
    { id: 45, text: 'Grandpa', arasaacId: 6633 },
    { id: 46, text: 'Aunt', arasaacId: 6634 },
    { id: 47, text: 'Uncle', arasaacId: 6635 },
    { id: 48, text: 'Cousin', arasaacId: 6636 },
    { id: 49, text: 'Son', arasaacId: 6637 },
    { id: 50, text: 'Daughter', arasaacId: 6638 },
    { id: 51, text: 'Family', arasaacId: 6639 },
    { id: 52, text: 'Home', arasaacId: 6640 },
  ],
  'Sports': [
    { id: 49, text: 'Football', arasaacId: 16743 },
    { id: 50, text: 'Basketball', arasaacId: 16754 },
    { id: 51, text: 'Run', arasaacId: 16755 },
    { id: 52, text: 'Jump', arasaacId: 16756 },
    { id: 53, text: 'Swim', arasaacId: 16757 },
    { id: 54, text: 'Bike', arasaacId: 16758 },
    { id: 55, text: 'Tennis', arasaacId: 16759 },
    { id: 56, text: 'Soccer', arasaacId: 16760 },
    { id: 57, text: 'Baseball', arasaacId: 16761 },
    { id: 58, text: 'Volleyball', arasaacId: 16762 },
    { id: 59, text: 'Gym', arasaacId: 16763 },
    { id: 60, text: 'Exercise', arasaacId: 16764 },
    { id: 61, text: 'Win', arasaacId: 16765 },
    { id: 62, text: 'Team', arasaacId: 16766 },
    { id: 63, text: 'Coach', arasaacId: 16767 },
    { id: 64, text: 'Match', arasaacId: 16768 },
  ],
  'Music': [
    { id: 61, text: 'Music', arasaacId: 16765 },
    { id: 62, text: 'Sing', arasaacId: 16766 },
    { id: 63, text: 'Dance', arasaacId: 16767 },
    { id: 64, text: 'Piano', arasaacId: 16768 },
    { id: 65, text: 'Guitar', arasaacId: 16769 },
    { id: 66, text: 'Drum', arasaacId: 16770 },
    { id: 67, text: 'Song', arasaacId: 16771 },
    { id: 68, text: 'Listen', arasaacId: 16772 },
    { id: 69, text: 'Radio', arasaacId: 16773 },
    { id: 70, text: 'Concert', arasaacId: 16774 },
    { id: 71, text: 'Band', arasaacId: 16775 },
    { id: 72, text: 'Play', arasaacId: 23392 },
    { id: 73, text: 'Microphone', arasaacId: 16776 },
    { id: 74, text: 'Speaker', arasaacId: 16777 },
    { id: 75, text: 'CD', arasaacId: 16778 },
    { id: 76, text: 'Headphones', arasaacId: 16779 },
  ],
  'Animals': [
    { id: 73, text: 'Dog', arasaacId: 16776 },
    { id: 74, text: 'Cat', arasaacId: 16777 },
    { id: 75, text: 'Bird', arasaacId: 16778 },
    { id: 76, text: 'Fish', arasaacId: 2538 },
    { id: 77, text: 'Rabbit', arasaacId: 16779 },
    { id: 78, text: 'Horse', arasaacId: 16780 },
    { id: 79, text: 'Cow', arasaacId: 16781 },
    { id: 80, text: 'Pig', arasaacId: 16782 },
    { id: 81, text: 'Duck', arasaacId: 16783 },
    { id: 82, text: 'Chicken', arasaacId: 16784 },
    { id: 83, text: 'Sheep', arasaacId: 16785 },
    { id: 84, text: 'Lion', arasaacId: 16786 },
    { id: 85, text: 'Bear', arasaacId: 16787 },
    { id: 86, text: 'Elephant', arasaacId: 16788 },
    { id: 87, text: 'Tiger', arasaacId: 16789 },
    { id: 88, text: 'Monkey', arasaacId: 16790 },
  ],
  'Transport': [
    { id: 85, text: 'Car', arasaacId: 16747 },
    { id: 86, text: 'Bus', arasaacId: 16787 },
    { id: 87, text: 'Train', arasaacId: 16788 },
    { id: 88, text: 'Plane', arasaacId: 16789 },
    { id: 89, text: 'Bike', arasaacId: 16758 },
    { id: 90, text: 'Boat', arasaacId: 16790 },
    { id: 91, text: 'Truck', arasaacId: 16791 },
    { id: 92, text: 'Motorcycle', arasaacId: 16792 },
    { id: 93, text: 'Taxi', arasaacId: 16793 },
    { id: 94, text: 'Helicopter', arasaacId: 16794 },
    { id: 95, text: 'Subway', arasaacId: 16795 },
    { id: 96, text: 'Walk', arasaacId: 16796 },
    { id: 97, text: 'Stop', arasaacId: 16797 },
    { id: 98, text: 'Go', arasaacId: 16798 },
    { id: 99, text: 'Road', arasaacId: 16799 },
    { id: 100, text: 'Parking', arasaacId: 16800 },
  ],
};

// Símbolos comunes (para categoría "All" o por defecto)
const COMMON_SYMBOLS = [
  { id: 100, text: 'I', arasaacId: 6632 },
  { id: 101, text: 'You', arasaacId: 6625 },
  { id: 102, text: 'Not', arasaacId: 32308 },
  { id: 103, text: 'Like', arasaacId: 37826 },
  { id: 104, text: 'Want', arasaacId: 5441 },
  { id: 105, text: 'Yes', arasaacId: 32309 },
  { id: 106, text: 'No', arasaacId: 32310 },
  { id: 107, text: 'More', arasaacId: 32311 },
  { id: 108, text: 'Less', arasaacId: 32312 },
  { id: 109, text: 'Help', arasaacId: 32313 },
  { id: 110, text: 'Please', arasaacId: 32314 },
  { id: 111, text: 'Thank', arasaacId: 32315 },
];

type PCSScreenParams = {
  topic?: string;
};

/**
 * PCS symbol selection screen
 * Allows user to select words through pictograms
 * MAIN SCREEN: Children access directly here
 * Also accessible from topic selection (with topic)
 * Optimized with useCallback, useMemo and InteractionManager
 */
const PCSScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: PCSScreenParams }, 'params'>>();
  const { theme } = useTheme();
  const { user } = useUser();
  // Params are optional - they may come from topic selection or not
  const params = route.params;
  const topic = params?.topic;

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Obtener categorías del usuario (similar a CategoriesScreen)
  const hiddenCategories = useMemo(() => {
    return user?.preferences.hiddenCategories || [];
  }, [user?.preferences.hiddenCategories]);

  const allCategories = useMemo(() => {
    // Filtrar categorías personalizadas que no estén ocultas
    const userCategories = (user?.preferences.categories || [])
      .filter(cat => !hiddenCategories.includes(cat.name))
      .map(cat => ({
        name: cat.name,
        emoji: cat.emoji || '📁',
        isCustom: true,
        id: cat.id,
      }));

    // Filtrar categorías predeterminadas que no estén ocultas
    const defaultCats = DEFAULT_CATEGORIES
      .filter(cat => !hiddenCategories.includes(cat.name))
      .map(cat => ({
        name: cat.name,
        emoji: cat.emoji,
        isCustom: false,
        id: cat.name,
      }));

    return [...defaultCats, ...userCategories];
  }, [user?.preferences.categories, hiddenCategories]);

  // Obtener símbolos para una categoría específica
  const getSymbolsForCategory = useCallback((categoryName: string) => {
    const categorySymbols = SYMBOLS_BY_CATEGORY[categoryName] || [];
    
    // Convertir a formato de símbolo
    const predefined = categorySymbols.map(s => ({
      id: s.id.toString(),
      text: s.text,
      arasaacId: s.arasaacId,
      imageUrl: getPictogramImageUrl(s.arasaacId, { color: true, backgroundColor: 'white' }),
      isCustom: false,
    }));

    // Añadir símbolos personalizados que pertenezcan a esta categoría
    const custom = (user?.preferences.customPCSSymbols || [])
      .filter(symbol => symbol.category === categoryName)
      .map((symbol) => ({
      id: `custom_${symbol.id}`,
      text: symbol.word,
      arasaacId: null,
      imageUrl: symbol.imageUrl,
      isCustom: true,
    }));

    return [...predefined, ...custom];
  }, [user?.preferences.customPCSSymbols]);

  // Obtener todos los símbolos (para búsqueda)
  const allSymbols = useMemo(() => {
    const allSymbolsList: Array<{
      id: string;
      text: string;
      arasaacId: number | null;
      imageUrl: string;
      isCustom: boolean;
    }> = [];

    // Añadir símbolos de todas las categorías
    Object.keys(SYMBOLS_BY_CATEGORY).forEach(category => {
      const symbols = getSymbolsForCategory(category);
      allSymbolsList.push(...symbols);
    });

    // Añadir símbolos comunes
    const commonSymbols = COMMON_SYMBOLS.map(s => ({
      id: s.id.toString(),
      text: s.text,
      arasaacId: s.arasaacId,
      imageUrl: getPictogramImageUrl(s.arasaacId, { color: true, backgroundColor: 'white' }),
      isCustom: false,
    }));
    allSymbolsList.push(...commonSymbols);

    // Añadir símbolos personalizados sin categoría
    const custom = (user?.preferences.customPCSSymbols || [])
      .filter(symbol => !symbol.category)
      .map((symbol) => ({
        id: `custom_${symbol.id}`,
        text: symbol.word,
        arasaacId: null,
        imageUrl: symbol.imageUrl,
        isCustom: true,
      }));
    allSymbolsList.push(...custom);

    return allSymbolsList;
  }, [getSymbolsForCategory, user?.preferences.customPCSSymbols]);

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
  }, [selectedWords, navigation, topic]);

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
          showBackButton={!!topic}
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
                  const symbol = allSymbols.find(s => s.text === word);
                  if (!symbol) return null;
                  
                  return (
                    <View key={`${symbol.id}_${word}`} style={styles.selectedWordItem}>
                      {symbol.isCustom ? (
                        <CustomSymbolImage 
                          imageUrl={symbol.imageUrl}
                          style={styles.selectedWordImage}
                        />
                      ) : (
                      <PictogramImage 
                          arasaacId={symbol.arasaacId!}
                        style={styles.selectedWordImage}
                      />
                      )}
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

      {/* Carrusel de categorías con cuadrículas */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Select Words</Text>
        <FlatList
          data={allCategories}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={true}
          keyExtractor={(item) => item.id}
          renderItem={({ item: category }) => {
            const categorySymbols = getSymbolsForCategory(category.name);
            
            return (
              <View style={styles.categoryGridContainer}>
                {/* Título de la categoría */}
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryName, { color: theme.primary }]}>
                    {category.name}
                  </Text>
                </View>
                
                {/* ScrollView vertical con cuadrícula 4x4 (hasta 16 elementos visibles inicialmente) */}
                {categorySymbols.length > 0 ? (
                  <ScrollView
                    style={styles.categoryScrollView}
                    contentContainerStyle={styles.grid4x4Container}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.grid4x4}>
                      {categorySymbols.map((symbol) => {
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
                            {symbol.isCustom ? (
                              <CustomSymbolImage 
                                imageUrl={symbol.imageUrl}
                                style={styles.symbolImage}
                              />
                            ) : (
                              <PictogramImage 
                                arasaacId={symbol.arasaacId!}
                                style={styles.symbolImage}
                              />
                            )}
                            <Text style={styles.symbolText}>{symbol.text}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.emptyCategoryContainer}>
                    <Text style={[styles.emptyCategoryText, { color: theme.accent }]}>
                      No hay símbolos en esta categoría
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          getItemLayout={(data, index) => {
            const itemWidth = Dimensions.get('window').width - 24; // Ancho menos márgenes del section
            return {
              length: itemWidth,
              offset: itemWidth * index,
              index,
            };
          }}
        />
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

