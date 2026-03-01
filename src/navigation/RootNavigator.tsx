// src/navigation/RootNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import AppTabs from "./AppTabs";
import { useAuth } from "../hooks/useAuth";
import { View, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";  // Changed from "../../context/ThemeContext"

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

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
  }

  return (
    <NavigationContainer>
      {user ? <AppTabs /> : <AuthNavigator />}
    </NavigationContainer>
  );
}