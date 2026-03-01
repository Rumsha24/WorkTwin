// src/screens/Auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation happens automatically via RootNavigator
    } catch (e: any) {
      let errorMessage = "Failed to login";
      if (e.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email";
      } else if (e.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password";
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format";
      } else if (e.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Try again later";
      }
      Alert.alert("Login Error", errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const onGuest = async () => {
    try {
      setBusy(true);
      await signInAnonymously(auth);
      // Navigation happens automatically via RootNavigator
    } catch (e: any) {
      Alert.alert("Guest Login Error", e?.message ?? "Failed to login as guest");
    } finally {
      setBusy(false);
    }
  };

  const styles = StyleSheet.create({
    bg: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    container: { 
      flex: 1, 
      justifyContent: "center", 
      padding: Spacing.xl 
    },
    header: { 
      marginBottom: Spacing.xxl, 
      alignItems: "center" 
    },
    title: { 
      ...Typography.h1, 
      fontSize: 44, 
      color: colors.primary, 
      marginBottom: Spacing.xs 
    },
    sub: { 
      ...Typography.body, 
      color: colors.textSecondary 
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      ...Shadows.medium,
    },
    cardTitle: { 
      ...Typography.h3, 
      marginBottom: Spacing.lg, 
      color: colors.text 
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: { 
      paddingHorizontal: Spacing.md 
    },
    input: {
      flex: 1,
      color: colors.text,
      paddingVertical: Spacing.lg,
      fontSize: 16,
    },
    eyeIcon: { 
      paddingHorizontal: Spacing.md 
    },
    forgotPassword: { 
      alignSelf: "flex-end", 
      marginBottom: Spacing.lg 
    },
    forgotText: { 
      color: colors.primary, 
      fontSize: 14, 
      fontWeight: "500" 
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      marginBottom: Spacing.md,
      ...Shadows.small,
    },
    disabled: { 
      opacity: 0.6 
    },
    primaryText: { 
      ...Typography.button, 
      color: colors.text 
    },
    secondaryBtn: { 
      alignItems: "center", 
      marginBottom: Spacing.lg 
    },
    secondaryText: { 
      color: colors.textSecondary, 
      fontSize: 15 
    },
    highlight: { 
      color: colors.primary, 
      fontWeight: "600" 
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: Spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textMuted,
      paddingHorizontal: Spacing.md,
      fontSize: 14,
    },
    guestBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    guestText: { 
      color: colors.textSecondary, 
      fontSize: 15 
    },
    note: { 
      color: colors.textMuted, 
      textAlign: "center", 
      fontSize: 12 
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.bg}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>WorkTwin</Text>
          <Text style={styles.sub}>Focus smarter. Track better.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!busy}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} disabled={busy}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} disabled={busy}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.disabled]}
            onPress={onLogin}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.primaryText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Register")}
            disabled={busy}
          >
            <Text style={styles.secondaryText}>
              Don't have an account? <Text style={styles.highlight}>Register</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={[styles.guestBtn, busy && styles.disabled]} 
            onPress={onGuest} 
            disabled={busy}
          >
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Guest mode is temporary (15 days)
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}