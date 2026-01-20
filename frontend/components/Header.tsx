import React, { useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from './BackButton';
import ProfileButton from './ProfileButton';
import { useTheme } from '../context/ThemeContext';
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
 * Extends to the top edge of the screen (behind the notch/Dynamic Island)
 * The background color covers the entire top area including the status bar
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

  // Container style that extends to the very top of the screen
  const containerStyle = useMemo(
    () => ({
      backgroundColor: headerBackgroundColor,
    }),
    [headerBackgroundColor]
  );

  // Content area with proper padding below the safe area
  const headerStyle = useMemo(
    () => [
      styles.header,
      {
        paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24),
      },
    ],
    [insets.top]
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
    <View style={containerStyle}>
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
    </View>
  );
};

// Memoize component to avoid unnecessary re-renders
export default React.memo(Header);
