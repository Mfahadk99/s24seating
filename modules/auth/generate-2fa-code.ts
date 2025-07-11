/**
 * Generate a random 4-digit two-factor authentication (2FA) code.
 * @returns {string} A 4-digit 2FA code.
 */

export function generate2faCode() {
  // Generate a random pattern for the 4-digit number
  const pattern = Math.floor(Math.random() * 3); // Random number between 0 and 2

  switch (pattern) {
    case 0:
      // Pattern: All four digits are the same (e.g., 1111)
      const digit = Math.floor(Math.random() * 10); // Random digit between 0 and 9
      return `${digit}${digit}${digit}${digit}`;
    case 1:
      // Pattern: Two pairs of identical digits (e.g., 1122)
      const pair1 = Math.floor(Math.random() * 10); // Random digit for the first pair
      let pair2 = pair1;
      while (pair2 === pair1) {
        pair2 = Math.floor(Math.random() * 10); // Random digit for the second pair (different from the first)
      }
      return `${pair1}${pair1}${pair2}${pair2}`;
    case 2:
      // Pattern: Random 4-digit number
      return String(Math.floor(1000 + Math.random() * 9000)); // Random number between 1000 and 9999
    default:
      return '1020'; // Default to 1020 if an invalid pattern is generated
  }
}
