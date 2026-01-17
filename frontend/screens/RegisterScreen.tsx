import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerWithEmailAndPassword } = useUser();
  const { theme } = useTheme();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const handleRegister = async () => {
    // Validations
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (fullName.trim().length < 2) {
      showError('Name must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmailAndPassword(email.trim(), password, fullName.trim());
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      showError(error.message || 'Error registering user');
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header con gradiente visual */}
          <View style={[styles.headerContainer, {
            backgroundColor: theme.secondary,
            paddingTop: Math.max(insets.top + 20, Platform.OS === 'ios' ? 60 : 40)
          }]}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../assets/logo.jpeg')} 
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.screenTitle, { color: theme.primary }]}>Create Account</Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.primary }]}>Full Name</Text>
                <View style={[styles.inputWrapper, {
                  backgroundColor: theme.white,
                  borderColor: fullName ? theme.primary : theme.accent,
                  shadowColor: theme.primary
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.primary }]}
                    placeholder="John Doe"
                    placeholderTextColor={theme.accent}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.primary }]}>Email</Text>
                <View style={[styles.inputWrapper, {
                  backgroundColor: theme.white,
                  borderColor: email ? theme.primary : theme.accent,
                  shadowColor: theme.primary
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.primary }]}
                    placeholder="your@email.com"
                    placeholderTextColor={theme.accent}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.primary }]}>Password</Text>
                <View style={[styles.inputWrapper, {
                  backgroundColor: theme.white,
                  borderColor: password ? theme.primary : theme.accent,
                  shadowColor: theme.primary
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.primary }]}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor={theme.accent}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.primary }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, {
                  backgroundColor: theme.white,
                  borderColor: confirmPassword ? theme.primary : theme.accent,
                  shadowColor: theme.primary
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.primary }]}
                    placeholder="Repeat your password"
                    placeholderTextColor={theme.accent}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary
                  },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: theme.primary }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={goToLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.loginLink, { color: theme.primary }]}>
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 20,
  },
  appTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    opacity: 1,
    letterSpacing: 0.5,
  },
  formContainer: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    opacity: 0.7,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
