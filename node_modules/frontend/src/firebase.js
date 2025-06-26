import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase config - using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please create frontend/.env.local with your Firebase configuration');
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

// Development configuration - USE PRODUCTION SERVICES
// This allows Gmail OAuth and external API calls to work properly
const isDevelopment = process.env.NODE_ENV === 'development';
const useEmulators = process.env.REACT_APP_USE_EMULATORS === 'true' && !isDevelopment;

console.log('🔧 Firebase Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_USE_EMULATORS: process.env.REACT_APP_USE_EMULATORS,
  useEmulators: useEmulators,
  isDevelopment: isDevelopment,
  mode: useEmulators ? 'EMULATOR' : 'PRODUCTION',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
});

if (useEmulators) {
  // Only connect to emulators if explicitly enabled AND not in development
  const isEmulatorConnected = {
    auth: false,
    firestore: false,
    functions: false
  };

  try {
    if (!isEmulatorConnected.auth) {
      connectAuthEmulator(auth, `http://localhost:9098`, { disableWarnings: true });
      isEmulatorConnected.auth = true;
      console.log('✅ Connected to Firebase Auth emulator at localhost:9098');
    }
  } catch (error) {
    console.log('⚠️ Auth emulator connection failed:', error.message);
  }

  try {
    if (!isEmulatorConnected.firestore) {
      connectFirestoreEmulator(db, 'localhost', 8081);
      isEmulatorConnected.firestore = true;
      console.log('✅ Connected to Firestore emulator at localhost:8081');
    }
  } catch (error) {
    console.log('⚠️ Firestore emulator connection failed:', error.message);
  }

  try {
    if (!isEmulatorConnected.functions) {
      connectFunctionsEmulator(functions, 'localhost', 5002);
      isEmulatorConnected.functions = true;
      console.log('✅ Connected to Firebase Functions emulator at localhost:5002');
    }
  } catch (error) {
    console.log('⚠️ Functions emulator connection failed:', error.message);
  }

  console.log('🔧 Using Firebase emulators for testing');
} else {
  console.log('🚀 Using PRODUCTION Firebase services (recommended for Gmail integration)');
}

export default app; 