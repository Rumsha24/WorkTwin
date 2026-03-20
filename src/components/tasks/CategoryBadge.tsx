import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { TaskCategory, CATEGORY_CONFIG } from '../../utils/types';
import { Spacing, Typography, BorderRadius } from '../../theme/worktwinTheme';

interface CategoryBadgeProps {
  category: TaskCategory;
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export function CategoryBadge({ category, size = 'medium', showLabel = true }: CategoryBadgeProps) {
  const { colors } = useTheme();
  const config = CATEGORY_CONFIG[category];

  const styles = StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: config.color + '20',
      paddingHorizontal: size === 'small' ? Spacing.sm : Spacing.md,
      paddingVertical: size === 'small' ? Spacing.xs : Spacing.sm,
      borderRadius: BorderRadius.round,
      gap: Spacing.xs,
    },
    label: {
      ...(size === 'small' ? Typography.caption : Typography.body),
      color: config.color,
      fontSize: size === 'small' ? 12 : 14,
    },
  });

  return (
    <View style={styles.badge}>
      <Ionicons name={config.icon as any} size={size === 'small' ? 12 : 16} color={config.color} />
      {showLabel && <Text style={styles.label}>{config.label}</Text>}
    </View>
  );
}