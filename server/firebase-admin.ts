import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps?.length) {
  // For development, we'll use a minimal configuration
  // In production, you would set up proper service account credentials
  try {
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.log('Firebase admin initialization skipped:', error.message);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore?.();