import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "jobtrack-app.firebaseapp.com",
  projectId: "jobtrack-app",
  storageBucket: "jobtrack-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  // Only connect if not already connected
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Functions emulator already connected or not available');
  }
}

export default app; 