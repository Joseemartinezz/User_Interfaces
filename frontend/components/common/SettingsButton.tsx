import React, { useCallback } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './SettingsButton.styles';

/**
 * Reusable settings button that appears on all screens
 * Navigates to settings screen
 * Optimized with useCallback for better performance
 */
const SettingsButton: React.FC = () => {
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate('Settings' as never);
  }, [navigation]);

  return (
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={require('../../assets/gear.png')}
        style={styles.settingsIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(SettingsButton);
