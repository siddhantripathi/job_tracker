# 🚀 Production Deployment Guide

## Architecture Overview

- **Frontend**: React app deployed on Vercel
- **Backend**: Firebase Cloud Functions (already deployed)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with Gmail OAuth

## 📋 Prerequisites

1. **Node.js 18+** and **npm 8+**
2. **Vercel account** (free tier is sufficient)
3. **Vercel CLI**: `npm install -g vercel`
4. **Firebase project** with functions already deployed

## 🎯 Deployment Steps

### Step 1: Prepare for Deployment

1. **Ensure your Firebase Functions are deployed:**
   ```bash
   firebase deploy --only functions
   ```

2. **Test the frontend build:**
   ```bash
   cd frontend
   npm run build
   ```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from the frontend directory:**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project? **N**
   - Project name: **job-tracker** (or your preferred name)
   - Directory: **./** (current directory)
   - Build settings: **auto-detected**

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

#### Option B: Deploy via GitHub Integration

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`
   - Deploy

### Step 3: Configure Environment Variables

In your Vercel dashboard (Project Settings > Environment Variables), add:

```
REACT_APP_FIREBASE_API_KEY=AIzaSyAIeeqRAqZSKJzFr5GnfgIvpjwfYU9z_OU
REACT_APP_FIREBASE_AUTH_DOMAIN=job-tracker-bd6dc.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=job-tracker-bd6dc
REACT_APP_FIREBASE_STORAGE_BUCKET=job-tracker-bd6dc.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=831968228747
REACT_APP_FIREBASE_APP_ID=1:831968228747:web:c2e75da41131ded1a12b8e
REACT_APP_FIREBASE_MEASUREMENT_ID=G-X8T9QY9VBJ
REACT_APP_USE_EMULATORS=false
```

### Step 4: Configure OAuth Redirect URLs

1. **Get your Vercel domain** (e.g., `https://job-tracker-xyz.vercel.app`)

2. **Update Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services > Credentials
   - Edit your OAuth 2.0 client
   - Add to **Authorized redirect URIs**:
     ```
     https://your-vercel-domain.vercel.app
     https://your-vercel-domain.vercel.app/
     ```

3. **Update Firebase Auth:**
   - Go to Firebase Console > Authentication > Settings
   - Add your Vercel domain to **Authorized domains**

### Step 5: Test Production Deployment

1. **Visit your Vercel URL**
2. **Test Gmail OAuth flow**
3. **Test email scanning functionality**
4. **Verify all features work correctly**

## 🔧 Maintenance & Updates

### Deploying Updates

1. **For automatic deployments** (if using GitHub integration):
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **For manual deployments:**
   ```bash
   cd frontend
   vercel --prod
   ```

### Updating Firebase Functions

```bash
firebase deploy --only functions
```

### Monitoring

- **Vercel Dashboard**: Monitor deployments and performance
- **Firebase Console**: Monitor function usage and errors
- **Google Cloud Console**: Monitor API usage and quotas

## 🎛️ Configuration Files

### `frontend/vercel.json`
- Optimizes static assets caching
- Handles SPA routing
- Manages environment variables

### `frontend/package.json`
- Production dependencies
- Build scripts
- Node.js version requirements

## 🔒 Security Considerations

1. **Environment Variables**: Stored securely in Vercel
2. **Firebase Security Rules**: Already configured
3. **HTTPS**: Automatically provided by Vercel
4. **OAuth**: Secured with proper redirect URLs

## 📊 Performance Optimizations

- **Static asset caching**: 1 year cache for immutable assets
- **Gzip compression**: Enabled by default on Vercel
- **CDN**: Global edge network via Vercel
- **Code splitting**: React lazy loading implemented

## 🚨 Troubleshooting

### Common Issues

1. **Environment variables not loading**:
   - Ensure they're set in Vercel dashboard
   - Redeploy after adding variables

2. **OAuth redirect errors**:
   - Verify redirect URLs in Google Cloud Console
   - Check Firebase authorized domains

3. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Function call errors**:
   - Ensure Firebase functions are deployed
   - Check CORS configuration

### Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Firebase Documentation**: [firebase.google.com/docs](https://firebase.google.com/docs)

---

🎉 **Your Job Tracker is now production-ready and deployed on Vercel!** 