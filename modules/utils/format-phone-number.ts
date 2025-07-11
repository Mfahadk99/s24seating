export function formatPhoneNumber(providedNumber) {
  // Remove all non-numeric characters except '+'
  let cleanedNumber = providedNumber.replace(/[^\d+]/g, "");

  // If number already starts with "+1" and has 11 digits, return as is
  if (/^\+1\d{10}$/.test(cleanedNumber)) {
    return cleanedNumber;
  }

  // If number starts with "1" but missing "+", add "+"
  if (/^1\d{10}$/.test(cleanedNumber)) {
    return `+${cleanedNumber}`;
  }

  // If number has exactly 10 digits, assume it's missing "1" and prepend "+1"
  if (/^\d{10}$/.test(cleanedNumber)) {
    return `+1${cleanedNumber}`;
  }

  return null; // Invalid number
}
