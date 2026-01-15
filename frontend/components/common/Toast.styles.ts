import { StyleSheet } from 'react-native';

/**
 * Styles for Toast notification component
 * Designed for accessibility with high contrast and minimum touch targets
 */
export const styles = StyleSheet.create({
    // Container positioned at top of screen with safe margins
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 10,
    },

    // Toast card with shadow for visibility
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 56, // Ensure minimum touch target
    },

    // Success variant - green theme
    success: {
        backgroundColor: '#10B981',
    },

    // Error variant - red theme
    error: {
        backgroundColor: '#EF4444',
    },

    // Warning variant - yellow/orange theme
    warning: {
        backgroundColor: '#F59E0B',
    },

    // Info variant - blue theme
    info: {
        backgroundColor: '#3B82F6',
    },

    // Icon container on the left
    iconContainer: {
        marginRight: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Icon text (emoji)
    icon: {
        fontSize: 20,
    },

    // Message text container - flex to take remaining space
    messageContainer: {
        flex: 1,
        marginRight: 8,
    },

    // Toast message text - high contrast white
    message: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 20,
    },

    // Dismiss button - minimum 44x44 touch target
    dismissButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -8, // Compensate for padding
    },

    // Dismiss icon
    dismissIcon: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
    },
});
