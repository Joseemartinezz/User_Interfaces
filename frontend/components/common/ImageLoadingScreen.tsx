import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './ImageLoadingScreen.styles';

interface ImageLoadingScreenProps {
  message?: string;
}

/**
 * Pantalla de carga minimalista y amigable para niños
 * Muestra una animación suave mientras se generan las imágenes
 */
const ImageLoadingScreen: React.FC<ImageLoadingScreenProps> = ({ 
  message = 'Creating your flashcards...' 
}) => {
  const { theme } = useTheme();
  
  // Animaciones para los elementos
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso continua
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Icono animado */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.accent,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.iconEmoji}>🎨</Text>
        </Animated.View>

        {/* Texto principal */}
        <Text style={[styles.mainText, { color: theme.primary }]}>
          {message}
        </Text>

        {/* Indicador de carga simple */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: theme.primary,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

export default React.memo(ImageLoadingScreen);

