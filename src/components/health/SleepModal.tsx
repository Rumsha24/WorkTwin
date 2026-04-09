import React, { useState } from 'react';
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

interface SleepModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (hours: number, quality: number) => void;
}

export function SleepModal({ visible, onClose, onSave }: SleepModalProps) {
  const { colors } = useTheme();
  const [selectedHours, setSelectedHours] = useState<number | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);

  const hoursOptions = [4, 5, 6, 7, 8, 9, 10];
  const qualityOptions = [
    { value: 4, label: '🌟 Excellent', emoji: '🌟' },
    { value: 3, label: '😊 Good', emoji: '😊' },
    { value: 2, label: '🙂 Fair', emoji: '🙂' },
    { value: 1, label: '😴 Poor', emoji: '😴' },
  ];

  const handleSave = () => {
    if (selectedHours && selectedQuality) {
      onSave(selectedHours, selectedQuality);
      setSelectedHours(null);
      setSelectedQuality(null);
    }
  };

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
    content: {
      padding: Spacing.xl,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    option: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 70,
      alignItems: 'center',
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      ...Typography.body,
      color: colors.text,
    },
    optionTextSelected: {
      color: colors.text,
      fontWeight: '600',
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      ...Typography.button,
      color: colors.text,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>😴 Sleep Log</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Hours of Sleep</Text>
              <View style={styles.optionsGrid}>
                {hoursOptions.map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[styles.option, selectedHours === hours && styles.optionSelected]}
                    onPress={() => setSelectedHours(hours)}
                  >
                    <Text style={[styles.optionText, selectedHours === hours && styles.optionTextSelected]}>
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Sleep Quality</Text>
              <View style={styles.optionsGrid}>
                {qualityOptions.map((quality) => (
                  <TouchableOpacity
                    key={quality.value}
                    style={[styles.option, selectedQuality === quality.value && styles.optionSelected]}
                    onPress={() => setSelectedQuality(quality.value)}
                  >
                    <Text style={[styles.optionText, selectedQuality === quality.value && styles.optionTextSelected]}>
                      {quality.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, (!selectedHours || !selectedQuality) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!selectedHours || !selectedQuality}
              >
                <Text style={styles.saveButtonText}>Save Sleep Log</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}