import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  searchPictograms,
  getPictogramImageUrl,
  convertWordsToPictograms,
  ArasaacPictogram,
} from '../services/arasaacService';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageSelector: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  languageButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: 'white',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pictogramsScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  pictogramCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 8,
  },
  pictogramImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  pictogramId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pictogramKeyword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  pictogramDownloads: {
    fontSize: 12,
    color: '#666',
  },
  phraseResultContainer: {
    marginTop: 16,
  },
  phraseResultScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  phraseItemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    width: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A90E2',
    marginRight: 8,
  },
  phraseItemImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
  },
  phraseItemNoImage: {
    width: 70,
    height: 70,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phraseItemNoImageText: {
    fontSize: 32,
  },
  phraseItemWord: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

