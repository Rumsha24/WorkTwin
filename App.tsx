
import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SyncProvider } from './src/context/SyncContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDarkMode, colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
=======
// App.tsx
import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const { colors, isDarkMode } = useTheme();

  if (!isReady) {
    return <SplashScreen onFinish={() => setIsReady(true)} />;
  }

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
<<<<<<< HEAD
      <SyncProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SyncProvider>
=======
      <AppContent />
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    </ThemeProvider>
  );
}