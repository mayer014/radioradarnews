const { generateEnvFile } = require('./generate-env.js');

console.log('🚀 Running pre-build tasks...');

// Generate environment file
generateEnvFile();

console.log('✅ Pre-build tasks completed');