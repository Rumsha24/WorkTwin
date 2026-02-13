import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function DashboardScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WorkTwin</Text>
      <Text style={styles.sub}>Your daily focus & tasks overview</Text>

      <View style={styles.grid}>
        <Card
          icon="checkbox-outline"
          title="Tasks"
          desc="Manage your to-dos"
          onPress={() => navigation.navigate("Tasks")}
        />
        <Card
          icon="timer-outline"
          title="Focus"
          desc="Start a session"
          onPress={() => navigation.navigate("Timer")}
        />
        <Card
          icon="bar-chart-outline"
          title="Insights"
          desc="See your stats"
          onPress={() => navigation.navigate("Insights")}
        />
        <Card
          icon="settings-outline"
          title="Settings"
          desc="Account & app"
          onPress={() => navigation.navigate("Settings")}
        />
      </View>

      <View style={styles.bigCard}>
        <Text style={styles.bigTitle}>Today</Text>
        <Text style={styles.bigText}>• 0 min focused</Text>
        <Text style={styles.bigText}>• 0 tasks completed</Text>
        <Text style={styles.bigHint}>Once tasks + timer are connected, this updates automatically.</Text>
      </View>
    </View>
  );
}

function Card({ icon, title, desc, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Ionicons name={icon} size={26} color="#A78BFA" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 18 },
  title: { color: "white", fontSize: 34, fontWeight: "900", marginTop: 8 },
  sub: { color: "#94A3B8", marginTop: 6, marginBottom: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "48%",
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cardTitle: { color: "#E5E7EB", fontSize: 16, fontWeight: "800", marginTop: 10 },
  cardDesc: { color: "#94A3B8", marginTop: 4, fontSize: 12 },
  bigCard: {
    marginTop: 16,
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  bigTitle: { color: "#E5E7EB", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  bigText: { color: "#CBD5E1", marginTop: 6, fontSize: 14 },
  bigHint: { color: "#64748B", marginTop: 10, fontSize: 12 },
});
