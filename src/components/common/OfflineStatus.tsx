import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Typography } from '../../theme/worktwinTheme';

export function OfflineStatus() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.warning + '20',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
    },
    text: {
      ...Typography.caption,
      color: colors.warning,
      marginLeft: Spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>You're offline. Changes will sync when connection is restored.</Text>
    </View>
  );
}