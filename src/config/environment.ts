// Centralized environment configuration
export const ENV = {
  // Application
  APP_NAME: 'Portal de Notícias',
  APP_DESCRIPTION: 'Portal de notícias moderno e responsivo',
  APP_URL: window.location.origin,
  
  // Supabase - using hardcoded values as per Lovable requirements
  SUPABASE_URL: 'https://bwxbhircezyhwekdngdk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGJoaXJjZXp5aHdla2RuZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjU4NDAsImV4cCI6MjA3MzIwMTg0MH0.cRpeDixAWnMRaKsdiQJeJ4KPx7-PJAP6M5m7ljhzEls',
  
  // Radio
  RADIO_STREAM_URL: 'https://servidor25.brlogic.com:8166/live',
  
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
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Initialize validation in production
if (ENV.IS_PRODUCTION) {
  validateEnvironment();
}