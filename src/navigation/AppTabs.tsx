import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";

import DashboardScreen from "../screens/Main/DashboardScreen";
import TaskListScreen from "../screens/Tasks/TaskListScreen";
import TimerScreen from "../screens/Timer/TimerScreen";
import InsightsScreen from "../screens/Insights/InsightsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#0B1220" },
        headerTintColor: "#E5E7EB",
        tabBarStyle: { backgroundColor: "#0B1220", borderTopColor: "#111827" },
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "home-outline";
          if (route.name === "Dashboard") iconName = "home-outline";
          if (route.name === "Tasks") iconName = "checkbox-outline";
          if (route.name === "Timer") iconName = "timer-outline";
          if (route.name === "Insights") iconName = "bar-chart-outline";
          if (route.name === "Settings") iconName = "settings-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
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
