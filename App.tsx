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
        backgroundColor={colors.background}
      />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SyncProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SyncProvider>
    </ThemeProvider>
  );
}