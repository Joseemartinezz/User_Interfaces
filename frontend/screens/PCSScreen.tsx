import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
  InteractionManager,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generatePhrases, getPictogramImageUrl, getAllCategories, getCategoryPictogramIds, getPictogramsByIds } from '../api';
import Header from '../components/common/Header';
import ImageLoadingScreen from '../components/common/ImageLoadingScreen';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
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

  // Memoize pictogram URL
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

  const { theme } = useTheme();

  if (imageError) {
    // Show a placeholder if there's an error with debug information
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>❓</Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>ID: {arasaacId}</Text>
        {errorMessage && (
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]} numberOfLines={2}>
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

// Component to display custom symbols
interface CustomSymbolImageProps {
  imageUrl: string;
  style?: any;
}

const CustomSymbolImage: React.FC<CustomSymbolImageProps> = React.memo(({ imageUrl, style }) => {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>❓</Text>
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

// Default categories (same as CategoriesScreen)
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

// Pagination constants
const INITIAL_PAGE_SIZE = 15; // First 15 pictograms (5 rows of 3x3)
const LOAD_MORE_SIZE = 15; // Load 15 more on scroll (5 rows of 3x3)

// Common symbols (for "All" category or default)
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
  const { showError } = useToast();
  // Params are optional - they may come from topic selection or not
  const params = route.params;
  const topic = params?.topic;

  // Changed from string[] to store unique symbol IDs to fix duplicate selection bug
  const [selectedSymbols, setSelectedSymbols] = useState<Array<{
    id: string;
    text: string;
    arasaacId: number | null;
    imageUrl: string;
    isCustom: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for categories and pictograms loaded from the backend
  const [backendCategories, setBackendCategories] = useState<Record<string, number[]>>({});
  const [categorySymbolsCache, setCategorySymbolsCache] = useState<Record<string, Array<{
    id: string;
    text: string;
    arasaacId: number | null;
    imageUrl: string;
    isCustom: boolean;
  }>>>({});
  const [categoryLoadProgress, setCategoryLoadProgress] = useState<Record<string, number>>({}); // How many pictograms have been loaded per category
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0); // Current category index for indicators
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Track initial loading state
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false); // Track if initial load has been completed
  const categoryFlatListRef = useRef<FlatList>(null); // Reference to FlatList for programmatic navigation
  const indicatorsScrollViewRef = useRef<ScrollView>(null); // Reference to indicators ScrollView

  // Get user categories (similar to CategoriesScreen)
  const hiddenCategories = useMemo(() => {
    return user?.preferences.hiddenCategories || [];
  }, [user?.preferences.hiddenCategories]);

  // Load categories from backend
  // Reloads when user changes or when user preferences change (to detect deleted categories)
  useEffect(() => {
    const loadCategories = async () => {
      if (!user?.id) {
        console.log('⚠️ User not authenticated, cannot load custom categories');
        // Fallback to default categories
        const fallbackCategories: Record<string, number[]> = {};
        DEFAULT_CATEGORIES.forEach(cat => {
          fallbackCategories[cat.name] = [];
        });
        setBackendCategories(fallbackCategories);
        return;
      }

      try {
        const categories = await getAllCategories(user.id);
        setBackendCategories(categories);
        console.log(`✅ Categories loaded from backend for user ${user.id}:`, Object.keys(categories));
        
        // Clean up cache: remove symbols from categories that no longer exist
        setCategorySymbolsCache(prevCache => {
          const newCache = { ...prevCache };
          const categoryNames = Object.keys(categories);
          
          // Remove cached symbols for deleted categories
          Object.keys(newCache).forEach(cachedCategory => {
            if (!categoryNames.includes(cachedCategory)) {
              console.log(`🗑️ Clearing cache for deleted category: ${cachedCategory}`);
              delete newCache[cachedCategory];
            }
          });
          
          return newCache;
        });
        
        // Also reset load progress for deleted categories
        setCategoryLoadProgress(prevProgress => {
          const newProgress = { ...prevProgress };
          const categoryNames = Object.keys(categories);
          
          Object.keys(newProgress).forEach(cachedCategory => {
            if (!categoryNames.includes(cachedCategory)) {
              delete newProgress[cachedCategory];
            }
          });
          
          return newProgress;
        });
        
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        // Fallback to default categories if failed
        const fallbackCategories: Record<string, number[]> = {};
        DEFAULT_CATEGORIES.forEach(cat => {
          fallbackCategories[cat.name] = [];
        });
        setBackendCategories(fallbackCategories);
      }
    };

    loadCategories();
  }, [user?.id, user?.preferences.categories]);

  // Build categories list combining backend and user preferences
  const allCategories = useMemo(() => {
    const categoriesList: Array<{
      name: string;
      emoji: string;
      isCustom: boolean;
      id: string;
    }> = [];

    // Backend categories (predefined + custom)
    Object.keys(backendCategories).forEach(categoryName => {
      if (!hiddenCategories.includes(categoryName)) {
        // First check if user has a custom emoji for this category
        const userCategory = (user?.preferences.categories || []).find(c => c.name === categoryName);
        let emoji = userCategory?.emoji;
        
        // If no custom emoji, look in DEFAULT_CATEGORIES
        if (!emoji) {
          const defaultCat = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
          emoji = defaultCat?.emoji || '📁';
        }
        
        const isCustom = !DEFAULT_CATEGORIES.some(c => c.name === categoryName);

        categoriesList.push({
          name: categoryName,
          emoji,
          isCustom,
          id: categoryName,
        });
      }
    });

    // Add user custom categories that are not in the backend
    (user?.preferences.categories || []).forEach(cat => {
      if (!hiddenCategories.includes(cat.name) && !backendCategories[cat.name]) {
        categoriesList.push({
          name: cat.name,
          emoji: cat.emoji || '📁',
          isCustom: true,
          id: cat.id,
        });
      }
    });

    return categoriesList;
  }, [backendCategories, user?.preferences.categories, hiddenCategories]);

  // Load pictograms for a category from the backend
  const loadCategoryPictograms = useCallback(async (
    categoryName: string,
    startIndex: number = 0,
    count: number = INITIAL_PAGE_SIZE
  ) => {
    // Avoid loading if already loading
    if (loadingCategories.has(categoryName)) {
      console.log(`⏭️ Already loading "${categoryName}", skipping...`);
      return;
    }

    try {
      console.log(`🔄 Starting load of pictograms for "${categoryName}" (index ${startIndex}, count ${count})`);
      setLoadingCategories(prev => new Set(prev).add(categoryName));

      // Get pictogram IDs for this category
      const pictogramIds = await getCategoryPictogramIds(categoryName, user?.id);

      if (pictogramIds.length === 0) {
        console.warn(`⚠️ No pictogram IDs found for "${categoryName}"`);
        setCategorySymbolsCache(prev => ({ ...prev, [categoryName]: [] }));
        setCategoryLoadProgress(prev => ({ ...prev, [categoryName]: 0 }));
        return;
      }

      // Get range of IDs to load
      const idsToLoad = pictogramIds.slice(startIndex, startIndex + count);

      if (idsToLoad.length === 0) {
        console.log(`✅ All pictograms already loaded for "${categoryName}"`);
        return;
      }

      console.log(`📥 Loading ${idsToLoad.length} pictograms from ARASAAC...`);

      // Get pictogram information from ARASAAC
      const pictogramsData = await getPictogramsByIds(idsToLoad, 'en');

      // Convert to symbol format
      const newSymbols = pictogramsData
        .filter(item => item.pictogram !== null)
        .map((item, index) => ({
          // Use unique ID combining arasaacId with index to handle color variants
          id: `pictogram_${item.id}_${startIndex + index}`,
          text: item.text,
          arasaacId: item.id,
          imageUrl: getPictogramImageUrl(item.id, { color: true, backgroundColor: 'white' }),
          isCustom: false,
        }));

      console.log(`✅ Converted ${newSymbols.length} pictograms to symbols for "${categoryName}"`);

      // Update cache combining with existing symbols
      setCategorySymbolsCache(prev => {
        const existing = prev[categoryName] || [];
        // Avoid duplicates by unique ID (not just arasaacId to allow variants)
        const existingIds = new Set(existing.map(s => s.id));
        const uniqueNewSymbols = newSymbols.filter(s => !existingIds.has(s.id));
        return {
          ...prev,
          [categoryName]: [...existing, ...uniqueNewSymbols],
        };
      });

      // Update progress
      setCategoryLoadProgress(prev => ({
        ...prev,
        [categoryName]: Math.min(startIndex + count, pictogramIds.length),
      }));

      console.log(`✅ Loaded ${newSymbols.length} pictograms for "${categoryName}" (${startIndex + count}/${pictogramIds.length})`);
    } catch (error: any) {
      console.error(`❌ Error loading pictograms for "${categoryName}":`, error);
      console.error(`   Message:`, error.message);
      console.error(`   Stack:`, error.stack);
    } finally {
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryName);
        return newSet;
      });
    }
  }, [loadingCategories, user?.id]);

  // Load initial pictograms when a category is loaded
  useEffect(() => {
    if (Object.keys(backendCategories).length > 0) {
      // Load first 16 pictograms for each visible category
      allCategories.forEach(category => {
        // If category exists in backend but has no cache and is not loading, load it
        if (backendCategories[category.name] !== undefined) {
          if (!categorySymbolsCache[category.name] && !loadingCategories.has(category.name)) {
            loadCategoryPictograms(category.name, 0, INITIAL_PAGE_SIZE);
          }
        } else {
          // Category doesn't exist in backend (custom category without backend data)
          // Mark it as processed by setting empty cache and progress
          if (!categorySymbolsCache[category.name] && categoryLoadProgress[category.name] === undefined) {
            setCategorySymbolsCache(prev => ({ ...prev, [category.name]: [] }));
            setCategoryLoadProgress(prev => ({ ...prev, [category.name]: 0 }));
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendCategories, allCategories.length]);

  // Track initial loading state - show loading screen until all initial symbols are loaded
  // Only show loading screen during initial load, not when loading more symbols
  useEffect(() => {
    // If initial load has already been completed, don't show loading screen anymore
    if (hasCompletedInitialLoad) {
      setIsInitialLoading(false);
      return;
    }

    // If no categories loaded yet, still loading
    if (Object.keys(backendCategories).length === 0) {
      setIsInitialLoading(true);
      return;
    }

    // Check if all visible categories have at least started loading their symbols
    // (they may be empty, but we need to know they've been processed)
    const visibleCategories = allCategories.filter(cat => !hiddenCategories.includes(cat.name));
    
    // If no visible categories, we're done
    if (visibleCategories.length === 0) {
      setIsInitialLoading(false);
      setHasCompletedInitialLoad(true);
      return;
    }

    // Check if all categories have been processed (have cache or progress set)
    const allCategoriesProcessed = visibleCategories.every(category => {
      return categorySymbolsCache[category.name] !== undefined || 
             categoryLoadProgress[category.name] !== undefined;
    });

    // Check if any category is loading its INITIAL batch
    // A category is loading initial if:
    // 1. It's in loadingCategories AND
    // 2. It has no progress yet (progress === 0 or undefined) OR
    // 3. It has progress but less than INITIAL_PAGE_SIZE (still loading first batch)
    const isAnyCategoryLoadingInitial = visibleCategories.some(category => {
      if (!loadingCategories.has(category.name)) {
        return false; // Not loading
      }
      const progress = categoryLoadProgress[category.name];
      // If no progress set yet, it's initial load
      // If progress is less than INITIAL_PAGE_SIZE, it's still loading initial batch
      return progress === undefined || progress < INITIAL_PAGE_SIZE;
    });

    // If all categories are processed and no initial loads are happening, we're done
    if (allCategoriesProcessed && !isAnyCategoryLoadingInitial) {
      setIsInitialLoading(false);
      setHasCompletedInitialLoad(true);
    } else if (isAnyCategoryLoadingInitial || !allCategoriesProcessed) {
      // Still loading initial symbols
      setIsInitialLoading(true);
    }
  }, [backendCategories, loadingCategories, categorySymbolsCache, categoryLoadProgress, allCategories, hiddenCategories, hasCompletedInitialLoad]);

  // Get symbols for a specific category (from cache)
  const getSymbolsForCategory = useCallback((categoryName: string) => {
    const cached = categorySymbolsCache[categoryName] || [];

    // Add custom symbols belonging to this category
    const custom = (user?.preferences.customPCSSymbols || [])
      .filter(symbol => symbol.category === categoryName)
      .map((symbol) => ({
        id: `custom_${symbol.id}`,
        text: symbol.word,
        arasaacId: null,
        imageUrl: symbol.imageUrl,
        isCustom: true,
      }));

    return [...cached, ...custom];
  }, [categorySymbolsCache, user?.preferences.customPCSSymbols]);

  // Get all symbols (for search)
  const allSymbols = useMemo(() => {
    const allSymbolsList: Array<{
      id: string;
      text: string;
      arasaacId: number | null;
      imageUrl: string;
      isCustom: boolean;
    }> = [];

    // Add symbols from all loaded categories
    Object.keys(categorySymbolsCache).forEach(category => {
      const symbols = getSymbolsForCategory(category);
      allSymbolsList.push(...symbols);
    });

    // Add custom symbols without category
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
  }, [categorySymbolsCache, getSymbolsForCategory, user?.preferences.customPCSSymbols]);

  // Create a fast lookup map for symbols by ID (O(1) instead of O(n))
  const symbolsById = useMemo(() => {
    const map = new Map<string, typeof allSymbols[0]>();
    allSymbols.forEach(symbol => {
      map.set(symbol.id, symbol);
    });
    return map;
  }, [allSymbols]);

  // Get selected words as string array for API calls
  const selectedWords = useMemo(() => {
    return selectedSymbols.map(s => s.text);
  }, [selectedSymbols]);

  // Optimized function to select/deselect symbols by unique ID
  // Uses immediate state update for instant visual feedback
  const handleSymbolPress = useCallback((symbol: {
    id: string;
    text: string;
    arasaacId: number | null;
    imageUrl: string;
    isCustom: boolean;
  }) => {
    // Use functional update for immediate state change
    setSelectedSymbols(prev => {
      const index = prev.findIndex(s => s.id === symbol.id);
      if (index !== -1) {
        // Remove symbol - create new array without the symbol for instant update
        const newArray = [...prev];
        newArray.splice(index, 1);
        return newArray;
      } else {
        // Add symbol
        return [...prev, symbol];
      }
    });
  }, []);

  // Generate phrases with Gemini
  const handleGeneratePhrases = useCallback(async () => {
    if (selectedWords.length === 0) {
      showError('Please select at least one word');
      return;
    }

    setIsLoading(true);
    try {
      const childAge = user?.preferences.childAge;
      const generatedPhrases = await generatePhrases(selectedWords, childAge);
      // Navigate to phrase selection screen
      navigation.navigate('PhraseSelection', {
        phrases: generatedPhrases,
        words: selectedWords,
        topic,
      });
    } catch (error: any) {
      showError(error.message || 'Could not generate phrases. Check your Gemini API key.');
      console.error('Error generating phrases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWords, navigation, topic, user?.preferences.childAge]);

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedSymbols([]);
  }, []);

  // Navigate to previous category
  const handlePreviousCategory = useCallback(() => {
    if (currentCategoryIndex > 0) {
      const newIndex = currentCategoryIndex - 1;
      categoryFlatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setCurrentCategoryIndex(newIndex);
    }
  }, [currentCategoryIndex]);

  // Navigate to next category
  const handleNextCategory = useCallback(() => {
    if (currentCategoryIndex < allCategories.length - 1) {
      const newIndex = currentCategoryIndex + 1;
      categoryFlatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
      setCurrentCategoryIndex(newIndex);
    }
  }, [currentCategoryIndex, allCategories.length]);

  // Navigate directly to a category from indicator
  const handleCategoryIndicatorPress = useCallback((index: number) => {
    if (index !== currentCategoryIndex) {
      categoryFlatListRef.current?.scrollToIndex({ index, animated: true });
      setCurrentCategoryIndex(index);
    }
  }, [currentCategoryIndex]);

  // Auto-scroll indicators when selected category changes
  useEffect(() => {
    if (allCategories.length > 0 && indicatorsScrollViewRef.current) {
      // Calculate selected indicator position
      // Each indicator has: minWidth (56) + paddingHorizontal (5*2) + gap (4) = ~70px
      const indicatorWidth = 56 + 10 + 4; // minWidth + padding + gap
      const screenWidth = Dimensions.get('window').width;
      const availableWidth = screenWidth - 120; // Available width for indicators (screen - arrows - padding)
      const scrollPosition = currentCategoryIndex * indicatorWidth;

      // Scroll so selected indicator is visible and centered if possible
      const targetScroll = Math.max(0, scrollPosition - availableWidth / 2 + indicatorWidth / 2);

      indicatorsScrollViewRef.current.scrollTo({
        x: targetScroll,
        animated: true,
      });
    }
  }, [currentCategoryIndex, allCategories.length]);

  // Show loading screen while initial symbols are loading
  if (isInitialLoading) {
    return <ImageLoadingScreen message="Loading symbols..." iconEmoji="🗣️" />;
  }

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Header */}
        <Header
          title="WizzWords"
          showBackButton={!!topic}
        />

        {/* Selected words with pictograms */}
        {/* CRITICAL: Avoid layout shift - always render container with fixed height */}
        {/* Tap on symbols to remove them from selection */}
        <View style={[styles.outputArea, { backgroundColor: theme.white }]}>
          <View style={styles.selectedWordsWrapper}>
            {selectedSymbols.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.selectedWordsContainer}
                style={styles.selectedWordsScrollView}
                nestedScrollEnabled={true}
                removeClippedSubviews={true}
                scrollEventThrottle={16}
              >
                {selectedSymbols.map((symbol) => {
                  return (
                    <TouchableOpacity
                      key={symbol.id}
                      style={[
                        styles.selectedWordItem,
                        { borderColor: theme.primary }
                      ]}
                      onPress={() => handleSymbolPress(symbol)}
                      activeOpacity={0.5}
                      accessible={true}
                      accessibilityLabel={`Remove ${symbol.text} from selection`}
                      accessibilityRole="button"
                      accessibilityHint="Tap to remove this word"
                    >
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
                      <Text style={[styles.selectedWordText, { color: theme.text }]}>{symbol.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={[styles.emptySelectionText, { color: theme.textSecondary }]}>No words selected</Text>
            )}
          </View>
        </View>

        {/* Category carousel with grids */}
        <View style={styles.section}>
          <FlatList
            ref={categoryFlatListRef}
            data={allCategories}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 24));
              setCurrentCategoryIndex(index);
            }}
            onScrollToIndexFailed={(info) => {
              // If scroll fails, retry after a small delay
              setTimeout(() => {
                categoryFlatListRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 100);
            }}
            renderItem={({ item: category }) => {
              const categorySymbols = getSymbolsForCategory(category.name);

              return (
                <View style={styles.categoryGridContainer}>
                  {/* Category title */}
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <Text style={[styles.categoryName, { color: theme.primary }]}>
                      {category.name}
                    </Text>
                  </View>

                  {/* Vertical ScrollView with 3x3 grid */}
                  {categorySymbols.length > 0 || loadingCategories.has(category.name) ? (
                    <ScrollView
                      style={styles.categoryScrollView}
                      contentContainerStyle={styles.grid3x3Container}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                    >
                      <View style={styles.grid3x3}>
                        {categorySymbols.map((symbol) => {
                          // Check if THIS specific symbol is selected (by unique ID, not text)
                          const isSelected = selectedSymbols.some(s => s.id === symbol.id);
                          return (
                            <TouchableOpacity
                              key={symbol.id}
                              style={[
                                styles.symbolButton,
                                { backgroundColor: 'white', borderColor: theme.accent },
                                isSelected && { borderColor: theme.primary, backgroundColor: 'white', borderWidth: 3 }
                              ]}
                              onPress={() => handleSymbolPress(symbol)}
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
                              <Text style={[styles.symbolText, { color: theme.text }]}>{symbol.text}</Text>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Button to load more pictograms */}
                        {(() => {
                          const currentProgress = categoryLoadProgress[category.name] || 0;
                          const totalIds = backendCategories[category.name]?.length || 0;
                          const hasMore = currentProgress < totalIds;
                          const isLoading = loadingCategories.has(category.name);

                          if (hasMore) {
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.loadMoreButton,
                                  {
                                    backgroundColor: theme.accent,
                                    borderColor: theme.accent,
                                  },
                                  isLoading && styles.buttonDisabled
                                ]}
                                onPress={() => {
                                  if (!isLoading) {
                                    loadCategoryPictograms(category.name, currentProgress, LOAD_MORE_SIZE);
                                  }
                                }}
                                disabled={isLoading}
                                activeOpacity={0.7}
                              >
                                {isLoading ? (
                                  <>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text style={styles.loadMoreButtonText}>Loading...</Text>
                                  </>
                                ) : (
                                  <>
                                    <Text style={styles.loadMoreButtonIcon}>➕</Text>
                                    <Text style={styles.loadMoreButtonText}>Load More</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            );
                          }
                          return null;
                        })()}
                      </View>
                    </ScrollView>
                  ) : (
                    <View style={styles.emptyCategoryContainer}>
                      <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
                        No symbols in this category
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
            getItemLayout={(data, index) => {
              const itemWidth = Dimensions.get('window').width - 24; // Width minus section margins
              return {
                length: itemWidth,
                offset: itemWidth * index,
                index,
              };
            }}
          />

          {/* Indicators and navigation combined */}
          {allCategories.length > 1 && (
            <View style={styles.categoryNavigationContainer}>
              {/* Left arrow - fixed width to maintain proportion */}
              <View style={styles.navButtonWrapper}>
                <TouchableOpacity
                  style={[
                    styles.navButtonIndicator,
                    {
                      backgroundColor: currentCategoryIndex === 0 ? theme.accent : theme.primary,
                      borderColor: currentCategoryIndex === 0 ? theme.accent : theme.primary,
                      opacity: currentCategoryIndex === 0 ? 0.5 : 1,
                    },
                  ]}
                  onPress={handlePreviousCategory}
                  disabled={currentCategoryIndex === 0}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../assets/WhiteBackArrow.png')}
                    style={styles.navButtonArrow}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Tactile indicators with emojis - centered */}
              <View style={styles.categoryIndicatorsContainer}>
                <ScrollView
                  ref={indicatorsScrollViewRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryIndicatorsScrollContent}
                >
                  {allCategories.map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryIndicator,
                        {
                          backgroundColor: index === currentCategoryIndex ? theme.primary : theme.accent,
                          borderColor: index === currentCategoryIndex ? theme.primary : theme.accent,
                          opacity: index === currentCategoryIndex ? 1 : 0.6,
                          transform: [{ scale: index === currentCategoryIndex ? 1.1 : 1 }],
                        },
                      ]}
                      onPress={() => handleCategoryIndicatorPress(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryIndicatorEmoji}>{category.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryIndicatorName,
                          {
                            color: 'white',
                            fontWeight: index === currentCategoryIndex ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Right arrow - fixed width to maintain proportion */}
              <View style={styles.navButtonWrapper}>
                <TouchableOpacity
                  style={[
                    styles.navButtonIndicator,
                    {
                      backgroundColor: currentCategoryIndex === allCategories.length - 1 ? theme.accent : theme.primary,
                      borderColor: currentCategoryIndex === allCategories.length - 1 ? theme.accent : theme.primary,
                      opacity: currentCategoryIndex === allCategories.length - 1 ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleNextCategory}
                  disabled={currentCategoryIndex === allCategories.length - 1}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../assets/WhiteNextArrow.png')}
                    style={styles.navButtonArrow}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action buttons - PCS-style with pictograms */}
        <View style={styles.actionButtons}>
          {/* Generate Phrases button - PCS style */}
          <TouchableOpacity
            style={[
              styles.pcsButton,
              { backgroundColor: 'white', borderColor: theme.primary },
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleGeneratePhrases}
            disabled={isLoading}
            accessible={true}
            accessibilityLabel="Generate phrases from selected words"
            accessibilityRole="button"
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.pcsButtonText, { color: theme.primary, marginTop: 8 }]}>
                  Loading...
                </Text>
              </>
            ) : (
              <>
                {/* Generate phrases pictogram - ARASAAC ID 9172 */}
                <PictogramImage
                  arasaacId={user?.preferences?.actionButtonPictograms?.generate || 9172}
                  style={styles.pcsButtonImage}
                />
                <Text style={[styles.pcsButtonText, { color: theme.primary }]}>
                  Generate
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Clear button - PCS style */}
          <TouchableOpacity
            style={[
              styles.pcsButton,
              { backgroundColor: 'white', borderColor: theme.tertiary }
            ]}
            onPress={handleClear}
            accessible={true}
            accessibilityLabel="Clear selected words"
            accessibilityRole="button"
          >
            {/* Clear/Delete pictogram - ARASAAC ID 37417 */}
            <PictogramImage
              arasaacId={user?.preferences?.actionButtonPictograms?.clear || 37417}
              style={styles.pcsButtonImage}
            />
            <Text style={[styles.pcsButtonText, { color: theme.tertiary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(PCSScreen);

