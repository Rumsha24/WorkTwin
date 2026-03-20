<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { clearAllData } from '../../utils/storage';
import { exportService } from '../../services/exportService';
import { haptics } from '../../utils/haptics';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [appVersion] = useState('2.0.0');

  const email = auth.currentUser?.isAnonymous
    ? 'Guest User'
    : auth.currentUser?.email ?? 'Unknown';

  useEffect(() => {
    loadNotificationPreference();
  }, []);

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

  const handleNotificationToggle = async (value: boolean) => {
    haptics.switch();
    setNotifications(value);
    try {
      await AsyncStorage.setItem('notifications_enabled', value.toString());
      Alert.alert('Notifications', value ? 'Notifications enabled' : 'Notifications disabled', [
        { text: 'OK' },
      ]);
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
          haptics.medium();
          await clearAllData();
          await signOut(auth);
        },
      },
    ]);
  };

  const handleClearData = () => {
    haptics.warning();
    Alert.alert(
      'Clear Data',
      'This will delete all your tasks and focus sessions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            haptics.heavy();
            const success = await clearAllData();
            if (success) {
              haptics.success();
              Alert.alert('Success', 'All local data has been cleared');
=======
// src/screens/Settings/SettingsScreen.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { clearAllData } from "../../utils/storage";

export default function SettingsScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  
  const email = auth.currentUser?.isAnonymous
    ? "Guest User"
    : auth.currentUser?.email ?? "Unknown";

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            await signOut(auth);
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear Data",
      "This will delete all your tasks and focus sessions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              Alert.alert("Success", "All local data has been cleared");
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
            }
          },
        },
      ]
    );
  };

