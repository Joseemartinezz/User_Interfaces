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
import { generatePhrases, getPictogramImageUrl, getAllCategories, getCategoryPictogramIds, getPictogramsByIds } from '../api';
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

// Constantes para paginación
const INITIAL_PAGE_SIZE = 16; // Primeros 16 pictogramas
const LOAD_MORE_SIZE = 16; // Cargar 16 más al deslizar

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
  
  // Estado para categorías y pictogramas cargados desde el backend
  const [backendCategories, setBackendCategories] = useState<Record<string, number[]>>({});
  const [categorySymbolsCache, setCategorySymbolsCache] = useState<Record<string, Array<{
    id: string;
    text: string;
    arasaacId: number | null;
    imageUrl: string;
    isCustom: boolean;
  }>>>({});
  const [categoryLoadProgress, setCategoryLoadProgress] = useState<Record<string, number>>({}); // Cuántos pictogramas se han cargado por categoría
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());

  // Obtener categorías del usuario (similar a CategoriesScreen)
  const hiddenCategories = useMemo(() => {
    return user?.preferences.hiddenCategories || [];
  }, [user?.preferences.hiddenCategories]);

  // Cargar categorías desde el backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getAllCategories();
        setBackendCategories(categories);
        console.log('✅ Categorías cargadas desde el backend:', Object.keys(categories));
      } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        // Fallback a categorías por defecto si falla
        const fallbackCategories: Record<string, number[]> = {};
        DEFAULT_CATEGORIES.forEach(cat => {
          fallbackCategories[cat.name] = [];
        });
        setBackendCategories(fallbackCategories);
      }
    };
    
    loadCategories();
  }, []);

  // Construir lista de categorías combinando backend y preferencias del usuario
  const allCategories = useMemo(() => {
    const categoriesList: Array<{
      name: string;
      emoji: string;
      isCustom: boolean;
      id: string;
    }> = [];

    // Categorías del backend (predefinidas + personalizadas)
    Object.keys(backendCategories).forEach(categoryName => {
      if (!hiddenCategories.includes(categoryName)) {
        // Buscar emoji en DEFAULT_CATEGORIES o usar uno por defecto
        const defaultCat = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
        const emoji = defaultCat?.emoji || '📁';
        const isCustom = !DEFAULT_CATEGORIES.some(c => c.name === categoryName);
        
        categoriesList.push({
          name: categoryName,
          emoji,
          isCustom,
          id: categoryName,
        });
      }
    });

    // Añadir categorías personalizadas del usuario que no estén en el backend
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

  // Cargar pictogramas para una categoría desde el backend
  const loadCategoryPictograms = useCallback(async (
    categoryName: string,
    startIndex: number = 0,
    count: number = INITIAL_PAGE_SIZE
  ) => {
    // Evitar cargar si ya está cargando
    if (loadingCategories.has(categoryName)) {
      console.log(`⏭️ Ya se está cargando "${categoryName}", saltando...`);
      return;
    }

    try {
      console.log(`🔄 Iniciando carga de pictogramas para "${categoryName}" (índice ${startIndex}, cantidad ${count})`);
      setLoadingCategories(prev => new Set(prev).add(categoryName));

      // Obtener IDs de pictogramas para esta categoría
      const pictogramIds = await getCategoryPictogramIds(categoryName);
      
      if (pictogramIds.length === 0) {
        console.warn(`⚠️ No se encontraron IDs de pictogramas para "${categoryName}"`);
        setCategorySymbolsCache(prev => ({ ...prev, [categoryName]: [] }));
        setCategoryLoadProgress(prev => ({ ...prev, [categoryName]: 0 }));
        return;
      }

      // Obtener el rango de IDs a cargar
      const idsToLoad = pictogramIds.slice(startIndex, startIndex + count);
      
      if (idsToLoad.length === 0) {
        console.log(`✅ Ya se cargaron todos los pictogramas para "${categoryName}"`);
        return;
      }

      console.log(`📥 Cargando ${idsToLoad.length} pictogramas desde ARASAAC...`);

      // Obtener información de los pictogramas desde ARASAAC
      const pictogramsData = await getPictogramsByIds(idsToLoad, 'en');

      // Convertir a formato de símbolo
      const newSymbols = pictogramsData
        .filter(item => item.pictogram !== null)
        .map((item) => ({
          id: `pictogram_${item.id}`,
          text: item.text,
          arasaacId: item.id,
          imageUrl: getPictogramImageUrl(item.id, { color: true, backgroundColor: 'white' }),
          isCustom: false,
        }));

      console.log(`✅ Convertidos ${newSymbols.length} pictogramas a símbolos para "${categoryName}"`);

      // Actualizar cache combinando con símbolos existentes
      setCategorySymbolsCache(prev => {
        const existing = prev[categoryName] || [];
        // Evitar duplicados
        const existingIds = new Set(existing.map(s => s.arasaacId));
        const uniqueNewSymbols = newSymbols.filter(s => !existingIds.has(s.arasaacId));
        return {
          ...prev,
          [categoryName]: [...existing, ...uniqueNewSymbols],
        };
      });

      // Actualizar progreso
      setCategoryLoadProgress(prev => ({
        ...prev,
        [categoryName]: Math.min(startIndex + count, pictogramIds.length),
      }));

      console.log(`✅ Cargados ${newSymbols.length} pictogramas para "${categoryName}" (${startIndex + count}/${pictogramIds.length})`);
    } catch (error: any) {
      console.error(`❌ Error cargando pictogramas para "${categoryName}":`, error);
      console.error(`   Mensaje:`, error.message);
      console.error(`   Stack:`, error.stack);
    } finally {
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryName);
        return newSet;
      });
    }
  }, [loadingCategories]);

  // Cargar pictogramas iniciales cuando se carga una categoría
  useEffect(() => {
    if (Object.keys(backendCategories).length > 0) {
      // Cargar primeros 16 pictogramas para cada categoría visible
      allCategories.forEach(category => {
        if (!categorySymbolsCache[category.name] && backendCategories[category.name] && !loadingCategories.has(category.name)) {
          loadCategoryPictograms(category.name, 0, INITIAL_PAGE_SIZE);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendCategories, allCategories.length]);

  // Obtener símbolos para una categoría específica (desde cache)
  const getSymbolsForCategory = useCallback((categoryName: string) => {
    const cached = categorySymbolsCache[categoryName] || [];
    
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

    return [...cached, ...custom];
  }, [categorySymbolsCache, user?.preferences.customPCSSymbols]);

  // Obtener todos los símbolos (para búsqueda)
  const allSymbols = useMemo(() => {
    const allSymbolsList: Array<{
      id: string;
      text: string;
      arasaacId: number | null;
      imageUrl: string;
      isCustom: boolean;
    }> = [];

    // Añadir símbolos de todas las categorías cargadas
    Object.keys(categorySymbolsCache).forEach(category => {
      const symbols = getSymbolsForCategory(category);
      allSymbolsList.push(...symbols);
    });

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
  }, [categorySymbolsCache, getSymbolsForCategory, user?.preferences.customPCSSymbols]);

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
                
                {/* ScrollView vertical con cuadrícula 4x4 con paginación */}
                {categorySymbols.length > 0 || loadingCategories.has(category.name) ? (
                  <ScrollView
                    style={styles.categoryScrollView}
                    contentContainerStyle={styles.grid4x4Container}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    onScroll={({ nativeEvent }) => {
                      // Detectar cuando el usuario está cerca del final (80% del scroll)
                      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                      const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height * 0.8;
                      
                      if (isNearBottom) {
                        const currentProgress = categoryLoadProgress[category.name] || 0;
                        const totalIds = backendCategories[category.name]?.length || 0;
                        
                        // Cargar más si hay más pictogramas disponibles
                        if (currentProgress < totalIds && !loadingCategories.has(category.name)) {
                          loadCategoryPictograms(category.name, currentProgress, LOAD_MORE_SIZE);
                        }
                      }
                    }}
                    scrollEventThrottle={400}
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
                      
                      {/* Indicador de carga al final si se están cargando más */}
                      {loadingCategories.has(category.name) && (
                        <View style={styles.loadingMoreContainer}>
                          <ActivityIndicator size="small" color={theme.primary} />
                          <Text style={[styles.loadingMoreText, { color: theme.accent }]}>
                            Loading more...
                          </Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.emptyCategoryContainer}>
                    <Text style={[styles.emptyCategoryText, { color: theme.accent }]}>
                      No symbols in this category
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

