import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { styles } from './ConfirmModal.styles';

/**
 * Button configuration for ConfirmModal
 */
export interface ConfirmModalButton {
    /** Button label text */
    text: string;
    /** Callback when button is pressed */
    onPress: () => void;
    /** Button style variant */
    style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Props for the ConfirmModal component
 */
export interface ConfirmModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Modal title */
    title: string;
    /** Modal message/description */
    message: string;
    /** Optional icon emoji to display at top */
    icon?: string;
    /** Action buttons */
    buttons: ConfirmModalButton[];
    /** Callback when modal is dismissed (backdrop press) */
    onDismiss?: () => void;
}

/**
 * ConfirmModal component
 * 
 * Custom modal for confirmation dialogs, replacing OS-level Alert.alert().
 * Designed for accessibility with:
 * - Minimum 48x48 touch targets
 * - High contrast colors
 * - Clear visual hierarchy
 * - Support for cancel, confirm, and destructive actions
 * 
 * @example
 * <ConfirmModal
 *   visible={showModal}
 *   title="Sign Out"
 *   message="Are you sure you want to sign out?"
 *   icon="🚪"
 *   buttons={[
 *     { text: 'Cancel', onPress: () => setShowModal(false), style: 'cancel' },
 *     { text: 'Sign Out', onPress: handleSignOut, style: 'destructive' },
 *   ]}
 *   onDismiss={() => setShowModal(false)}
 * />
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    title,
    message,
    icon,
    buttons,
    onDismiss,
}) => {
    const { theme } = useTheme();

    // Get button styling based on style variant
    const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
        switch (style) {
            case 'cancel':
                return [styles.button, styles.cancelButton, { borderColor: theme.textSecondary }];
            case 'destructive':
                return [styles.button, styles.destructiveButton];
            default:
                return [styles.button, styles.confirmButton, { backgroundColor: theme.primary }];
        }
    };

    // Get button text styling based on style variant
    const getButtonTextStyle = (style?: 'default' | 'cancel' | 'destructive') => {
        switch (style) {
            case 'cancel':
                return [styles.buttonText, styles.cancelButtonText, { color: theme.textSecondary }];
            case 'destructive':
            default:
                return [styles.buttonText, styles.confirmButtonText];
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={onDismiss}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={[styles.container, { backgroundColor: theme.white }]}>
                            {/* Icon */}
                            {icon && (
                                <View style={styles.iconContainer}>
                                    <Text style={styles.icon}>{icon}</Text>
                                </View>
                            )}

                            {/* Title */}
                            <Text style={[styles.title, { color: theme.primary }]}>
                                {title}
                            </Text>

                            {/* Message */}
                            <Text style={[styles.message, { color: theme.text }]}>
                                {message}
                            </Text>

                            {/* Buttons */}
                            <View
                                style={[
                                    styles.buttonsContainer,
                                    buttons.length === 1 && styles.singleButtonContainer,
                                ]}
                            >
                                {buttons.map((button, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            getButtonStyle(button.style),
                                            buttons.length === 1 && styles.buttonFull,
                                        ]}
                                        onPress={button.onPress}
                                        activeOpacity={0.7}
                                        accessibilityRole="button"
                                        accessibilityLabel={button.text}
                                    >
                                        <Text style={getButtonTextStyle(button.style)}>
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default React.memo(ConfirmModal);
