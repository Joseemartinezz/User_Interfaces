import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { styles } from './SettingsScreen.styles';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

/**
 * Settings screen with user preferences
 */
const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, currentPalette, setTheme } = useTheme();
  const { user, updatePreferences } = useUser();
  const { showSuccess, showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (paletteNumber: number) => {
    const paletteNames: Record<number, string> = {
      1: 'Purple Harmony',
      2: 'Ocean Blue',
      3: 'Forest Green',
      4: 'Sunshine Bright',
      5: 'Soft Pastel',
      6: 'Earthy Tones',
    };
    
    await setTheme(paletteNumber, false); // Don't show internal notification
    try {
      await updatePreferences({ theme: paletteNumber });
      const paletteName = paletteNames[paletteNumber] || `Palette ${paletteNumber}`;
      showSuccess(`Theme changed to ${paletteName}`);
    } catch (error) {
      console.error('Error saving theme:', error);
      showError('Could not save theme preference');
    }
  };

  const handleFontSizeChange = async (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setIsSaving(true);
    try {
      await updatePreferences({ preferredFontSize: size });
      showSuccess('Font size updated');
    } catch (error: any) {
      showError(error.message || 'Error updating font size');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Header */}
        <Header
          title="Settings"
          showProfile={true}
        />

        {/* Contenido */}
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Section: Color Theme */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🎨 Color Theme</Text>
            <Text style={[styles.sectionDescription, { color: theme.primary }]}>
              Select a color palette for the app:
            </Text>

            <View style={styles.themeSelector}>
              {/* Paleta 1 */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 1 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(1)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#8470e5' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#daa5f3' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#e9a1f7' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#efbaf9' }]} />
                  {currentPalette === 1 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Paleta 2 */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 2 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(2)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#5b59c5' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#6481e3' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#81A0EE' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#90B3F4' }]} />
                  {currentPalette === 2 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Paleta 3 - Evergreen/Dark Teal */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 3 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(3)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#002626' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#0E4749' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#95C623' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#E55812' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#EFE7DA' }]} />
                  {currentPalette === 3 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Paleta 4 - Light Yellow/Emerald */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 4 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(4)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#F8FFE5' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#08D6A0' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#189AAA' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#EF476F' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#FFC43D' }]} />
                  {currentPalette === 4 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Paleta 5 - Lavender Blush/Aquamarine */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 5 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(5)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#FCEFEF' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#7FD8BE' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#A1FCDF' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#FCD29F' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#FCAB64' }]} />
                  {currentPalette === 5 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Paleta 6 - Pecan Beige/Desert Sand */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: 'white',
                    borderColor: theme.primary,
                    borderWidth: currentPalette === 6 ? 3 : 2,
                  }
                ]}
                onPress={() => handleThemeChange(6)}
                disabled={isSaving}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.colorSwatch, { backgroundColor: '#D8CFAF' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#E6B89C' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#ED9390' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#F374AE' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#32533D' }]} />
                  {currentPalette === 6 && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedCheckmark}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Font Size */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>📏 Font Size (Not implemented)</Text>
            <Text style={[styles.sectionDescription, { color: theme.primary }]}>
              Text size in the app
            </Text>

            <View style={styles.optionsList}>
              {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.optionItem,
                    {
                      borderColor: user?.preferences.preferredFontSize === size ? theme.primary : '#ddd',
                      borderWidth: user?.preferences.preferredFontSize === size ? 2 : 1,
                      backgroundColor: user?.preferences.preferredFontSize === size ? theme.secondary : 'white',
                    }
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: theme.primary,
                        fontSize: size === 'small' ? 14 : size === 'medium' ? 16 : size === 'large' ? 18 : 20
                      }
                    ]}
                  >
                    {size === 'small' && 'Small'}
                    {size === 'medium' && 'Medium'}
                    {size === 'large' && 'Large'}
                    {size === 'extra-large' && 'Extra Large'}
                    {user?.preferences.preferredFontSize === size && ' ✓'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(SettingsScreen);
