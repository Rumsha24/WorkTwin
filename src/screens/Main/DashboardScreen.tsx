import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import {
  loadTasks,
  loadFocus,
  loadProductivityTrends,
} from '../../utils/storage';
import { Task, FocusSession } from '../../utils/types';
import { haptics } from '../../utils/haptics';

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });
  const [focusStats, setFocusStats] = useState({
    total: 0,
    today: 0,
    average: 0,
  });
  const [productivity, setProductivity] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [todaySessions, setTodaySessions] = useState(0);
  const [greeting, setGreeting] = useState('');

  useFocusEffect(
    useCallback(() => {
      updateGreeting();
      loadStats();
    }, [])
  );

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  };

  const loadStats = async () => {
    try {
      const tasks = await loadTasks();
      const sessions = await loadFocus();
      const trends = await loadProductivityTrends();

      const completed = tasks.filter((t: Task) => t.done).length;
      const pending = tasks.filter((t: Task) => !t.done).length;

      setTaskStats({
        total: tasks.length,
        completed,
        pending,
      });

      setRecentTasks(tasks.slice(0, 5));

      const totalFocusSeconds = sessions.reduce(
        (acc: number, session: FocusSession) => acc + session.seconds,
        0
      );

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayFocusSessions = sessions.filter(
        (session: FocusSession) => session.endedAt >= todayStart.getTime()
      );

      const todayFocusSeconds = todayFocusSessions.reduce(
        (acc: number, session: FocusSession) => acc + session.seconds,
        0
      );

      const averageFocus =
        sessions.length > 0 ? Math.round(totalFocusSeconds / sessions.length) : 0;

      setFocusStats({
        total: totalFocusSeconds,
        today: todayFocusSeconds,
        average: averageFocus,
      });

      setTodaySessions(todayFocusSessions.length);

      if (trends.length > 0) {
        const avg =
          trends.reduce((acc, item) => acc + item.productivityScore, 0) /
          trends.length;
        setProductivity(Math.round(avg * 10) / 10);
      } else {
        setProductivity(0);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadStats();
    setRefreshing(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const getDisplayName = () => {
    if (user?.isAnonymous) return 'Guest';
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getMotivationText = () => {
    if (taskStats.total === 0) return 'Start by adding your first task today.';
    if (taskStats.pending > 0) return `You have ${taskStats.pending} pending task${taskStats.pending > 1 ? 's' : ''}.`;
    return 'Awesome work — all tasks are completed.';
  };

  const styles = StyleSheet.create({
    bg: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxxl,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    greeting: {
      ...Typography.h1,
      color: colors.text,
      fontSize: 30,
    },
    subGreeting: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      ...Shadows.medium,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    heroTitle: {
      ...Typography.h2,
      color: colors.text,
    },
    heroSubtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    heroRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    heroPill: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
    },
    heroPillValue: {
      ...Typography.h3,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    heroPillLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    seeAll: {
      ...Typography.body,
      color: colors.primary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    statValue: {
      ...Typography.h2,
      color: colors.text,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    progressValue: {
      ...Typography.h1,
      fontSize: 44,
      color: colors.primary,
    },
    progressSmall: {
      ...Typography.body,
      color: colors.textSecondary,
      marginLeft: Spacing.xs,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginTop: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
    recentTaskCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    taskDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: Spacing.md,
    },
    taskTextWrap: {
      flex: 1,
    },
    taskTitle: {
      ...Typography.body,
      color: colors.text,
    },
    taskDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    taskMeta: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    quickActions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      ...Shadows.small,
    },
    actionText: {
      ...Typography.caption,
      color: colors.text,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {greeting}, {getDisplayName()}!
            </Text>
            <Text style={styles.subGreeting}>Ready to focus and get things done?</Text>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroTitle}>Today Overview</Text>
              <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
            </View>

            <Text style={styles.heroSubtitle}>{getMotivationText()}</Text>

            <View style={styles.heroRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillValue}>{todaySessions}</Text>
                <Text style={styles.heroPillLabel}>Sessions Today</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillValue}>{taskStats.pending}</Text>
                <Text style={styles.heroPillLabel}>Pending Tasks</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Statistics</Text>
            </View>

            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Tasks');
                }}
              >
                <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>
                  {taskStats.completed}/{taskStats.total}
                </Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Timer');
                }}
              >
                <Ionicons name="timer-outline" size={24} color={colors.secondary} />
                <Text style={styles.statValue}>{formatTime(focusStats.today)}</Text>
                <Text style={styles.statLabel}>Today Focus</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Insights');
                }}
              >
                <Ionicons name="bar-chart-outline" size={24} color={colors.accent} />
                <Text style={styles.statValue}>{productivity}/10</Text>
                <Text style={styles.statLabel}>Avg Productivity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Insights');
                }}
              >
                <Ionicons name="time-outline" size={24} color={colors.info} />
                <Text style={styles.statValue}>{formatTime(focusStats.total)}</Text>
                <Text style={styles.statLabel}>Total Focus Time</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Productivity</Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Insights');
                }}
              >
                <Text style={styles.seeAll}>Open Insights</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.progressCard}
              onPress={() => {
                haptics.light();
                navigation.navigate('Insights');
              }}
            >
              <View style={styles.progressHeader}>
                <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                <Text style={styles.sectionTitle}>Your score</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={styles.progressValue}>{productivity}</Text>
                <Text style={styles.progressSmall}>/ 10</Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.max(0, Math.min(productivity * 10, 100))}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Tasks</Text>
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Tasks');
                }}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentTasks.length === 0 ? (
              <TouchableOpacity
                style={styles.progressCard}
                onPress={() => {
                  haptics.light();
                  navigation.navigate('Tasks');
                }}
              >
                <Text style={styles.statLabel}>
                  No tasks yet. Tap here to add your first task.
                </Text>
              </TouchableOpacity>
            ) : (
              recentTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.recentTaskCard}
                  onPress={() => {
                    haptics.light();
                    navigation.navigate('Tasks');
                  }}
                >
                  <View
                    style={[
                      styles.taskDot,
                      { backgroundColor: task.done ? colors.success : colors.primary },
                    ]}
                  />
                  <View style={styles.taskTextWrap}>
                    <Text style={[styles.taskTitle, task.done && styles.taskDone]}>
                      {task.title}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {task.done ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  haptics.medium();
                  navigation.navigate('Tasks');
                }}
              >
                <Ionicons name="add-circle-outline" size={30} color={colors.primary} />
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  haptics.medium();
                  navigation.navigate('Timer');
                }}
              >
                <Ionicons name="play-circle-outline" size={30} color={colors.secondary} />
                <Text style={styles.actionText}>Start Timer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  haptics.medium();
                  navigation.navigate('Insights');
                }}
              >
                <Ionicons name="analytics-outline" size={30} color={colors.accent} />
                <Text style={styles.actionText}>Insights</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}