<<<<<<< HEAD
  const handleExportData = () => {
    haptics.medium();
    Alert.alert('Export Data', 'Choose export format', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'JSON',
        onPress: async () => {
          haptics.medium();
          const path = await exportService.exportData('json');
          if (path) {
            haptics.success();
            Alert.alert('Success', 'Data exported successfully');
          }
        },
      },
      {
        text: 'CSV',
        onPress: async () => {
          haptics.medium();
          const path = await exportService.exportData('csv');
          if (path) {
            haptics.success();
            Alert.alert('Success', 'Data exported successfully');
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

      haptics.medium();
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
      console.error('Error importing:', error);
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@worktwin.com');
    setHelpModalVisible(false);
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://www.worktwin.com');
    setHelpModalVisible(false);
  };

=======
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    title: { ...Typography.h1, color: colors.text, marginBottom: Spacing.lg },
    profileCard: {
<<<<<<< HEAD
      flexDirection: 'row',
      alignItems: 'center',
=======
      flexDirection: "row",
      alignItems: "center",
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    profileInfo: { marginLeft: Spacing.lg, flex: 1 },
<<<<<<< HEAD
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
=======
    profileName: { ...Typography.body, fontWeight: "600", color: colors.text, marginBottom: Spacing.xs },
    profileBadge: {
      ...Typography.caption,
      backgroundColor: colors.primary + "20",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
      alignSelf: "flex-start",
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
      color: colors.primary,
    },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.md },
    settingItem: {
<<<<<<< HEAD
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
=======
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
<<<<<<< HEAD
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    settingText: { ...Typography.body, color: colors.text },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
=======
    settingLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    settingText: { ...Typography.body, color: colors.text },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
<<<<<<< HEAD
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    menuText: { ...Typography.body, color: colors.textSecondary },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
=======
    menuLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    menuText: { ...Typography.body, color: colors.textSecondary },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
      backgroundColor: colors.danger,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      ...Shadows.small,
    },
<<<<<<< HEAD
    logoutText: { color: colors.text, fontSize: 18, fontWeight: '600' },
    version: { textAlign: 'center', color: colors.textMuted, fontSize: 12 },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: '100%',
      maxHeight: '80%',
      ...Shadows.medium,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    modalTitle: { ...Typography.h2, color: colors.text },
    closeButton: {
      padding: Spacing.xs,
    },
    modalBody: {
      marginBottom: Spacing.lg,
    },
    modalText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 22,
    },
    modalSection: {
      marginBottom: Spacing.lg,
    },
    modalSectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
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
    actionButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    actionButtonText: {
      ...Typography.button,
      color: colors.text,
    },
    secondaryActionButton: {
      backgroundColor: colors.surface,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryActionButtonText: {
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
=======
    logoutText: { color: colors.text, fontSize: 18, fontWeight: "600" },
    version: { textAlign: "center", color: colors.textMuted, fontSize: 12 },
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>

<<<<<<< HEAD
          {/* Profile Card */}
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => {
              haptics.light();
              if (auth.currentUser?.isAnonymous) {
                Alert.alert(
                  'Guest Account',
                  'Guest users cannot access profile. Please register to create a profile.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Register',
                      onPress: () => navigation.navigate('Auth', { screen: 'Register' }),
                    },
                  ]
                );
              } else {
                navigation.navigate('Profile');
              }
            }}
          >
            <Ionicons name="person-circle" size={60} color={colors.primary} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{email}</Text>
              <Text style={styles.profileBadge}>
                {auth.currentUser?.isAnonymous ? 'Guest Account' : 'Registered User'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

=======
          <View style={styles.profileCard}>
            <Ionicons name="person-circle" size={60} color={colors.primary} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{email}</Text>
              <Text style={[styles.profileBadge, { color: colors.primary }]}>
                {auth.currentUser?.isAnonymous ? "Guest Account" : "Registered User"}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
<<<<<<< HEAD
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
                ios_backgroundColor={colors.border}
=======
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
<<<<<<< HEAD
                <Ionicons name={isDarkMode ? 'moon' : 'sunny-outline'} size={22} color={colors.primary} />
=======
                <Ionicons name={isDarkMode ? "moon" : "sunny-outline"} size={22} color={colors.primary} />
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
<<<<<<< HEAD
                onValueChange={() => {
                  haptics.switch();
                  toggleTheme();
                }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
                ios_backgroundColor={colors.border}
=======
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
              />
            </View>
          </View>

<<<<<<< HEAD
          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <TouchableOpacity
              style={[styles.menuItem, { opacity: auth.currentUser?.isAnonymous ? 0.5 : 1 }]}
              onPress={() => {
                haptics.light();
                if (auth.currentUser?.isAnonymous) {
                  Alert.alert(
                    'Guest Account',
                    'Please register to change your password',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Register', onPress: () => navigation.navigate('Auth', { screen: 'Register' }) },
                    ]
                  );
                } else {
                  navigation.navigate('ChangePassword');
                }
              }}
              disabled={auth.currentUser?.isAnonymous}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
                <Text style={styles.menuText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Data Management Section */}
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

=======
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <View style={styles.menuLeft}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>Clear Local Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

<<<<<<< HEAD
          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
=======
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <TouchableOpacity style={styles.menuItem}>
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

<<<<<<< HEAD
            <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
=======
            <TouchableOpacity style={styles.menuItem}>
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>About WorkTwin</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

<<<<<<< HEAD
          {/* Logout Button */}
=======
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.text} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

<<<<<<< HEAD
          <Text style={styles.version}>Version {appVersion}</Text>
        </View>
      </ScrollView>

      {/* Help & Support Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={helpModalVisible}
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setHelpModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Frequently Asked Questions</Text>

                  <View style={styles.bulletPoint}>
                    <Ionicons name="help-circle" size={20} color={colors.primary} />
                    <Text style={styles.bulletText}>How do I add a task? Tap the + button on Tasks screen</Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <Ionicons name="help-circle" size={20} color={colors.primary} />
                    <Text style={styles.bulletText}>How do I start a timer? Go to Timer screen and tap Start</Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <Ionicons name="help-circle" size={20} color={colors.primary} />
                    <Text style={styles.bulletText}>How do I export my data? Settings → Data Management → Export</Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <Ionicons name="help-circle" size={20} color={colors.primary} />
                    <Text style={styles.bulletText}>How do I change theme? Settings → Preferences → Dark Mode</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact Us</Text>
                  <Text style={styles.modalText}>
                    Having issues? We're here to help! Reach out to our support team.
                  </Text>

                  <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
                    <Text style={styles.actionButtonText}>Email Support</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryActionButton} onPress={handleVisitWebsite}>
                    <Text style={styles.secondaryActionButtonText}>Visit Website</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={aboutModalVisible}
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About WorkTwin</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAboutModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalBody}>
                <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
                  <Ionicons name="timer-outline" size={80} color={colors.primary} />
                  <Text style={[styles.modalTitle, { fontSize: 32, marginTop: Spacing.sm }]}>WorkTwin</Text>
                  <Text style={[styles.modalText, { textAlign: 'center' }]}>Version {appVersion}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Our Mission</Text>
                  <Text style={styles.modalText}>
                    WorkTwin helps you stay focused and productive with smart task management and focus timers.
                    Track your progress, analyze your productivity, and achieve your goals.
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Key Features</Text>

                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkbox-outline" size={20} color={colors.success} />
                      <Text style={styles.featureText}>Task Management with categories & priorities</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Ionicons name="timer-outline" size={20} color={colors.primary} />
                      <Text style={styles.featureText}>Focus Timer with interruptions tracking</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Ionicons name="trending-up" size={20} color={colors.accent} />
                      <Text style={styles.featureText}>Productivity Insights & Analytics</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Ionicons name="cloud-offline-outline" size={20} color={colors.warning} />
                      <Text style={styles.featureText}>Offline Support with auto-sync</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Ionicons name="color-palette-outline" size={20} color={colors.secondary} />
                      <Text style={styles.featureText}>Light & Dark Theme</Text>
                    </View>

                    <View style={styles.featureItem}>
                      <Ionicons name="download-outline" size={20} color={colors.info} />
                      <Text style={styles.featureText}>Export/Import Data (JSON/CSV)</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Developer</Text>
                  <Text style={styles.modalText}>Created with ❤️ by Team 3</Text>
                  <Text style={[styles.modalText, { marginTop: Spacing.xs }]}>© 2026 WorkTwin. All rights reserved.</Text>
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={() => setAboutModalVisible(false)}>
                  <Text style={styles.actionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
=======
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    </SafeAreaView>
  );
}