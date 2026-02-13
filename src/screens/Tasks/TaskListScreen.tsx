import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from "react-native";

type Task = { id: string; title: string; category: string; done: boolean };

const categories = ["Study", "Work", "Personal", "Health", "Daily"];

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const completed = useMemo(() => tasks.filter(t => t.done).length, [tasks]);

  function addTask() {
    if (!title.trim()) return;
    const newTask: Task = { id: String(Date.now()), title: title.trim(), category, done: false };
    setTasks(prev => [newTask, ...prev]);
    setTitle("");
    setCategory(categories[0]);
    setOpen(false);
  }

  function toggleDone(id: string) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.sub}>{completed}/{tasks.length} completed</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setOpen(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={styles.empty}>No tasks yet. Add one!</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.task} onPress={() => toggleDone(item.id)} activeOpacity={0.85}>
            <View style={[styles.dot, item.done && { opacity: 0.35 }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, item.done && styles.done]}>{item.title}</Text>
              <Text style={styles.taskMeta}>{item.category}</Text>
            </View>
            <Text style={[styles.badge, item.done ? styles.badgeDone : styles.badgePending]}>
              {item.done ? "Done" : "Pending"}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Task</Text>

            <TextInput
              placeholder="Task title"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={addTask}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>Firestore sync will be added next.</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: "white", fontSize: 26, fontWeight: "900" },
  sub: { color: "#94A3B8", marginTop: 4 },
  addBtn: { backgroundColor: "#4F46E5", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: "white", fontWeight: "800" },
  empty: { color: "#64748B", marginTop: 30, textAlign: "center" },

  task: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 99, backgroundColor: "#A78BFA" },
  taskTitle: { color: "#E5E7EB", fontSize: 16, fontWeight: "800" },
  taskMeta: { color: "#94A3B8", marginTop: 4, fontSize: 12 },
  done: { textDecorationLine: "line-through", color: "#64748B" },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: "hidden", fontSize: 12, fontWeight: "800" },
  badgePending: { backgroundColor: "#0F172A", color: "#E5E7EB", borderWidth: 1, borderColor: "#1F2937" },
  badgeDone: { backgroundColor: "#052e16", color: "#86efac", borderWidth: 1, borderColor: "#14532d" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", backgroundColor: "#0F172A", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#1F2937" },
  modalTitle: { color: "white", fontSize: 20, fontWeight: "900", marginBottom: 12 },
  input: { backgroundColor: "#111827", color: "#E5E7EB", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#1F2937" },
  label: { color: "#94A3B8", marginTop: 12, marginBottom: 8, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "#1F2937", backgroundColor: "#111827" },
  chipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipText: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "white" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  cancel: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1F2937" },
  cancelText: { color: "#E5E7EB", fontWeight: "800" },
  save: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#4F46E5" },
  saveText: { color: "white", fontWeight: "900" },
  hint: { color: "#64748B", marginTop: 10, fontSize: 12 },
});
