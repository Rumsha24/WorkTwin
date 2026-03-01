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
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, padding: Spacing.lg },
    title: { ...Typography.h1, color: colors.text, marginBottom: Spacing.lg },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    profileInfo: { marginLeft: Spacing.lg, flex: 1 },
    profileName: { ...Typography.body, fontWeight: "600", color: colors.text, marginBottom: Spacing.xs },
    profileBadge: {
      ...Typography.caption,
      backgroundColor: colors.primary + "20",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
      alignSelf: "flex-start",
      color: colors.primary,
    },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.md },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    settingLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    settingText: { ...Typography.body, color: colors.text },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    menuLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    menuText: { ...Typography.body, color: colors.textSecondary },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.md,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      ...Shadows.small,
    },
    logoutText: { color: colors.text, fontSize: 18, fontWeight: "600" },
    version: { textAlign: "center", color: colors.textMuted, fontSize: 12 },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>

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
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name={isDarkMode ? "moon" : "sunny-outline"} size={22} color={colors.primary} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <View style={styles.menuLeft}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <Text style={[styles.menuText, { color: colors.danger }]}>Clear Local Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="information-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>About WorkTwin</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.text} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}