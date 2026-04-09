import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';

interface Medicine {
  id: string;
  name: string;
  time: string;
  dosage: string;
  taken: boolean;
}

interface MedicineModalProps {
  visible: boolean;
  onClose: () => void;
  medicines: Medicine[];
  onTakeMedicine: (id: string) => void;
  onDeleteMedicine: (id: string) => void;
  onAddPress: () => void;
}

export function MedicineModal({
  visible,
  onClose,
  medicines,
  onTakeMedicine,
  onDeleteMedicine,
  onAddPress,
}: MedicineModalProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      width: '90%',
      maxHeight: '85%',
      ...Shadows.large,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...Typography.h2,
      color: colors.text,
      fontSize: 20,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    emptyContainer: {
      padding: Spacing.xxxl,
      alignItems: 'center',
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    medicineList: {
      padding: Spacing.md,
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
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    takeButton: {
      backgroundColor: colors.success,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
    },
    takeButtonDisabled: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    takeText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      margin: Spacing.md,
    },
    addButtonText: {
      ...Typography.button,
      color: colors.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>💊 Medicines</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.medicineList}>
            {medicines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No medicine reminders yet.</Text>
              </View>
            ) : (
              medicines.map((med) => (
                <View key={med.id} style={styles.medicineItem}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineDosage}>{med.dosage}</Text>
                    <Text style={styles.medicineTime}>⏰ {med.time}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.takeButton, med.taken && styles.takeButtonDisabled]}
                      onPress={() => !med.taken && onTakeMedicine(med.id)}
                      disabled={med.taken}
                    >
                      <Text style={styles.takeText}>{med.taken ? '✓ Taken' : 'Take'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteMedicine(med.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Text style={styles.addButtonText}>+ Add Medicine</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
