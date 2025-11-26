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
import { getPictogramImageUrl } from './services/arasaacService';
import { generateAzurePhrases, generateMoreAzurePhrases } from './services/azureService';

// Componente para mostrar pictogramas con manejo de errores y carga
interface PictogramImageProps {
  arasaacId: number;
  style?: any;
}

const PictogramImage: React.FC<PictogramImageProps> = ({ arasaacId, style }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Generar URL del pictograma
  const imageUrl = getPictogramImageUrl(arasaacId, { 
    color: true, 
    backgroundColor: 'white' 
  });
  
  // Log para debug
  React.useEffect(() => {
    console.log(`🖼️ Pictograma ID ${arasaacId}`);
    console.log(`   URL: ${imageUrl}`);
    // Resetear error cuando cambia el ID o la URL
    setImageError(false);
    setErrorMessage(null);
    setImageLoading(true);
  }, [arasaacId, imageUrl]);
  
  if (imageError) {
    // Mostrar un placeholder si hay error con información de debug
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
    <View style={[style, { overflow: 'hidden' }]}>
      {imageLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#4A90E2" />
        </View>
      )}
      <Image
        source={{ 
          uri: imageUrl,
          // No usar cache forzado para evitar problemas
          cache: 'default'
        }}
        style={style}
        resizeMode="contain"
        onLoadStart={() => {
          console.log(`⏳ Iniciando carga: ID ${arasaacId}`);
          console.log(`   URL completa: ${imageUrl}`);
          setImageLoading(true);
          setImageError(false);
        }}
        onLoad={(event) => {
          console.log(`✅ Imagen cargada exitosamente: ID ${arasaacId}`);
          console.log(`   Dimensiones: ${event.nativeEvent.source.width}x${event.nativeEvent.source.height}`);
          setImageLoading(false);
        }}
        onLoadEnd={() => {
          setImageLoading(false);
        }}
        onError={(error) => {
          const errorDetails = error.nativeEvent || error;
          
          console.error(`❌ Error cargando pictograma ID ${arasaacId}`);
          console.error(`   URL: ${imageUrl}`);
          console.error(`   Error tipo:`, typeof errorDetails);
          console.error(`   Error keys:`, Object.keys(errorDetails));
          console.error(`   Error completo:`, errorDetails);
          
          // Intentar extraer el mensaje de error
          // En React Native, el error puede estar en diferentes propiedades
          let finalErrorMessage = 'Error al cargar';
          
          if (errorDetails.error) {
            finalErrorMessage = String(errorDetails.error);
          } else if (typeof errorDetails === 'string') {
            finalErrorMessage = errorDetails;
          } else if (errorDetails && typeof errorDetails === 'object') {
            // Intentar extraer cualquier propiedad que contenga el mensaje
            const errorString = JSON.stringify(errorDetails);
            if (errorString.length < 200) {
              finalErrorMessage = errorString;
            } else {
              finalErrorMessage = 'Error desconocido (ver logs)';
            }
          }
          
          console.error(`   Mensaje final: ${finalErrorMessage}`);
          
          setErrorMessage(finalErrorMessage);
          setImageError(true);
          setImageLoading(false);
        }}
      />
    </View>
  );
};

// Palabras del prototipo con pictogramas de ARASAAC
// Los IDs corresponden a pictogramas verificados en ARASAAC para cada palabra en inglés
const WORD_SYMBOLS = [
  { 
    id: 1, 
    text: 'I', 
    arasaacId: 6632, // "I" (yo) - pronombre personal
    imageUrl: getPictogramImageUrl(6632, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 2, 
    text: 'You', 
    arasaacId: 6625, // "you" (tú) - pronombre personal
    imageUrl: getPictogramImageUrl(6625, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 3, 
    text: 'Not', 
    arasaacId: 32308, // "not" (no) - negación
    imageUrl: getPictogramImageUrl(32308, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 4, 
    text: 'Like', 
    arasaacId: 37826, // "like" (gustar) - verbo
    imageUrl: getPictogramImageUrl(37826, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 5, 
    text: 'Want', 
    arasaacId: 5441, // "want" (querer) - verbo
    imageUrl: getPictogramImageUrl(5441, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 6, 
    text: 'Play', 
    arasaacId: 23392, // "play" (jugar) - verbo
    imageUrl: getPictogramImageUrl(23392, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 7, 
    text: 'Football', 
    arasaacId: 16743, // "football" (fútbol) - deporte
    imageUrl: getPictogramImageUrl(16743, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 8, 
    text: 'Pizza', 
    arasaacId: 2527, // "pizza" - comida
    imageUrl: getPictogramImageUrl(2527, { color: true, backgroundColor: 'white' })
  },
  { 
    id: 9, 
    text: 'School', 
    arasaacId: 32446, // "school" (escuela) - lugar
    imageUrl: getPictogramImageUrl(32446, { color: true, backgroundColor: 'white' })
  },
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
      const generatedPhrases = await generateAzurePhrases(selectedWords);
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
      const morePhrases = await generateMoreAzurePhrases(selectedWords, allPhrases);
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
function cleanPhrase(phrase: string): string {
  return phrase.trim().replace(/^\d+\.\s*/, "");
}

  const handleSpeakPhrase = (phrase: string) => {
    const cleaned = cleanPhrase(phrase);
    Speech.speak(cleaned, {
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

        {/* Palabras seleccionadas con pictogramas */}
        <View style={styles.outputArea}>
          {selectedWords.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.selectedWordsContainer}
              style={styles.selectedWordsScrollView}
              nestedScrollEnabled={true}
            >
              {selectedWords.map((word) => {
                const symbol = WORD_SYMBOLS.find(s => s.text === word);
                if (!symbol) return null;
                
                return (
                  <View key={word} style={styles.selectedWordItem}>
                    <PictogramImage 
                      arasaacId={symbol.arasaacId}
                      style={styles.selectedWordImage}
                    />
                    <Text style={styles.selectedWordText}>{word}</Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptySelectionText}>Ninguna palabra seleccionada</Text>
          )}
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
                  <PictogramImage 
                    arasaacId={symbol.arasaacId}
                    style={styles.symbolImage}
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
  selectedWordsScrollView: {
    maxHeight: 90,
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingVertical: 4,
  },
  selectedWordItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    marginRight: 12,
  },
  selectedWordImage: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  selectedWordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySelectionText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
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
  errorContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 30,
    color: '#999',
  },
  errorSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
