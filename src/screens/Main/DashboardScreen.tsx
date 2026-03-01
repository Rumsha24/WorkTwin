// src/screens/Main/DashboardScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/common/Screen";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { loadTasks, loadFocus, formatHumanSeconds } from "../../utils/storage";
import type { Task } from "../../utils/type";
import { auth } from "../../services/firebaseConfig";

type TabsParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Timer: undefined;
  Insights: undefined;
  Settings: undefined;
};

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabsParamList>>();
  const { colors } = useTheme();
  const [userName, setUserName] = useState("Guest");
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [todayFocus, setTodayFocus] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    completed: 0,
    focusTime: 0,
    sessions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
    // Check if user is anonymous
    if (auth.currentUser) {
      if (auth.currentUser.isAnonymous) {
        setUserName("Guest");
      } else if (auth.currentUser.email) {
        // Extract name from email or use first part
        const name = auth.currentUser.email.split('@')[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const tasks = await loadTasks();
      const sessions = await loadFocus();
      
      const today = new Date().toDateString();
      const todayTasksList = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        return taskDate === today;
      });
      setTodayTasks(todayTasksList);

      const todaySessions = sessions.filter(session => {
        const sessionDate = new Date(session.endedAt).toDateString();
        return sessionDate === today;
      });
      const todayFocusTotal = todaySessions.reduce((acc, s) => acc + s.seconds, 0);
      setTodayFocus(todayFocusTotal);

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekTasks = tasks.filter(task => task.createdAt >= oneWeekAgo && task.done);
      const weekSessions = sessions.filter(session => session.endedAt >= oneWeekAgo);
      const weekFocusTotal = weekSessions.reduce((acc, s) => acc + s.seconds, 0);
      
      setWeeklyStats({
        completed: weekTasks.length,
        focusTime: weekFocusTotal,
        sessions: weekSessions.length,
      });

      const recent = [
        ...tasks.slice(0, 3).map(t => ({ type: 'task', data: t, time: t.createdAt })),
        ...sessions.slice(0, 3).map(s => ({ type: 'session', data: s, time: s.endedAt })),
      ].sort((a, b) => b.time - a.time).slice(0, 5);
      
      setRecentActivities(recent);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const styles = StyleSheet.create({
    greeting: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    greetingText: {
      ...Typography.h1,
      color: colors.text,
    },
    greetingSub: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    userName: {
      color: colors.primary,
      fontWeight: '700',
    },
    profileBtn: {
      padding: Spacing.sm,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
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
    statSub: {
      ...Typography.caption,
      color: colors.primary,
      fontSize: 12,
      marginTop: Spacing.xs,
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
    seeAllBtn: {
      padding: Spacing.xs,
    },
    seeAllText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    quickActionCard: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    quickActionTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    quickActionSub: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    todayTasksCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    taskTime: {
      ...Typography.caption,
      color: colors.textMuted,
      fontSize: 12,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
    activityCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    activityIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      ...Typography.body,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    activityMeta: {
      ...Typography.caption,
      color: colors.textMuted,
      fontSize: 12,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginTop: Spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
  });

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>
              Hello, <Text style={styles.userName}>{userName}</Text>
              {auth.currentUser?.isAnonymous && (
                <Text style={[styles.greetingSub, { fontSize: 14, marginLeft: Spacing.xs }]}> (Guest)</Text>
              )}
            </Text>
            <Text style={styles.greetingSub}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={colors.secondary} style={styles.statIcon} />
            <Text style={styles.statValue}>{formatHumanSeconds(todayFocus)}</Text>
            <Text style={styles.statLabel}>Focus Time</Text>
            <Text style={styles.statSub}>Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkbox-outline" size={24} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{todayTasks.filter(t => t.done).length}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
            <Text style={styles.statSub}>Today</Text>
          </View>
        </View>

        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Tasks")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionTitle}>Tasks</Text>
            <Text style={styles.quickActionSub}>Manage your to-dos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Timer")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="timer-outline" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.quickActionTitle}>Focus</Text>
            <Text style={styles.quickActionSub}>Start a session</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Insights")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="bar-chart-outline" size={24} color={colors.accent} />
            </View>
            <Text style={styles.quickActionTitle}>Insights</Text>
            <Text style={styles.quickActionSub}>See your stats</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate("Settings")}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="settings-outline" size={24} color={colors.info} />
            </View>
            <Text style={styles.quickActionTitle}>Settings</Text>
            <Text style={styles.quickActionSub}>Account & app</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>
            <TouchableOpacity 
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate("Insights")}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weeklyStats.completed}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatHumanSeconds(weeklyStats.focusTime)}</Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{weeklyStats.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity 
              style={styles.seeAllBtn}
              onPress={() => navigation.navigate("Tasks")}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.todayTasksCard}>
            {todayTasks.length > 0 ? (
              todayTasks.slice(0, 5).map((task, index) => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={[styles.taskDot, task.done && { backgroundColor: colors.success }]} />
                  <Text style={[styles.taskTitle, task.done && { textDecorationLine: 'line-through', color: colors.textMuted }]}>
                    {task.title}
                  </Text>
                  <Text style={styles.taskTime}>
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No tasks for today. Tap + to add one!</Text>
            )}
            
            {todayTasks.length > 0 && (
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(todayTasks.filter(t => t.done).length / todayTasks.length) * 100}%` }
                  ]} 
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          <View style={styles.activityCard}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { 
                    backgroundColor: activity.type === 'task' ? colors.success + '20' : colors.primary + '20'
                  }]}>
                    <Ionicons 
                      name={activity.type === 'task' ? "checkbox-outline" : "timer-outline"} 
                      size={16} 
                      color={activity.type === 'task' ? colors.success : colors.primary} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {activity.type === 'task' 
                        ? (activity.data.done ? 'Completed: ' : 'Added: ') + activity.data.title
                        : `Focus session: ${formatHumanSeconds(activity.data.seconds)}`
                      }
                    </Text>
                    <Text style={styles.activityMeta}>
                      {new Date(activity.time).toLocaleDateString()} at{' '}
                      {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No recent activity. Start using the app!</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}