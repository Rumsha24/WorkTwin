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
import { loadTasks, loadFocus, loadProductivityTrends } from '../../utils/storage';
import { Task, FocusSession } from '../../utils/types';
import { haptics } from '../../utils/haptics';

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [focusStats, setFocusStats] = useState({ total: 0, today: 0, average: 0 });
  const [productivity, setProductivity] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [greeting, setGreeting] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadStats();
      updateGreeting();
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
      const completed = tasks.filter((t: Task) => t.done).length;

      setTaskStats({
        total: tasks.length,
        completed,
        pending: tasks.length - completed,
      });

      setRecentTasks(tasks.slice(0, 5));

      const sessions = await loadFocus();
      const totalFocus = sessions.reduce((acc: number, s: FocusSession) => acc + s.seconds, 0);

      const today = new Date().setHours(0, 0, 0, 0);
      const todayFocus = sessions
        .filter((s: FocusSession) => s.endedAt >= today)
        .reduce((acc: number, s: FocusSession) => acc + s.seconds, 0);

      const avgSessionTime = sessions.length > 0 ? totalFocus / sessions.length : 0;

      setFocusStats({
        total: totalFocus,
        today: todayFocus,
        average: avgSessionTime,
      });

      const trends = await loadProductivityTrends();
      if (trends.length > 0) {
        const avgProductivity =
          trends.reduce((acc, t) => acc + t.productivityScore, 0) / trends.length;
        setProductivity(Math.round(avgProductivity * 10) / 10);
      } else {
        setProductivity(0);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadStats();
    setRefreshing(false);
    haptics.success();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleQuickAction = (action: 'task' | 'timer' | 'insights' | 'settings') => {
    haptics.medium();
    if (action === 'task') navigation.navigate('Tasks');
    if (action === 'timer') navigation.navigate('Timer');
    if (action === 'insights') navigation.navigate('Insights');
    if (action === 'settings') navigation.navigate('Settings');
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg },
    header: {
      marginBottom: Spacing.xl,
    },
    greeting: {
      ...Typography.h1,
      color: colors.text,
      fontSize: 28,
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
    heroTitle: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    heroText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    heroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroBadge: {
      backgroundColor: colors.primary + '20',
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    heroBadgeText: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    statIcon: {
      marginBottom: Spacing.sm,
    },
    statValue: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
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
      color: colors.primary,
      ...Typography.body,
    },
    productivityCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
      marginBottom: Spacing.md,
    },
    productivityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    productivityScore: {
      ...Typography.h1,
      fontSize: 48,
      color: colors.primary,
    },
    productivityBar: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginTop: Spacing.sm,
    },
    productivityFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    taskDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginRight: Spacing.md,
    },
    taskTitle: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    taskStatus: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    quickActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      minWidth: '45%',
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
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {greeting}, {user?.isAnonymous ? 'Guest' : user?.email?.split('@')[0] || 'User'}!
            </Text>
            <Text style={styles.subGreeting}>Ready to focus today?</Text>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Today&apos;s Focus Plan</Text>
            <Text style={styles.heroText}>
              Review pending tasks, start a focus session, and check your insights to stay on track.
            </Text>
            <View style={styles.heroRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{taskStats.pending} pending tasks</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Timer')}>
                <Ionicons name="play-circle" size={34} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Tasks')}>
              <Ionicons
                name="checkbox-outline"
                size={24}
                color={colors.primary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{taskStats.completed}/{taskStats.total}</Text>
              <Text style={styles.statLabel}>Tasks Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Timer')}>
              <Ionicons
                name="timer-outline"
                size={24}
                color={colors.secondary}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{formatTime(focusStats.today)}</Text>
              <Text style={styles.statLabel}>Today&apos;s Focus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Insights')}>
              <Ionicons
                name="trending-up"
                size={24}
                color={colors.accent}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{productivity}/10</Text>
              <Text style={styles.statLabel}>Avg. Productivity</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Insights')}>
              <Ionicons
                name="time-outline"
                size={24}
                color={colors.info}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>{formatTime(focusStats.total)}</Text>
              <Text style={styles.statLabel}>Total Focus Time</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s Productivity</Text>
            </View>
            <TouchableOpacity
              style={styles.productivityCard}
              onPress={() => navigation.navigate('Insights')}
            >
              <View style={styles.productivityHeader}>
                <Text style={styles.productivityScore}>{productivity}</Text>
                <Text style={styles.statLabel}>/10</Text>
              </View>
              <View style={styles.productivityBar}>
                <View style={[styles.productivityFill, { width: `${productivity * 10}%` }]} />
              </View>
            </TouchableOpacity>
          </View>

          {recentTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>

              {recentTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
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
                  <Text
                    style={[
                      styles.taskTitle,
                      task.done && {
                        textDecorationLine: 'line-through',
                        color: colors.textMuted,
                      },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <Text style={styles.taskStatus}>{task.done ? 'Done' : 'Pending'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('task')}
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
                <Text style={styles.actionText}>Open Tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('timer')}
              >
                <Ionicons name="play-circle" size={32} color={colors.secondary} />
                <Text style={styles.actionText}>Start Timer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('insights')}
              >
                <Ionicons name="analytics" size={32} color={colors.accent} />
                <Text style={styles.actionText}>View Insights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleQuickAction('settings')}
              >
                <Ionicons name="settings-outline" size={32} color={colors.info} />
                <Text style={styles.actionText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}