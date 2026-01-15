import { StyleSheet } from 'react-native';

/**
 * Styles for ConfirmModal component
 * Designed for accessibility with high contrast and minimum 48x48 touch targets
 */
export const styles = StyleSheet.create({
    // Full screen overlay with semi-transparent background
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    // Modal container card
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },

    // Icon container at top
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },

    // Icon emoji
    icon: {
        fontSize: 48,
    },

    // Title text
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },

    // Message/description text
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },

    // Buttons container
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },

    // Single button container (for OK-only modals)
    singleButtonContainer: {
        justifyContent: 'center',
    },

    // Base button style - minimum 48px height for accessibility
    button: {
        flex: 1,
        minHeight: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    // Full width button (for single button variant)
    buttonFull: {
        flex: 1,
        maxWidth: '100%',
    },

    // Cancel button style
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },

    // Confirm/primary button style
    confirmButton: {
        // backgroundColor set dynamically via theme
    },

    // Destructive action button (delete, logout, etc.)
    destructiveButton: {
        backgroundColor: '#EF4444',
    },

    // Button text base style
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Cancel button text
    cancelButtonText: {
        // color set dynamically via theme
    },

    // Confirm button text (white for contrast)
    confirmButtonText: {
        color: '#FFFFFF',
    },
});
