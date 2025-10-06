# Vercel Deployment Guide

## Environment Variables

When deploying to Vercel, you need to add the following environment variables in your Vercel project settings:

### Required Environment Variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://ezzwqntqsoybedqjtfyy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6endxbnRxc295YmVkcWp0Znl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODEwMzksImV4cCI6MjA3NDU1NzAzOX0.-boF6CwXlZ-cTAotUs3VhyFqOZ-1EYJsh1b60fFkN9I
```

**Important:** The `EXPO_PUBLIC_` prefix is required for these variables to be accessible in the Expo web build.

## Deployment Steps

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard** (recommended):
   - Go to https://vercel.com
   - Import your GitHub repository
   - Add the environment variables in the project settings
   - Deploy!

3. **Or deploy via CLI**:
   ```bash
   vercel
   ```

## Build Configuration

The project is configured with:
- **Build Command**: `npm run build:web`
- **Output Directory**: `web-build`
- **Framework**: None (manual configuration)

## Important Considerations

### Storage
- The app uses `localStorage` for web (instead of AsyncStorage)
- Session persistence works automatically on web

### Native Features
Some features may not work on web:
- `expo-speech-recognition` - Web doesn't support this plugin
- `react-native-maps` - Limited web support
- `expo-location` - Requires browser permissions

### Web-Specific Configuration
The `vercel.json` includes:
- SPA routing (all routes point to index.html)
- CORS headers for proper security
- Cross-origin policies for isolation

## Testing Locally

Before deploying, test the web build locally:

```bash
npm run build:web
npx serve web-build
```

Then visit http://localhost:3000

