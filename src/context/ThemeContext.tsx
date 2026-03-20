<<<<<<< HEAD
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#EC4899',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const darkColors: ThemeColors = {
  primary: '#818CF8',
  secondary: '#A78BFA',
  accent: '#F472B6',
  background: '#111827',
  surface: '#1F2937',
  card: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#374151',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
=======
// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme/worktwinTheme';

type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

<<<<<<< HEAD
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved !== null) {
        setIsDarkMode(saved === 'dark');
      } else {
        // If no saved preference, use light mode (not system)
        setIsDarkMode(false);
        await AsyncStorage.setItem('theme', 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
=======
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    }
  };

  const toggleTheme = async () => {
<<<<<<< HEAD
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
=======
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    await AsyncStorage.setItem('theme_preference', newValue ? 'dark' : 'light');
  };

  const setDarkMode = async (value: boolean) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('theme_preference', value ? 'dark' : 'light');
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
  };

  const colors = isDarkMode ? darkColors : lightColors;

<<<<<<< HEAD
  return (
    <ThemeContext.Provider value={{ colors, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
=======
  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
