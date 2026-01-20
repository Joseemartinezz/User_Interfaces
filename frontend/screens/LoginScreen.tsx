import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { styles } from './LoginScreen.styles';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithEmailAndPassword } = useUser();
  const { theme } = useTheme();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmailAndPassword(email.trim(), password);
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      showError(error.message || 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background }]}
        style={{ backgroundColor: theme.background }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Header with visual gradient */}
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
              <Text style={[styles.screenTitle, { color: theme.primary }]}>Welcome</Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: theme.background }]}>
            <View style={styles.form}>
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
                    placeholder="••••••••"
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

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    shadowColor: theme.primary
                  },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: theme.primary }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={goToRegister}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.registerLink, { color: theme.primary }]}>
                    Sign up
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
