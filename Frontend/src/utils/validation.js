/**
 * Validation utilities for Lena Dena Bank Authentication
 */

/**
 * Validates an email address.
 * Rejects obviously invalid addresses such as:
 * - abc
 * - abc@
 * - @gmail.com
 * - abc@gmail
 * - abc gmail.com
 * - empty email
 * Accepts legitimate formats such as:
 * - user@gmail.com
 * - user.name@example.com
 * - student123@university.edu
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email address is required.' };
  }

  // Robust email pattern that enforces:
  // 1. Non-empty local part before '@' without spaces or extra '@'
  // 2. Domain part with valid host characters
  // 3. At least one dot in domain followed by a top-level domain of at least 2 letters
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. user@example.com).',
    };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates strong password rules:
 * - At least 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*...)
 */
export function validateStrongPassword(password) {
  const pwd = typeof password === 'string' ? password : '';

  const rules = {
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[^A-Za-z0-9]/.test(pwd),
  };

  if (!pwd) {
    return {
      isValid: false,
      error: 'Password is required.',
      rules,
    };
  }

  const isValid =
    rules.minLength &&
    rules.hasUpper &&
    rules.hasLower &&
    rules.hasNumber &&
    rules.hasSpecial;

  let error = '';
  if (!isValid) {
    const missing = [];
    if (!rules.minLength) missing.push('at least 8 characters');
    if (!rules.hasUpper) missing.push('an uppercase letter');
    if (!rules.hasLower) missing.push('a lowercase letter');
    if (!rules.hasNumber) missing.push('a number');
    if (!rules.hasSpecial) missing.push('a special character (!@#$%...)');

    error = `Password must include ${missing.join(', ')}.`;
  }

  return { isValid, error, rules };
}
