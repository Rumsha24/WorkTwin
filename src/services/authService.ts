import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function register(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function login(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);

  // Save guest expiry (15 days)
  const expiryDate = Date.now() + 15 * 24 * 60 * 60 * 1000;
  await AsyncStorage.setItem("guestExpiry", expiryDate.toString());

  return result.user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem("guestExpiry");
  await signOut(auth);
}
