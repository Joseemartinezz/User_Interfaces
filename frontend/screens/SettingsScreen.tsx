import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header from '../components/common/Header';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
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
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = async (paletteNumber: number) => {
    await setTheme(paletteNumber);
    try {
      await updatePreferences({ theme: paletteNumber });
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleColorPaletteChange = async (palette: 'default' | 'high-contrast' | 'pastel' | 'vibrant') => {
    setIsSaving(true);
    try {
      await updatePreferences({ colorPalette: palette });
      Alert.alert('Success', 'Color palette updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error updating palette');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFontSizeChange = async (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setIsSaving(true);
    try {
      await updatePreferences({ preferredFontSize: size });
      Alert.alert('Success', 'Font size updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error updating font size');
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
                  <View style={[styles.colorSwatch, { backgroundColor: '#efbaf9' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#e9a1f7' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#daa5f3' }]} />
                </View>
                <Text style={[styles.themeOptionText, { color: theme.primary }]}>
                  Palette 1 {currentPalette === 1 && '✓'}
                </Text>
              </TouchableOpacity>

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
                  <View style={[styles.colorSwatch, { backgroundColor: '#ffffff' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#6a99f0' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#678dea' }]} />
                  <View style={[styles.colorSwatch, { backgroundColor: '#6481e3' }]} />
                </View>
                <Text style={[styles.themeOptionText, { color: theme.primary }]}>
                  Palette 2 {currentPalette === 2 && '✓'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Preferred PCS Palette */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🖌️ PCS Symbol Palette</Text>
            <Text style={[styles.sectionDescription, { color: theme.primary }]}>
              Style of PCS symbols
            </Text>
            
            <View style={styles.optionsList}>
              {(['default', 'high-contrast', 'pastel', 'vibrant'] as const).map((palette) => (
                <TouchableOpacity
                  key={palette}
                  style={[
                    styles.optionItem,
                    { 
                      borderColor: user?.preferences.colorPalette === palette ? theme.primary : '#ddd',
                      borderWidth: user?.preferences.colorPalette === palette ? 2 : 1,
                      backgroundColor: user?.preferences.colorPalette === palette ? theme.secondary : 'white',
                    }
                  ]}
                  onPress={() => handleColorPaletteChange(palette)}
                  disabled={isSaving}
                >
                  <Text style={[styles.optionText, { color: theme.primary }]}>
                    {palette === 'default' && 'Default'}
                    {palette === 'high-contrast' && 'High Contrast'}
                    {palette === 'pastel' && 'Pastel'}
                    {palette === 'vibrant' && 'Vibrant'}
                    {user?.preferences.colorPalette === palette && ' ✓'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Font Size */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>📏 Font Size</Text>
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

          {/* App Information */}
          <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
            <Text style={[styles.infoTitle, { color: theme.primary }]}>ℹ️ App Information</Text>
            <Text style={[styles.infoText, { color: theme.primary }]}>
              AAC App - Augmentative Communication{'\n'}
              Version 0.2.0 (with Firebase){'\n'}
              Polimi - Advanced User Interfaces
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(SettingsScreen);
