import { auth, db } from "../services/firebaseConfig";
import { signInAnonymously } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export async function testFirebaseConnection() {
  console.log("🔍 Testing Firebase connection...");
  
  try {
    // Test 1: Check if auth is initialized
    console.log("Auth initialized:", !!auth);
    
    // Test 2: Check if db is initialized
    console.log("Firestore initialized:", !!db);
    
    // Test 3: Try anonymous sign-in
    console.log("Testing anonymous sign-in...");
    const result = await signInAnonymously(auth);
    console.log("✅ Anonymous sign-in successful:", result.user.uid);
    
    // Test 4: Try Firestore read
    console.log("Testing Firestore read...");
    const testCollection = collection(db, "test");
    await getDocs(testCollection);
    console.log("✅ Firestore read successful");
    
    return { success: true };
  } catch (error) {
    console.error("❌ Firebase test failed:", error);
    return { success: false, error };
  }
}