import { validateEmail, validatePassword, validateTaskTitle } from '../src/utils/validation';

describe('Validation Utils', () => {
  it('should validate correct email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  it('should validate password strength', () => {
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('StrongPass123')).toBe(true);
  });

  it('should validate task title', () => {
    expect(validateTaskTitle('Valid Title')).toBe(true);
    expect(validateTaskTitle('')).toBe(false);
    expect(validateTaskTitle('a'.repeat(101))).toBe(false);
  });
});