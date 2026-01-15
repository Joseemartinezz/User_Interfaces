import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Header from '../components/common/Header';
import ConfirmModal from '../components/common/ConfirmModal';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { styles } from './ParentMenuScreen.styles';

// Password Modal Component - separated to prevent re-renders and screen flickering
interface PasswordModalProps {
  visible: boolean;
  passwordInput: string;
  onPasswordChange: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
  isLockedOut?: boolean;
  lockoutRemaining?: number;
}

const PasswordModal: React.FC<PasswordModalProps> = React.memo(({
  visible,
  passwordInput,
  onPasswordChange,
  onSubmit,
  onCancel,
  errorMessage,
  isLockedOut = false,
  lockoutRemaining = 0,
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
          <Text style={[styles.modalTitle, { color: theme.primary }]}>
            🔐 Parent Menu
          </Text>
          <Text style={[styles.modalDescription, { color: theme.text }]}>
            Enter the password to access the configuration menu:
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                borderColor: errorMessage ? '#EF4444' : theme.primary,
                color: theme.text
              }
            ]}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={passwordInput}
            onChangeText={onPasswordChange}
            secureTextEntry
            autoFocus
            onSubmitEditing={onSubmit}
            editable={!isLockedOut}
          />

          {/* Inline error message with lockout countdown */}
          {errorMessage && (
            <View style={{
              backgroundColor: '#FEE2E2',
              padding: 12,
              borderRadius: 8,
              marginTop: 8,
              marginBottom: 8,
              borderColor: '#EF4444',
              borderWidth: 1
            }}>
              <Text style={{ color: '#DC2626', fontSize: 14, textAlign: 'center' }}>
                ⚠️ {errorMessage}
                {isLockedOut && lockoutRemaining > 0 && (
                  `\n\n⏱ Time remaining: ${lockoutRemaining}s`
                )}
              </Text>
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { borderColor: theme.textSecondary }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalConfirmButton,
                {
                  backgroundColor: isLockedOut ? '#9CA3AF' : theme.primary,
                  opacity: isLockedOut ? 0.5 : 1
                }
              ]}
              onPress={onSubmit}
              activeOpacity={0.7}
              disabled={isLockedOut}
            >
              <Text style={[styles.modalButtonText, { color: theme.white }]}>
                {isLockedOut ? 'Locked' : 'Enter'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/**
 * Parent/tutor menu screen
 * Contains all configuration and preference options
 * that children should not modify
 * Optimized with useCallback for better performance
 * Protected with 4-digit password
 */
const ParentMenuScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, logout } = useUser();
  const { showError, showSuccess } = useToast();

  // State for password protection
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ============================================================================
  // LOCKOUT MECHANISM: Prevent brute force password guessing
  // ============================================================================
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30000; // 30 seconds
  const STORAGE_KEY_LOCKOUT_END = '@aac_lockout_end';
  const STORAGE_KEY_FAILED_ATTEMPTS = '@aac_failed_attempts';

  // Load lockout state on mount
  useEffect(() => {
    const loadLockoutState = async () => {
      try {
        const [savedLockoutEnd, savedFailedAttempts] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_LOCKOUT_END),
          AsyncStorage.getItem(STORAGE_KEY_FAILED_ATTEMPTS)
        ]);

        if (savedFailedAttempts) {
          setFailedAttempts(parseInt(savedFailedAttempts, 10));
        }

        if (savedLockoutEnd) {
          const endTime = parseInt(savedLockoutEnd, 10);
          if (endTime > Date.now()) {
            setIsLockedOut(true);
            setLockoutEndTime(endTime);
            setLockoutRemaining(Math.ceil((endTime - Date.now()) / 1000));
            setPasswordError(`Too many failed attempts. Please wait ${Math.ceil((endTime - Date.now()) / 1000)} seconds.`);
          } else {
            // Lockout expired while away
            await AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT_END);
          }
        }
      } catch (error) {
        console.error('Error loading lockout state:', error);
      }
    };

    loadLockoutState();
  }, []);

  // Persist failed attempts
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY_FAILED_ATTEMPTS, failedAttempts.toString())
      .catch(err => console.error('Error saving failed attempts:', err));
  }, [failedAttempts]);

  // Persist lockout end time
  useEffect(() => {
    if (lockoutEndTime) {
      AsyncStorage.setItem(STORAGE_KEY_LOCKOUT_END, lockoutEndTime.toString())
        .catch(err => console.error('Error saving lockout end time:', err));
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT_END)
        .catch(err => console.error('Error removing lockout end time:', err));
    }
  }, [lockoutEndTime]);

  // Password error for inline display
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Update lockout countdown timer
  useEffect(() => {
    if (isLockedOut && lockoutEndTime) {
      lockoutTimerRef.current = setInterval(() => {
        const remaining = Math.max(0, lockoutEndTime - Date.now());
        setLockoutRemaining(Math.ceil(remaining / 1000));

        if (remaining <= 0) {
          setIsLockedOut(false);
          setLockoutEndTime(null);
          setFailedAttempts(0);
          setPasswordError(null);
          if (lockoutTimerRef.current) {
            clearInterval(lockoutTimerRef.current);
          }
        }
      }, 1000);

      return () => {
        if (lockoutTimerRef.current) {
          clearInterval(lockoutTimerRef.current);
        }
      };
    }
  }, [isLockedOut, lockoutEndTime]);

  // Check if password is configured
  useEffect(() => {
    if (user?.preferences?.parentMenuPassword) {
      setShowPasswordModal(true);
      setIsLoading(false);
    } else {
      // No password configured, allow direct access
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [user]);

  // Verify password with lockout protection
  const handlePasswordSubmit = useCallback(() => {
    // Check lockout status
    if (isLockedOut) {
      return;
    }

    // Clear previous error
    setPasswordError(null);

    const savedPassword = user?.preferences?.parentMenuPassword;

    if (!savedPassword) {
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      return;
    }

    if (passwordInput === savedPassword) {
      // Correct password - reset attempts and authenticate
      setIsAuthenticated(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setFailedAttempts(0);
    } else {
      // Incorrect password - increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPasswordInput('');

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Trigger lockout
        setIsLockedOut(true);
        const endTime = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutEndTime(endTime);
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setPasswordError(`Too many failed attempts. Please wait ${Math.ceil(LOCKOUT_DURATION_MS / 1000)} seconds.`);
      } else {
        const remainingAttempts = MAX_FAILED_ATTEMPTS - newAttempts;
        setPasswordError(`Incorrect password. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`);
      }
    }
  }, [passwordInput, user, failedAttempts, isLockedOut]);

  // Cancel and go back
  const handleCancel = useCallback(() => {
    setPasswordInput('');
    setShowPasswordModal(false);
    navigation.goBack();
  }, [navigation]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings' as never);
  }, [navigation]);

  const handleProfile = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Profile',
        params: {},
      })
    );
  }, [navigation]);


  const handleLogout = useCallback(() => {
    // Show custom confirm modal instead of Alert.alert
    setShowLogoutModal(true);
  }, []);

  // Perform the actual logout
  const performLogout = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await logout();
    } catch (error: any) {
      showError(error.message || 'Error signing out');
    }
  }, [logout, showError]);

  // Navigate to categories
  const handleCategories = useCallback(() => {
    (navigation as any).navigate('Categories', {
      selectedColor: theme.primary
    });
  }, [navigation, theme.primary]);

  // Show loading while verifying
  if (isLoading) {
    return (
      <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Don't show content until authenticated
  // Use transparent background so PCS screen is visible behind the modal
  if (!isAuthenticated) {
    return (
      <View style={[styles.rootWrapper, { backgroundColor: 'transparent' }]}>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <PasswordModal
            visible={showPasswordModal}
            passwordInput={passwordInput}
            onPasswordChange={(text) => {
              setPasswordInput(text);
              setPasswordError(null); // Clear error on type
            }}
            onSubmit={handlePasswordSubmit}
            onCancel={handleCancel}
            errorMessage={passwordError}
            isLockedOut={isLockedOut}
            lockoutRemaining={lockoutRemaining}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.rootWrapper, { backgroundColor: theme.background }]}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar style="auto" />

        {/* Header */}
        <Header
          title="Parent Menu"
          showProfile={false}
        />

        {/* Main content */}
        <ScrollView
          style={[styles.content, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Configuration Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Configuration</Text>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.primary }]}
              onPress={handleProfile}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>👤</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    User Profile
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Edit name, email...
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.primary }]}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>🎨</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    Theme Settings
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Change colors and appearance
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Content Management Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Content </Text>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: theme.secondary, marginTop: 0 }]}
              onPress={handleCategories}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>📂</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: theme.primary }]}>
                    Categories
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: theme.primary }]}>
                    Manage categories and symbols
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: theme.primary }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Session Management Section */}
          <View style={[styles.section, { backgroundColor: theme.white }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Session </Text>

            <TouchableOpacity
              style={[styles.menuButton, { borderColor: '#e74c3c' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuButtonContent}>
                <Text style={styles.menuIcon}>🚪</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuButtonText, { color: '#e74c3c' }]}>
                    Sign Out
                  </Text>
                  <Text style={[styles.menuButtonSubtext, { color: '#e74c3c' }]}>
                    Sign out of your account
                  </Text>
                </View>
                <Text style={[styles.menuArrow, { color: '#e74c3c' }]}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* App Information */}
          <View style={[styles.infoBox, { backgroundColor: theme.secondary, borderColor: theme.accent }]}>
            <Text style={[styles.infoTitle, { color: theme.primary }]}>ℹ️ App Information</Text>
            <Text style={[styles.infoText, { color: theme.primary }]}>
              WizzWords{'\n'}
              AAC App - LLM powered{'\n'}
              Polimi - Advanced User Interfaces{'\n'}
              Version 0.3.0
            </Text>
          </View>
        </ScrollView>

        {/* Logout Confirmation Modal - replaces Alert.alert */}
        <ConfirmModal
          visible={showLogoutModal}
          title="Sign Out"
          message="Are you sure you want to sign out?"
          icon="🚪"
          buttons={[
            { text: 'Cancel', onPress: () => setShowLogoutModal(false), style: 'cancel' },
            { text: 'Sign Out', onPress: performLogout, style: 'destructive' },
          ]}
          onDismiss={() => setShowLogoutModal(false)}
        />
      </SafeAreaView>
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(ParentMenuScreen);

