import DOMPurify from 'dompurify';

// Configure DOMPurify with secure settings
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
  ],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(html, sanitizeConfig);
};

/**
 * Sanitizes and truncates HTML content for previews
 * @param html - Raw HTML string to sanitize
 * @param maxLength - Maximum length of sanitized content
 * @returns Truncated and sanitized HTML string
 */
export const sanitizeAndTruncateHTML = (html: string, maxLength: number = 150): string => {
  const sanitized = sanitizeHTML(html);
  
  // Strip HTML tags for length calculation
  const textOnly = sanitized.replace(/<[^>]*>/g, '');
  
  if (textOnly.length <= maxLength) {
    return sanitized;
  }
  
  // Truncate and add ellipsis
  const truncated = textOnly.substring(0, maxLength) + '...';
  return DOMPurify.sanitize(truncated);
};

/**
 * Validates and sanitizes user input before database operations
 * @param input - User input to validate and sanitize
 * @param options - Validation options
 * @returns Sanitized and validated input
 */
export const validateAndSanitizeInput = (
  input: string, 
  options: {
    maxLength?: number;
    allowHTML?: boolean;
    required?: boolean;
  } = {}
): { isValid: boolean; sanitized: string; error?: string } => {
  const { maxLength, allowHTML = false, required = false } = options;
  
  // Check if required field is empty
  if (required && (!input || input.trim().length === 0)) {
    return { isValid: false, sanitized: '', error: 'This field is required' };
  }
  
  // If not required and empty, return empty string
  if (!input) {
    return { isValid: true, sanitized: '' };
  }
  
  let sanitized = input.trim();
  
  // Sanitize HTML if allowed, otherwise strip all HTML
  if (allowHTML) {
    sanitized = sanitizeHTML(sanitized);
  } else {
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  
  // Check length after sanitization
  if (maxLength && sanitized.length > maxLength) {
    return { 
      isValid: false, 
      sanitized, 
      error: `Content exceeds maximum length of ${maxLength} characters` 
    };
  }
  
  return { isValid: true, sanitized };
};