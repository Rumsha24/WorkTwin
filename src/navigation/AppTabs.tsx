<<<<<<< HEAD
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import DashboardScreen from '../screens/Main/DashboardScreen';
import TaskListScreen from '../screens/Tasks/TaskListScreen';
import TimerScreen from '../screens/Timer/TimerScreen';
import InsightsScreen from '../screens/Insights/InsightsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Settings/ProfileScreen';
import ChangePasswordScreen from '../screens/Settings/ChangePasswordScreen';

import { MainTabParamList, SettingsStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

function SettingsStackScreen() {
  const { colors } = useTheme();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <SettingsStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
    </SettingsStack.Navigator>
  );
}
=======
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
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b

export default function AppTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
<<<<<<< HEAD
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'checkbox' : 'checkbox-outline';
          } else if (route.name === 'Timer') {
            iconName = focused ? 'timer' : 'timer-outline';
          } else if (route.name === 'Insights') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
=======
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
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{ title: 'Tasks', tabBarLabel: 'Tasks' }}
      />
      <Tab.Screen
        name="Timer"
        component={TimerScreen}
        options={{ title: 'Timer', tabBarLabel: 'Timer' }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: 'Insights', tabBarLabel: 'Insights' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        options={{ headerShown: false, title: 'Settings', tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
<<<<<<< HEAD
}
=======
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
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
