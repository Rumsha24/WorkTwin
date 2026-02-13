import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Insights</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This Week</Text>
        <Text style={styles.cardText}>• Focus time: 0 min</Text>
        <Text style={styles.cardText}>• Sessions: 0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>By Category</Text>
        <Text style={styles.cardText}>Study / Work / Personal / Health / Daily</Text>
      </View>

      <Text style={styles.hint}>Next: build “Health app style” charts from Firestore sessions.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 16 },
  title: { color: "white", fontSize: 26, fontWeight: "900", marginBottom: 12 },
  card: { backgroundColor: "#111827", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#1F2937", marginBottom: 12 },
  cardTitle: { color: "#E5E7EB", fontSize: 16, fontWeight: "900", marginBottom: 8 },
  cardText: { color: "#CBD5E1", marginTop: 4 },
  hint: { color: "#64748B", marginTop: 6 },
});
