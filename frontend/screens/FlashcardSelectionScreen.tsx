import React, { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
  Animated,
  Easing,
  ImageStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { generateMorePhrases } from '../api';
import { getPictogramImageUrl } from '../services/arasaacService';
import { generateImagesForPhrases, GeneratedImage } from '../services/imageService';
import Header from '../components/common/Header';
import LoadingScreen from '../components/common/LoadingScreen';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { styles } from './FlashcardSelectionScreen.styles';

// Component to display ARASAAC pictograms with error handling
interface PictogramImageProps {
  arasaacId: number;
  style?: any;
}

const PictogramImage: React.FC<PictogramImageProps> = React.memo(({ arasaacId, style }) => {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();

  const imageUrl = useMemo(() =>
    getPictogramImageUrl(arasaacId, {
      color: true,
      backgroundColor: 'white'
    }),
    [arasaacId]
  );

  if (imageError) {
    return (
      <View style={[style, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 24 }}>❓</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl, cache: 'default' }}
      style={style}
      resizeMode="contain"
      onError={() => setImageError(true)}
      fadeDuration={150}
    />
  );
});

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
 * Flashcard selection screen with flashcard design
 * Shows AI-generated phrases with images in a swipeable carousel
 * Each phrase is displayed as a flashcard with image and text-to-speech
 */
const FlashcardSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: PhraseSelectionParams }, 'params'>>();
  const { theme } = useTheme();
  const { showError } = useToast();
  const { user } = useUser();
  const flatListRef = useRef<FlatList>(null);

  const params = route.params;
  const initialPhrases = params?.phrases || [];
  const words = params?.words || [];
  const topic = params?.topic;

  const [phrasesWithImages, setPhrasesWithImages] = useState<PhraseWithImage[]>([]);
  const [allPhrases, setAllPhrases] = useState<string[]>(initialPhrases);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  // Start with true to prevent flash of content before images are loaded
  const [isLoadingInitialImages, setIsLoadingInitialImages] = useState(initialPhrases.length > 0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tappedIndex, setTappedIndex] = useState<number | null>(null);

  // Animation values
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const flashcardScale = useRef(new Animated.Value(1)).current;
  const flashcardRotate = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(50)).current;
  const imagePulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const imagePulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const previousSelectedIndex = useRef<number | null>(null);

  // Clean phrase by removing leading numbers and dots
  const cleanPhrase = useCallback((phrase: string): string => {
    return phrase.trim().replace(/^\d+\.\s*/, "");
  }, []);

  const resetHeaderAnimation = useCallback(() => {
    headerTranslateY.setValue(0);
    headerOpacity.setValue(1);
  }, []);

  // Generate images for initial phrases (only first 3)
  useEffect(() => {
    const loadImagesForPhrases = async () => {
      console.log('🎨 Loading images for initial phrases...');

      // Limit to only the first 3 phrases
      const firstThreePhrases = initialPhrases.slice(0, 3);

      try {
        const images = await generateImagesForPhrases(firstThreePhrases);
        const phrasesData: PhraseWithImage[] = images.map(img => ({
          phrase: img.phrase,
          imageUrl: img.imageUrl,
          isLoading: false,
        }));
        setPhrasesWithImages(phrasesData);
        console.log('✅ Images loaded successfully');
      } catch (error: any) {
        console.error('Error loading images:', error);
        showError('Could not generate images for some phrases');
        // Keep phrases but without images
        const phrasesData: PhraseWithImage[] = firstThreePhrases.map(phrase => ({
          phrase,
          imageUrl: '',
          isLoading: false,
        }));
        setPhrasesWithImages(phrasesData);
      } finally {
        // Disable loading screen when done (success or error)
        setIsLoadingInitialImages(false);
      }
    };

    if (initialPhrases.length > 0) {
      loadImagesForPhrases();
    }
  }, [initialPhrases]);

  // Scroll to correct index when returning from selected view
  // This runs synchronously before the browser paints, preventing visual jump
  useLayoutEffect(() => {
    // If selectedIndex changed from a value to null, scroll to the correct index
    if (previousSelectedIndex.current !== null && selectedIndex === null && flatListRef.current) {
      const indexToScroll = previousSelectedIndex.current;
      try {
        flatListRef.current.scrollToIndex({ 
          index: indexToScroll, 
          animated: false 
        });
        setCurrentIndex(indexToScroll);
      } catch (error) {
        // If it fails, use scrollToOffset as fallback
        flatListRef.current.scrollToOffset({
          offset: SCREEN_WIDTH * indexToScroll,
          animated: false,
        });
        setCurrentIndex(indexToScroll);
      }
    }
    // Update the ref with the current value
    previousSelectedIndex.current = selectedIndex;
  }, [selectedIndex]);

  // Animate selection transition
  useEffect(() => {
    if (selectedIndex !== null) {
      // Animate IN - when a phrase is selected
      Animated.parallel([
        // Header slides up and disappears
        Animated.timing(headerTranslateY, {
          toValue: -100,
          duration: 250,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        // Flashcard grows with an elegant zoom effect
        Animated.spring(flashcardScale, {
          toValue: 1.08,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        // Small rotation for dynamic effect
        Animated.sequence([
          Animated.timing(flashcardRotate, {
            toValue: 2,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(flashcardRotate, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Glow effect
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Buttons appear from below
        Animated.sequence([
          Animated.delay(200),
          Animated.parallel([
            Animated.timing(buttonsOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(buttonsTranslateY, {
              toValue: 0,
              friction: 9,
              tension: 40,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

      // Continuous image pulse
      // Stop any previous pulse animation
      if (imagePulseAnimation.current) {
        imagePulseAnimation.current.stop();
      }
      imagePulseAnimation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(imagePulse, {
            toValue: 1.02,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(imagePulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      imagePulseAnimation.current.start();

    } else {
      resetHeaderAnimation();
      // Stop image pulse when deselected
      if (imagePulseAnimation.current) {
        imagePulseAnimation.current.stop();
        imagePulseAnimation.current = null;
      }
      // Animate OUT - when deselected
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(flashcardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(flashcardRotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsTranslateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(imagePulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedIndex, resetHeaderAnimation]);

  // Play phrase with text-to-speech
  const handleSpeakPhrase = useCallback((phrase: string) => {
    const cleaned = cleanPhrase(phrase);
    Speech.stop();
    Speech.speak(cleaned, {
      language: 'en',
      pitch: 1.2,
      rate: 0.9,
      volume: 0.5,
    });
  }, [cleanPhrase]);

  // Generate more phrases with images
  const handleGenerateMorePhrases = useCallback(async () => {
    if (!words || words.length === 0) {
      return;
    }

    setIsGeneratingMore(true);
    try {
      const childAge = user?.preferences.childAge;
      const morePhrases = await generateMorePhrases(words, allPhrases, childAge);

      // Add new phrases with loading state
      const newPhrasesWithLoading: PhraseWithImage[] = morePhrases.map(phrase => ({
        phrase,
        imageUrl: '',
        isLoading: true,
      }));

      setPhrasesWithImages(prev => [...prev, ...newPhrasesWithLoading]);
      setAllPhrases(prev => [...prev, ...morePhrases]);

      // Generate images for new phrases
      const images = await generateImagesForPhrases(morePhrases);
      const newPhrasesData: PhraseWithImage[] = images.map(img => ({
        phrase: img.phrase,
        imageUrl: img.imageUrl,
        isLoading: false,
      }));

      // Update only the new phrases
      setPhrasesWithImages(prev => {
        const updated = [...prev];
        const startIndex = prev.length - morePhrases.length;
        newPhrasesData.forEach((data, i) => {
          updated[startIndex + i] = data;
        });
        return updated;
      });

    } catch (error: any) {
      showError(error.message || 'Could not generate more phrases');
      console.error('Error generating more phrases:', error);
    } finally {
      setIsGeneratingMore(false);
    }
  }, [words, allPhrases, user?.preferences.childAge]);

  // Go back to PCS screen
  const handleBackToPCS = useCallback(() => {
    resetHeaderAnimation();
    setSelectedIndex(null);
    setTappedIndex(null);
    (navigation as any).navigate('PCS', { topic });
  }, [navigation, topic, resetHeaderAnimation]);

  // Handle card tap - play audio and enable selection
  const handleCardTap = useCallback((index: number) => {
    const phrase = phrasesWithImages[index]?.phrase;
    if (phrase) {
      // Play audio automatically
      handleSpeakPhrase(phrase);
      // Enable selection button
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
            {/* Image with audio indicator */}
            <View style={styles.imageContainer}>
              {/* Audio indicator badge - shows that tapping plays audio */}
              <View style={styles.audioIndicatorBadge}>
                <Text style={styles.audioIndicatorIcon}>🔊</Text>
              </View>
              
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
                  style={styles.phraseImage as ImageStyle}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.accent }]}>
                  <Text style={styles.placeholderEmoji}>🖼️</Text>
                </View>
              )}
            </View>

            {/* Phrase text */}
            <View style={styles.phraseTextContainer}>
              <Text style={[styles.phraseText, { color: theme.primary }]}>
                {cleanPhrase(item.phrase)}
              </Text>
            </View>

            {/* Select button (always visible, shaded if not tapped) */}
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
              <PictogramImage
                arasaacId={6612}
                style={styles.selectButtonImage}
              />
              <Text style={styles.selectButtonText}>Select</Text>
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

  // Slide indicators (subtle arrows)
  const showLeftArrow = phrasesWithImages.length > 1 && currentIndex > 0 && selectedIndex === null;
  const showRightArrow = phrasesWithImages.length > 1 && currentIndex < phrasesWithImages.length - 1 && selectedIndex === null;

  // Show loading screen while generating initial images
  if (isLoadingInitialImages) {
    return <LoadingScreen message="Creating your flashcards..." />;
  }

  // If there's a selected phrase, show special view
  if (selectedIndex !== null) {
    const selectedPhrase = phrasesWithImages[selectedIndex];

    const rotateInterpolate = flashcardRotate.interpolate({
      inputRange: [0, 360],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <StatusBar style="auto" />

          {/* Animated header - slides up and disappears */}
          <Animated.View
            style={{
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
            }}
          >
            <Header
              title="Generated Phrases"
            />
          </Animated.View>

          {/* Selected flashcard (larger) with animation */}
          <View style={styles.selectedFlashcardWrapper}>
            {/* Background glow effect */}
            <Animated.View
              style={{
                position: 'absolute',
                width: '105%',
                height: '105%',
                borderRadius: 24,
                backgroundColor: theme.accent,
                opacity: glowOpacity,
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 30,
                elevation: 25,
              }}
            />
            
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => handleSpeakPhrase(selectedPhrase.phrase)}
              style={styles.flashcardTouchable}
            >
              <Animated.View
                style={{
                  width: '100%',
                  height: '100%',
                  transform: [
                    { scale: flashcardScale },
                    { rotate: rotateInterpolate },
                  ],
                }}
              >
                <View style={[styles.flashcard, styles.flashcardSelected, { backgroundColor: theme.white }]}>
                  <Animated.View 
                    style={[
                      styles.imageContainer,
                      {
                        transform: [{ scale: imagePulse }],
                      }
                    ]}
                  >
                    {/* Audio indicator badge - shows that tapping plays audio */}
                    <View style={styles.audioIndicatorBadge}>
                      <Text style={styles.audioIndicatorIcon}>🔊</Text>
                    </View>
                    
                    {selectedPhrase.isLoading ? (
                      <View style={styles.imageLoadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                      </View>
                    ) : selectedPhrase.imageUrl ? (
                      <Image
                        source={{ uri: selectedPhrase.imageUrl }}
                        style={styles.phraseImage as ImageStyle}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.imagePlaceholder, { backgroundColor: theme.accent }]}>
                        <Text style={styles.placeholderEmoji}>🖼️</Text>
                      </View>
                    )}
                  </Animated.View>

                  <View style={[styles.phraseTextContainer, { flex: 1, justifyContent: 'center' }]}>
                    <Text style={[styles.phraseText, styles.phraseTextLarge, { color: theme.primary }]}>
                      {cleanPhrase(selectedPhrase.phrase)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Animated action buttons - appear from below */}
          <Animated.View
            style={[
              styles.selectedActionButtons,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsTranslateY }],
              },
            ]}
          >
            {/* Back to Phrases button */}
            <TouchableOpacity
              style={[
                styles.pcsButtonSelected,
                { backgroundColor: 'white', borderColor: theme.primary }
              ]}
              onPress={() => {
                resetHeaderAnimation();
                // Simply change state - useLayoutEffect will handle scrolling
                setSelectedIndex(null);
                setTappedIndex(null);
              }}
              accessible={true}
              accessibilityLabel="Back to phrase list"
              accessibilityRole="button"
            >
              {/* Back arrow pictogram */}
              <PictogramImage
                arasaacId={38219}
                style={styles.pcsButtonSelectedImage}
              />
              <Text style={[styles.pcsButtonSelectedText, { color: theme.primary }]} numberOfLines={1}>
                Back
              </Text>
            </TouchableOpacity>

            {/* Back to Words button */}
            <TouchableOpacity
              style={[
                styles.pcsButtonSelected,
                { backgroundColor: 'white', borderColor: theme.tertiary }
              ]}
              onPress={handleBackToPCS}
              accessible={true}
              accessibilityLabel="Go back to word selection"
              accessibilityRole="button"
            >
              {/* Home/Words pictogram - ARASAAC ID 38249 (house/home) */}
              <PictogramImage
                arasaacId={38249}
                style={styles.pcsButtonSelectedImage}
              />
              <Text style={[styles.pcsButtonSelectedText, { color: theme.tertiary }]} numberOfLines={1}>
                Back to Words
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Normal view with carousel
  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Animated header */}
        <Animated.View
          style={{
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          }}
        >
          <Header
            title="Generated Phrases"
          />
        </Animated.View>

        {/* Flashcards carousel */}
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

            {/* Page indicators (dots) */}
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

        {/* Action buttons - PCS style with pictograms */}
        <View style={styles.actionButtons}>
          {/* Generate More button - PCS style */}
          <TouchableOpacity
            style={[
              styles.pcsButton,
              { backgroundColor: 'white', borderColor: theme.primary },
              isGeneratingMore && styles.buttonDisabled
            ]}
            onPress={handleGenerateMorePhrases}
            disabled={isGeneratingMore}
            accessible={true}
            accessibilityLabel="Generate more phrases"
            accessibilityRole="button"
          >
            {isGeneratingMore ? (
              <>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.pcsButtonText, { color: theme.primary, marginTop: 8 }]}>
                  Loading...
                </Text>
              </>
            ) : (
              <>
                {/* Plus/Add pictogram - ARASAAC ID 9172 (plus sign) */}
                <PictogramImage
                  arasaacId={user?.preferences?.actionButtonPictograms?.generateMore || 9172}
                  style={styles.pcsButtonImage}
                />
                <Text style={[styles.pcsButtonText, { color: theme.primary }]} numberOfLines={1}>
                  Generate More
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Words button - PCS style */}
          <TouchableOpacity
            style={[
              styles.pcsButton,
              { backgroundColor: 'white', borderColor: theme.tertiary }
            ]}
            onPress={handleBackToPCS}
            accessible={true}
            accessibilityLabel="Go back to word selection"
            accessibilityRole="button"
          >
            {/* Back arrow pictogram - ARASAAC ID 38249 (back arrow) */}
            <PictogramImage
              arasaacId={user?.preferences?.actionButtonPictograms?.back || 38249}
              style={styles.pcsButtonImage}
            />
            <Text style={[styles.pcsButtonText, { color: theme.tertiary }]} numberOfLines={1}>
              Back to Words
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default React.memo(FlashcardSelectionScreen);
