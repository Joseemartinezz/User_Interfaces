import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import { generatePhrases, generateMorePhrases } from './services/geminiService';

// Palabras del prototipo con sus imágenes
const WORD_SYMBOLS = [
  { id: 1, text: 'I', image: require('./assets/placeholder.png') },
  { id: 2, text: 'You', image: require('./assets/placeholder.png') },
  { id: 3, text: 'Not', image: require('./assets/placeholder.png') },
  { id: 4, text: 'Like', image: require('./assets/placeholder.png') },
  { id: 5, text: 'Want', image: require('./assets/placeholder.png') },
  { id: 6, text: 'Play', image: require('./assets/placeholder.png') },
  { id: 7, text: 'Football', image: require('./assets/placeholder.png') },
  { id: 8, text: 'Pizza', image: require('./assets/placeholder.png') },
  { id: 9, text: 'School', image: require('./assets/placeholder.png') },
];

type Screen = 'word-selection' | 'phrase-selection';

export default function App() {
  const [screen, setScreen] = useState<Screen>('word-selection');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [allPhrases, setAllPhrases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [caregiverInput, setCaregiverInput] = useState('');

  // Función para seleccionar/deseleccionar palabras
  const handleWordPress = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  // Generar frases con Gemini
  const handleGeneratePhrases = async () => {
    if (selectedWords.length === 0) {
      Alert.alert('Error', 'Por favor selecciona al menos una palabra');
      return;
    }

    setIsLoading(true);
    try {
      const generatedPhrases = await generatePhrases(selectedWords);
      setPhrases(generatedPhrases);
      setAllPhrases(generatedPhrases);
      setScreen('phrase-selection');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'No se pudieron generar las frases. Verifica tu API key de Gemini.'
      );
      console.error('Error generating phrases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar más frases
  const handleGenerateMorePhrases = async () => {
    if (selectedWords.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const morePhrases = await generateMorePhrases(selectedWords, allPhrases);
      setPhrases(morePhrases);
      setAllPhrases([...allPhrases, ...morePhrases]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron generar más frases');
      console.error('Error generating more phrases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reproducir frase con text-to-speech
  const handleSpeakPhrase = (phrase: string) => {
    Speech.speak(phrase, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  // Volver a selección de palabras
  const handleBackToWords = () => {
    setScreen('word-selection');
    setSelectedWords([]);
    setPhrases([]);
  };

  // Limpiar selección
  const handleClear = () => {
    setSelectedWords([]);
    setPhrases([]);
    setAllPhrases([]);
    setScreen('word-selection');
  };

  // Pantalla de selección de palabras
  if (screen === 'word-selection') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AAC App - Selección de Palabras</Text>
          <Text style={styles.headerSubtitle}>Selecciona palabras para crear frases</Text>
        </View>

        {/* Palabras seleccionadas */}
        <View style={styles.outputArea}>
          <Text style={styles.outputLabel}>
            Palabras seleccionadas: {selectedWords.length > 0 ? selectedWords.join(', ') : 'Ninguna'}
          </Text>
        </View>

        {/* Grilla de palabras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona Palabras</Text>
          <ScrollView 
            style={styles.symbolGrid}
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
                    isSelected && styles.symbolButtonSelected
                  ]}
                  onPress={() => handleWordPress(symbol.text)}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={symbol.image} 
                    style={styles.symbolImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.symbolText}>{symbol.text}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.generateButton, isLoading && styles.buttonDisabled]}
            onPress={handleGeneratePhrases}
            disabled={isLoading || selectedWords.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.generateButtonText}>Generar Frases</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pantalla de selección de frases
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AAC App - Frases Generadas</Text>
        <Text style={styles.headerSubtitle}>Elige una frase para reproducir</Text>
      </View>

      {/* Frases generadas */}
      <ScrollView style={styles.phrasesContainer} contentContainerStyle={styles.phrasesContent}>
        {phrases.map((phrase, index) => (
          <TouchableOpacity
            key={index}
            style={styles.phraseButton}
            onPress={() => handleSpeakPhrase(phrase)}
            activeOpacity={0.7}
          >
            <Text style={styles.phraseText}>{phrase}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.generateButton, isLoading && styles.buttonDisabled]}
          onPress={handleGenerateMorePhrases}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.generateButtonText}>Generar Más Frases</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={handleBackToWords}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  outputArea: {
    backgroundColor: 'white',
    padding: 16,
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  outputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 12,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  symbolGrid: {
    maxHeight: 400,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10,
  },
  symbolButton: {
    backgroundColor: 'white',
    width: 100,
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 10,
    marginBottom: 10,
  },
  symbolButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
    borderWidth: 3,
  },
  symbolImage: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  phrasesContainer: {
    flex: 1,
    padding: 12,
  },
  phrasesContent: {
    paddingBottom: 20,
  },
  phraseButton: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  phraseText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  actionButtons: {
    padding: 12,
    gap: 10,
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#9E9E9E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
