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
import { login, loginAsGuest } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      haptics.error();
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      haptics.medium();
      await login(email, password);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Login Failed', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setGuestLoading(true);
      haptics.medium();
      await loginAsGuest();
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Guest Login Failed', error?.message || 'Something went wrong');
    } finally {
      setGuestLoading(false);
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
      fontSize: 42,
      color: colors.primary,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xxxl,
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
      marginBottom: Spacing.md,
    },
    primaryButtonText: {
      ...Typography.button,
      color: colors.text,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      ...Typography.button,
      color: colors.textSecondary,
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
          <Text style={styles.title}>WorkTwin</Text>
          <Text style={styles.subtitle}>Focus on what matters</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading && !guestLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading && !guestLoading}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading || guestLoading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGuestLogin}
            disabled={loading || guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color={colors.textSecondary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Continue as Guest</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}