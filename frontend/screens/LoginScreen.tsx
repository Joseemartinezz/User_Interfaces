import React, { useState, useEffect, useRef } from 'react';
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
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { loginWithGoogleWeb, loginWithGoogleNative } from '../services/authService';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Complete Google authentication flow
WebBrowser.maybeCompleteAuthSession();

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { loginWithEmailAndPassword } = useUser();
  const { theme } = useTheme();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configurar Google Auth para React Native
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manejar la respuesta de Google Auth
  useEffect(() => {
    if (!response) return;

    // Limpiar timeout cuando recibimos una respuesta
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (response.type === 'success' && response.params?.id_token) {
      handleGoogleResponse(response.params.id_token);
    } else if (response.type === 'error') {
      setIsGoogleLoading(false);
      const errorMessage = response.error?.message || 'Error al autenticar con Google';
      Alert.alert('Error', errorMessage);
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      // Usuario canceló o cerró el diálogo
      setIsGoogleLoading(false);
    } else {
      // Cualquier otro tipo de respuesta no esperada
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken: string) => {
    try {
      setIsGoogleLoading(true);
      const firebaseUser = await loginWithGoogleNative(idToken);
      // If user is new, create document in Firestore
      const { createUserDocument } = await import('../services/firestoreService');
      await createUserDocument(
        firebaseUser.uid,
        firebaseUser.email || '',
        firebaseUser.displayName || 'User'
      );
      // Navigation will be handled automatically by AuthContext
    } catch (error: any) {
      console.error('Error en handleGoogleResponse:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmailAndPassword(email.trim(), password);
      // La navegación se manejará automáticamente por el AuthContext
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error signing in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web') {
      // On web, use signInWithPopup
      setIsGoogleLoading(true);
      try {
        const firebaseUser = await loginWithGoogleWeb();
        // Si el usuario es nuevo, crear documento en Firestore
        const { createUserDocument } = await import('../services/firestoreService');
        await createUserDocument(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || 'Usuario'
        );
        // La navegación se manejará automáticamente por el AuthContext
      } catch (error: any) {
        console.error('Error en loginWithGoogleWeb:', error);
        Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
      } finally {
        setIsGoogleLoading(false);
      }
    } else {
      // On React Native, use expo-auth-session
      if (!webClientId) {
        Alert.alert(
          'Configuration Required',
          'Google Web Client ID not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file'
        );
        return;
      }
      
      // Verificar si ya hay una solicitud en curso
      if (isGoogleLoading) {
        return;
      }

      setIsGoogleLoading(true);
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Timeout de seguridad para evitar que se quede cargando indefinidamente
      timeoutRef.current = setTimeout(() => {
        setIsGoogleLoading(false);
        timeoutRef.current = null;
        Alert.alert('Tiempo de espera agotado', 'La autenticación con Google está tardando demasiado. Por favor, intenta de nuevo.');
      }, 30000); // 30 segundos

      try {
        // promptAsync() no retorna un resultado directamente,
        // sino que actualiza el estado 'response' que se maneja en useEffect
        await promptAsync();
        // La respuesta se manejará en el useEffect cuando 'response' cambie
      } catch (error: any) {
        // Limpiar timeout si hay un error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsGoogleLoading(false);
        console.error('Error en promptAsync:', error);
        Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
      }
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header con gradiente visual */}
          <View style={[styles.headerContainer, { backgroundColor: theme.secondary }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.primary }]}>Welcome</Text>
              <Text style={[styles.subtitle, { color: theme.primary }]}>
                Sign in to continue
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
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
                    placeholder="tu@email.com"
                    placeholderTextColor={theme.accent}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && !isGoogleLoading}
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
                    editable={!isLoading && !isGoogleLoading}
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
                  (isLoading || isGoogleLoading) && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={isLoading || isGoogleLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.accent }]} />
                <Text style={[styles.dividerText, { color: theme.primary }]}>o</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.accent }]} />
              </View>

              {/* Google Button - Siempre visible */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  { 
                    backgroundColor: theme.white,
                    borderColor: theme.accent,
                    shadowColor: theme.accent
                  },
                  (isLoading || isGoogleLoading) && styles.buttonDisabled
                ]}
                onPress={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                activeOpacity={0.8}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <Text style={[styles.googleButtonText, { color: theme.primary }]}>
                    Continue with Google
                  </Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, { color: theme.primary }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity
                  onPress={goToRegister}
                  disabled={isLoading || isGoogleLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.registerLink, { color: theme.primary }]}>
                    Sign up here
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
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
    marginBottom: 24,
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
    marginTop: 24,
    marginBottom: 20,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 20,
  },
  registerText: {
    fontSize: 15,
    opacity: 0.7,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
