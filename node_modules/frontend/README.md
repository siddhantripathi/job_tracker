# Job Tracker Frontend

A React application for tracking job applications with Gmail integration.

## 🚀 Production Deployment (Vercel)

### Prerequisites
- Node.js 18+ and npm 8+
- Vercel CLI: `npm install -g vercel`
- Firebase project with Cloud Functions deployed

### Environment Variables
Set these in Vercel dashboard under Project Settings > Environment Variables:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
REACT_APP_USE_EMULATORS=false
```

### Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Or use the deploy script:**
   ```bash
   npm run deploy
   ```

## 🔧 Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── pages/
│   │   ├── Dashboard.js    # Main dashboard
│   │   └── Login.js        # Authentication
│   ├── App.js              # Main app component
│   ├── firebase.js         # Firebase configuration
│   └── api.js              # API calls to Firebase Functions
├── package.json
├── vercel.json             # Vercel configuration
└── .env.local              # Local environment variables
```

## 🔗 Backend

The backend runs on Firebase Cloud Functions and is deployed separately.
See the `/functions` directory in the root project for backend code.

## 🌐 Features

- Gmail OAuth integration
- Job application tracking
- Email scanning with AI-powered filtering
- Real-time updates with Firestore
- Responsive design
