import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// Firebase callable functions
export const getAuthUrl = httpsCallable(functions, 'getAuthUrl');
export const fetchJobEmails = httpsCallable(functions, 'fetchJobEmails');
export const generatePDFReport = httpsCallable(functions, 'generatePDFReport');

// API helper functions
export const callGetAuthUrl = async () => {
  try {
    const result = await getAuthUrl();
    return result.data;
  } catch (error) {
    console.error('Error getting auth URL:', error);
    throw error;
  }
};

export const callFetchJobEmails = async (daysBack = 7) => {
  try {
    const result = await fetchJobEmails({ daysBack });
    return result.data;
  } catch (error) {
    console.error('Error fetching job emails:', error);
    throw error;
  }
};

export const callGeneratePDFReport = async () => {
  try {
    const result = await generatePDFReport();
    return result.data;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

// OAuth callback handler
export const handleOAuthCallback = (code, state) => {
  // This will be handled by the Cloud Function endpoint
  const callbackUrl = `${process.env.REACT_APP_FUNCTIONS_URL || 'http://localhost:5001/job-tracker-bd6dc/us-central1'}/oauthCallback?code=${code}&state=${state}`;
  window.location.href = callbackUrl;
}; 