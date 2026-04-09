import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Spacing, BorderRadius, Typography, Shadows } from '../theme/worktwinTheme';

export function FirebaseTestButton() {
  const { colors } = useTheme();

  const testFirebaseConnection = async () => {
    try {
      const user = auth.currentUser;
      console.log('Auth user:', user?.uid || 'No user logged in');
      
      const testCollection = collection(db, '_test_');
      await getDocs(testCollection);
      
      Alert.alert(
        '✅ Firebase Connected',
        `Auth: ${user ? 'Logged in' : 'Guest mode'}\nFirestore: Connected`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        '❌ Firebase Error',
        error?.message || 'Failed to connect to Firebase',
        [{ text: 'OK' }]
      );
    }
  };

  const styles = StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '20',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    text: {
      ...Typography.caption,
      color: colors.primary,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
      <Ionicons name="cloud-outline" size={16} color={colors.primary} />
      <Text style={styles.text}>Test Firebase Connection</Text>
    </TouchableOpacity>
  );
}