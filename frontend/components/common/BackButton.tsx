import React, { useCallback } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './BackButton.styles';

/**
 * Botón de atrás reutilizable con flecha estilizada
 * Navega a la pantalla anterior usando navigation.goBack()
 * Optimizado con useCallback para mejor rendimiento
 */
const BackButton: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handlePress = useCallback(() => {
    if (navigation.canGoBack()) {
      // Usar goBack() - simple y eficiente para navegación hacia atrás
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

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(BackButton);
