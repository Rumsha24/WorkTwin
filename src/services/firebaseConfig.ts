import { initializeApp, getApps, getApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'demo.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'demo.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:000000000000:web:demo',
};

// Initialize Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const getReactNativePersistence = (() => {
  try {
    return require('@firebase/auth/dist/rn/index.js').getReactNativePersistence as (
      storage: typeof AsyncStorage
    ) => unknown;
  } catch {
    return null;
  }
})();

// Initialize Auth
export const auth = (() => {
  try {
    if (getReactNativePersistence) {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage) as any,
      });
    }

    return getAuth(app);
  } catch {
    return getAuth(app);
  }
})();

// Initialize Firestore
export const db = getFirestore(app);

export default app;
