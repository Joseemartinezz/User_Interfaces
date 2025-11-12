import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Symbol } from './src/types';
import { SymbolGrid } from './src/components/SymbolGrid';
import { CaregiverTextInput } from './src/components/TextInput';
import { DisplayArea } from './src/components/DisplayArea';
import {
  BASIC_SYMBOLS,
  getArasaacSymbol,
  textToSymbolIds,
  wordToSymbolId,
  getArasaacImageUrl,
} from './src/services/arasaacService';

export default function App() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayText, setDisplayText] = useState<string>('');
  const [displaySymbols, setDisplaySymbols] = useState<Symbol[]>([]);

  // Cargar símbolos básicos al iniciar
  useEffect(() => {
    loadBasicSymbols();
  }, []);

  const loadBasicSymbols = async () => {
    setIsLoading(true);
    try {
      const loadedSymbols: Symbol[] = [];

      // Cargar los símbolos básicos
      for (const basicSymbol of BASIC_SYMBOLS) {
        const symbol = await getArasaacSymbol(basicSymbol.id, basicSymbol.word);
        if (symbol) {
          loadedSymbols.push({
            id: symbol.id,
            word: basicSymbol.word,
            imageUrl: symbol.imageUrl,
          });
        }
      }

      setSymbols(loadedSymbols);
    } catch (error) {
      console.error('Error al cargar símbolos:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar los símbolos. Verifica tu conexión a internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymbolPress = (symbol: Symbol) => {
    // Agregar símbolo a la secuencia de visualización
    setDisplaySymbols((prev) => [...prev, symbol]);
    
    // Actualizar texto mostrando la palabra
    setDisplayText((prev) => {
      return prev ? `${prev} ${symbol.word}` : symbol.word;
    });
  };

  const handleTextSubmit = async (text: string) => {
    // Convertir texto a IDs de símbolos
    const symbolIds = textToSymbolIds(text);
    
    if (symbolIds.length === 0) {
      Alert.alert(
        'Sin símbolos',
        'No se encontraron símbolos para las palabras ingresadas.'
      );
      return;
    }

    // Cargar los símbolos correspondientes
    const loadedSymbols: Symbol[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i];
      // Intentar encontrar la palabra correspondiente
      const word = words.find(w => wordToSymbolId(w) === symbolId) || '';
      const symbol = await getArasaacSymbol(symbolId, word);
      if (symbol) {
        loadedSymbols.push({
          id: symbol.id,
          word: symbol.keyword,
          imageUrl: symbol.imageUrl,
        });
      }
    }

    setDisplaySymbols(loadedSymbols);
    setDisplayText(text);
  };

  const handleSymbolRemove = (symbolId: number) => {
    setDisplaySymbols((prev) => prev.filter((s) => s.id !== symbolId));
    
    // Reconstruir el texto sin el símbolo eliminado
    const newSymbols = displaySymbols.filter((s) => s.id !== symbolId);
    setDisplayText(newSymbols.map((s) => s.word).join(' '));
  };

  const handleClear = () => {
    setDisplayText('');
    setDisplaySymbols([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6']}
        style={styles.header}
      >
        <Text style={styles.title}>WizWords</Text>
        <Text style={styles.subtitle}>Comunicación Aumentativa</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.displaySection}>
          <View style={styles.displayHeader}>
            <Text style={styles.sectionTitle}>Traducción</Text>
            {displayText && (
              <Text
                style={styles.clearButton}
                onPress={handleClear}
              >
                Limpiar
              </Text>
            )}
          </View>
          <DisplayArea
            text={displayText}
            symbols={displaySymbols}
            onSymbolRemove={handleSymbolRemove}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Símbolos</Text>
          <SymbolGrid
            symbols={symbols}
            onSymbolPress={handleSymbolPress}
            isLoading={isLoading}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Entrada de texto (cuidador)</Text>
        <CaregiverTextInput onTextSubmit={handleTextSubmit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E9D5FF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  displaySection: {
    flex: 0.4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  clearButton: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: '600',
  },
  inputSection: {
    flex: 0.6,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

