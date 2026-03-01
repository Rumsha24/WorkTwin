// src/screens/Insights/InsightsScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { 
  loadFocus, 
  loadTasks, 
  loadProductivityTrends,
  formatHumanSeconds
} from "../../utils/storage";

interface FocusSession {
  seconds: number;
  endedAt: number;
  productivity: number;
  interruptions?: number;
}

interface ProductivityTrend {
  date: string;
  productivityScore: number;
  totalFocus: number;
}

export default function InsightsScreen() {
  const { colors } = useTheme();
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [trends, setTrends] = useState<ProductivityTrend[]>([]);
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [avgProductivity, setAvgProductivity] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadInsightsData();
  }, [selectedPeriod]);

  const loadInsightsData = async () => {
    try {
      const sessions = await loadFocus();
      const filteredSessions = filterSessionsByPeriod(sessions);
      
      const totalSeconds = filteredSessions.reduce((acc, session) => acc + session.seconds, 0);
      setTotalFocusTime(totalSeconds);
      setTotalSessions(filteredSessions.length);
      setRecentSessions(filteredSessions.slice(0, 5));

      const avgProd = filteredSessions.reduce((acc, s) => acc + (s.productivity || 5), 0) / 
                      (filteredSessions.length || 1);
      setAvgProductivity(Math.round(avgProd * 10) / 10);

      const tasks = await loadTasks();
      const completed = tasks.filter(t => t.done).length;
      setCompletedTasks(completed);
      setTotalTasks(tasks.length);

      const loadedTrends = await loadProductivityTrends();
      setTrends(loadedTrends.slice(0, 7));
    } catch (error) {
      console.error("Error loading insights:", error);
    }
  };

  const filterSessionsByPeriod = (sessions: FocusSession[]) => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    switch(selectedPeriod) {
      case 'week':
        return sessions.filter(s => now - s.endedAt <= oneWeek);
      case 'month':
        return sessions.filter(s => now - s.endedAt <= oneMonth);
      default:
        return sessions;
    }
  };

  const getProductivityColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 5) return colors.warning;
    return colors.danger;
  };

  const getProductivityEmoji = (score: number) => {
    if (score >= 8) return "🔥";
    if (score >= 5) return "👍";
    return "💪";
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg },
    title: { ...Typography.h1, color: colors.text, marginBottom: Spacing.lg },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.round,
      padding: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    periodBtn: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.round,
      alignItems: 'center',
    },
    periodBtnSelected: {
      backgroundColor: colors.primary,
    },
    periodText: { color: colors.textSecondary, fontWeight: '500' },
    periodTextSelected: { color: colors.text },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      ...Shadows.small,
    },
    statValue: { 
      ...Typography.h2, 
      color: colors.text, 
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    statLabel: { ...Typography.caption, color: colors.textSecondary },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: { 
      ...Typography.h3, 
      color: colors.text,
      marginBottom: Spacing.md,
    },
    trendItem: {
      marginBottom: Spacing.md,
    },
    trendDate: { 
      ...Typography.caption, 
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    trendBarContainer: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginBottom: Spacing.xs,
      overflow: 'hidden',
    },
    trendBar: {
      height: '100%',
      borderRadius: BorderRadius.round,
    },
    trendStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    trendScore: { ...Typography.body, color: colors.text, fontSize: 14 },
    trendFocus: { ...Typography.caption, color: colors.textSecondary },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: { ...Typography.body, color: colors.textSecondary, textAlign: 'center' },
    sessionCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionTime: { ...Typography.caption, color: colors.textSecondary, flex: 1 },
    sessionDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    sessionDetail: {
      alignItems: 'center',
    },
    detailLabel: { ...Typography.caption, color: colors.textMuted, fontSize: 12, marginBottom: Spacing.xs },
    detailValue: { ...Typography.body, color: colors.text, fontWeight: '600' },
    completionCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    completionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    completionPercentage: { ...Typography.h2, color: colors.primary },
    completionCount: { ...Typography.body, color: colors.textSecondary },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Insights</Text>

          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodBtn, selectedPeriod === 'week' && styles.periodBtnSelected]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextSelected]}>
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, selectedPeriod === 'month' && styles.periodBtnSelected]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextSelected]}>
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodBtn, selectedPeriod === 'all' && styles.periodBtnSelected]}
              onPress={() => setSelectedPeriod('all')}
            >
              <Text style={[styles.periodText, selectedPeriod === 'all' && styles.periodTextSelected]}>
                All Time
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{formatHumanSeconds(totalFocusTime)}</Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="fitness-outline" size={24} color={colors.secondary} />
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="checkbox-outline" size={24} color={colors.accent} />
              <Text style={styles.statValue}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="trending-up-outline" size={24} color={colors.info} />
              <Text style={styles.statValue}>{avgProductivity}</Text>
              <Text style={styles.statLabel}>Avg Productivity</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Productivity Trends</Text>
            {trends.length > 0 ? (
              trends.map((trend, index) => (
                <View key={index} style={styles.trendItem}>
                  <Text style={styles.trendDate}>{trend.date}</Text>
                  <View style={styles.trendBarContainer}>
                    <View 
                      style={[
                        styles.trendBar, 
                        { 
                          width: `${(trend.productivityScore / 10) * 100}%`,
                          backgroundColor: getProductivityColor(trend.productivityScore)
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.trendStats}>
                    <Text style={styles.trendScore}>
                      {getProductivityEmoji(trend.productivityScore)} {trend.productivityScore}/10
                    </Text>
                    <Text style={styles.trendFocus}>{formatHumanSeconds(trend.totalFocus)}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No trends data yet. Complete some focus sessions!</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {recentSessions.length > 0 ? (
              recentSessions.map((session, index) => (
                <View key={index} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Ionicons name="timer-outline" size={20} color={colors.primary} />
                    <Text style={styles.sessionTime}>
                      {new Date(session.endedAt).toLocaleDateString()} at{' '}
                      {new Date(session.endedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.sessionDetails}>
                    <View style={styles.sessionDetail}>
                      <Text style={styles.detailLabel}>Duration</Text>
                      <Text style={styles.detailValue}>{formatHumanSeconds(session.seconds)}</Text>
                    </View>
                    <View style={styles.sessionDetail}>
                      <Text style={styles.detailLabel}>Productivity</Text>
                      <Text style={[styles.detailValue, { color: getProductivityColor(session.productivity) }]}>
                        {session.productivity}/10
                      </Text>
                    </View>
                    {session.interruptions !== undefined && (
                      <View style={styles.sessionDetail}>
                        <Text style={styles.detailLabel}>Interruptions</Text>
                        <Text style={styles.detailValue}>{session.interruptions}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No sessions yet. Start your first focus session!</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Task Completion</Text>
            <View style={styles.completionCard}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionPercentage}>
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </Text>
                <Text style={styles.completionCount}>{completedTasks}/{totalTasks} tasks</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}