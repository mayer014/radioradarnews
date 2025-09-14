const fs = require('fs');
const path = require('path');

// Generate env.js file with environment variables for runtime injection
function generateEnvFile() {
  const envConfig = {
    RADIO_STREAM_URL: process.env.VITE_RADIO_STREAM_URL || process.env.RADIO_STREAM_URL || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_APP_URL: process.env.VITE_APP_URL || process.env.APP_URL || ''
  };

  const envContent = `// Auto-generated environment configuration
window.ENV = ${JSON.stringify(envConfig, null, 2)};

console.log('Runtime environment loaded:', Object.keys(window.ENV).filter(k => window.ENV[k]).length + ' variables configured');
`;

  const publicDir = path.join(process.cwd(), 'public');
  const envPath = path.join(publicDir, 'env.js');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write env.js file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('✅ Generated public/env.js with runtime environment configuration');
  
  // Log which variables were found (without exposing values)
  const configuredVars = Object.keys(envConfig).filter(key => envConfig[key]);
  const missingVars = Object.keys(envConfig).filter(key => !envConfig[key]);
  
  if (configuredVars.length > 0) {
    console.log(`   📋 Configured variables: ${configuredVars.join(', ')}`);
  }
  if (missingVars.length > 0) {
    console.log(`   ⚠️  Missing variables: ${missingVars.join(', ')} (will use fallbacks)`);
  }
}

// Run if called directly
if (require.main === module) {
  generateEnvFile();
}

module.exports = { generateEnvFile };