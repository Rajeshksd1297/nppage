import { z } from 'zod';

// Enhanced email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .refine(
    (email) => {
      // Additional validation for common email issues
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      
      const [local, domain] = parts;
      // Check for consecutive dots
      if (local.includes('..') || domain.includes('..')) return false;
      // Check for valid characters
      if (!/^[a-zA-Z0-9._-]+$/.test(local)) return false;
      if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) return false;
      
      return true;
    },
    'Invalid email format'
  );

// Enhanced password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .refine(
    (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

// Contact form validation schema with enhanced security
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .refine(
      (name) => !/[<>\"'&]/.test(name),
      'Name contains invalid characters'
    ),
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .refine(
      (message) => !/(<script|javascript:|data:)/i.test(message),
      'Message contains potentially unsafe content'
    )
});

// URL validation schema
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        // Only allow HTTP/HTTPS protocols
        return ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    },
    'Only HTTP and HTTPS URLs are allowed'
  );

// Slug validation schema
export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .refine(
    (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
    'Slug cannot start or end with a hyphen'
  );

// Phone number validation schema
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-\(\)]{7,15}$/, 'Invalid phone number format')
  .refine(
    (phone) => {
      // Remove all non-digits to check length
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length >= 7 && digitsOnly.length <= 15;
    },
    'Phone number must contain 7-15 digits'
  );

/**
 * Validates and sanitizes form data
 * @param data - Form data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with sanitized data or errors
 */
export const validateFormData = <T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};