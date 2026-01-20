import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    AccessibilityInfo,
} from 'react-native';
import { styles } from './Toast.styles';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Props for the Toast component
 */
export interface ToastProps {
    /** Whether the toast is visible */
    visible: boolean;
    /** Toast message to display */
    message: string;
    /** Type of toast (affects styling) */
    type?: ToastType;
    /** Duration in ms before auto-dismiss (0 = no auto-dismiss) */
    duration?: number;
    /** Callback when toast is dismissed */
    onDismiss: () => void;
}

/**
 * Get icon emoji based on toast type
 */
const getIcon = (type: ToastType): string => {
    switch (type) {
        case 'success':
            return '✓';
        case 'error':
            return '✕';
        case 'warning':
            return '⚠';
        case 'info':
        default:
            return 'ℹ';
    }
};

/**
 * Toast notification component
 * 
 * Displays a temporary notification message at the top of the screen.
 * Designed for accessibility with:
 * - High contrast colors
 * - Minimum 44x44 touch targets
 * - Screen reader announcements
 * - Auto-dismiss with manual dismiss option
 * 
 * @example
 * <Toast
 *   visible={showToast}
 *   message="Settings saved successfully!"
 *   type="success"
 *   duration={3000}
 *   onDismiss={() => setShowToast(false)}
 * />
 */
const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onDismiss,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();

            // Announce to screen readers for accessibility
            AccessibilityInfo.announceForAccessibility(message);

            // Auto-dismiss after duration (if duration > 0)
            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleDismiss();
                }, duration);
                return () => clearTimeout(timer);
            }
        }
    }, [visible, message, duration]);

    const handleDismiss = () => {
        // Animate out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss();
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }],
                },
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
        >
            <View style={[styles.toast, styles[type]]}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{getIcon(type)}</Text>
                </View>
                <View style={styles.messageContainer}>
                    <Text style={styles.message} numberOfLines={3}>
                        {message}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={handleDismiss}
                    accessibilityLabel="Dismiss notification"
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.dismissIcon}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

export default React.memo(Toast);
