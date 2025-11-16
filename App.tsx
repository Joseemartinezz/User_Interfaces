import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Símbolos de ejemplo para el demo
const DEMO_SYMBOLS = [
  { id: 1, text: 'Hola', emoji: '👋' },
  { id: 2, text: 'Gracias', emoji: '🙏' },
  { id: 3, text: 'Comer', emoji: '🍎' },
  { id: 4, text: 'Beber', emoji: '🥤' },
  { id: 5, text: 'Jugar', emoji: '⚽' },
  { id: 6, text: 'Dormir', emoji: '😴' },
  { id: 7, text: 'Ayuda', emoji: '🆘' },
  { id: 8, text: 'Mamá', emoji: '👩' },
  { id: 9, text: 'Papá', emoji: '👨' },
  { id: 10, text: 'Baño', emoji: '🚽' },
  { id: 11, text: 'Sí', emoji: '✅' },
  { id: 12, text: 'No', emoji: '❌' },
];

export default function App() {
  const [selectedSymbols, setSelectedSymbols] = useState<any[]>([]);
  const [caregiverInput, setCaregiverInput] = useState('');
  const [translatedOutput, setTranslatedOutput] = useState('');

  // Función para cuando el niño selecciona un símbolo
  const handleSymbolPress = (symbol: any) => {
    const newSymbols = [...selectedSymbols, symbol];
    setSelectedSymbols(newSymbols);
    
    // Simulación simple de traducción: concatenar textos
    const translation = newSymbols.map(s => s.text).join(' ');
    setTranslatedOutput(translation);
  };

  // Función para cuando el cuidador envía texto
  const handleCaregiverSubmit = () => {
    if (caregiverInput.trim()) {
      setTranslatedOutput(`[Modo Cuidador] → "${caregiverInput}"`);
      // Aquí más adelante se conectará con el LLM para traducir a símbolos PCS
    }
  };

  // Limpiar todo
  const handleClear = () => {
    setSelectedSymbols([]);
    setCaregiverInput('');
    setTranslatedOutput('');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AAC App - Demo</Text>
        <Text style={styles.headerSubtitle}>Comunicación Aumentativa</Text>
      </View>

      {/* Área de Salida / Display */}
      <View style={styles.outputArea}>
        <Text style={styles.outputLabel}>Traducción:</Text>
        <View style={styles.outputBox}>
          <Text style={styles.outputText}>
            {translatedOutput || 'Selecciona símbolos o escribe texto...'}
          </Text>
        </View>
        
        {/* Símbolos seleccionados */}
        {selectedSymbols.length > 0 && (
          <View style={styles.selectedSymbolsContainer}>
            <Text style={styles.selectedLabel}>Símbolos seleccionados:</Text>
            <View style={styles.selectedSymbols}>
              {selectedSymbols.map((symbol, index) => (
                <View key={`${symbol.id}-${index}`} style={styles.miniSymbol}>
                  <Text style={styles.miniEmoji}>{symbol.emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Grilla de Símbolos PCS (para el niño) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selección de Símbolos (Niño)</Text>
        <ScrollView 
          style={styles.symbolGrid}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {DEMO_SYMBOLS.map((symbol) => (
            <TouchableOpacity
              key={symbol.id}
              style={styles.symbolButton}
              onPress={() => handleSymbolPress(symbol)}
              activeOpacity={0.7}
            >
              <Text style={styles.symbolEmoji}>{symbol.emoji}</Text>
              <Text style={styles.symbolText}>{symbol.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input de Texto (para el cuidador) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entrada de Texto (Cuidador)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe aquí..."
            value={caregiverInput}
            onChangeText={setCaregiverInput}
            onSubmitEditing={handleCaregiverSubmit}
          />
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleCaregiverSubmit}
          >
            <Text style={styles.submitButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botón de limpiar */}
      <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
        <Text style={styles.clearButtonText}>Limpiar Todo</Text>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  outputBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    minHeight: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  outputText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
  },
  selectedSymbolsContainer: {
    marginTop: 12,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  selectedSymbols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  miniSymbol: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  miniEmoji: {
    fontSize: 24,
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  symbolGrid: {
    maxHeight: 220,
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
  symbolEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  symbolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
    margin: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

