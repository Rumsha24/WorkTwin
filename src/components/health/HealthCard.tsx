import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';

const { width: screenWidth } = Dimensions.get('window');

interface HealthCardProps {
  mentalHealthScore: number;
  sleepAverage: number;
  stepProgress: number;
  medicineCount: number;
  onMentalCheck: () => void;
  onSleepLog: () => void;
  onSteps: () => void;
  onMedicines: () => void;
}

export function HealthCard({
  mentalHealthScore,
  sleepAverage,
  stepProgress,
  medicineCount,
  onMentalCheck,
  onSleepLog,
  onSteps,
  onMedicines,
}: HealthCardProps) {
  const { colors } = useTheme();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const chartData = {
    labels: ['Mental', 'Sleep', 'Steps', 'Medicines'],
    data: [
      mentalHealthScore / 100,
      sleepAverage / 12,
      stepProgress / 100,
      medicineCount > 0 ? Math.min(1, medicineCount / 10) : 0,
    ],
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (_opacity = 1) => colors.primary,
    labelColor: (_opacity = 1) => colors.textSecondary,
    style: { borderRadius: BorderRadius.lg },
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      ...Shadows.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h2,
      color: colors.primary,
      fontSize: 20,
    },
    chartContainer: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    scoreContainer: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    score: {
      ...Typography.h1,
      fontSize: 36,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    scoreLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>💚 Health & Wellness</Text>
        <Ionicons name="heart" size={28} color={colors.primary} />
      </View>

      <View style={styles.chartContainer}>
        <ProgressChart
          data={chartData}
          width={Math.min(screenWidth - 64, 320)}
          height={180}
          strokeWidth={12}
          radius={28}
          chartConfig={chartConfig}
          hideLegend={false}
        />
      </View>

      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{mentalHealthScore}/100</Text>
        <Text style={styles.scoreLabel}>Mental Wellness Score</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onMentalCheck} activeOpacity={0.85}>
          <Ionicons name="clipboard" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Mental Check</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onSleepLog} activeOpacity={0.85}>
          <Ionicons name="bed" size={18} color={colors.info} />
          <Text style={styles.actionText}>Sleep</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onSteps} activeOpacity={0.85}>
          <Ionicons name="walk" size={18} color={colors.success} />
          <Text style={styles.actionText}>Steps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onMedicines} activeOpacity={0.85}>
          <Ionicons name="medkit" size={18} color={colors.warning} />
          <Text style={styles.actionText}>Medicines</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}