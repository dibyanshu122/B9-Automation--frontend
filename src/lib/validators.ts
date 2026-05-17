/**
 * Email Validation
 */
export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Password Validation
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * URL Validation
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateYoutubeUrl = (url: string): boolean => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  return regex.test(url);
};

/**
 * File Validation
 */
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const validatePdf = (file: File, maxSizeMB = 25): {
  isValid: boolean;
  error?: string;
} => {
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'File must be a PDF' };
  }
  if (!validateFileSize(file, maxSizeMB)) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  return { isValid: true };
};

/**
 * Form Validation
 */
export const validateField = (
  field: string,
  value: any,
  rules: Record<string, any>
): string | null => {
  if (rules.required && !value) {
    return `${field} is required`;
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${field} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${field} must be at most ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return `${field} format is invalid`;
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

/**
 * Credit Card Validation
 */
export const validateCreditCard = (cardNumber: string): boolean => {
  const regex = /^\d{13,19}$/;
  if (!regex.test(cardNumber.replace(/\s/g, ''))) {
    return false;
  }

  const digits = cardNumber.replace(/\D/g, '').split('').reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = parseInt(digits[i], 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

/**
 * Phone Number Validation
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return regex.test(phone);
};

/**
 * Username Validation
 */
export const validateUsername = (username: string): {
  isValid: boolean;
  error?: string;
} => {
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { isValid: true };
};

/**
 * Name Validation
 */
export const validateName = (name: string): {
  isValid: boolean;
  error?: string;
} => {
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  return { isValid: true };
};