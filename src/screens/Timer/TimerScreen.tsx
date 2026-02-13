import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function TimerScreen() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Timer</Text>
      <View style={styles.clock}>
        <Text style={styles.time}>{mm}:{ss}</Text>
        <Text style={styles.sub}>Pomodoro 25:00 (edit later)</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, running && styles.btnGhost]} onPress={() => setRunning(!running)}>
          <Text style={[styles.btnText, running && styles.btnTextGhost]}>{running ? "Pause" : "Start"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={() => { setRunning(false); setSeconds(25 * 60); }}>
          <Text style={[styles.btnText, styles.btnTextGhost]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Next: link timer session to selected task + save to Firestore.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 18, alignItems: "center", justifyContent: "center" },
  title: { color: "white", fontSize: 26, fontWeight: "900", marginBottom: 22 },
  clock: { backgroundColor: "#111827", borderRadius: 24, padding: 22, borderWidth: 1, borderColor: "#1F2937", width: "100%", alignItems: "center" },
  time: { color: "#E5E7EB", fontSize: 54, fontWeight: "900" },
  sub: { color: "#94A3B8", marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  btn: { backgroundColor: "#4F46E5", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16 },
  btnGhost: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" },
  btnText: { color: "white", fontWeight: "900" },
  btnTextGhost: { color: "#E5E7EB" },
  hint: { color: "#64748B", marginTop: 16, textAlign: "center" },
});
