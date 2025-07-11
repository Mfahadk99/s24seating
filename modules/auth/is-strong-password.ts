/**
 * Check if a password is strong.
 *
 * A strong password must have a minimum length of 8 characters
 * and contain at least one uppercase letter, one lowercase letter,
 * one number, and one special symbol.
 *
 * @param {string} password - The password to check.
 * @returns {boolean} True if the password is strong, false otherwise.
 */
export function isStrongPassword(password: string): boolean {
  const hasMinimumLength: boolean = password.length >= 8;
  const hasUppercase: boolean = /[A-Z]/.test(password);
  const hasLowercase: boolean = /[a-z]/.test(password);
  const hasNumber: boolean = /[0-9]/.test(password);
  const hasSpecialSymbol: boolean = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]/.test(password);

  return hasMinimumLength && hasUppercase && hasLowercase && hasNumber && hasSpecialSymbol;
}
