import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import * as authService from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user?.isAnonymous) {
        checkGuestExpiry();
      }
    });

    return unsubscribe;
  }, []);

  const checkGuestExpiry = async () => {
    const expiry = await AsyncStorage.getItem('guestExpiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      await authService.logout();
    }
  };

  const login = async (email: string, password: string) => {
    return authService.login(email, password);
  };

  const register = async (email: string, password: string) => {
    return authService.register(email, password);
  };

  const loginAsGuest = async () => {
    return authService.loginAsGuest();
  };

  const logout = async () => {
    return authService.logout();
  };

  return {
    user,
    loading,
    login,
    register,
    loginAsGuest,
    logout,
  };
}