/**
 * Utility functions for the frontend
 */

/**
 * Extracts the initial letter(s) from a name for fallback display
 * @param fullName - User full name
 * @param email - User email (fallback if no name)
 * @returns Initial letter(s) for avatar fallback
 */
export const getInitials = (fullName: string, email: string): string => {
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(/\s+/);
    if (names.length >= 2) {
      // First letter of first name + first letter of last name
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1) {
      // First letter of the name
      return names[0][0].toUpperCase();
    }
  }
  
  // Fallback to email initial
  if (email && email.trim()) {
    return email.trim()[0].toUpperCase();
  }
  
  // Ultimate fallback
  return '?';
};

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates user name (at least 2 characters, only letters and spaces)
 * @param name - Name to validate
 * @returns True if name is valid
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  return nameRegex.test(name);
};

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

