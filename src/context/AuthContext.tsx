import React, { createContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { login as authLogin, loginAsGuest as authLoginAsGuest, register as authRegister, logout as authLogout } from '../services/authService';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginAsGuest: () => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authLogin(email, password);
    return result;
  };

  const loginAsGuest = async () => {
    const result = await authLoginAsGuest();
    return result;
  };

  const register = async (email: string, password: string) => {
    const result = await authRegister(email, password);
    return result;
  };

  const logout = async () => {
    await authLogout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsGuest, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};