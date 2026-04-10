import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';
import { validateEmail, validatePassword } from '../../utils/validation';
import { AuthLogo } from '../../components/common/AuthLogo';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

    if (!gender) {
      haptics.warning();
      Alert.alert('Gender', 'Please select male or female');
      return;
    }

    if (!acceptTerms) {
      haptics.warning();
      Alert.alert('Terms', 'Please accept the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      haptics.medium();
      const user = await register(email, password);
      await AsyncStorage.setItem(`profileGender:${user.uid}`, gender);
      haptics.success();
    } catch (error: any) {
      haptics.error();
      Alert.alert('Registration Failed', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { score: 0, color: colors.textMuted, message: '' };
    
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, color: colors.danger, message: 'Weak' };
    if (score <= 3) return { score, color: colors.warning, message: 'Fair' };
    if (score <= 4) return { score, color: colors.info, message: 'Good' };
    return { score, color: colors.success, message: 'Strong' };
  };

  const strength = getPasswordStrength();

  const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    backButton: {
      marginRight: Spacing.md,
      padding: Spacing.xs,
    },
    title: {
      ...Typography.h1,
      color: colors.text,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
    },
    input: {
      flex: 1,
      color: colors.text,
      padding: Spacing.lg,
      fontSize: 16,
    },
    eyeIcon: {
      paddingHorizontal: Spacing.md,
    },
    passwordStrength: {
      marginTop: Spacing.xs,
      marginBottom: Spacing.md,
    },
    strengthText: {
      ...Typography.caption,
      fontSize: 12,
    },
    strengthBar: {
      height: 4,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginTop: Spacing.xs,
      overflow: 'hidden',
    },
    strengthFill: {
      height: '100%',
      borderRadius: BorderRadius.round,
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    termsTextRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    genderLabel: {
      ...Typography.h3,
      color: colors.text,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    genderRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    genderOption: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    genderOptionActive: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
    },
    genderText: {
      ...Typography.button,
      color: colors.text,
      marginTop: Spacing.xs,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    termsText: {
      ...Typography.body,
      color: colors.textSecondary,
      flex: 1,
    },
    termsLink: {
      color: colors.primary,
      fontWeight: '600',
    },
    termsModalText: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: 23,
      marginBottom: Spacing.lg,
    },
    registerButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    registerButtonText: {
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                haptics.light();
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </View>

          <AuthLogo compact />

          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textMuted}
              style={{ paddingHorizontal: Spacing.md }}
            />
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
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
              style={{ paddingHorizontal: Spacing.md }}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => {
                haptics.light();
                setShowPassword(!showPassword);
              }}
              disabled={loading}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View style={styles.passwordStrength}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.strengthText, { color: strength.color }]}>
                  Strength: {strength.message}
                </Text>
                <Text style={[styles.strengthText, { color: colors.textMuted }]}>
                  {strength.score}/5
                </Text>
              </View>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${(strength.score / 5) * 100}%`,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
              style={{ paddingHorizontal: Spacing.md }}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => {
                haptics.light();
                setShowConfirmPassword(!showConfirmPassword);
              }}
              disabled={loading}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={[styles.strengthText, { color: colors.danger, marginBottom: Spacing.md }]}>
              Passwords do not match
            </Text>
          )}

          <Text style={styles.genderLabel}>Select gender</Text>
          <View style={styles.genderRow}>
            {[
              { value: 'male' as const, label: 'Male', icon: 'male-outline' as const },
              { value: 'female' as const, label: 'Female', icon: 'female-outline' as const },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  gender === option.value && styles.genderOptionActive,
                ]}
                onPress={() => {
                  haptics.light();
                  setGender(option.value);
                }}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={gender === option.value ? colors.primary : colors.textMuted}
                />
                <Text style={styles.genderText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.termsContainer}>
            <TouchableOpacity
              onPress={() => {
                haptics.switch();
                setAcceptTerms(!acceptTerms);
              }}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checked]}>
                {acceptTerms && <Ionicons name="checkmark" size={16} color={colors.text} />}
              </View>
            </TouchableOpacity>
            <View style={styles.termsTextRow}>
              <Text style={styles.termsText}>I accept the </Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  setShowTermsModal(true);
                }}
              >
                <Text style={styles.termsLink}>Terms and Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showTermsModal} transparent animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            padding: Spacing.lg,
          }}>
            <View style={{
              backgroundColor: colors.card,
              borderRadius: BorderRadius.xl,
              padding: Spacing.xl,
              ...Shadows.large,
            }}>
              <Text style={[styles.title, { marginBottom: Spacing.md }]}>Terms</Text>
              <Text style={styles.termsModalText}>
                By creating an account, you agree to use WorkTwin for personal productivity and wellness tracking. Your task, focus, and health entries should be accurate and respectful. Health features are for self-tracking only and are not medical advice.
              </Text>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <Text style={styles.registerButtonText}>Accept Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={styles.link}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
