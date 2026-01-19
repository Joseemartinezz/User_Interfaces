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
} from '../services/arasaacService';
import { styles } from './PictogramExample.styles';

/**
 * Example component to demonstrate ARASAAC service usage
 * This component allows:
 * - Searching pictograms by word
 * - Displaying results in a gallery
 * - Converting complete phrases into pictogram sequences
 */
export default function PictogramExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('en');
  const [pictograms, setPictograms] = useState<ArasaacPictogram[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phraseWords, setPhraseWords] = useState('');
  const [phraseResult, setPhraseResult] = useState<Array<{
    word: string;
    pictogram: ArasaacPictogram | null;
    imageUrl: string | null;
  }>>([]);

  // Search pictograms by word
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a word to search');
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchPictograms(searchTerm.trim(), language);
      setPictograms(results);
      
      if (results.length === 0) {
        Alert.alert('No results', `No pictograms found for "${searchTerm}"`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error searching pictograms');
      console.error('Error searching pictograms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert phrase to pictograms
  const handleConvertPhrase = async () => {
    if (!phraseWords.trim()) {
      Alert.alert('Error', 'Please enter words separated by spaces');
      return;
    }

    setIsLoading(true);
    try {
      const words = phraseWords.trim().split(/\s+/);
      const results = await convertWordsToPictograms(words, language);
      setPhraseResult(results);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error converting phrase');
      console.error('Error converting phrase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render an individual pictogram
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
          {pictogram.keywords[0]?.keyword || 'No name'}
        </Text>
        <Text style={styles.pictogramDownloads}>
          ⬇️ {pictogram.downloads || 0}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>ARASAAC Example</Text>
      
      {/* Language selector */}
      <View style={styles.languageSelector}>
        <Text style={styles.label}>Language:</Text>
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

      {/* Pictogram search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Search Pictograms</Text>
        <TextInput
          style={styles.input}
          placeholder="Type a word (e.g.: house, dog, eat)"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

        {/* Search results */}
        {isLoading && <ActivityIndicator size="large" color="#4A90E2" />}
        
        {pictograms.length > 0 && !isLoading && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              Found {pictograms.length} pictograms
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

      {/* Convert phrase to pictograms */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Convert Phrase to Pictograms</Text>
        <TextInput
          style={styles.input}
          placeholder="Type words separated by spaces"
          value={phraseWords}
          onChangeText={setPhraseWords}
          onSubmitEditing={handleConvertPhrase}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleConvertPhrase}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Convert</Text>
        </TouchableOpacity>

        {/* Conversion result */}
        {phraseResult.length > 0 && !isLoading && (
          <View style={styles.phraseResultContainer}>
            <Text style={styles.resultsTitle}>Result:</Text>
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
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          • Pictograms are sourced from ARASAAC (arasaac.org){'\n'}
          • You can search in different languages{'\n'}
          • The number with ⬇️ indicates pictogram popularity{'\n'}
          • Some pictograms support customization (color, plural, etc.)
        </Text>
      </View>
    </ScrollView>
  );
}

