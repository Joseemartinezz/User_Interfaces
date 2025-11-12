import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Symbol } from '../types';
import { getArasaacImageUrl } from '../services/arasaacService';

interface SymbolGridProps {
  symbols: Symbol[];
  onSymbolPress: (symbol: Symbol) => void;
  isLoading?: boolean;
}

export const SymbolGrid: React.FC<SymbolGridProps> = ({
  symbols,
  onSymbolPress,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Cargando símbolos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    >
      {symbols.map((symbol) => (
        <TouchableOpacity
          key={symbol.id}
          style={styles.symbolCard}
          onPress={() => onSymbolPress(symbol)}
          activeOpacity={0.7}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: symbol.imageUrl }}
              style={styles.symbolImage}
              contentFit="contain"
              transition={200}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          </View>
          <Text style={styles.symbolLabel} numberOfLines={2}>
            {symbol.word}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  symbolCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbolImage: {
    width: '80%',
    height: '80%',
  },
  symbolLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

