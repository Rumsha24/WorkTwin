<<<<<<< HEAD
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Define the param list for type safety
=======
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";

>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

<<<<<<< HEAD
const Stack = createStackNavigator<AuthStackParamList>();
=======
const Stack = createNativeStackNavigator<AuthStackParamList>();
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}