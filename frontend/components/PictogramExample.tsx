import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  searchPictograms,
  getPictogramImageUrl,
  convertWordsToPictograms,
  ArasaacPictogram,
} from '../api';
import { styles } from './PictogramExample.styles';

/**
 * Componente de ejemplo para demostrar el uso del servicio de ARASAAC
 * Este componente permite:
 * - Buscar pictogramas por palabra
 * - Mostrar los resultados en una galería
 * - Convertir frases completas en secuencias de pictogramas
 */
export default function PictogramExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('es');
  const [pictograms, setPictograms] = useState<ArasaacPictogram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phraseWords, setPhraseWords] = useState('');
  const [phraseResult, setPhraseResult] = useState<Array<{
    word: string;
    pictogram: ArasaacPictogram | null;
    imageUrl: string | null;
  }>>([]);

  // Buscar pictogramas por palabra
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Por favor ingresa una palabra para buscar');
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPictograms(searchTerm.trim(), language);
      setPictograms(results);
      
      if (results.length === 0) {
        Alert.alert('Sin resultados', `No se encontraron pictogramas para "${searchTerm}"`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al buscar pictogramas');
      console.error('Error searching pictograms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convertir frase en pictogramas
  const handleConvertPhrase = async () => {
    if (!phraseWords.trim()) {
      Alert.alert('Error', 'Por favor ingresa palabras separadas por espacios');
      return;
    }

    setIsLoading(true);
    try {
      const words = phraseWords.trim().split(/\s+/);
      const results = await convertWordsToPictograms(words, language);
      setPhraseResult(results);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al convertir la frase');
      console.error('Error converting phrase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar un pictograma individual
  const renderPictogram = (pictogram: ArasaacPictogram, index: number) => {
    const imageUrl = getPictogramImageUrl(pictogram._id, {
      color: true,
      backgroundColor: 'white',
    });

    return (
      <View key={`${pictogram._id}-${index}`} style={styles.pictogramCard}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.pictogramImage}
          resizeMode="contain"
        />
        <Text style={styles.pictogramId}>ID: {pictogram._id}</Text>
        <Text style={styles.pictogramKeyword} numberOfLines={2}>
          {pictogram.keywords[0]?.keyword || 'Sin nombre'}
        </Text>
        <Text style={styles.pictogramDownloads}>
          ⬇️ {pictogram.downloads || 0}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Ejemplo de ARASAAC</Text>
      
      {/* Selector de idioma */}
      <View style={styles.languageSelector}>
        <Text style={styles.label}>Idioma:</Text>
        <View style={styles.languageButtons}>
          {['es', 'en', 'fr', 'it'].map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                language === lang && styles.languageButtonActive
              ]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[
                styles.languageButtonText,
                language === lang && styles.languageButtonTextActive
              ]}>
                {lang.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Búsqueda de pictogramas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Buscar Pictogramas</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe una palabra (ej: casa, perro, comer)"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Buscar</Text>
        </TouchableOpacity>

        {/* Resultados de búsqueda */}
        {isLoading && <ActivityIndicator size="large" color="#4A90E2" />}
        
        {pictograms.length > 0 && !isLoading && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Se encontraron {pictograms.length} pictogramas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pictogramsScroll}
            >
              {pictograms.map((pictogram, index) => renderPictogram(pictogram, index))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Convertir frase en pictogramas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Convertir Frase en Pictogramas</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe palabras separadas por espacios"
          value={phraseWords}
          onChangeText={setPhraseWords}
          onSubmitEditing={handleConvertPhrase}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConvertPhrase}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Convertir</Text>
        </TouchableOpacity>

        {/* Resultado de conversión */}
        {phraseResult.length > 0 && !isLoading && (
          <View style={styles.phraseResultContainer}>
            <Text style={styles.resultsTitle}>Resultado:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.phraseResultScroll}
            >
              {phraseResult.map((item, index) => (
                <View key={index} style={styles.phraseItemCard}>
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.phraseItemImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.phraseItemNoImage}>
                      <Text style={styles.phraseItemNoImageText}>❌</Text>
                    </View>
                  )}
                  <Text style={styles.phraseItemWord}>{item.word}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los pictogramas se obtienen de ARASAAC (arasaac.org){'\n'}
          • Puedes buscar en diferentes idiomas{'\n'}
          • El número con ⬇️ indica popularidad del pictograma{'\n'}
          • Algunos pictogramas soportan personalización (color, plural, etc.)
        </Text>
      </View>
    </ScrollView>
  );
}

