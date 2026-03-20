<<<<<<< HEAD
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import AuthNavigator from './AuthNavigator';
import AppTabs from './AppTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
=======
// src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import AppTabs from "./AppTabs";
import { useAuth } from "../hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";  // Changed from "../../context/ThemeContext"
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
<<<<<<< HEAD

  if (loading) {
    return null; // You can add a loading screen here
=======

  console.log("RootNavigator - user:", user ? "Logged in" : "Not logged in", "loading:", loading);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
  }

  return (
    <NavigationContainer>
<<<<<<< HEAD
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={AppTabs} />
        )}
      </Stack.Navigator>
=======
      {user ? <AppTabs /> : <AuthNavigator />}
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    </NavigationContainer>
  );
}