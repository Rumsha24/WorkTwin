import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Task } from '../../utils/types';
import { Spacing, Typography, BorderRadius, Shadows } from '../../theme/worktwinTheme';
import { CategoryBadge } from './CategoryBadge';
import { formatDateTime } from '../../utils/storage';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onLongPress?: () => void;
}

export function TaskItem({ task, onToggle, onDelete, onLongPress }: TaskItemProps) {
  const { colors } = useTheme();

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      borderLeftWidth: 4,
      borderLeftColor: getPriorityColor(),
      ...Shadows.small,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: BorderRadius.sm,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    titleDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    metaText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    priorityText: {
      color: getPriorityColor(),
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.checkbox, task.done && styles.checked]}>
          {task.done && <Ionicons name="checkmark" size={16} color={colors.text} />}
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, task.done && styles.titleDone]}>
            {task.title}
          </Text>
          <View style={styles.meta}>
            <CategoryBadge category={task.category || 'other'} size="small" showLabel={false} />
            {task.priority && (
              <>
                <Ionicons name="flag-outline" size={14} color={getPriorityColor()} />
                <Text style={[styles.metaText, styles.priorityText]}>
                  {task.priority}
                </Text>
              </>
            )}
            {task.dueDate && (
              <>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{formatDateTime(task.dueDate)}</Text>
              </>
            )}
            {task.reminder && (
              <Ionicons name="notifications-outline" size={14} color={colors.primary} />
            )}
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}