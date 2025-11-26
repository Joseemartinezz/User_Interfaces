import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { generateMorePhrases } from '../api';
import { generateImagesForPhrases, GeneratedImage } from '../services/imageService';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { styles } from './PhraseSelectionScreen.styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PhraseSelectionParams = {
  phrases: string[];
  words: string[];
  topic?: string;
};

interface PhraseWithImage {
  phrase: string;
  imageUrl: string;
  isLoading: boolean;
}

/**
 * Phrase selection screen with flashcard design
 * Shows AI-generated phrases with images in a swipeable carousel
 * Each phrase is displayed as a flashcard with image and text-to-speech
 */
const PhraseSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: PhraseSelectionParams }, 'params'>>();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  const params = route.params;
  const initialPhrases = params?.phrases || [];
  const words = params?.words || [];
  const topic = params?.topic;

  const [phrasesWithImages, setPhrasesWithImages] = useState<PhraseWithImage[]>([]);
  const [allPhrases, setAllPhrases] = useState<string[]>(initialPhrases);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Clean phrase by removing leading numbers and dots
  const cleanPhrase = useCallback((phrase: string): string => {
    return phrase.trim().replace(/^\d+\.\s*/, "");
  }, []);

  // Generate images for initial phrases (only first 3)
  useEffect(() => {
    const loadImagesForPhrases = async () => {
      console.log('🎨 Cargando imágenes para frases iniciales...');
      
      // Limitar a solo las primeras 3 frases
      const firstThreePhrases = initialPhrases.slice(0, 3);
      
      // Inicializar con loading state
      const initialData: PhraseWithImage[] = firstThreePhrases.map(phrase => ({
        phrase,
        imageUrl: '',
        isLoading: true,
      }));
      setPhrasesWithImages(initialData);

      try {
        const images = await generateImagesForPhrases(firstThreePhrases);
        const phrasesData: PhraseWithImage[] = images.map(img => ({
          phrase: img.phrase,
          imageUrl: img.imageUrl,
          isLoading: false,
        }));
        setPhrasesWithImages(phrasesData);
        console.log('✅ Imágenes cargadas exitosamente');
      } catch (error: any) {
        console.error('Error cargando imágenes:', error);
        Alert.alert('Error', 'Could not generate images for some phrases');
        // Mantener las frases pero sin imágenes
        const phrasesData: PhraseWithImage[] = firstThreePhrases.map(phrase => ({
          phrase,
          imageUrl: '',
          isLoading: false,
        }));
        setPhrasesWithImages(phrasesData);
      }
    };

    if (initialPhrases.length > 0) {
      loadImagesForPhrases();
    }
  }, [initialPhrases]);

  // Play phrase with text-to-speech with higher volume
  const handleSpeakPhrase = useCallback((phrase: string) => {
    const cleaned = cleanPhrase(phrase);
    Speech.stop();
    Speech.speak(cleaned, {
      language: 'en',
      pitch: 1.2,
      rate: 0.9,
      volume: 1.0, // Volumen máximo
    });
  }, [cleanPhrase]);

  // Generate more phrases with images
  const handleGenerateMorePhrases = useCallback(async () => {
    if (!words || words.length === 0) {
      return;
    }

    setIsGeneratingMore(true);
    try {
      const morePhrases = await generateMorePhrases(words, allPhrases);
      
      // Agregar las nuevas frases con loading state
      const newPhrasesWithLoading: PhraseWithImage[] = morePhrases.map(phrase => ({
        phrase,
        imageUrl: '',
        isLoading: true,
      }));
      
      setPhrasesWithImages(prev => [...prev, ...newPhrasesWithLoading]);
      setAllPhrases(prev => [...prev, ...morePhrases]);

      // Generar imágenes para las nuevas frases
      const images = await generateImagesForPhrases(morePhrases);
      const newPhrasesData: PhraseWithImage[] = images.map(img => ({
        phrase: img.phrase,
        imageUrl: img.imageUrl,
        isLoading: false,
      }));

      // Actualizar solo las nuevas frases
      setPhrasesWithImages(prev => {
        const updated = [...prev];
        const startIndex = prev.length - morePhrases.length;
        newPhrasesData.forEach((data, i) => {
          updated[startIndex + i] = data;
        });
        return updated;
      });

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not generate more phrases');
      console.error('Error generating more phrases:', error);
    } finally {
      setIsGeneratingMore(false);
    }
  }, [words, allPhrases]);

  // Go back to PCS screen
  const handleBackToPCS = useCallback(() => {
    setSelectedIndex(null);
    setTappedIndex(null);
    (navigation as any).navigate('PCS', { topic });
  }, [navigation, topic]);

  // Handle card tap - play audio and enable selection
  const handleCardTap = useCallback((index: number) => {
    const phrase = phrasesWithImages[index]?.phrase;
    if (phrase) {
      // Reproducir audio automáticamente
      handleSpeakPhrase(phrase);
      // Habilitar el botón de selección
      setTappedIndex(index);
    }
  }, [phrasesWithImages, handleSpeakPhrase]);

  // Select/Deselect phrase
  const handleSelectPhrase = useCallback((index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setTappedIndex(null);
    } else {
      setSelectedIndex(index);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  }, [selectedIndex]);

  // Render single flashcard
  const renderFlashcard = useCallback(({ item, index }: { item: PhraseWithImage; index: number }) => {
    const isSelected = selectedIndex === index;
    const isTapped = tappedIndex === index;
    
    return (
      <View style={[styles.flashcardContainer, isSelected && styles.flashcardContainerSelected]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleCardTap(index)}
          style={styles.flashcardTouchable}
        >
          <View style={[
            styles.flashcard,
            { backgroundColor: theme.white },
            isTapped && { borderWidth: 4, borderColor: theme.primary }
          ]}>
            {/* Imagen */}
            <View style={styles.imageContainer}>
              {item.isLoading ? (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.imageLoadingText, { color: theme.primary }]}>
                    Generating image...
                  </Text>
                </View>
              ) : item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.phraseImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.accent }]}>
                  <Text style={styles.placeholderEmoji}>🖼️</Text>
                </View>
              )}
            </View>

            {/* Texto de la frase */}
            <View style={styles.phraseTextContainer}>
              <Text style={[styles.phraseText, { color: theme.primary }]}>
                {cleanPhrase(item.phrase)}
              </Text>
            </View>

            {/* Botón de seleccionar (siempre visible, sombreado si no está tocado) */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                isTapped
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: theme.accent, opacity: 0.4 }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (isTapped) {
                  handleSelectPhrase(index);
                } else {
                  handleCardTap(index);
                }
              }}
              activeOpacity={0.7}
              disabled={!isTapped && !isSelected}
            >
              <Text style={styles.selectButtonText}>Select Phrase</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [selectedIndex, tappedIndex, theme, cleanPhrase, handleCardTap, handleSelectPhrase, phrasesWithImages.length]);

  // Handle scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Indicadores de deslizamiento (flechas sutiles)
  const showLeftArrow = phrasesWithImages.length > 1 && currentIndex > 0 && selectedIndex === null;
  const showRightArrow = phrasesWithImages.length > 1 && currentIndex < phrasesWithImages.length - 1 && selectedIndex === null;

  // Si hay una frase seleccionada, mostrar vista especial
  if (selectedIndex !== null) {
    const selectedPhrase = phrasesWithImages[selectedIndex];
    
    return (
      <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar style="auto" />
          
          <Header
            title="Selected Phrase"
            subtitle="Your chosen phrase"
          />

          {/* Flashcard seleccionada (más grande) */}
          <View style={styles.selectedFlashcardWrapper}>
            <View style={[styles.flashcard, styles.flashcardSelected, { backgroundColor: theme.white }]}>
              <View style={styles.imageContainer}>
                {selectedPhrase.isLoading ? (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                ) : selectedPhrase.imageUrl ? (
                  <Image
                    source={{ uri: selectedPhrase.imageUrl }}
                    style={styles.phraseImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: theme.accent }]}>
                    <Text style={styles.placeholderEmoji}>🖼️</Text>
                  </View>
                )}
              </View>

              <View style={styles.phraseTextContainer}>
                <Text style={[styles.phraseText, styles.phraseTextLarge, { color: theme.primary }]}>
                  {cleanPhrase(selectedPhrase.phrase)}
                </Text>
              </View>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.selectedActionButtons}>
            <TouchableOpacity
              style={[styles.deselectButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                setSelectedIndex(null);
                setTappedIndex(null);
              }}
            >
              <Text style={styles.deselectButtonText}>Back to Phrases</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.homeButton, { backgroundColor: 'white', borderColor: theme.tertiary, borderWidth: 2 }]}
              onPress={handleBackToPCS}
            >
              <Text style={[styles.homeButtonText, { color: theme.tertiary }]}>Back to Words</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Vista normal con carrusel
  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        
        <Header
          title="Generated Phrases"
          subtitle="Swipe to see more phrases"
        />

        {/* Carrusel de flashcards */}
        {phrasesWithImages.length > 0 ? (
          <View style={styles.carouselWrapper}>
            {/* Flecha izquierda */}
            {showLeftArrow && (
              <View style={[styles.arrowIndicator, styles.arrowLeft]}>
                <Text style={styles.arrowText}>‹</Text>
              </View>
            )}
            
            <FlatList
              ref={flatListRef}
              data={phrasesWithImages}
              renderItem={renderFlashcard}
              keyExtractor={(item, index) => `${item.phrase}-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="center"
              decelerationRate={0.9}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              scrollEnabled={selectedIndex === null}
              contentContainerStyle={styles.flatListContent}
              getItemLayout={(data, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
            
            {/* Flecha derecha */}
            {showRightArrow && (
              <View style={[styles.arrowIndicator, styles.arrowRight]}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            )}
            
            {/* Indicadores de página (dots) */}
            {phrasesWithImages.length > 1 && (
              <View style={styles.dotsContainer}>
                {phrasesWithImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: currentIndex === index ? theme.primary : theme.accent,
                        opacity: currentIndex === index ? 1 : 0.3,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.emptyText, { color: theme.primary }]}>
              Generating your phrases...
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[
              styles.generateButton,
              { backgroundColor: 'white', borderColor: theme.primary, borderWidth: 2 },
              isGeneratingMore && styles.buttonDisabled
            ]}
            onPress={handleGenerateMorePhrases}
            disabled={isGeneratingMore}
          >
            {isGeneratingMore ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
              <Text style={[styles.generateButtonText, { color: theme.primary }]}>
                Generate 3 More
              </Text>
          )}
        </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: 'white', borderColor: theme.tertiary, borderWidth: 2 }]}
            onPress={handleBackToPCS}
          >
            <Text style={[styles.homeButtonText, { color: theme.tertiary }]}>Back to Words</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default React.memo(PhraseSelectionScreen);
