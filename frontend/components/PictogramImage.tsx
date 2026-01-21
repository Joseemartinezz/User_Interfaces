import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, Image, InteractionManager } from 'react-native';
import { getPictogramImageUrl } from '../services/arasaacService';
import { useTheme } from '../context/ThemeContext';
import { styles } from './PictogramImage.styles';

/**
 * Props for PictogramImage component
 */
export interface PictogramImageProps {
  arasaacId: number;
  style?: any;
}

/**
 * Component to display ARASAAC pictograms with error handling and loading
 * Memoized to avoid unnecessary re-renders
 */
export const PictogramImage: React.FC<PictogramImageProps> = React.memo(({ arasaacId, style }) => {
  const [imageError, setImageError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { theme } = useTheme();

  // Memoize pictogram URL
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
      console.log(`Pictogram ID ${arasaacId} - URL: ${imageUrl}`);
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
    console.error(`Error loading pictogram ID ${arasaacId}`);

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
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>❓</Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>ID: {arasaacId}</Text>
        {errorMessage && (
          <Text style={[styles.errorSubtext, { color: theme.textSecondary }]} numberOfLines={2}>
            {errorMessage.substring(0, 50)}...
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[style, styles.imageContainer]}>
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

/**
 * Props for CustomSymbolImage component
 */
export interface CustomSymbolImageProps {
  imageUrl: string;
  style?: any;
}

/**
 * Component to display custom symbols (user-uploaded images)
 * Memoized to avoid unnecessary re-renders
 */
export const CustomSymbolImage: React.FC<CustomSymbolImageProps> = React.memo(({ imageUrl, style }) => {
  const [imageError, setImageError] = useState(false);
  const { theme } = useTheme();

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <View style={[style, styles.errorContainer]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>❓</Text>
      </View>
    );
  }

  return (
    <View style={[style, styles.imageContainer]}>
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

// Default export for convenience
export default PictogramImage;
