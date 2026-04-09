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
import { Medicine } from '../../hooks/useHealth';

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
      color