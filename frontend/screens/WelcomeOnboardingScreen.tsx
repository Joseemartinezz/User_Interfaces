import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { styles } from './WelcomeOnboardingScreen.styles';

const { width, height } = Dimensions.get('window');

/**
 * Beautiful welcome screen with animations
 * Shown before the onboarding setup process
 */
const WelcomeOnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Title and emoji entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Emoji pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(emojiScale, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(emojiScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Button entrance (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);
  }, []);

  const handleGetStarted = () => {
    // Navigate to onboarding
    (navigation as any).navigate('Onboarding');
  };

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          {/* Animated emoji */}
          <Animated.View
            style={[
              styles.emojiContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { scale: emojiScale },
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.emoji}>👋</Text>
          </Animated.View>

          {/* Animated title */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.primary }]}>
              Welcome to
            </Text>
            <Text style={[styles.titleBold, { color: theme.primary }]}>
              WizzWords
            </Text>
          </Animated.View>

          {/* Animated description */}
          <Animated.View
            style={[
              styles.descriptionContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.description, { color: theme.text }]}>
              Let's set up your preferences!
            </Text>
          </Animated.View>

          {/* Animated button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonOpacity,
                transform: [{ scale: buttonScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.getStartedButton, { backgroundColor: theme.primary }]}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.white }]}>
                Get Started
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default React.memo(WelcomeOnboardingScreen);

