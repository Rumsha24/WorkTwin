import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import {
  loadFocus,
  loadTasks,
  loadProductivityTrends,
  getProductivityStats,
  getCompletionRate,
  getFocusStats,
  getTaskStats,
} from '../../utils/storage';
import { haptics } from '../../utils/haptics';

export default function InsightsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.xl * 2;

  const [refreshing, setRefreshing] = useState(false);
  const [totalFocus, setTotalFocus] = useState(0);
  const [avgProductivity, setAvgProductivity] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [trends, setTrends] = useState<any[]>([]);
  const [productivityStats, setProductivityStats] = useState({ average: 0, best: 0, worst: 0 });
  const [completionRate, setCompletionRate] = useState(0);
  const [focusStats, setFocusStats] = useState({ total: 0, today: 0, average: 0 });
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [selectedPeriod])
  );

  const loadInsights = async () => {
    try {
      const sessions = await loadFocus();
      const tasks = await loadTasks();
      const productivityTrends = await loadProductivityTrends();
      const prodStats = await getProductivityStats();
      const rate = await getCompletionRate();
      const fStats = await getFocusStats();
      const tStats = await getTaskStats();

      const totalSeconds = sessions.reduce((acc: number, s: any) => acc + s.seconds, 0);
      setTotalFocus(totalSeconds);
      setTotalSessions(sessions.length);

      const completed = tasks.filter((t: any) => t.done).length;
      setCompletedTasks(completed);
      setTotalTasks(tasks.length);

      if (productivityTrends.length > 0) {
        const avg =
          productivityTrends.reduce((acc, t) => acc + t.productivityScore, 0) /
          productivityTrends.length;
        setAvgProductivity(Math.round(avg * 10) / 10);

        let filteredTrends = productivityTrends;
        if (selectedPeriod === 'week') filteredTrends = productivityTrends.slice(-7);
        else if (selectedPeriod === 'month') filteredTrends = productivityTrends.slice(-30);

        setTrends(filteredTrends);
      } else {
        setAvgProductivity(0);
        setTrends([]);
      }

      setProductivityStats(prodStats);
      setCompletionRate(rate);
      setFocusStats(fStats);
      setTaskStats(tStats);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadInsights();
    setRefreshing(false);
    haptics.success();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.primary,
    labelColor: () => colors.textSecondary,
    style: {
      borderRadius: BorderRadius.lg,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const getRecommendations = () => {
    if (totalSessions === 0) {
      return 'Start your first focus session to see insights.';
    }
    if (productivityStats.average < 5) {
      return 'Try shorter focus sessions to keep your productivity higher.';
    }
    if (taskStats.completed < taskStats.total * 0.3) {
      return 'Break pending tasks into smaller steps and complete them one by one.';
    }
    if (focusStats.today < 3600) {
      return 'You are doing well. Try to reach 1 hour of focus today.';
    }
    return 'Excellent work. Keep the momentum going.';
  };

  const handlePressMessage = (title: string, message: string) => {
    haptics.light();
    Alert.alert(title, message);
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: { ...Typography.h1, color: colors.text },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      padding: Spacing.xs,
    },
    periodButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    periodTextActive: {
      color: colors.text,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
    },
    statIcon: {
      marginBottom: Spacing.xs,
    },
    statValue: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
      fontSize: 24,
    },
    statLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
      marginBottom: Spacing.lg,
    },
    chartTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    chartWrapper: {
      alignItems: 'center',
    },
    insightsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    insightCard: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    insightTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    insightValue: {
      ...Typography.h2,
      color: colors.primary,
      fontSize: 28,
    },
    insightSubtext: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    progressContainer: {
      marginTop: Spacing.sm,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
    },
    progressText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 11,
    },
    recommendationCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    recommendationTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    recommendationText: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      padding: Spacing.xxxl,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    quickActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      marginBottom: Spacing.xl,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      ...Shadows.small,
    },
    actionText: {
      ...Typography.caption,
      color: colors.text,
      marginTop: Spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                onPress={() => {
                  haptics.light();
                  setSelectedPeriod('week');
                }}
              >
                <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                  Week
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                onPress={() => {
                  haptics.light();
                  setSelectedPeriod('month');
                }}
              >
                <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                  Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
                onPress={() => {
                  haptics.light();
                  setSelectedPeriod('year');
                }}
              >
                <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
                  Year
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handlePressMessage('Total Focus Time', `You have focused for ${formatTime(totalFocus)} in total.`)}
            >
              <Ionicons name="timer-outline" size={24} color={colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatTime(totalFocus)}</Text>
              <Text style={styles.statLabel}>Total Focus Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handlePressMessage('Average Productivity', `Your average productivity is ${avgProductivity}/10.`)}
            >
              <Ionicons name="trending-up" size={24} color={colors.secondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{avgProductivity}/10</Text>
              <Text style={styles.statLabel}>Avg Productivity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handlePressMessage('Total Sessions', `You completed ${totalSessions} focus sessions.`)}
            >
              <Ionicons name="play-circle" size={24} color={colors.accent} style={styles.statIcon} />
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Tasks')}
            >
              <Ionicons name="checkbox" size={24} color={colors.success} style={styles.statIcon} />
              <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </TouchableOpacity>
          </View>

          {trends.length > 0 ? (
            <TouchableOpacity
              style={styles.chartCard}
              onPress={() => handlePressMessage('Productivity Trend', 'This chart shows how your productivity changes over time.')}
              activeOpacity={0.85}
            >
              <Text style={styles.chartTitle}>Productivity Trend ({selectedPeriod})</Text>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={{
                    labels: trends.map((t) => t.date.split('/')[0]),
                    datasets: [{ data: trends.map((t) => t.productivityScore) }],
                  }}
                  width={screenWidth}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={{ borderRadius: BorderRadius.lg }}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.chartCard}
              onPress={() => navigation.navigate('Timer')}
            >
              <Text style={styles.chartTitle}>No Data Yet</Text>
              <View style={styles.emptyState}>
                <Ionicons name="timer-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  Complete some focus sessions to see your trends
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.insightsGrid}>
            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => handlePressMessage('Best Score', `Your best productivity score is ${productivityStats.best}/10.`)}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="flash" size={20} color={colors.warning} />
                <Text style={styles.insightTitle}>Best Score</Text>
              </View>
              <Text style={styles.insightValue}>{productivityStats.best}/10</Text>
              <Text style={styles.insightSubtext}>Your highest productivity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => handlePressMessage('Average Session', `Your average session length is ${formatTime(focusStats.average)}.`)}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="time" size={20} color={colors.info} />
                <Text style={styles.insightTitle}>Avg Session</Text>
              </View>
              <Text style={styles.insightValue}>{formatTime(focusStats.average)}</Text>
              <Text style={styles.insightSubtext}>Per focus session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => handlePressMessage('Today', `You focused for ${formatTime(focusStats.today)} today.`)}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="calendar" size={20} color={colors.accent} />
                <Text style={styles.insightTitle}>Today</Text>
              </View>
              <Text style={styles.insightValue}>{formatTime(focusStats.today)}</Text>
              <Text style={styles.insightSubtext}>Focus time today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => handlePressMessage('Completion Rate', `Your task completion rate is ${completionRate}%.`)}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.insightTitle}>Completion</Text>
              </View>
              <Text style={styles.insightValue}>{completionRate}%</Text>
              <Text style={styles.insightSubtext}>Tasks completed</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.chartCard}
            onPress={() => navigation.navigate('Tasks')}
            activeOpacity={0.85}
          >
            <Text style={styles.chartTitle}>Task Completion</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(taskStats.completed / (taskStats.total || 1)) * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>Completed: {taskStats.completed}</Text>
                <Text style={styles.progressText}>Pending: {taskStats.pending}</Text>
                <Text style={styles.progressText}>Total: {taskStats.total}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recommendationCard}
            onPress={() => {
              haptics.medium();
              if (totalSessions === 0) navigation.navigate('Timer');
              else if (taskStats.pending > 0) navigation.navigate('Tasks');
              else navigation.navigate('Dashboard');
            }}
          >
            <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
            <Text style={styles.recommendationText}>{getRecommendations()}</Text>
          </TouchableOpacity>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Tasks')}>
              <Ionicons name="list" size={24} color={colors.primary} />
              <Text style={styles.actionText}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Timer')}>
              <Ionicons name="timer" size={24} color={colors.secondary} />
              <Text style={styles.actionText}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Ionicons name="home-outline" size={24} color={colors.accent} />
              <Text style={styles.actionText}>Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}