import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

import { useTheme } from '../../context/ThemeContext';
import { haptics } from '../../utils/haptics';

export default function LoginScreen({ navigation }: any) {
  const { colors } = useTheme();
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  
  // Animation values - removed shaking animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      haptics.error();
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      haptics.medium();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Login Failed', error?.message || 'Unable to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setGuestLoading(true);
      haptics.medium();
      await signInAnonymously(auth);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Guest Login Failed', error?.message || 'Unable to continue as guest');
    } finally {
      setGuestLoading(false);
    }
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    title: {
      fontSize: 40,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 36,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      paddingHorizontal: 14,
    },
    input: {
      flex: 1,
      color: colors.text,
      paddingVertical: 16,
      paddingRight: 16,
      fontSize: 16,
    },
    eyeIcon: {
      paddingHorizontal: 14,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 12,
    },
    loginButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    guestButton: {
      backgroundColor: colors.card,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    guestButtonText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    registerLink: {
      color: colors.primary,
      fontWeight: '700',
      marginLeft: 6,
      fontSize: 15,
    },
    infoBox: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      color: colors.textSecondary,
      flex: 1,
      marginLeft: 10,
      fontSize: 13,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.title}>WorkTwin</Text>
            <Text style={styles.subtitle}>Focus on what matters</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading && !guestLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading && !guestLoading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading || guestLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading || guestLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={loading || guestLoading}
            >
              {guestLoading ? (
                <ActivityIndicator color={colors.textSecondary} />
              ) : (
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.infoText}>
                Guest accounts are temporary. Register to keep your data safely.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}