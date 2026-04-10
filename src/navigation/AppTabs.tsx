import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

import DashboardScreen from '../screens/Main/DashboardScreen';
import TaskListScreen from '../screens/Tasks/TaskListScreen';
import TimerScreen from '../screens/Timer/TimerScreen';
import InsightsScreen from '../screens/Insights/InsightsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ProfileScreen from '../screens/Settings/ProfileScreen';
import ChangePasswordScreen from '../screens/Settings/ChangePasswordScreen';

const Tab = createBottomTabNavigator();
const SettingsStack = createNativeStackNavigator();

function SettingsStackScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerBackTitle: t('back'),
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile'), headerBackTitle: t('settings') }}
      />
      <SettingsStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: t('change_password'), headerBackTitle: t('settings') }}
      />
    </SettingsStack.Navigator>
  );
}

export default function AppTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

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
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{ title: t('tasks') }}
      />
      <Tab.Screen
        name="Timer"
        component={TimerScreen}
        options={{ title: t('focus') }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: t('insights') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackScreen}
        options={{ headerShown: false, title: t('settings') }}
      />
    </Tab.Navigator>
  );
}
