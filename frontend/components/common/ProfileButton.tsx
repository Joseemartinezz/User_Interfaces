import React, { useCallback, useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { getInitials } from '../../utils';
import { getUserAvatarUrl } from '../../api';
import { styles } from './ProfileButton.styles';

/**
 * Circular profile button that appears in the header
 * Navigates to parent menu with configuration options
 * Shows avatar generated with DiceBear or initials as fallback
 * Optimized with useCallback for better performance
 */
const ProfileButton: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  // Generate avatar when user changes
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

  // Get initials for fallback
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

// Memoize component to avoid unnecessary re-renders
export default React.memo(ProfileButton);

