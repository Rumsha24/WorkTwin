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

export default function AppTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
}