/**
 * Security utilities for production deployment
 */

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React
    "'unsafe-eval'", // Required for dev tools
    'https://cdn.jsdelivr.net',
    'https://unpkg.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'https:', // Allow all HTTPS images
    '*.supabase.co',
    '*.unsplash.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co', // WebSocket for realtime
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://lovable.dev',
    'wss://lovable.dev'
  ],
  'media-src': [
    "'self'",
    'https:',
    'data:'
  ],
  'frame-src': [
    "'self'"
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * Generate CSP header string
 */
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

/**
 * Enhanced input sanitization (deprecated - use contentSanitizer.ts)
 * @deprecated Use sanitizeText from contentSanitizer.ts instead
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"'&<>]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .trim()
    .slice(0, 1000); // Limit length
};

/**
 * Validate file upload security
 */
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Additional validation for images
  if (file.type.startsWith('image/')) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width > 4000 || img.height > 4000) {
          resolve({ valid: false, error: 'Image dimensions too large (max 4000x4000)' });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve({ valid: false, error: 'Invalid image file' });
      };
    }) as any;
  }

  return { valid: true };
};

/**
 * Force HTTPS redirect
 */
export const enforceHTTPS = (): void => {
  if (typeof window !== 'undefined' && 
      window.location.protocol === 'http:' && 
      window.location.hostname !== 'localhost') {
    window.location.replace(window.location.href.replace('http:', 'https:'));
  }
};

/**
 * Rate limiting for API calls
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  canMakeRequest(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

/**
 * Environment-based security configurations
 */
export const getSecurityConfig = () => {
  const isProduction = import.meta.env.PROD;
  
  return {
    strictMode: isProduction,
    allowUnsafeEval: !isProduction,
    enableCSP: isProduction,
    enforceHTTPS: isProduction,
    logSecurityEvents: isProduction
  };
};