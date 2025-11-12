import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Symbol } from '../types';
import { getArasaacImageUrl } from '../services/arasaacService';

interface DisplayAreaProps {
  text?: string;
  symbols?: Symbol[];
  onSymbolRemove?: (symbolId: number) => void;
}

export const DisplayArea: React.FC<DisplayAreaProps> = ({
  text,
  symbols = [],
  onSymbolRemove,
}) => {
  const hasContent = text || symbols.length > 0;

  if (!hasContent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aquí se mostrará la traducción
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {text && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
      
      {symbols.length > 0 && (
        <View style={styles.symbolsContainer}>
          {symbols.map((symbol) => (
            <View key={symbol.id} style={styles.symbolWrapper}>
              <TouchableOpacity
                style={styles.symbolItem}
                activeOpacity={0.7}
                onLongPress={() => onSymbolRemove?.(symbol.id)}
              >
                <Image
                  source={{ uri: symbol.imageUrl }}
                  style={styles.displaySymbolImage}
                  contentFit="contain"
                  transition={200}
                />
                <Text style={styles.displaySymbolLabel} numberOfLines={1}>
                  {symbol.word}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  textContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#6B46C1',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
  },
  symbolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symbolWrapper: {
    width: '22%',
  },
  symbolItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  displaySymbolImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  displaySymbolLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
});

