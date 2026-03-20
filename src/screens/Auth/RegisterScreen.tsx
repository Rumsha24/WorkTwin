import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
<<<<<<< HEAD
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register } from '../../services/authService';
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
      await register(email, password);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Register Failed', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
=======
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onRegister = async () => {
    try {
      setBusy(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert("Register Error", e?.message ?? "Failed to register");
    } finally {
      setBusy(false);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
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
<<<<<<< HEAD
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
=======
    <KeyboardAvoidingView
      style={styles.bg}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>Start using WorkTwin</Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            style={styles.input}
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
<<<<<<< HEAD
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
=======
          />
          <TextInput
            placeholder="Password (min 6)"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            onPress={onRegister}
            disabled={busy}
          >
            <Text style={styles.primaryText}>
              {busy ? "Please wait..." : "Register"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
            disabled={busy}
          >
            <Text style={styles.secondaryText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#07101F" },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 36, fontWeight: "900", color: "#E5E7EB" },
  sub: { color: "#94A3B8", marginTop: 6, marginBottom: 18, fontSize: 16 },
  card: {
    backgroundColor: "rgba(17,24,39,0.65)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    borderRadius: 22,
    padding: 18,
  },
  input: {
    backgroundColor: "rgba(2,6,23,0.55)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
    color: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "white", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    backgroundColor: "rgba(17,24,39,0.4)",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  secondaryText: { color: "#E5E7EB", fontWeight: "700", fontSize: 16 },
});
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
