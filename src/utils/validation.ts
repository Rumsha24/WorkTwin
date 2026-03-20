// src/utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

export function validateTaskTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 100;
}

export function validateTaskNotes(notes: string): boolean {
  return notes.length <= 500;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateTaskTitle = (title: string): boolean => {
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= 100;
};

export const validateMinutes = (minutes: string): boolean => {
  const num = parseInt(minutes);
  return !isNaN(num) && num > 0 && num <= 120;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
