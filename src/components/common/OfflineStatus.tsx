import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, Typography } from '../../theme/worktwinTheme';
import { useSync } from '../../context/SyncContext';
import { haptics } from '../../utils/haptics';

const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export function OfflineStatus() {
  const { colors } = useTheme();
  const { isOnline, syncStatus, retryFailedSync, triggerSync } = useSync();

  const isActuallyOnline = isOnline && syncStatus !== 'error';
  
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        message: "🔴 OFFLINE",
        detail: "Will sync when connection restored",
        icon: "cloud-offline-outline",
        color: colors.danger,
        onPress: null,
      };
    }
    if (syncStatus === 'syncing') {
      return {
        message: "🔄 SYNCING",
        detail: "Uploading changes...",
        icon: "sync-outline",
        color: colors.primary,
        onPress: null,
      };
    }
    if (syncStatus === 'pending') {
      return {
        message: "⏳ PENDING",
        detail: "Changes waiting to sync",
        icon: "time-outline",
        color: colors.warning,
        onPress: () => triggerSync(),
      };
    }
    if (syncStatus === 'error') {
      return {
        message: "⚠️ SYNC ERROR",
        detail: "Tap to retry",
        icon: "alert-circle-outline",
        color: colors.danger,
        onPress: () => retryFailedSync(),
      };
    }
    return {
      message: "🟢 ONLINE",
      detail: "Connected",
      icon: "cloud-outline",
      color: colors.success,
      onPress: null,
    };
  };

  const config = getStatusConfig();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: config.color + '10',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      ...Typography.caption,
      color: config.color,
      marginLeft: Spacing.xs,
      fontWeight: '500',
    },
    detail: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    retryButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: config.color + '20',
      borderRadius: BorderRadius.sm,
    },
    retryText: {
      ...Typography.caption,
      color: config.color,
      fontSize: 10,
      fontWeight: '600',
    },
  });

  const Content = () => (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <Text style={styles.text}>{config.message}</Text>
        <Text style={styles.detail}> • {config.detail}</Text>
      </View>
      {config.onPress && (
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          haptics.light();
          config.onPress();
        }}>
          <Text style={styles.retryText}>RETRY</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return <Content />;
}