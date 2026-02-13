import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert("Register Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#9aa4b2"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#9aa4b2"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={register}>
        <Text style={styles.primaryText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    justifyContent: "center",
    padding: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#EAF0FF",
    textAlign: "center",
    marginBottom: 22,
  },
  input: {
    backgroundColor: "#101A2E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    color: "#EAF0FF",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#3949AB",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
  },
  link: {
    color: "#A9B3CC",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
  },
});
