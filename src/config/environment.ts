// Centralized environment configuration with runtime env.js injection and build-time fallbacks
const getRuntimeEnv = () => {
  if (typeof window === 'undefined') return {};
  return (window as any).ENV || {};
};

export const ENV = {
  // Get runtime configuration
  get RUNTIME_CONFIG() {
    return getRuntimeEnv();
  },
  
  // Application - prefer runtime (env.js), then Vite build-time, then defaults
  get APP_NAME() {
    const runtime = getRuntimeEnv();
    return runtime.APP_NAME || import.meta.env.VITE_APP_NAME || 'Portal de Notícias';
  },
  get APP_DESCRIPTION() {
    const runtime = getRuntimeEnv();
    return runtime.APP_DESCRIPTION || import.meta.env.VITE_APP_DESCRIPTION || 'Portal de notícias moderno e responsivo';
  },
  get APP_URL() {
    const runtime = getRuntimeEnv();
    return runtime.VITE_APP_URL || runtime.APP_URL || import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  },
  
  // Supabase - prefer runtime (env.js), then build-time, then fallbacks
  get SUPABASE_URL() {
    const runtime = getRuntimeEnv();
    return runtime.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://bwxbhircezyhwekdngdk.supabase.co';
  },
  get SUPABASE_ANON_KEY() {
    const runtime = getRuntimeEnv();
    return runtime.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGJoaXJjZXp5aHdla2RuZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjU4NDAsImV4cCI6MjA3MzIwMTg0MH0.cRpeDixAWnMRaKsdiQJeJ4KPx7-PJAP6M5m7ljhzEls';
  },
  
  // Radio - prefer runtime (env.js), then build-time, then default
      get RADIO_STREAM_URL() {
        console.warn('RADIO_STREAM_URL is no longer supported - Radio system has been removed');
        return '';
      },
  
  // Groq API Key - from runtime env.js (Easypanel will inject it)
  get GROQ_API_KEY() {
    const runtime = getRuntimeEnv();
    return runtime.GROQ_API_KEY || '';
  },
  
  // Security
  FORCE_HTTPS: import.meta.env.PROD,
  
  // Performance
  ENABLE_SERVICE_WORKER: import.meta.env.PROD,
  
  // Development
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

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