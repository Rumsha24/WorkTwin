import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ProductivityTrend } from '../../utils/types';
import { Spacing, Typography } from '../../theme/worktwinTheme';

interface ProductivityChartProps {
  data: ProductivityTrend[];
}

export function ProductivityChart({ data }: ProductivityChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.xxxl * 2;

  const maxProductivity = Math.max(...data.map(d => d.productivityScore), 10);

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: Spacing.md,
    },
    chartContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 200,
      marginBottom: Spacing.md,
    },
    barContainer: {
      alignItems: 'center',
      width: (screenWidth - (data.length - 1) * Spacing.sm) / data.length,
    },
    bar: {
      width: '80%',
      backgroundColor: colors.primary,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      minHeight: 2,
    },
    barLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      fontSize: 11,
      textAlign: 'center',
    },
    valueLabel: {
      ...Typography.caption,
      color: colors.text,
      fontSize: 10,
      marginBottom: Spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
  });

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.productivityScore / maxProductivity) * 180;
          
          return (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.valueLabel}>{item.productivityScore}</Text>
              <View style={[styles.bar, { height: Math.max(barHeight, 4) }]} />
              <Text style={styles.barLabel}>{item.date}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}