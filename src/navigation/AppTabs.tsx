// AppTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet } from "react-native";

import DashboardScreen from "../screens/Main/DashboardScreen";
import TaskListScreen from "../screens/Tasks/TaskListScreen";
import TimerScreen from "../screens/Timer/TimerScreen";
import InsightsScreen from "../screens/Insights/InsightsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import { Colors, Spacing, BorderRadius } from "../theme/worktwinTheme";

export type AppTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Timer: undefined;
  Insights: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 15,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: -2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = "home-outline";
          if (route.name === "Dashboard") iconName = focused ? "home" : "home-outline";
          if (route.name === "Tasks") iconName = focused ? "checkbox" : "checkbox-outline";
          if (route.name === "Timer") iconName = focused ? "timer" : "timer-outline";
          if (route.name === "Insights") iconName = focused ? "bar-chart" : "bar-chart-outline";
          if (route.name === "Settings") iconName = focused ? "settings" : "settings-outline";

          return (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Ionicons name={iconName} size={22} color={focused ? Colors.primary : color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TaskListScreen} />
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
  },
  activeIconContainer: {
    backgroundColor: Colors.primary + "20",
  },
});