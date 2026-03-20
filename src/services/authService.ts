import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';

export async function register(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function login(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return result.user;
}

export async function loginAsGuest(): Promise<User> {
  console.log('Attempting anonymous login...');
  const result = await signInAnonymously(auth);
  const expiryDate = Date.now() + 15 * 24 * 60 * 60 * 1000;
  await AsyncStorage.setItem('guestExpiry', expiryDate.toString());
  console.log('Anonymous login successful:', result.user.uid);
  return result.user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('guestExpiry');
  await signOut(auth);
}