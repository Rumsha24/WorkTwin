import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.displayName || user?.email?.split('@')[0] || 'Guest User'
  );
  const [occupation, setOccupation] = useState('');
  const [bio, setBio] = useState('');
  const [dailyGoal, setDailyGoal] = useState(120);
  const [weeklyGoal, setWeeklyGoal] = useState(600);
  const [photoURL, setPhotoURL] = useState<string | undefined>(user?.photoURL || undefined);

  const profileStorageKey = user?.uid ? `profile:${user.uid}` : null;

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [profileStorageKey])
  );

  const loadProfile = async () => {
    if (!profileStorageKey) return;

    try {
      const saved = await AsyncStorage.getItem(profileStorageKey);
      if (!saved) return;

      const profile = JSON.parse(saved);
      setDisplayName(profile.displayName || user?.displayName || user?.email?.split('@')[0] || 'Guest User');
      setOccupation(profile.occupation || '');
      setBio(profile.bio || '');
      setDailyGoal(Number(profile.dailyGoal || 120));
      setWeeklyGoal(Number(profile.weeklyGoal || 600));
      setPhotoURL(profile.photoURL || user?.photoURL || undefined);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    haptics.medium();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const pickedUri = result.assets[0].uri;
      const extension = pickedUri.split('.').pop()?.split('?')[0] || 'jpg';
      const persistedUri =
        FileSystem.documentDirectory && user?.uid
          ? `${FileSystem.documentDirectory}profile-${user.uid}-${Date.now()}.${extension}`
          : pickedUri;

      if (persistedUri !== pickedUri) {
        await FileSystem.copyAsync({ from: pickedUri, to: persistedUri });
      }

      haptics.success();
      setPhotoURL(persistedUri);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      haptics.medium();

      if (profileStorageKey) {
        await AsyncStorage.setItem(
          profileStorageKey,
          JSON.stringify({
            displayName: displayName.trim(),
            occupation: occupation.trim(),
            bio: bio.trim(),
            dailyGoal,
            weeklyGoal,
            photoURL,
            updatedAt: Date.now(),
          })
        );
      }

      if (user) {
        try {
          await updateProfile(user, {
            displayName: displayName.trim(),
            photoURL: photoURL || null,
          });
        } catch {
          // Local profile storage is the source of truth for picked device images.
        }
      }

      setSaving(false);
      setEditMode(false);
      haptics.success();
      Alert.alert('Success', 'Profile updated.');
    } catch (error) {
      setSaving(false);
      haptics.error();
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: { ...Typography.h1, color: colors.text },
    backButton: {
      padding: Spacing.sm,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      gap: Spacing.xs,
    },
    editButtonText: { color: colors.text, fontWeight: '600' },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      alignItems: 'center',
      ...Shadows.medium,
      marginBottom: Spacing.xl,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: Spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surface,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitials: {
      ...Typography.h1,
      fontSize: 40,
      color: colors.primary,
    },
    editAvatarButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    displayName: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    email: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    badge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
    },
    badgeText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    inputGroup: {
      marginBottom: Spacing.md,
    },
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      color: colors.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    readOnlyField: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    readOnlyText: {
      color: colors.text,
      fontSize: 16,
    },
    goalsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    goalCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalValue: {
      ...Typography.h2,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    goalLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    saveButtonText: {
      ...Typography.button,
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

            <Text style={styles.title}>Profile</Text>

            {!editMode ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  haptics.medium();
                  setEditMode(true);
                }}
              >
                <Ionicons name="pencil" size={18} color={colors.text} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.success }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="checkmark" size={18} color={colors.text} />
                <Text style={styles.editButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {editMode && (
                <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                  <Ionicons name="camera" size={18} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {editMode ? (
              <TextInput
                style={[styles.input, { width: '100%', textAlign: 'center' }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display Name"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.displayName}>{displayName}</Text>
            )}

            <Text style={styles.email}>{user?.email || 'Guest user has no email'}</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user?.isAnonymous ? 'Guest Account' : 'Registered User'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            {editMode ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Occupation</Text>
                  <TextInput
                    style={styles.input}
                    value={occupation}
                    onChangeText={setOccupation}
                    placeholder="e.g., Software Developer"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>
                    {occupation || 'No occupation added yet'}
                  </Text>
                </View>
                <View style={[styles.readOnlyField, { marginTop: Spacing.sm }]}>
                  <Text style={styles.readOnlyText}>{bio || 'No bio added yet'}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goals</Text>

            <View style={styles.goalsContainer}>
              <View style={styles.goalCard}>
                <Text style={styles.goalValue}>{dailyGoal}</Text>
                <Text style={styles.goalLabel}>Daily Goal (min)</Text>
                {editMode && (
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <TouchableOpacity onPress={() => setDailyGoal(Math.max(15, dailyGoal - 15))}>
                      <Ionicons name="remove-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDailyGoal(Math.min(480, dailyGoal + 15))}>
                      <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.goalCard}>
                <Text style={styles.goalValue}>{weeklyGoal}</Text>
                <Text style={styles.goalLabel}>Weekly Goal (min)</Text>
                {editMode && (
                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                    <TouchableOpacity onPress={() => setWeeklyGoal(Math.max(60, weeklyGoal - 60))}>
                      <Ionicons name="remove-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setWeeklyGoal(Math.min(1680, weeklyGoal + 60))}>
                      <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          {editMode && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
