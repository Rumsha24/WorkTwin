import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Modal,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

import { auth } from '../../services/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { clearAllData } from '../../utils/storage';
import { exportService } from '../../services/exportService';
import { haptics } from '../../utils/haptics';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);

  const email = auth.currentUser?.isAnonymous
    ? 'Guest User'
    : auth.currentUser?.email ?? 'Unknown';

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileCard();
    }, [auth.currentUser?.uid])
  );

  const loadNotificationPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('notifications_enabled');
      if (saved !== null) {
        setNotifications(saved === 'true');
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const loadProfileCard = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      setProfilePhotoURL(null);
      setProfileDisplayName(null);
      return;
    }

    try {
      const saved = await AsyncStorage.getItem(`profile:${currentUser.uid}`);
      const profile = saved ? JSON.parse(saved) : null;
      setProfilePhotoURL(profile?.photoURL || currentUser.photoURL || null);
      setProfileDisplayName(
        profile?.displayName ||
          currentUser.displayName ||
          currentUser.email ||
          (currentUser.isAnonymous ? 'Guest User' : null)
      );
    } catch (error) {
      console.error('Error loading profile card:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    haptics.switch();
    setNotifications(value);

    try {
      await AsyncStorage.setItem('notifications_enabled', value.toString());
      Alert.alert(
        'Notifications',
        value ? 'Notifications enabled' : 'Notifications disabled'
      );
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const handleLogout = () => {
    haptics.heavy();
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            haptics.medium();
            await clearAllData();
            await signOut(auth);
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleClearData = () => {
    haptics.warning();
    Alert.alert(
      'Clear Data',
      'This will delete all your local tasks and focus sessions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              haptics.heavy();
              const success = await clearAllData();
              if (success) {
                haptics.success();
                Alert.alert('Success', 'All local data has been cleared');
              } else {
                Alert.alert('Error', 'Failed to clear data');
              }
            } catch (error) {
              console.error('Clear data error:', error);
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    haptics.medium();
    Alert.alert('Export Data', 'Choose export format', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'JSON',
        onPress: async () => {
          try {
            const path = await exportService.exportData('json');
            if (path) {
              haptics.success();
              Alert.alert('Success', 'Data exported successfully');
            } else {
              Alert.alert('Error', 'Export failed');
            }
          } catch (error) {
            console.error('JSON export error:', error);
            Alert.alert('Error', 'Export failed');
          }
        },
      },
      {
        text: 'CSV',
        onPress: async () => {
          try {
            const path = await exportService.exportData('csv');
            if (path) {
              haptics.success();
              Alert.alert('Success', 'Data exported successfully');
            } else {
              Alert.alert('Error', 'Export failed');
            }
          } catch (error) {
            console.error('CSV export error:', error);
            Alert.alert('Error', 'Export failed');
          }
        },
      },
    ]);
  };

  const handleImportData = async () => {
    haptics.medium();

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const success = await exportService.importFromFile(result.assets[0].uri);

      if (success) {
        haptics.success();
        Alert.alert('Success', 'Data imported successfully');
      } else {
        haptics.error();
        Alert.alert('Error', 'Failed to import data');
      }
    } catch (error) {
      haptics.error();
      console.error('Error importing data:', error);
      Alert.alert('Error', 'Failed to import data');
    }
  };

  const handleHelpSupport = () => {
    haptics.light();
    setHelpModalVisible(true);
  };

  const handleAbout = () => {
    haptics.light();
    setAboutModalVisible(true);
  };

  const handleContactSupport = async () => {
    try {
      await Linking.openURL('mailto:support@worktwin.com');
    } catch {
      Alert.alert('Error', 'Unable to open email app');
    }
  };

  const handleVisitWebsite = async () => {
    try {
      await Linking.openURL('https://www.worktwin.com');
    } catch {
      Alert.alert('Error', 'Unable to open website');
    }
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    title: { ...Typography.h1, color: colors.text, marginBottom: Spacing.lg },

    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    profileInfo: { marginLeft: Spacing.lg, flex: 1 },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surface,
    },
    profileName: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    profileBadge: {
      ...Typography.caption,
      backgroundColor: colors.primary + '20',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
      alignSelf: 'flex-start',
      color: colors.primary,
    },

    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },

    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    settingText: { ...Typography.body, color: colors.text },

    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    menuText: { ...Typography.body, color: colors.textSecondary },

    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.danger,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      ...Shadows.small,
    },
    logoutText: { color: colors.text, fontSize: 18, fontWeight: '600' },
    version: { textAlign: 'center', color: colors.textMuted, fontSize: 12 },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      ...Shadows.medium,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    modalTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    modalText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 22,
    },
    modalButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    modalButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    modalButtonText: {
      ...Typography.button,
      color: colors.text,
    },
    modalButtonSecondaryText: {
      ...Typography.button,
      color: colors.textSecondary,
    },
    featureList: {
      marginTop: Spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.md,
    },
    featureText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    bulletPoint: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    bulletText: {
      ...Typography.body,
      color: colors.textSecondary,
      flex: 1,
    },
    modalSection: {
      marginBottom: Spacing.lg,
    },
    modalSectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>

          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => {
              haptics.light();
              if (auth.currentUser?.isAnonymous) {
                Alert.alert(
                  'Guest Account',
                  'Guest users cannot open profile. Please register first.'
                );
                return;
              }
              navigation.navigate('Profile');
            }}
          >
            {profilePhotoURL ? (
              <Image source={{ uri: profilePhotoURL }} style={styles.profileAvatar} />
            ) : (
              <Ionicons name="person-circle" size={60} color={colors.primary} />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileDisplayName || email}</Text>
              <Text style={styles.profileBadge}>
                {auth.currentUser?.isAnonymous ? 'Guest Account' : 'Registered User'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
                ios_backgroundColor={colors.border}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={isDarkMode ? 'moon' : 'sunny-outline'}
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={() => {
                  haptics.switch();
                  toggleTheme();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <TouchableOpacity
              style={[
                styles.menuItem,
                auth.currentUser?.isAnonymous ? { opacity: 0.5 } : null,
              ]}
              disabled={auth.currentUser?.isAnonymous}
              onPress={() => {
                haptics.light();
                navigation.navigate('ChangePassword');
              }}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
                <Text style={styles.menuText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
              <View style={styles.menuLeft}>
                <Ionicons name="download-outline" size={22} color={colors.primary} />
                <Text style={styles.menuText}>Export Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
              <View style={styles.menuLeft}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <Text style={styles.menuText}>Import Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <View style={styles.menuLeft}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>
                  Clear Local Data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
              <View style={styles.menuLeft}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color={colors.textSecondary}
                />
                <Text style={styles.menuText}>About WorkTwin</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.text} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 2.0.0</Text>
        </View>
      </ScrollView>

      {/* Help & Support Modal */}
      <Modal visible={helpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Help & Support</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
                  <Ionicons name="bulb-outline" size={60} color={colors.primary} />
                  <Text style={[styles.modalTitle, { fontSize: 24, marginTop: Spacing.sm }]}>
                    How can we help?
                  </Text>
                  <Text style={[styles.modalText, { textAlign: 'center' }]}>
                    Everything you need to know about WorkTwin
                  </Text>
                </View>

                <Text style={styles.modalSectionTitle}>📌 Frequently Asked Questions</Text>

                <View style={styles.bulletPoint}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '600' }}>How do I add a task?</Text>{'\n'}
                    Tap the + button on the Tasks screen, fill in the details, and save. You can add categories, priorities, due dates, and even set reminders!
                  </Text>
                </View>

                <View style={styles.bulletPoint}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '600' }}>How does the focus timer work?</Text>{'\n'}
                    Select your desired focus duration, optionally link it to a task, and tap Start. You can log interruptions and rate your productivity after each session.
                  </Text>
                </View>

                <View style={styles.bulletPoint}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '600' }}>Can I use the app offline?</Text>{'\n'}
                    Yes! WorkTwin works offline. Your tasks and focus sessions are saved locally and automatically sync when you're back online.
                  </Text>
                </View>

                <View style={styles.bulletPoint}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '600' }}>How do I export my data?</Text>{'\n'}
                    Go to Settings → Data Management → Export Data, and choose JSON or CSV format. Your data will be saved and shared via the iOS share sheet.
                  </Text>
                </View>

                <View style={styles.bulletPoint}>
                  <Ionicons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: '600' }}>How do I change the theme?</Text>{'\n'}
                    Go to Settings → Preferences → Dark Mode toggle. You can switch between light and dark themes anytime.
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💬 Need More Help?</Text>
                <Text style={styles.modalText}>
                  Our support team is here to assist you. Whether you have questions, feedback, or need technical support, we're just an email away.
                </Text>

                <TouchableOpacity style={styles.modalButton} onPress={handleContactSupport}>
                  <Ionicons name="mail-outline" size={20} color={colors.text} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.modalButtonText}>Email Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={handleVisitWebsite}
                >
                  <Ionicons name="globe-outline" size={20} color={colors.textSecondary} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.modalButtonSecondaryText}>Visit Website</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal visible={aboutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ℹ️ About WorkTwin</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
                  <Ionicons name="timer-outline" size={80} color={colors.primary} />
                  <Text style={[styles.modalTitle, { fontSize: 32, marginTop: Spacing.sm }]}>WorkTwin</Text>
                  <Text style={[styles.modalText, { textAlign: 'center' }]}>Version 2.0.0</Text>
                  <View style={[styles.profileBadge, { marginTop: Spacing.md }]}>
                    <Text style={{ color: colors.primary }}>✨ Productivity Reimagined</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>🎯 Our Mission</Text>
                <Text style={styles.modalText}>
                  WorkTwin is designed to help you achieve more by combining powerful task management with focused work sessions. We believe that productivity isn't just about doing more — it's about doing what matters with intention and clarity.
                </Text>

                <Text style={styles.modalSectionTitle}>⭐ Key Features</Text>
                <View style={styles.featureList}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkbox-outline" size={20} color={colors.success} />
                    <Text style={styles.featureText}>Smart Task Management with categories & priorities</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="timer-outline" size={20} color={colors.primary} />
                    <Text style={styles.featureText}>Focus Timer with real-time interruption tracking</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="trending-up" size={20} color={colors.accent} />
                    <Text style={styles.featureText}>Productivity Insights & Visual Analytics</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="cloud-offline-outline" size={20} color={colors.warning} />
                    <Text style={styles.featureText}>Offline Support with Auto-Sync</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="color-palette-outline" size={20} color={colors.secondary} />
                    <Text style={styles.featureText}>Light & Dark Theme Support</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="download-outline" size={20} color={colors.info} />
                    <Text style={styles.featureText}>Export/Import Data (JSON & CSV)</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="notifications-outline" size={20} color={colors.warning} />
                    <Text style={styles.featureText}>Smart Reminders & Notifications</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="analytics-outline" size={20} color={colors.accent} />
                    <Text style={styles.featureText}>Detailed Session History & Trends</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>📱 Built With</Text>
                <Text style={styles.modalText}>
                  • React Native & Expo • Firebase Authentication & Firestore • React Navigation • AsyncStorage • React Native Chart Kit • Expo Haptics
                </Text>

                <Text style={styles.modalSectionTitle}>👨‍💻 Developer</Text>
                <Text style={styles.modalText}>Created with ❤️ by Team 3 — Capstone Project</Text>
                <Text style={[styles.modalText, { marginTop: Spacing.xs }]}>© 2026 WorkTwin. All rights reserved.</Text>

                <View style={[styles.featureList, { marginTop: Spacing.md }]}>
                  <View style={styles.featureItem}>
                    <Ionicons name="star" size={16} color={colors.warning} />
                    <Text style={styles.featureText}>Rate us on the App Store</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="git-branch" size={16} color={colors.primary} />
                    <Text style={styles.featureText}>Open Source on GitHub</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="heart" size={16} color={colors.danger} />
                    <Text style={styles.featureText}>Made with passion for productivity</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setAboutModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>✨ Discover Your Focus ✨</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
