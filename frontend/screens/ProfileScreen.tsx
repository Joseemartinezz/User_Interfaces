import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { getUserAvatarUrl } from '../api';
import { getInitials, isValidEmail, isValidName } from '../utils';
import BackButton from '../components/common/BackButton';
import { RootStackParamList } from '../types/navigation';
import { styles } from './ProfileScreen.styles';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

/**
 * User profile screen
 * Allows editing name, email and user settings
 */
export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme } = useTheme();
  const { user, updateUser, resetUser, isLoading: userLoading } = useUser();

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Load avatar when user changes
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      loadAvatar();
    }
  }, [user?.id, user?.email, user?.fullName]);

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
      Alert.alert('Error', 'Name is required');
      return false;
    }

    if (!isValidName(fullName)) {
      Alert.alert('Error', 'Name must be at least 2 characters and contain only letters');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Email is not valid');
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
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  }, [fullName, email, updateUser]);

  /**
   * Resets profile to default values
   */
  const handleReset = useCallback(() => {
    Alert.alert(
      'Confirm Reset',
      'Are you sure you want to reset your profile to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              await resetUser();
              Alert.alert('Success', 'Profile reset successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error resetting profile');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }, [resetUser]);

  /**
   * Goes back to previous screen
   */
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (userLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = getInitials(fullName, email);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { backgroundColor: 'white' }]}>
            {avatarLoading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Text style={[styles.avatarLabel, { color: theme.textSecondary }]}>
            Automatically generated avatar
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre completo */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: 'white',
                  color: theme.text,
                  borderColor: theme.border || '#ddd'
                }
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: John Doe"
              placeholderTextColor={theme.textSecondary || '#999'}
              autoCapitalize="words"
              editable={!isSaving}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: 'white',
                  color: theme.text,
                  borderColor: theme.border || '#ddd'
                }
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@email.com"
              placeholderTextColor={theme.textSecondary || '#999'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSaving}
            />
          </View>

          {/* Preferencias (solo lectura por ahora) */}
          <View style={styles.preferencesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
            
            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.textSecondary }]}>
                Language
              </Text>
              <Text style={[styles.preferenceValue, { color: theme.text }]}>
                {user?.preferences.language === 'es' ? 'Spanish' : 'English'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.textSecondary }]}>
                Theme
              </Text>
              <Text style={[styles.preferenceValue, { color: theme.text }]}>
                Palette {user?.preferences.theme || 1}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.textSecondary }]}>
                Font Size
              </Text>
              <Text style={[styles.preferenceValue, { color: theme.text }]}>
                {user?.preferences.fontSize === 'medium' ? 'Medium' : user?.preferences.fontSize}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Text style={[styles.preferenceLabel, { color: theme.textSecondary }]}>
                Voice Speed
              </Text>
              <Text style={[styles.preferenceValue, { color: theme.text }]}>
                {user?.preferences.voiceSpeed || 1.0}x
              </Text>
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
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

            <TouchableOpacity
              style={[
                styles.resetButton,
                { borderColor: theme.error || '#dc3545' },
                isSaving && styles.disabledButton
              ]}
              onPress={handleReset}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetButtonText, { color: theme.error || '#dc3545' }]}>
                Reset Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

