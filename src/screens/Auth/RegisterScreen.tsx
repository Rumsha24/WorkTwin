import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';
import { validateEmail, validatePassword } from '../../utils/validation';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      haptics.error();
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      haptics.error();
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      haptics.error();
      Alert.alert('Error', 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
      return;
    }

    if (password !== confirmPassword) {
      haptics.error();
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      haptics.medium();
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Register Failed', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xxl,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.md,
      fontSize: 16,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    primaryButtonText: {
      ...Typography.button,
      color: colors.text,
    },
    link: {
      ...Typography.body,
      textAlign: 'center',
      color: colors.primary,
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.primaryButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

