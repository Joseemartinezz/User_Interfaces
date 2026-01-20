import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

/**
 * Toast message configuration
 */
interface ToastMessage {
    /** Unique ID for the toast */
    id: string;
    /** Message to display */
    message: string;
    /** Toast type (affects styling) */
    type: ToastType;
    /** Duration in ms before auto-dismiss */
    duration: number;
}

/**
 * Toast context type
 */
interface ToastContextType {
    /** Show a toast notification */
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    /** Show a success toast */
    showSuccess: (message: string, duration?: number) => void;
    /** Show an error toast */
    showError: (message: string, duration?: number) => void;
    /** Show a warning toast */
    showWarning: (message: string, duration?: number) => void;
    /** Show an info toast */
    showInfo: (message: string, duration?: number) => void;
    /** Hide the current toast */
    hideToast: () => void;
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Props for ToastProvider
 */
interface ToastProviderProps {
    children: ReactNode;
}

/**
 * ToastProvider component
 * 
 * Provides global toast notification functionality throughout the app.
 * Wrap your app with this provider to enable toast notifications anywhere.
 * 
 * @example
 * // In App.tsx
 * <ToastProvider>
 *   <YourApp />
 * </ToastProvider>
 * 
 * // In any component
 * const { showSuccess, showError } = useToast();
 * 
 * const handleSave = async () => {
 *   try {
 *     await saveData();
 *     showSuccess('Data saved successfully!');
 *   } catch (error) {
 *     showError('Failed to save data');
 *   }
 * };
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<ToastMessage | null>(null);

    // Generate unique ID for each toast
    const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Show a toast notification
    const showToast = useCallback((
        message: string,
        type: ToastType = 'info',
        duration: number = 3000
    ) => {
        setToast({
            id: generateId(),
            message,
            type,
            duration,
        });
    }, []);

    // Convenience methods for different toast types
    const showSuccess = useCallback((message: string, duration?: number) => {
        showToast(message, 'success', duration);
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        showToast(message, 'error', duration || 4000); // Errors stay longer
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showToast(message, 'warning', duration);
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showToast(message, 'info', duration);
    }, [showToast]);

    // Hide the current toast
    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider
            value={{
                showToast,
                showSuccess,
                showError,
                showWarning,
                showInfo,
                hideToast,
            }}
        >
            {children}
            {/* Render toast at app level so it appears above all content */}
            <Toast
                visible={toast !== null}
                message={toast?.message || ''}
                type={toast?.type || 'info'}
                duration={toast?.duration || 3000}
                onDismiss={hideToast}
            />
        </ToastContext.Provider>
    );
};

/**
 * Hook to use toast notifications
 * 
 * @example
 * const { showSuccess, showError } = useToast();
 * 
 * showSuccess('Profile updated!');
 * showError('Failed to save changes');
 */
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
