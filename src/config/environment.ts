// Centralized environment configuration with fallbacks
export const ENV = {
  // Application - use environment variables with fallbacks
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Portal de Notícias',
  APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Portal de notícias moderno e responsivo',
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  
  // Supabase - use environment variables with fallbacks
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://bwxbhircezyhwekdngdk.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGJoaXJjZXp5aHdla2RuZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjU4NDAsImV4cCI6MjA3MzIwMTg0MH0.cRpeDixAWnMRaKsdiQJeJ4KPx7-PJAP6M5m7ljhzEls',
  
  // Radio - use environment variable with fallback
  RADIO_STREAM_URL: import.meta.env.VITE_RADIO_STREAM_URL || 'https://servidor25.brlogic.com:8166/live',
  
  // Security
  FORCE_HTTPS: import.meta.env.PROD,
  
  // Performance
  ENABLE_SERVICE_WORKER: import.meta.env.PROD,
  
  // Development
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Runtime environment validation
export const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
  const missing = required.filter(key => !ENV[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')} - using fallback values`);
  }
  
  // Validate that we have valid Supabase configuration
  if (!ENV.SUPABASE_URL.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL');
  }
  
  if (!ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY.length < 100) {
    throw new Error('VITE_SUPABASE_ANON_KEY must be a valid JWT token');
  }
};

// Initialize validation in production
if (ENV.IS_PRODUCTION) {
  validateEnvironment();
}