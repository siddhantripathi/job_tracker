import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import './Login.css';

const Login = () => {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailScanDays: 7,
        preferences: {
          pdfColorScheme: 'default',
          emailNotifications: true,
        },
        lastLogin: new Date(),
        created_at: new Date(),
      }, { merge: true });

      console.log('User signed in:', result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>JobTrack</h1>
          <p>Track your job applications with ease</p>
        </div>
        
        <div className="login-form">
          <button 
            onClick={handleGoogleSignIn}
            className="google-signin-btn"
            type="button"
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="login-info">
          <p>Sign in with your Google account to:</p>
          <ul>
            <li> Automatically scan your Gmail for job applications</li>
            <li> Track application statuses with AI insights</li>
            <li> Generate professional PDF reports</li>
            <li> Never miss a follow-up opportunity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login; 