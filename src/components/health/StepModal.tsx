import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';

interface StepModalProps {
  visible: boolean;
  onClose: () => void;
  currentSteps: number;
  currentGoal: number;
  stepProgress: number;
  onUpdateSteps: (steps: number) => void;
  onUpdateGoal: (goal: number) => void;
}

export function StepModal({
  visible,
  onClose,
  currentSteps,
  currentGoal,
  stepProgress,
  onUpdateSteps,
  onUpdateGoal,
}: StepModalProps) {
  const { colors } = useTheme();
  const [stepInput, setStepInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  const handleUpdateSteps = () => {
    const steps = parseInt(stepInput);
    if (!isNaN(steps) && steps >= 0) {
      onUpdateSteps(steps);
      setStepInput('');
    }
  };

  const handleUpdateGoal = () => {
    const goal = parseInt(goalInput);
    if (!isNaN(goal) && goal >= 100) {
      onUpdateGoal(goal);
      setGoalInput('');
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
    statsContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    currentSteps: {
      ...Typography.h1,
      fontSize: 48,
      color: colors.primary,
    },
    goalText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginVertical: Spacing.md,
      width: '100%',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
    progressPercent: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      color: colors.text,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      ...Typography.button,
      color: colors.text,
    },
    buttonTextSecondary: {
      color: colors.textSecondary,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>👟 Step Tracker</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.statsContainer}>
                <Text style={styles.currentSteps}>{currentSteps.toLocaleString()}</Text>
                <Text style={styles.goalText}>Goal: {currentGoal.toLocaleString()} steps</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${stepProgress}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{stepProgress}% of daily goal</Text>
              </View>

              <Text style={styles.sectionTitle}>Update Today's Steps</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter step count"
                placeholderTextColor={colors.textMuted}
                value={stepInput}
                onChangeText={setStepInput}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.button} onPress={handleUpdateSteps}>
                <Text style={styles.buttonText}>Update Steps</Text>
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>Set Daily Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter step goal"
                placeholderTextColor={colors.textMuted}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
              />
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleUpdateGoal}>
                <Text style={styles.buttonTextSecondary}>Update Goal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}