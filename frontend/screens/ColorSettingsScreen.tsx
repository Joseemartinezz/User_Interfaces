import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { styles } from './ColorSettingsScreen.styles';

type ColorSettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

/**
 * Settings screen with user preferences
 */
const ColorSettingsScreen: React.FC<ColorSettingsScreenProps> = ({ navigation }) => {
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

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      {/* Header - outside SafeAreaView so it extends to top edge */}
      <Header
        title="Color Theme"
        showProfile={false}
      />

      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom', 'left', 'right']}>
        {/* Content */}
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
              {/* Palette 1 */}
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

              {/* Palette 2 */}
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

              {/* Palette 3 - Evergreen/Dark Teal */}
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

              {/* Palette 4 - Light Yellow/Emerald */}
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

              {/* Palette 5 - Lavender Blush/Aquamarine */}
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

              {/* Palette 6 - Pecan Beige/Desert Sand */}
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

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(ColorSettingsScreen);
