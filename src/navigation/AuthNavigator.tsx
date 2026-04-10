import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useLanguage } from '../context/LanguageContext';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  const { t } = useLanguage();

  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('login') }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('register') }} />
    </Stack.Navigator>
  );
}
