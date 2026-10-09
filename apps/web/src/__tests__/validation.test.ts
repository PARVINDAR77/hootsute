import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
    .regex(/[\d\W]/, 'Must contain at least 1 number or special character'),
});

describe('Frontend Form Validation Schemas', () => {
  describe('Login Validation', () => {
    it('should validate valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });
  });

  describe('Registration Validation', () => {
    it('should pass strong compliant registration data', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(true);
    });

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        name: 'J',
        email: 'jane@company.com',
        password: 'SecurePassword123!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password with less than 8 characters', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'Pass1!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('at least 8 characters'))).toBe(true);
      }
    });

    it('should reject password lacking uppercase letter', () => {
      const result = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@company.com',
        password: 'password123!',
      });
      expect(result.success).toBe(false);
    });
  });
});
