# Deployment with Runtime Environment Injection

This guide covers deploying the Radio Radar News with proper runtime environment variable injection for VPS/Docker deployments.

## ✅ Environment Variables for VPS (Easypanel/Docker)

Configure these exact variables in your VPS container environment:

```bash
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://bwxbhircezyhwekdngdk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3eGJoaXJjZXp5aHdla2RuZ2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjU4NDAsImV4cCI6MjA3MzIwMTg0MH0.cRpeDixAWnMRaKsdiQJeJ4KPx7-PJAP6M5m7ljhzEls

# Radio Stream (NO semicolon at the end!)
VITE_RADIO_STREAM_URL=https://cc6.streammaximum.com:20010/

# AI/Groq (CORRECT variable name!)
GROQ_API_KEY=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

# App Configuration
VITE_APP_NAME=Radio Radar News
VITE_APP_URL=https://radioradar.news
NODE_ENV=production
PORT=3000
```

## 🚀 How It Works

### Runtime Environment Injection

1. **Build Time**: The app is built with fallback values
2. **Container Startup**: The `10-env.sh` script runs automatically and generates `/usr/share/nginx/html/env.js` with actual environment variables
3. **Runtime**: The app loads `env.js` and uses the actual environment values

### File Structure

```
docker/
└── entrypoint/
    └── 10-env.sh          # Runtime environment injection script

scripts/
├── generate-env.js        # Build-time fallback generation
└── prebuild.js           # Pre-build tasks

src/config/
└── environment.ts         # Centralized environment configuration
```

## 🛠️ Deployment Steps

### 1. Update VPS Environment Variables
- Set the exact variables listed above in your VPS container settings
- **Double-check**: No extra semicolons, correct variable names

### 2. Deploy New Version
```bash
# If using Git deployment
git pull origin main

# If uploading files, include the new docker/ directory

# Rebuild container
docker-compose up --build -d
```

### 3. Verify Deployment

After deployment, check these endpoints:

#### A. Environment File
```bash
curl https://yourdomain.com/env.js
```
Should return:
```javascript
window.ENV = {
  RADIO_STREAM_URL: 'https://cc6.streammaximum.com:20010/',
  GROQ_API_KEY: 'gsk_...',
  VITE_SUPABASE_URL: 'https://bwxbhircezyhwekdngdk.supabase.co',
  // ... other variables
};
```

#### B. Radio Player
1. Visit your site
2. Click the radio play button
3. Should start playing immediately (no need to save from admin)

#### C. Console Logs
Check browser console for:
```
Runtime environment loaded: X variables configured
[RADIO] Using environment URL: https://cc6.streammaximum.com:20010/
```

## 🔧 Troubleshooting

### Radio Not Playing
1. Check `/env.js` - should have your stream URL
2. Check container logs: `docker logs container_name`
3. Verify no localStorage conflicts (clear browser storage)

### Environment Variables Not Loading
1. Check `10-env.sh` script permissions: `ls -la /docker-entrypoint.d/`
2. Check container startup logs for environment injection messages
3. Verify VPS environment variables are set correctly

### Build Issues
1. The `scripts/generate-env.js` provides build-time fallbacks
2. Check build logs for environment generation messages
3. Ensure both build-time and runtime systems are working

## 📋 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Radio only works after admin save | Runtime env not loaded | Check `/env.js` accessibility |
| `setRadioStreamUrl is not defined` | Function scope issue | Already fixed in latest code |
| Environment variables empty | Wrong variable names | Use exact names from this guide |
| Container fails to start | Script permissions | Check `10-env.sh` is executable |

## 🔄 Rollback Plan

If issues occur, you can rollback by:

1. Remove the `COPY docker/entrypoint/` line from Dockerfile
2. Rebuild container
3. This will fall back to build-time environment injection only

## 🎯 Expected Result

After successful deployment:
- ✅ Radio plays immediately without admin panel interaction
- ✅ All environment variables loaded at runtime
- ✅ No localStorage conflicts
- ✅ Service worker cache cleared automatically
- ✅ Proper fallback to build-time values if runtime fails
