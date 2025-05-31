// Input sanitization utilities for security

export const sanitizeText = (input: string): string => {
  if (!input) return '';
  
  // Remove potentially harmful characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, ''); // Remove angle brackets
};

export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Only allow http and https protocols
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    return '';
  }
  
  return url.trim();
};

export const validateAndSanitizePrice = (price: string | number): number | null => {
  if (typeof price === 'number') {
    return price >= 0 ? price : null;
  }
  
  if (!price) return null;
  
  // Remove non-numeric characters except decimal point
  const sanitized = price.toString().replace(/[^\d.]/g, '');
  const parsed = parseFloat(sanitized);
  
  return !isNaN(parsed) && parsed >= 0 ? parsed : null;
};

export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  // Remove special characters that could be used for injection
  return query
    .replace(/[<>'"%;()&+]/g, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 100); // Limit length
};
