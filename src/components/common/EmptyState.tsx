import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export function EmptyState({ 
  icon = 'alert-circle-outline', 
  title, 
  message, 
  buttonText, 
  onButtonPress 
}: EmptyStateProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xxxl,
      minHeight: 300,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      ...Typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    message: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: buttonText ? Spacing.xl : 0,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      ...Shadows.small,
    },
    buttonText: {
      ...Typography.button,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}