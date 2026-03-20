import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Prevent re-initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ✅ Properly typed exports (fixes ALL your "auth any" errors)
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;