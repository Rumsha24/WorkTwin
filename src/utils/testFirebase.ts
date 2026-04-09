import { auth, db } from "../services/firebaseConfig";
import { signInAnonymously } from "firebase/auth";
import { collection, addDoc, getDocs, limit, query, deleteDoc, doc } from "firebase/firestore";

export interface TestResult {
  success: boolean;
  message: string;
  details?: {
    userId?: string;
    testDocId?: string;
    documentsFound?: number;
    errorCode?: string;
    errorMessage?: string;
  };
}

export async function testFirebaseConnection(): Promise<TestResult> {
  console.log("🔍 Testing Firebase connection...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    // Test 1: Check if auth is initialized
    console.log("📱 [1/5] Checking Auth initialization...");
    if (!auth) {
      throw new Error("Auth not initialized. Check firebaseConfig.ts");
    }
    console.log("✅ Auth initialized successfully");

    // Test 2: Check if db is initialized
    console.log("📁 [2/5] Checking Firestore initialization...");
    if (!db) {
      throw new Error("Firestore not initialized. Check firebaseConfig.ts");
    }
    console.log("✅ Firestore initialized successfully");

    // Test 3: Try anonymous sign-in
    console.log("🔑 [3/5] Testing anonymous authentication...");
    let user = auth.currentUser;
    if (!user) {
      const result = await signInAnonymously(auth);
      user = result.user;
      console.log("✅ Anonymous sign-in successful");
      console.log(`   User ID: ${user.uid}`);
    } else {
      console.log("✅ User already signed in");
      console.log(`   User ID: ${user.uid}`);
    }

    // Test 4: Try Firestore write
    console.log("✍️ [4/5] Testing Firestore write operation...");
    const testCollection = collection(db, "_connection_test");
    const testDoc = {
      test: true,
      timestamp: Date.now(),
      message: "Firebase connection test",
      source: "WorkTwin",
      userId: user.uid
    };
    const docRef = await addDoc(testCollection, testDoc);
    console.log("✅ Firestore write successful");
    console.log(`   Document ID: ${docRef.id}`);

    // Test 5: Try Firestore read
    console.log("📖 [5/5] Testing Firestore read operation...");
    const q = query(testCollection, limit(5));
    const querySnapshot = await getDocs(q);
    console.log("✅ Firestore read successful");
    console.log(`   Found ${querySnapshot.size} documents in collection`);

    // Clean up test document (optional)
    try {
      await deleteDoc(doc(db, "_connection_test", docRef.id));
      console.log("🧹 Test document cleaned up");
    } catch (cleanupError) {
      console.log("⚠️ Could not clean up test document (non-critical)");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Firebase is working perfectly!");
    
    return { 
      success: true, 
      message: "Firebase connected successfully! ✅",
      details: {
        userId: user.uid,
        testDocId: docRef.id,
        documentsFound: querySnapshot.size
      }
    };
    
  } catch (error: any) {
    console.error("❌ Firebase test failed:", error);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    let errorMessage = error?.message || "Unknown error";
    let errorCode = error?.code;
    
    // Provide helpful error messages
    if (errorCode === 'permission-denied') {
      errorMessage = "Permission denied! Go to Firebase Console → Firestore Database → Rules and set to:\n\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}";
    } else if (errorCode === 'unavailable') {
      errorMessage = "Firebase unavailable. Check your internet connection or run with --tunnel flag.";
    } else if (errorCode === 'failed-precondition') {
      errorMessage = "Firestore not enabled. Enable it in Firebase Console → Firestore Database → Create database.";
    } else if (errorCode === 'auth/network-request-failed') {
      errorMessage = "Network request failed. Run with: npx expo start --tunnel";
    } else if (errorCode === 'auth/invalid-api-key') {
      errorMessage = "Invalid Firebase API key. Check your .env file configuration.";
    }
    
    return { 
      success: false, 
      message: errorMessage,
      details: { 
        errorCode: errorCode,
        errorMessage: error?.message 
      }
    };
  }
}

// Helper function to check Firebase status quickly
export async function checkFirebaseStatus(): Promise<{ isConnected: boolean; message: string }> {
  try {
    const result = await testFirebaseConnection();
    return {
      isConnected: result.success,
      message: result.success ? "Connected" : "Disconnected"
    };
  } catch {
    return { isConnected: false, message: "Error" };
  }
}