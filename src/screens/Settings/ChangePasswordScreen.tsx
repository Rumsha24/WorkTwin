import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reload,
} from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';
import { auth } from '../../services/firebaseConfig';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const currentUser = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (password: string): boolean => password.length >= 6;

  const handleChangePassword = async () => {
    setError('');

    if (currentUser?.isAnonymous) {
      Alert.alert('Guest Account', 'Guest users cannot change password. Please register first.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      haptics.error();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      haptics.error();
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 6 characters');
      haptics.error();
      return;
    }

    try {
      setLoading(true);
      haptics.medium();

      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      await reload(user);

      const hasPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === 'password'
      );

      if (!hasPasswordProvider) {
        throw new Error('This account does not use email and password sign-in.');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      haptics.success();
      Alert.alert('Success', 'Password changed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      haptics.error();
      console.error('Error changing password:', error);

      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        setError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password');
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Please log out and log in again before changing your password');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message === 'This account does not use email and password sign-in.') {
        setError('This account cannot change password here because it was not created with email/password login.');
      } else {
        setError('Unable to change password right now. Please verify your current password and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (
    password: string
  ): { score: number; color: string; message: string } => {
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

  const strength = getPasswordStrength(newPassword);

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    backButton: {
      marginRight: Spacing.md,
      padding: Spacing.xs,
    },
    title: { ...Typography.h1, color: colors.text, flex: 1 },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      ...Shadows.medium,
    },
    description: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xl,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
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
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    button: {
      backgroundColor: currentUser?.isAnonymous ? colors.textMuted : colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.xl,
      ...Shadows.small,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      ...Typography.button,
      color: colors.text,
    },
    infoBox: {
      backgroundColor: colors.info + '20',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    infoText: {
      ...Typography.caption,
      color: colors.info,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <View style={styles.container}>
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
          <Text style={styles.title}>{t('change_password')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.description}>
            Choose a strong password that you don&apos;t use elsewhere
          </Text>

          {currentUser?.isAnonymous ? (
            <Text style={styles.errorText}>
              Guest users cannot change password. Please register first.
            </Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={colors.textMuted}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                editable={!loading && !currentUser?.isAnonymous}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  haptics.light();
                  setShowCurrent(!showCurrent);
                }}
                disabled={loading}
              >
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                editable={!loading && !currentUser?.isAnonymous}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  haptics.light();
                  setShowNew(!showNew);
                }}
                disabled={loading}
              >
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {newPassword.length > 0 && (
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
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                editable={!loading && !currentUser?.isAnonymous}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => {
                  haptics.light();
                  setShowConfirm(!showConfirm);
                }}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={[styles.strengthText, { color: colors.danger, marginTop: Spacing.xs }]}>
                Passwords do not match
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                currentUser?.isAnonymous) &&
                styles.buttonDisabled,
            ]}
            onPress={handleChangePassword}
            disabled={
              loading ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              !!currentUser?.isAnonymous
            }
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>{t('change_password')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={24} color={colors.info} />
            <Text style={styles.infoText}>
              For security, enter your current login password first. If you are using the presentation account, use its existing password before setting a new one.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
