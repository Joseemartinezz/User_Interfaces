import React, { useCallback, useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { getInitials } from '../../utils';
import { getUserAvatarUrl } from '../../api';
import { styles } from './ProfileButton.styles';

/**
 * Botón de perfil circular que aparece en el header
 * Navega al menú de padres con opciones de configuración
 * Muestra avatar generado con DiceBear o iniciales como fallback
 * Optimizado con useCallback para mejor rendimiento
 */
const ProfileButton: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  // Generar avatar cuando cambia el usuario
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setShowFallback(true);
      return;
    }

    let isMounted = true;

    const loadAvatar = async () => {
      try {
        setIsLoading(true);
        setShowFallback(false);
        
        const url = await getUserAvatarUrl(user);
        
        if (isMounted) {
          if (url) {
            setAvatarUrl(url);
            setShowFallback(false);
          } else {
            setShowFallback(true);
          }
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
        if (isMounted) {
          setShowFallback(true);
          setAvatarUrl(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAvatar();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email, user?.fullName]);

  const handlePress = useCallback(() => {
    navigation.navigate('ParentMenu' as never);
  }, [navigation]);

  // Obtener iniciales para el fallback
  const initials = getInitials(user?.fullName || '', user?.email || '');

  return (
    <TouchableOpacity
      style={[styles.profileButton, { backgroundColor: 'white' }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : showFallback || !avatarUrl ? (
          <Text style={styles.avatarText}>{initials}</Text>
        ) : (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImage}
            onError={() => {
              setShowFallback(true);
              setAvatarUrl(null);
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(ProfileButton);

