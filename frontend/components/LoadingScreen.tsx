import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { styles } from './LoadingScreen.styles';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Minimalist and child-friendly loading screen
 * Shows a smooth animation while images are being generated
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...'
}) => {
  const { theme } = useTheme();
  
  // Pulse animation for the logo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Start continuous pulse animation immediately
    pulseAnimationRef.current = Animated.loop(
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
    pulseAnimationRef.current.start();

    return () => {
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Animated icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: 'transparent',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image 
            source={require('../assets/logo.jpeg')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Main text */}
        <Text style={[styles.mainText, { color: theme.primary }]}>
          {message}
        </Text>

        {/* Simple loading indicator */}
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
      </View>
    </View>
  );
};

export default React.memo(LoadingScreen);
