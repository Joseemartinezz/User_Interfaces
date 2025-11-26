/**
 * Utilidades simples del frontend (solo UI, sin lógica de negocio)
 */

/**
 * Extracts the initial letter(s) from a name for fallback display
 * @param fullName User full name
 * @param email User email (fallback if no name)
 * @returns Initial letter(s) for avatar fallback
 */
export function getInitials(fullName?: string, email?: string): string {
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
}

