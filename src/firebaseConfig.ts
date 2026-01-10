import { getFirestore } from 'firebase/firestore';
// Firebase configuration and initialization for EventSphere
// Uses real Firebase Authentication but mock Firestore-style data elsewhere.

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Import the functions you need from the SDKs you need
// NOTE: This block is kept very close to the spec in the assignment brief.
const firebaseConfig = {
  apiKey: "AIzaSyDF6YB0564kxYZdWnsh8kpjvo_4OE7RxU4",
  authDomain: "eventsphere-62fc6.firebaseapp.com",
  projectId: "eventsphere-62fc6",
  storageBucket: "eventsphere-62fc6.firebasestorage.app",
  messagingSenderId: "614974249836",
  appId: "1:614974249836:web:5b391cee23f0cc3fc67149",
  measurementId: "G-F1BSQ1QY62"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics is optional (it only works in supported environments, e.g. browser with proper setup)
let analytics: ReturnType<typeof getAnalytics> | null = null;
isAnalyticsSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {
    analytics = null;
  });


// Export Auth instance and provider for use across the app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Initialize Firebase Storage
import { getStorage } from "firebase/storage";
export const storage = getStorage(app);




