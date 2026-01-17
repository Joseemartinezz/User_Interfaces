import React, { useCallback } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './BackButton.styles';

/**
 * Reusable back button with styled arrow
 * Navigates to previous screen using navigation.goBack()
 * Optimized with useCallback for better performance
 */
const BackButton: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handlePress = useCallback(() => {
    if (navigation.canGoBack()) {
      // Use goBack() - simple and efficient for backward navigation
      navigation.goBack();
    }
  }, [navigation]);

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image
        source={require('../../assets/WhiteBackArrow.png')}
        style={styles.arrow}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(BackButton);
