import React, { useCallback } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './SettingsButton.styles';

/**
 * Botón de ajustes reutilizable que aparece en todas las pantallas
 * Navega a la pantalla de configuración
 * Optimizado con useCallback para mejor rendimiento
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

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(SettingsButton);
