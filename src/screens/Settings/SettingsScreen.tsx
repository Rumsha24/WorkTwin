import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";

export default function SettingsScreen() {
  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert("Logout Error", e?.message ?? "Unknown error");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>
          {auth.currentUser?.isAnonymous ? "Guest" : auth.currentUser?.email ?? "User"}
        </Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 16 },
  title: { color: "white", fontSize: 26, fontWeight: "900", marginBottom: 12 },
  card: { backgroundColor: "#111827", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#1F2937", marginBottom: 14 },
  label: { color: "#94A3B8" },
  value: { color: "#E5E7EB", fontWeight: "900", marginTop: 6 },
  logout: { backgroundColor: "#EF4444", paddingVertical: 14, borderRadius: 18, alignItems: "center" },
  logoutText: { color: "white", fontWeight: "900", fontSize: 16 },
});
