import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import { haptics } from '../../utils/haptics';

interface Medicine {
  id: string;
  name: string;
  time: string;
  dosage: string;
  taken: boolean;
  notificationId?: string | null;
}

interface MedicineReminderProps {
  medicines: Medicine[];
  visible: boolean;
  onClose: () => void;
  onAddMedicine: (name: string, time: string, dosage: string) => Promise<void> | void;
  onTakeMedicine: (id: string) => Promise<void> | void;
  onDeleteMedicine: (id: string) => Promise<void> | void;
}

export function MedicineReminder({
  medicines,
  visible,
  onClose,
  onAddMedicine,
  onTakeMedicine,
  onDeleteMedicine,
}: MedicineReminderProps) {
  const { colors } = useTheme();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDosage, setNewDosage] = useState('');

  const handleAdd = async () => {
    if (!newName || !newTime || !newDosage) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    haptics.success();
    await onAddMedicine(newName, newTime, newDosage);
    setNewName('');
    setNewTime('');
    setNewDosage('');
    setShowAddModal(false);
  };

  const handleTake = async (id: string) => {
    haptics.medium();
    await onTakeMedicine(id);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            haptics.heavy();
            await onDeleteMedicine(id);
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
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
    modalTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: Spacing.xl,
    },
    medicineList: {
      marginBottom: Spacing.lg,
    },
    medicineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    medicineInfo: {
      flex: 1,
    },
    medicineName: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    medicineDosage: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    medicineTime: {
      ...Typography.caption,
      color: colors.primary,
    },
    takenBtn: {
      backgroundColor: colors.success,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
    },
    takenText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    takenDisabled: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deleteBtn: {
      padding: Spacing.sm,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    addButtonText: {
      ...Typography.button,
      color: colors.text,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      color: colors.text,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveBtn: {
      backgroundColor: colors.primary,
    },
    cancelText: {
      color: colors.textSecondary,
    },
    saveText: {
      color: colors.text,
    },
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💊 Medicine Reminders</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.medicineList}>
              {medicines.length === 0 ? (
                <Text style={styles.emptyText}>No medicines added yet.</Text>
              ) : (
                medicines.map((med) => (
                  <View key={med.id} style={styles.medicineItem}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{med.name}</Text>
                      <Text style={styles.medicineDosage}>{med.dosage}</Text>
                      <Text style={styles.medicineTime}>⏰ {med.time}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {!med.taken ? (
                        <TouchableOpacity
                          style={styles.takenBtn}
                          onPress={() => handleTake(med.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.takenText}>Take</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.takenBtn, styles.takenDisabled]}>
                          <Text style={[styles.takenText, { color: colors.textMuted }]}>✓ Taken</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(med.id, med.name)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
              <Text style={styles.addButtonText}>+ Add Medicine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Add Medicine</Text>
            <TextInput
              style={styles.input}
              placeholder="Medicine Name"
              placeholderTextColor={colors.textMuted}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={styles.input}
              placeholder="Time (e.g., 9:00 AM)"
              placeholderTextColor={colors.textMuted}
              value={newTime}
              onChangeText={setNewTime}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g., 1 tablet)"
              placeholderTextColor={colors.textMuted}
              value={newDosage}
              onChangeText={setNewDosage}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveBtn]}
                onPress={handleAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}