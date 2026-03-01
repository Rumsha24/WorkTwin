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
    }
  };

  return (
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
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
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
