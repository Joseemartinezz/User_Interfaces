import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  generatePhrases,
  getAllCategories,
  DEFAULT_CATEGORIES,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_SIZE,
  PCSSymbol,
} from '../services/api';
import { loadCategorySymbols } from '../services/arasaacService';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';
import { PictogramImage, CustomSymbolImage } from '../components/PictogramImage';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../types/navigation';
import { styles } from './PCSScreen.styles';

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
  const [selectedSymbols, setSelectedSymbols] = useState<PCSSymbol[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for categories and pictograms loaded from the backend
  const [backendCategories, setBackendCategories] = useState<Record<string, number[]>>({});
  const [categorySymbolsCache, setCategorySymbolsCache] = useState<Record<string, PCSSymbol[]>>({});
  const [categoryLoadProgress, setCategoryLoadProgress] = useState<Record<string, number>>({}); // How many pictograms have been loaded per category
  const [categoryTotalCounts, setCategoryTotalCounts] = useState<Record<string, number>>({}); // Total pictograms per category
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
  // ALSO reloads when screen gains focus (using useFocusEffect below)
  const loadCategories = useCallback(async (resetCache: boolean = false) => {
    if (!user?.id) {
      console.log('User not authenticated, cannot load custom categories');
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
      console.log(`Categories loaded from backend for user ${user.id}:`, Object.keys(categories));
      
      // If resetCache is true, clear ALL cache to force reload
      if (resetCache) {
        console.log('Resetting all category caches...');
        setCategorySymbolsCache({});
        setCategoryLoadProgress({});
        setCategoryTotalCounts({});
        setHasCompletedInitialLoad(false);
      } else {
        // Clean up cache: remove symbols from categories that no longer exist
        setCategorySymbolsCache(prevCache => {
          const newCache = { ...prevCache };
          const categoryNames = Object.keys(categories);
          
          // Remove cached symbols for deleted categories
          Object.keys(newCache).forEach(cachedCategory => {
            if (!categoryNames.includes(cachedCategory)) {
              console.log(`Clearing cache for deleted category: ${cachedCategory}`);
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

        // Also reset total counts for deleted categories
        setCategoryTotalCounts(prevCounts => {
          const newCounts = { ...prevCounts };
          const categoryNames = Object.keys(categories);
          
          Object.keys(newCounts).forEach(cachedCategory => {
            if (!categoryNames.includes(cachedCategory)) {
              delete newCounts[cachedCategory];
            }
          });
          
          return newCounts;
        });
      }
      
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to default categories if failed
      const fallbackCategories: Record<string, number[]> = {};
      DEFAULT_CATEGORIES.forEach(cat => {
        fallbackCategories[cat.name] = [];
      });
      setBackendCategories(fallbackCategories);
    }
  }, [user?.id]);

  // Load categories on mount and when user changes
  useEffect(() => {
    loadCategories(false);
  }, [loadCategories, user?.preferences.categories]);

  // Reload categories when screen gains focus (e.g., returning from CategoriesScreen)
  // This ensures newly created categories are loaded
  useFocusEffect(
    useCallback(() => {
      console.log('PCSScreen gained focus, reloading categories...');
      loadCategories(true); // Force cache reset to reload all data
    }, [loadCategories])
  );

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

  // Load pictograms for a category using the abstracted service function
  const loadCategoryPictograms = useCallback(async (
    categoryName: string,
    startIndex: number = 0,
    count: number = INITIAL_PAGE_SIZE
  ) => {
    // Avoid loading if already loading
    if (loadingCategories.has(categoryName)) {
      console.log(`Already loading "${categoryName}", skipping...`);
      return;
    }

    try {
      setLoadingCategories(prev => new Set(prev).add(categoryName));

      // Use the abstracted service function
      const result = await loadCategorySymbols(categoryName, startIndex, count, user?.id, 'en');

      if (result.totalCount === 0) {
        setCategorySymbolsCache(prev => ({ ...prev, [categoryName]: [] }));
        setCategoryLoadProgress(prev => ({ ...prev, [categoryName]: 0 }));
        setCategoryTotalCounts(prev => ({ ...prev, [categoryName]: 0 }));
        return;
      }

      // Update cache combining with existing symbols
      setCategorySymbolsCache(prev => {
        const existing = prev[categoryName] || [];
        // Avoid duplicates by unique ID
        const existingIds = new Set(existing.map(s => s.id));
        const uniqueNewSymbols = result.symbols.filter(s => !existingIds.has(s.id));
        return {
          ...prev,
          [categoryName]: [...existing, ...uniqueNewSymbols],
        };
      });

      // Update progress and total counts
      setCategoryLoadProgress(prev => ({
        ...prev,
        [categoryName]: result.loadedCount,
      }));
      setCategoryTotalCounts(prev => ({
        ...prev,
        [categoryName]: result.totalCount,
      }));

      console.log(`Loaded ${result.symbols.length} pictograms for "${categoryName}" (${result.loadedCount}/${result.totalCount})`);
    } catch (error: any) {
      console.error(`Error loading pictograms for "${categoryName}":`, error);
      console.error(`   Message:`, error.message);
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
      // Load first pictograms for each visible category
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
            setCategoryTotalCounts(prev => ({ ...prev, [category.name]: 0 }));
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
  const getSymbolsForCategory = useCallback((categoryName: string): PCSSymbol[] => {
    const cached = categorySymbolsCache[categoryName] || [];

    // Add custom symbols belonging to this category
    const custom: PCSSymbol[] = (user?.preferences.customPCSSymbols || [])
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
    const allSymbolsList: PCSSymbol[] = [];

    // Add symbols from all loaded categories
    Object.keys(categorySymbolsCache).forEach(category => {
      const symbols = getSymbolsForCategory(category);
      allSymbolsList.push(...symbols);
    });

    // Add custom symbols without category
    const custom: PCSSymbol[] = (user?.preferences.customPCSSymbols || [])
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
    const map = new Map<string, PCSSymbol>();
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
  const handleSymbolPress = useCallback((symbol: PCSSymbol) => {
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
  }, [selectedWords, navigation, topic, user?.preferences.childAge, showError]);

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
    return <LoadingScreen message="Loading symbols..." />;
  }

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header - outside SafeAreaView so it extends to top edge */}
      <Header
        title="WizzWords"
        showBackButton={!!topic}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>

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
                          const totalIds = categoryTotalCounts[category.name] || 0;
                          const hasMore = currentProgress < totalIds;
                          const isCategoryLoading = loadingCategories.has(category.name);

                          if (hasMore) {
                            return (
                              <TouchableOpacity
                                style={[
                                  styles.loadMoreButton,
                                  {
                                    backgroundColor: theme.accent,
                                    borderColor: theme.accent,
                                  },
                                  isCategoryLoading && styles.buttonDisabled
                                ]}
                                onPress={() => {
                                  if (!isCategoryLoading) {
                                    loadCategoryPictograms(category.name, currentProgress, LOAD_MORE_SIZE);
                                  }
                                }}
                                disabled={isCategoryLoading}
                                activeOpacity={0.7}
                              >
                                {isCategoryLoading ? (
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
