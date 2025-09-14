#!/bin/sh

# Runtime environment injection for Nginx deployment
# This script generates env.js at container startup with actual environment variables

echo "🔧 Generating runtime environment configuration..."

# Create the env.js file in the web root
cat > /usr/share/nginx/html/env.js << EOF
// Runtime environment configuration - generated at container startup
window.ENV = {
  RADIO_STREAM_URL: '${VITE_RADIO_STREAM_URL:-${RADIO_STREAM_URL:-}}',
  GROQ_API_KEY: '${GROQ_API_KEY:-}',
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL:-}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY:-}',
  VITE_APP_URL: '${VITE_APP_URL:-${APP_URL:-}}'
};

console.log('Runtime environment loaded:', Object.keys(window.ENV).filter(k => window.ENV[k]).length + ' variables configured');
EOF

# Log configured variables (without exposing values)
CONFIGURED_VARS=""
MISSING_VARS=""

check_var() {
  if [ -n "$2" ]; then
    CONFIGURED_VARS="$CONFIGURED_VARS $1"
  else
    MISSING_VARS="$MISSING_VARS $1"
  fi
}

check_var "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
check_var "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"
check_var "VITE_RADIO_STREAM_URL" "$VITE_RADIO_STREAM_URL"
check_var "GROQ_API_KEY" "$GROQ_API_KEY"
check_var "VITE_APP_URL" "$VITE_APP_URL"

echo "✅ Generated /usr/share/nginx/html/env.js with runtime environment"

if [ -n "$CONFIGURED_VARS" ]; then
  echo "   📋 Configured variables:$CONFIGURED_VARS"
fi

if [ -n "$MISSING_VARS" ]; then
  echo "   ⚠️  Missing variables:$MISSING_VARS (will use fallbacks)"
fi

echo "🔧 Runtime environment injection completed"