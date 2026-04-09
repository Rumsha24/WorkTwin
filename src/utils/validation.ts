// Named exports
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6;
}

export function validateStrongPassword(password: string): boolean {
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

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateMinutes = (minutes: string): boolean => {
  const num = parseInt(minutes);
  return !isNaN(num) && num > 0 && num <= 120;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};