import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { styles } from './OnboardingScreen.styles';

// Categorías predefinidas con emojis
const DEFAULT_CATEGORIES = [
  { name: 'Food', emoji: '🍕' },
  { name: 'Games', emoji: '🎮' },
  { name: 'School', emoji: '🏫' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Animals', emoji: '🐾' },
  { name: 'Transport', emoji: '🚗' },
];

// Opciones de idioma
const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Español', emoji: '🇪🇸' },
  { code: 'en', label: 'English', emoji: '🇬🇧' },
  { code: 'it', label: 'Italiano', emoji: '🇮🇹' },
];


/**
 * Welcome and initial setup screen for new users
 * Multi-step wizard to configure basic preferences
 */
const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, setTheme } = useTheme();
  const { updatePreferences } = useUser();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Configuration states
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTheme, setSelectedTheme] = useState(1);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [childAge, setChildAge] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const totalSteps = 5;

  // ============================================================================
  // PASSWORD VALIDATION UTILITIES
  // ============================================================================

  /**
   * Minimum password length requirement
   * Increased from 4 to 6 for better security
   */
  const MIN_PASSWORD_LENGTH = 6;

  /**
   * Common weak passwords that should be rejected
   * These patterns are easy to guess by children
   */
  const WEAK_PASSWORD_PATTERNS = [
    '123456', '654321', '111111', '000000', '123123',
    'password', 'qwerty', 'abcdef', 'aaaaaa'
  ];

  /**
   * Check if password is a weak pattern
   */
  const isWeakPassword = (password: string): boolean => {
    const lower = password.toLowerCase();
    return WEAK_PASSWORD_PATTERNS.some(pattern => lower.includes(pattern));
  };

  /**
   * Get password strength: 'weak' | 'medium' | 'strong'
   */
  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (!password || password.length < MIN_PASSWORD_LENGTH) return 'weak';
    if (isWeakPassword(password)) return 'weak';

    // Check for variety (letters + numbers)
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);

    if (hasLetters && hasNumbers && password.length >= 8) return 'strong';
    if (password.length >= MIN_PASSWORD_LENGTH) return 'medium';
    return 'weak';
  };

  // Navigate to next step
  const handleNext = useCallback(() => {
    // Clear previous password error
    setPasswordError(null);

    // Validations per step
    if (currentStep === 1) {
      // Validate age
      const age = parseInt(childAge);
      if (!childAge || isNaN(age) || age < 1 || age > 18) {
        showError('Please enter a valid age (1-18 years)');
        return;
      }
    }

    if (currentStep === 6) {
      // Validate password with hardened requirements
      if (!parentPassword || parentPassword.length < MIN_PASSWORD_LENGTH) {
        setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return;
      }

      // Check for weak passwords
      if (isWeakPassword(parentPassword)) {
        setPasswordError('This password is too easy to guess. Please use a stronger password.');
        return;
      }

      if (parentPassword !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  }, [currentStep, childAge, parentPassword, confirmPassword]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Finish onboarding and save configuration
  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Update theme
      await setTheme(selectedTheme);

      // Save all preferences to Firestore
      await updatePreferences({
        language: selectedLanguage,
        theme: selectedTheme,
        hiddenCategories,
        childAge: parseInt(childAge),
        parentMenuPassword: parentPassword,
        hasCompletedOnboarding: true,
      });

      // Navigation will be handled automatically by context
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      showError('Could not save configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle hidden categories
  const toggleCategory = useCallback((categoryName: string) => {
    setHiddenCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainerCentered}>
            <Text style={[styles.stepTitle, { color: theme.primary }]}>
              👶 Child's Age
            </Text>
            <Text style={[styles.stepDescription, { color: theme.text }]}>
              Please enter the age of the child who will be using the app:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: theme.primary, color: theme.text }]}
              placeholder="Age (e.g. 5)"
              placeholderTextColor={theme.textSecondary}
              value={childAge}
              onChangeText={setChildAge}
              keyboardType="number-pad"
              maxLength={2}
            />
            <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
              <Text style={[styles.infoText, { color: theme.primary }]}>
                ℹ️ This helps us provide age-appropriate content and recommendations.
              </Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.primary }]}>
              🌍 Language
            </Text>
            <Text style={[styles.stepDescription, { color: theme.text }]}>
              Select your preferred language:
            </Text>
            <View style={styles.optionsContainer}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.optionButton,
                    {
                      borderColor: selectedLanguage === lang.code ? theme.primary : theme.textSecondary,
                      backgroundColor: selectedLanguage === lang.code ? theme.secondary : theme.white,
                    },
                  ]}
                  onPress={() => setSelectedLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{lang.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selectedLanguage === lang.code ? theme.primary : theme.text,
                        fontWeight: selectedLanguage === lang.code ? 'bold' : 'normal',
                      },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.primary }]}>
              🎨 Color Theme
            </Text>
            <Text style={[styles.stepDescription, { color: theme.text }]}>
              Choose your favorite color combination:
            </Text>
            <ScrollView style={styles.themesScrollContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.themesContainer}>
                {/* Palette 1 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 1 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 1 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(1);
                    setTheme(1);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#8470e5' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#daa5f3' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#e9a1f7' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#efbaf9' }]} />
                  </View>
                  {selectedTheme === 1 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#8470e5' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Palette 2 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 2 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 2 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(2);
                    setTheme(2);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#5b59c5' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#6481e3' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#81A0EE' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#90B3F4' }]} />
                  </View>
                  {selectedTheme === 2 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#5b59c5' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Palette 3 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 3 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 3 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(3);
                    setTheme(3);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#002626' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#0E4749' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#95C623' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#E55812' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#EFE7DA' }]} />
                  </View>
                  {selectedTheme === 3 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#0E4749' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Palette 4 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 4 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 4 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(4);
                    setTheme(4);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#F8FFE5' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#08D6A0' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#189AAA' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#EF476F' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#FFC43D' }]} />
                  </View>
                  {selectedTheme === 4 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#189AAA' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Palette 5 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 5 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 5 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(5);
                    setTheme(5);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#FCEFEF' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#7FD8BE' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#A1FCDF' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#FCD29F' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#FCAB64' }]} />
                  </View>
                  {selectedTheme === 5 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#7FD8BE' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Palette 6 */}
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    {
                      borderColor: selectedTheme === 6 ? theme.primary : '#ddd',
                      borderWidth: selectedTheme === 6 ? 3 : 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedTheme(6);
                    setTheme(6);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: '#D8CFAF' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#E6B89C' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#ED9390' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#F374AE' }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: '#32533D' }]} />
                  </View>
                  {selectedTheme === 6 && (
                    <View style={[styles.selectedBadge, { backgroundColor: '#32533D' }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.categoriesHeader}>
              <Text style={[styles.stepTitle, { color: theme.primary }]}>
                📂 Categories
              </Text>
              <Text style={[styles.stepDescription, { color: theme.text }]}>
                Select which categories you want to show. You can hide the ones you don't need:
              </Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                (Tap a category to hide/show it)
              </Text>
            </View>
            <ScrollView
              style={styles.categoriesScrollContainer}
              contentContainerStyle={styles.categoriesScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={styles.categoriesGrid}>
                {DEFAULT_CATEGORIES.map((category) => {
                  const isHidden = hiddenCategories.includes(category.name);
                  return (
                    <TouchableOpacity
                      key={category.name}
                      style={[
                        styles.categoryCard,
                        {
                          borderColor: isHidden ? '#ddd' : theme.primary,
                          backgroundColor: isHidden ? '#f5f5f5' : theme.white,
                          opacity: isHidden ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => toggleCategory(category.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text
                        style={[
                          styles.categoryName,
                          {
                            color: isHidden ? theme.textSecondary : theme.primary,
                            textDecorationLine: isHidden ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                      {!isHidden && <Text style={styles.categoryStatus}>✓ Visible</Text>}
                      {isHidden && <Text style={styles.categoryStatus}>✗ Hidden</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        );

      case 5:
        // Calculate password strength for visual indicator
        const strength = getPasswordStrength(parentPassword);
        const strengthColors = {
          weak: '#EF4444',
          medium: '#F59E0B',
          strong: '#10B981'
        };
        const strengthLabels = {
          weak: 'Weak',
          medium: 'Medium',
          strong: 'Strong'
        };

        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.primary }]}>
              🔐 Parent Menu Password
            </Text>
            <Text style={[styles.stepDescription, { color: theme.text }]}>
              Create a password to access the settings menu (for parents/tutors only):
            </Text>

            {/* Password input */}
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: passwordError ? '#EF4444' : theme.primary,
                  color: theme.text
                }
              ]}
              placeholder={`Password (minimum ${MIN_PASSWORD_LENGTH} characters)`}
              placeholderTextColor={theme.textSecondary}
              value={parentPassword}
              onChangeText={(text) => {
                setParentPassword(text);
                setPasswordError(null); // Clear error on type
              }}
              secureTextEntry
              maxLength={20}
            />

            {/* Password strength indicator */}
            {parentPassword.length > 0 && (
              <View style={{ marginTop: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{
                    flex: 1,
                    height: 6,
                    backgroundColor: '#E5E7EB',
                    borderRadius: 3,
                    marginRight: 8
                  }}>
                    <View style={{
                      width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
                      height: '100%',
                      backgroundColor: strengthColors[strength],
                      borderRadius: 3
                    }} />
                  </View>
                  <Text style={{ fontSize: 12, color: strengthColors[strength], fontWeight: '600' }}>
                    {strengthLabels[strength]}
                  </Text>
                </View>
              </View>
            )}

            {/* Confirm password input */}
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: passwordError ? '#EF4444' : theme.primary,
                  color: theme.text
                }
              ]}
              placeholder="Confirm password"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError(null); // Clear error on type
              }}
              secureTextEntry
              maxLength={20}
            />

            {/* Inline error message (replaces Alert.alert) */}
            {passwordError && (
              <View style={{
                backgroundColor: '#FEE2E2',
                padding: 12,
                borderRadius: 8,
                marginTop: 8,
                borderColor: '#EF4444',
                borderWidth: 1
              }}>
                <Text style={{ color: '#DC2626', fontSize: 14 }}>
                  ⚠️ {passwordError}
                </Text>
              </View>
            )}

            <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
              <Text style={[styles.infoText, { color: theme.primary }]}>
                ℹ️ This password protects the parent menu so children cannot change
                settings without supervision.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header with progress */}
        <View style={[
          styles.header,
          {
            backgroundColor: theme.white,
            paddingTop: Math.max(insets.top + 10, 40),
          }
        ]}>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Setup
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.secondary }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${(currentStep / totalSteps) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>
        </View>

        {/* Current step content */}
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation buttons */}
        <View style={[styles.footer, { backgroundColor: theme.white }]}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[
                styles.backButton,
                {
                  borderColor: theme.primary,
                  backgroundColor: theme.primary,
                }
              ]}
              onPress={handleBack}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/WhiteBackArrow.png')}
                  style={{ width: 20, height: 20, marginRight: 8 }}
                  resizeMode="contain"
                />
                <Text style={[styles.backButtonText, { color: theme.white }]}>
                  Back
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: theme.primary },
              currentStep === 1 && styles.nextButtonFull,
            ]}
            onPress={handleNext}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.white} />
            ) : (
              <>
                {currentStep === totalSteps ? (
                  <Text style={[styles.nextButtonText, { color: theme.white }]}>
                    Finish! 🎉
                  </Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.nextButtonText, { color: theme.white }]}>
                      Next
                    </Text>
                    <Image
                      source={require('../assets/WhiteNextArrow.png')}
                      style={{ width: 20, height: 20, marginLeft: 8 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default React.memo(OnboardingScreen);

