import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import ProfileButton from './ProfileButton';
import { useTheme } from '../../context/ThemeContext';
import { styles } from './Header.styles';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  showProfile?: boolean;
  showBackButton?: boolean;
  titleSize?: 'small' | 'medium' | 'large';
}

/**
 * Unified header for all screens
 * Allows customizing title, subtitle, background color and showing/hiding buttons
 * Optimized with React.memo and useMemo
 */
const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  backgroundColor,
  showProfile = true,
  showBackButton = true,
  titleSize,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  // Use theme primary color if backgroundColor is not specified
  const headerBackgroundColor = backgroundColor || theme.primary;

  // Memoize dynamic styles
  const headerStyle = useMemo(
    () => [
      styles.header,
      {
        backgroundColor: headerBackgroundColor,
        paddingTop: Math.max(insets.top, 12),
      },
    ],
    [headerBackgroundColor, insets.top]
  );

  const contentStyle = useMemo(
    () => [
      styles.headerContent,
      { marginLeft: showBackButton ? 16 : 0 },
      !showBackButton && styles.headerContentCentered,
    ],
    [showBackButton]
  );

  const titleStyle = useMemo(
    () => [
      styles.headerTitle,
      showBackButton && !titleSize && styles.headerTitleSmall,
      titleSize === 'medium' && styles.headerTitleMedium,
      titleSize === 'small' && styles.headerTitleSmall,
    ],
    [showBackButton, titleSize]
  );

  const subtitleStyle = useMemo(
    () => [
      styles.headerSubtitle,
      showBackButton && styles.headerSubtitleSmall,
    ],
    [showBackButton]
  );

  return (
    <View style={headerStyle}>
      {showBackButton && <BackButton />}
      {!showBackButton && <View style={styles.placeholder} />}
      <View style={contentStyle}>
        <Text style={titleStyle}>{title}</Text>
        {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
      </View>
      {showProfile && (
        <View style={styles.profileContainer}>
          <ProfileButton />
        </View>
      )}
      {!showProfile && <View style={styles.placeholder} />}
    </View>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(Header);
