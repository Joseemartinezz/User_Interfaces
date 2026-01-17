import React, { useState, useCallback, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { getUserAvatarUrl } from '../api';
import { getInitials, isValidEmail, isValidName } from '../utils/index';
import Header from '../components/common/Header';
import { RootStackParamList } from '../types/navigation';
import { styles } from './ProfileScreen.styles';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

/**
 * User profile screen
 * Allows editing name, email and user settings
 */
export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme, currentPalette } = useTheme();
  const { user, updateUser, updatePreferences, refreshUser, isLoading: userLoading } = useUser();

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [childAge, setChildAge] = useState<string>(user?.preferences.childAge?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // Load avatar and form data when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setChildAge(user.preferences.childAge?.toString() || '');
      loadAvatar();
    }
  }, [user?.id, user?.fullName, user?.email, user?.preferences.childAge]);

  const loadAvatar = async () => {
    if (!user) return;

    try {
      setAvatarLoading(true);
      const url = await getUserAvatarUrl(user);
      if (url) setAvatarUrl(url);
    } catch (error) {
      console.error('Error loading avatar:', error);
    } finally {
      setAvatarLoading(false);
    }
  };

  /**
   * Validates form data
   */
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      showError('Name is required');
      return false;
    }

    if (!isValidName(fullName)) {
      showError('Name must be at least 2 characters and contain only letters');
      return false;
    }

    if (!email.trim()) {
      showError('Email is required');
      return false;
    }

    if (!isValidEmail(email)) {
      showError('Email is not valid');
      return false;
    }

    if (childAge.trim() && (isNaN(Number(childAge)) || Number(childAge) < 0 || Number(childAge) > 120)) {
      showError('Age must be a valid number between 0 and 120');
      return false;
    }

    return true;
  };

  /**
   * Saves profile changes
   */
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      await updateUser({ fullName, email });
      
      // Update child age in preferences
      const ageValue = childAge.trim() ? parseInt(childAge, 10) : undefined;
      await updatePreferences({ childAge: ageValue });
      
      // Refresh user data from Firestore to ensure consistency
      await refreshUser();
      
      showSuccess('Profile updated successfully');
    } catch (error: any) {
      showError(error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  }, [fullName, email, childAge, updateUser, updatePreferences, refreshUser]);



  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = getInitials(fullName, email);

  // Get palette colors based on palette number
  const getPaletteColors = (paletteNumber: number): string[] => {
    const palettes: Record<number, string[]> = {
      1: ['#8470e5', '#daa5f3', '#e9a1f7', '#efbaf9'],
      2: ['#5b59c5', '#6481e3', '#81A0EE', '#90B3F4'],
      3: ['#002626', '#0E4749', '#95C623', '#E55812', '#EFE7DA'],
      4: ['#F8FFE5', '#08D6A0', '#189AAA', '#EF476F', '#FFC43D'],
      5: ['#FCEFEF', '#7FD8BE', '#A1FCDF', '#FCD29F', '#FCAB64'],
      6: ['#D8CFAF', '#E6B89C', '#ED9390', '#F374AE', '#32533D'],
    };
    return palettes[paletteNumber] || palettes[1];
  };

  const selectedPalette = currentPalette || user?.preferences.theme || 1;
  const paletteColors = getPaletteColors(selectedPalette);

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Header */}
        <Header
          title="My Profile"
          showProfile={false}
        />

        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={[styles.card, { backgroundColor: 'white' }]}>
            <View style={styles.avatarSection}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.primary + '15' }]}>
                {avatarLoading ? (
                  <ActivityIndicator size="large" color={theme.primary} />
                ) : avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</Text>
                )}
              </View>
              <Text style={[styles.avatarLabel, { color: theme.accent }]}>
                Automatically generated avatar
              </Text>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: 'white' }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>👤 Personal Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.primary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: '#f8f9fa',
                    color: theme.primary,
                    borderColor: '#e0e0e0'
                  }
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ex: John Doe"
                placeholderTextColor={theme.accent}
                autoCapitalize="words"
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.primary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: '#f8f9fa',
                    color: theme.primary,
                    borderColor: '#e0e0e0'
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="ejemplo@email.com"
                placeholderTextColor={theme.accent}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.primary }]}>Age</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: '#f8f9fa',
                    color: theme.primary,
                    borderColor: '#e0e0e0'
                  }
                ]}
                value={childAge}
                onChangeText={setChildAge}
                placeholder="Enter age"
                placeholderTextColor={theme.accent}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />
            </View>
          </View>

          {/* Preferences Card */}
          <View style={[styles.card, { backgroundColor: 'white' }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>⚙️ Preferences</Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceIcon}>🌐</Text>
                <Text style={[styles.preferenceLabel, { color: theme.accent }]}>
                  Language
                </Text>
              </View>
              <Text style={[styles.preferenceValue, { color: theme.primary }]}>
                {user?.preferences.language === 'es' ? 'Spanish' : 'English'}
              </Text>
            </View>

            <View style={styles.preferenceDivider} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Text style={styles.preferenceIcon}>🎨</Text>
                <Text style={[styles.preferenceLabel, { color: theme.accent }]}>
                  Theme
                </Text>
              </View>
              <View style={styles.themePreview}>
                {paletteColors.map((color, index) => (
                  <View
                    key={index}
                    style={[styles.colorSwatch, { backgroundColor: color }]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.primary },
              isSaving && styles.disabledButton
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

