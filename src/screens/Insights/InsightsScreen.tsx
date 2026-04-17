// src/screens/Insights/InsightsScreen.tsx

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
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useHealth } from '../../hooks/useHealth';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import {
  loadFocus,
  loadTasks,
  loadProductivityTrends,
  getProductivityStats,
  getCompletionRate,
  getFocusStats,
  getTaskStats,
  getScopedStorageKey,
} from '../../utils/storage';
import { haptics } from '../../utils/haptics';
import { FocusSession, ProductivityTrend } from '../../utils/types';
import { notificationService } from '../../services/notificationService';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = Math.min(screenWidth - Spacing.lg * 2 - Spacing.md * 2, 340);

type WellnessReminderOption = {
  type: 'hydration' | 'break' | 'checkin';
  label: string;
  time: string;
  hour: number;
  minute: number;
  icon: keyof typeof Ionicons.glyphMap;
};

type PeriodLog = {
  id: string;
  date: string;
  symptoms: string[];
  mood: string | null;
  notes?: string;
};

export default function InsightsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { healthData, getRecentSleepAverage, getStepProgress, loadHealthData } = useHealth();

  // State variables
  const [refreshing, setRefreshing] = useState(false);
  const [totalFocus, setTotalFocus] = useState(0);
  const [avgProductivity, setAvgProductivity] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [trends, setTrends] = useState<ProductivityTrend[]>([]);
  const [productivityStats, setProductivityStats] = useState({
    average: 0,
    best: 0,
    worst: 0,
  });
  const [completionRate, setCompletionRate] = useState(0);
  const [focusStats, setFocusStats] = useState({
    total: 0,
    today: 0,
    average: 0,
  });
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [profileGender, setProfileGender] = useState<'male' | 'female' | null>(null);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [lastPeriodDate, setLastPeriodDate] = useState<string | null>(null);
  const [showWellnessScheduleModal, setShowWellnessScheduleModal] = useState(false);
  const [selectedWellnessReminder, setSelectedWellnessReminder] = useState<WellnessReminderOption | null>(null);
  const [wellnessReminderTime, setWellnessReminderTime] = useState(new Date());
  const [showWellnessTimePicker, setShowWellnessTimePicker] = useState(false);

  const wellnessReminderOptions: WellnessReminderOption[] = [
    { type: 'hydration', label: 'Hydrate Reminder', time: '10 AM', hour: 10, minute: 0, icon: 'water' },
    { type: 'break', label: 'Break Reminder', time: '2 PM', hour: 14, minute: 0, icon: 'body' },
    { type: 'checkin', label: 'Check-in Reminder', time: '8 PM', hour: 20, minute: 0, icon: 'clipboard' },
  ];

  // Load data when screen focuses or period changes
  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [selectedPeriod, loadHealthData])
  );

  // Main function to load all insights data
  const loadInsights = async () => {
    try {
      const sessions = await loadFocus();
      const tasks = await loadTasks();
      const productivityTrends = await loadProductivityTrends();
      const prodStats = await getProductivityStats();
      const rate = await getCompletionRate();
      const fStats = await getFocusStats();
      const tStats = await getTaskStats();
      await loadHealthData();
      await loadWaterIntake();
      await loadPeriodInsights();

      const totalSeconds = sessions.reduce((acc: number, s: any) => acc + (s.seconds || 0), 0);
      setTotalFocus(totalSeconds);
      setTotalSessions(sessions.length);

      const completed = tasks.filter((t: any) => t.done).length;
      setCompletedTasks(completed);
      setTotalTasks(tasks.length);

      const trendSource =
        productivityTrends.length > 0 ? productivityTrends : buildTrendsFromSessions(sessions);

      if (trendSource.length > 0) {
        const avg =
          trendSource.reduce((acc: number, t: ProductivityTrend) => acc + (t.productivityScore || 0), 0) /
          trendSource.length;
        setAvgProductivity(Math.round(avg * 10) / 10);

        let filteredTrends = trendSource;
        if (selectedPeriod === 'week') {
          filteredTrends = trendSource.slice(-7);
        } else if (selectedPeriod === 'month') {
          filteredTrends = trendSource.slice(-30);
        } else {
          filteredTrends = trendSource.slice(-12);
        }
        setTrends(filteredTrends);
      } else {
        setAvgProductivity(0);
        setTrends([]);
      }

      setProductivityStats(prodStats || { average: 0, best: 0, worst: 0 });
      setCompletionRate(rate || 0);
      setFocusStats(fStats || { total: 0, today: 0, average: 0 });
      setTaskStats(tStats || { total: 0, completed: 0, pending: 0 });
    } catch (error) {
      console.error('Error loading insights:', error);
      Alert.alert('Error', 'Failed to load insights');
    }
  };

  const loadWaterIntake = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(getScopedStorageKey(`waterIntake:${today}`));
      setWaterTodayMl(stored ? Number(stored) : 0);
    } catch (error) {
      console.error('Error loading water insight:', error);
      setWaterTodayMl(0);
    }
  };

  const loadPeriodInsights = async () => {
    if (!user?.uid) {
      setProfileGender(null);
      setPeriodLogs([]);
      setLastPeriodDate(null);
      return;
    }

    try {
      const [savedGender, savedLogs, savedLastPeriod] = await Promise.all([
        AsyncStorage.getItem(`profileGender:${user.uid}`),
        AsyncStorage.getItem(`periodLogs:${user.uid}`),
        AsyncStorage.getItem(`lastPeriodDate:${user.uid}`),
      ]);

      setProfileGender(savedGender === 'female' || savedGender === 'male' ? savedGender : null);
      setPeriodLogs(savedLogs ? JSON.parse(savedLogs) : []);
      setLastPeriodDate(savedLastPeriod);
    } catch (error) {
      console.error('Error loading period insights:', error);
      setPeriodLogs([]);
    }
  };

  const buildTrendsFromSessions = (sessions: FocusSession[]): ProductivityTrend[] => {
    const grouped = sessions.reduce<Record<string, { totalScore: number; count: number; totalFocus: number }>>(
      (acc, session) => {
        const date = new Date(session.endedAt).toISOString().split('T')[0];
        const score = Number(session.productivity || session.focusScore || 5);
        const normalizedScore = score > 10 ? Math.round((score / 10) * 10) / 10 : score;

        acc[date] = acc[date] || { totalScore: 0, count: 0, totalFocus: 0 };
        acc[date].totalScore += Math.min(10, normalizedScore);
        acc[date].count += 1;
        acc[date].totalFocus += Number(session.seconds || 0);
        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .map(([date, value]) => ({
        date,
        productivityScore: Math.round((value.totalScore / value.count) * 10) / 10,
        totalFocus: value.totalFocus,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const formatTrendLabel = (dateValue: string) => {
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return '';

    if (selectedPeriod === 'week') {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatDisplayDate = (dateValue: string) => {
    const date = new Date(`${dateValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysSinceLastPeriod = () => {
    if (!lastPeriodDate) return null;
    const lastDate = new Date(`${lastPeriodDate}T12:00:00`);
    if (Number.isNaN(lastDate.getTime())) return null;
    const diffMs = Date.now() - lastDate.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadInsights();
    setRefreshing(false);
    haptics.success();
  };

  // Format time from seconds to readable format
  const formatTime = (seconds: number): string => {
    const safeSeconds = Number(seconds || 0);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Generate personalized recommendations
  const getRecommendations = () => {
    if (totalSessions === 0) {
      return 'Start your first focus session to unlock insights.';
    }
    if (productivityStats.average < 5) {
      return 'Try shorter sessions and take regular breaks to improve focus.';
    }
    if (taskStats.completed < taskStats.total * 0.3 && taskStats.total > 0) {
      return 'Break pending tasks into smaller steps and tackle one at a time.';
    }
    if (focusStats.today < 3600) {
      return 'You are doing well. Try reaching at least 1 hour of focus today.';
    }
    return 'Excellent work. Keep up the strong momentum.';
  };

  // Handle stat card press - POPUP with details
  const handleStatPress = (title: string, message: string, screen?: string) => {
    haptics.light();
    Alert.alert(
      title,
      message,
      [
        { 
          text: screen ? `Go to ${screen}` : 'OK', 
          onPress: () => screen && navigation.navigate(screen) 
        },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  // Handle period selector press
  const handlePeriodPress = (period: 'week' | 'month' | 'year') => {
    haptics.light();
    setSelectedPeriod(period);
    Alert.alert('Period Changed', `Showing ${period}ly insights`);
  };

  // Handle chart press - POPUP with details
  const handleChartPress = () => {
    haptics.medium();
    Alert.alert(
      '📈 Productivity Trend',
      `Your average productivity over the last ${selectedPeriod} is ${avgProductivity}/10.\n\n` +
      `Highest: ${productivityStats.best}/10\n` +
      `Lowest: ${productivityStats.worst}/10\n\n` +
      `Tip: Consistent sessions improve productivity!`,
      [
        { text: 'Start Timer', onPress: () => navigation.navigate('Timer') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  // Handle insight card press - POPUP with details
  const handleInsightPress = (title: string, value: string, message: string, screen?: string) => {
    haptics.light();
    Alert.alert(
      `📊 ${title}`,
      `${message}\n\nCurrent: ${value}`,
      [
        { 
          text: screen ? `Go to ${screen}` : 'OK', 
          onPress: () => screen && navigation.navigate(screen) 
        },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  // Handle progress bar press - NAVIGATE to Tasks
  const handleProgressPress = () => {
    haptics.light();
    Alert.alert(
      '📋 Task Progress',
      `You have completed ${taskStats.completed} out of ${taskStats.total} tasks.\n\n` +
      `${taskStats.pending} tasks remaining!`,
      [
        { text: 'View Tasks', onPress: () => navigation.navigate('Tasks') },
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  // Handle recommendation press - NAVIGATE or POPUP
  const handleRecommendationPress = () => {
    haptics.medium();
    if (totalSessions === 0) {
      Alert.alert(
        '💡 Recommendation',
        'Start your first focus session to see insights!',
        [
          { text: 'Start Timer', onPress: () => navigation.navigate('Timer') },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } else if (taskStats.pending > 0) {
      Alert.alert(
        '💡 Recommendation',
        getRecommendations(),
        [
          { text: 'View Tasks', onPress: () => navigation.navigate('Tasks') },
          { text: 'Close', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert('💡 Recommendation', getRecommendations(), [{ text: 'Got it!' }]);
    }
  };

  // Handle quick action buttons - NAVIGATE
  const handleQuickAction = (screen: string) => {
    haptics.medium();
    navigation.navigate(screen);
  };

  const openWellnessReminderScheduler = (option: WellnessReminderOption) => {
    const nextReminderTime = new Date();
    nextReminderTime.setHours(option.hour, option.minute, 0, 0);
    setSelectedWellnessReminder(option);
    setWellnessReminderTime(nextReminderTime);
    setShowWellnessTimePicker(false);
    setShowWellnessScheduleModal(true);
  };

  const formatReminderTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const handleScheduleWellnessReminder = async () => {
    if (!selectedWellnessReminder) return;

    haptics.medium();
    const hasPermission = await notificationService.initialize();

    if (!hasPermission) {
      Alert.alert('Notifications Disabled', 'Please allow notifications to receive wellness reminders.');
      return;
    }

    const hour = wellnessReminderTime.getHours();
    const minute = wellnessReminderTime.getMinutes();
    const storageKey = `wellnessReminder:${selectedWellnessReminder.type}:${user?.uid || 'local'}`;
    const existingId = await AsyncStorage.getItem(storageKey);
    if (existingId) {
      await notificationService.cancelNotification(existingId);
    }

    const notificationId = await notificationService.scheduleWellnessReminder(
      selectedWellnessReminder.type,
      hour,
      minute
    );

    if (!notificationId) {
      Alert.alert('Reminder Not Set', 'I could not schedule that reminder. Please try again.');
      return;
    }

    await AsyncStorage.setItem(storageKey, notificationId);
    setShowWellnessScheduleModal(false);
    setShowWellnessTimePicker(false);
    haptics.success();
    Alert.alert(
      'Reminder Set',
      `${selectedWellnessReminder.label} reminder will notify you daily at ${formatReminderTime(wellnessReminderTime)}.`
    );
  };

  // Handle summary button - POPUP
  const handleSummaryPress = () => {
    haptics.light();
    Alert.alert(
      '📊 Your Productivity Summary',
      `📈 Total Focus: ${formatTime(totalFocus)}\n` +
      `🎯 Total Sessions: ${totalSessions}\n` +
      `⭐ Avg Productivity: ${avgProductivity}/10\n` +
      `✅ Tasks Done: ${completedTasks}/${totalTasks}\n` +
      `🏆 Best Score: ${productivityStats.best}/10\n` +
      `📅 Today's Focus: ${formatTime(focusStats.today)}`,
      [{ text: 'Great!' }]
    );
  };

  // Chart configuration
  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: { borderRadius: BorderRadius.lg },
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primary },
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
    periodButtonActive: { backgroundColor: colors.primary },
    periodText: { ...Typography.caption, color: colors.textSecondary },
    periodTextActive: { color: colors.text },

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
    statIcon: { marginBottom: Spacing.xs },
    statValue: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
      fontSize: 24,
    },
    statLabel: { ...Typography.caption, color: colors.textSecondary },
    wellnessCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    wellnessHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    wellnessTitle: { ...Typography.body, color: colors.text, fontWeight: '700' },
    wellnessSubtext: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 18,
    },
    wellnessGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    wellnessMetric: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '22',
    },
    wellnessMetricValue: { ...Typography.h3, color: colors.text, marginTop: Spacing.xs },
    wellnessMetricLabel: { ...Typography.caption, color: colors.textSecondary },
    reminderRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    reminderMiniButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reminderMiniText: { ...Typography.caption, color: colors.text, fontWeight: '700', marginTop: 4 },
    reminderMiniSub: { ...Typography.caption, color: colors.textSecondary, fontSize: 10 },
    periodInsightsCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.accent + '25',
    },
    periodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    periodTitle: { ...Typography.body, color: colors.text, fontWeight: '800' },
    periodSubtext: { ...Typography.caption, color: colors.textSecondary, lineHeight: 18 },
    periodStatsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    periodStat: {
      flex: 1,
      backgroundColor: colors.accent + '10',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.accent + '22',
    },
    periodStatValue: { ...Typography.h3, color: colors.text },
    periodStatLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    periodLogItem: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodLogDate: { ...Typography.body, color: colors.text, fontWeight: '700' },
    periodLogMeta: { ...Typography.caption, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      ...Shadows.medium,
    },
    modalTitle: { ...Typography.h2, color: colors.text, marginBottom: Spacing.sm },
    modalSubtitle: { ...Typography.body, color: colors.textSecondary, marginBottom: Spacing.md },
    reminderPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
    },
    reminderPickerText: { ...Typography.h3, color: colors.text },
    modalButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    modalButtonText: { ...Typography.body, color: colors.text, fontWeight: '700' },
    modalButtonSecondary: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonSecondaryText: { ...Typography.body, color: colors.textSecondary, fontWeight: '700' },

    chartCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      ...Shadows.small,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    chartTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.md,
    },
    chartWrapper: {
      alignItems: 'center',
      overflow: 'hidden',
      marginLeft: -Spacing.xs,
    },
    chartMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    chartPill: {
      backgroundColor: colors.primary + '15',
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    chartPillText: { ...Typography.caption, color: colors.primary, fontWeight: '700' },

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
    insightTitle: { ...Typography.body, fontWeight: '600', color: colors.text },
    insightValue: { ...Typography.h2, color: colors.primary, fontSize: 28 },
    insightSubtext: { ...Typography.caption, color: colors.textSecondary },

    progressContainer: { marginTop: Spacing.sm },
    progressBar: {
      height: 8,
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
      flexWrap: 'wrap',
      gap: Spacing.xs,
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
      marginBottom: Spacing.lg,
    },
    recommendationTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    recommendationText: { ...Typography.body, color: colors.textSecondary },

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
    actionText: { ...Typography.caption, color: colors.text, marginTop: Spacing.xs },
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
          {/* HEADER with Period Selector */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('insights')}</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                onPress={() => handlePeriodPress('week')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                  {t('week')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                onPress={() => handlePeriodPress('month')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                  {t('month')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
                onPress={() => handlePeriodPress('year')}
              >
                <Text style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
                  {t('year')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MAIN STATISTICS CARDS - CLICKABLE */}
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleStatPress(
                '📊 Total Focus Time',
                `You have focused for ${formatTime(totalFocus)} in total.\n\n` +
                `That's ${Math.floor(totalFocus / 3600)} hours of productive time!\n\n` +
                `Keep going! 🎯`,
                'Timer'
              )}
            >
              <Ionicons name="timer-outline" size={24} color={colors.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatTime(totalFocus)}</Text>
              <Text style={styles.statLabel}>{t('total_focus')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleStatPress(
                '📈 Average Productivity',
                `Your average productivity score is ${avgProductivity}/10.\n\n` +
                `Best: ${productivityStats.best}/10\n` +
                `Worst: ${productivityStats.worst}/10\n\n` +
                `Consistency is key! 💪`,
                'Timer'
              )}
            >
              <Ionicons name="trending-up" size={24} color={colors.secondary} style={styles.statIcon} />
              <Text style={styles.statValue}>{avgProductivity}/10</Text>
              <Text style={styles.statLabel}>{t('avg_productivity')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleStatPress(
                '🎯 Total Sessions',
                `You completed ${totalSessions} focus sessions.\n\n` +
                `Average session length: ${formatTime(focusStats.average)}\n\n` +
                `Each session builds better habits! 🔥`,
                'Timer'
              )}
            >
              <Ionicons name="play-circle" size={24} color={colors.accent} style={styles.statIcon} />
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>{t('total_sessions')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => handleStatPress(
                '✅ Tasks Completed',
                `You have completed ${completedTasks} out of ${totalTasks} tasks.\n\n` +
                `${taskStats.pending} tasks remaining!\n\n` +
                `Keep checking them off! ✅`,
                'Tasks'
              )}
            >
              <Ionicons name="checkbox" size={24} color={colors.success} style={styles.statIcon} />
              <Text style={styles.statValue}>{completedTasks}/{totalTasks}</Text>
              <Text style={styles.statLabel}>{t('tasks_done')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wellnessCard}>
            <View style={styles.wellnessHeader}>
              <Text style={styles.wellnessTitle}>{t('wellness')}</Text>
              <Ionicons name="heart-circle" size={26} color={colors.primary} />
            </View>
            <Text style={styles.wellnessSubtext}>
              Your health habits sit beside productivity here, so the presentation shows a complete wellbeing workflow.
            </Text>
            <View style={styles.wellnessGrid}>
              <TouchableOpacity
                style={styles.wellnessMetric}
                onPress={() => navigation.navigate('Dashboard')}
                activeOpacity={0.85}
              >
                <Ionicons name="happy-outline" size={22} color={colors.primary} />
                <Text style={styles.wellnessMetricValue}>{healthData.mentalHealthScore}/100</Text>
                <Text style={styles.wellnessMetricLabel}>Mental score</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wellnessMetric}
                onPress={() => navigation.navigate('Dashboard')}
                activeOpacity={0.85}
              >
                <Ionicons name="walk-outline" size={22} color={colors.success} />
                <Text style={styles.wellnessMetricValue}>{getStepProgress()}%</Text>
                <Text style={styles.wellnessMetricLabel}>Step goal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wellnessMetric}
                onPress={() => navigation.navigate('Dashboard')}
                activeOpacity={0.85}
              >
                <Ionicons name="bed-outline" size={22} color={colors.info} />
                <Text style={styles.wellnessMetricValue}>{getRecentSleepAverage(7)}h</Text>
                <Text style={styles.wellnessMetricLabel}>Avg sleep</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.wellnessMetric}
                onPress={() => navigation.navigate('Timer')}
                activeOpacity={0.85}
              >
                <Ionicons name="water-outline" size={22} color={colors.accent} />
                <Text style={styles.wellnessMetricValue}>{waterTodayMl} ml</Text>
                <Text style={styles.wellnessMetricLabel}>Water today</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reminderRow}>
              {wellnessReminderOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={styles.reminderMiniButton}
                  onPress={() => openWellnessReminderScheduler(option)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={option.icon} size={20} color={colors.primary} />
                  <Text style={styles.reminderMiniText}>{option.label}</Text>
                  <Text style={styles.reminderMiniSub}>{option.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {profileGender === 'female' && (
            <TouchableOpacity
              style={styles.periodInsightsCard}
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.9}
            >
              <View style={styles.periodHeader}>
                <Text style={styles.periodTitle}>Period Insights</Text>
                <Ionicons name="calendar-outline" size={24} color={colors.accent} />
              </View>
              <Text style={styles.periodSubtext}>
                Recent period logs with symptoms and mood so wellness reports feel complete.
              </Text>
              <View style={styles.periodStatsRow}>
                <View style={styles.periodStat}>
                  <Text style={styles.periodStatValue}>
                    {getDaysSinceLastPeriod() ?? '-'}
                  </Text>
                  <Text style={styles.periodStatLabel}>Days since last start</Text>
                </View>
                <View style={styles.periodStat}>
                  <Text style={styles.periodStatValue}>{periodLogs.length}</Text>
                  <Text style={styles.periodStatLabel}>Saved logs</Text>
                </View>
              </View>
              {periodLogs.length > 0 ? (
                periodLogs.slice(0, 4).map((log) => (
                  <View key={log.id} style={styles.periodLogItem}>
                    <Text style={styles.periodLogDate}>{formatDisplayDate(log.date)}</Text>
                    <Text style={styles.periodLogMeta}>
                      {[log.mood, ...log.symptoms].filter(Boolean).join(' | ') || 'No symptoms selected'}
                    </Text>
                    {log.notes ? <Text style={styles.periodLogMeta}>{log.notes}</Text> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.periodSubtext}>
                  No period logs yet. Open Dashboard and tap Log Period to add the first one.
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* PRODUCTIVITY TREND CHART - CLICKABLE */}
          {trends.length > 0 ? (
            <TouchableOpacity style={styles.chartCard} onPress={handleChartPress} activeOpacity={0.9}>
              <View style={styles.chartMetaRow}>
              <Text style={styles.chartTitle}>{t('view_productivity_trends')}</Text>
                <View style={styles.chartPill}>
                  <Text style={styles.chartPillText}>{avgProductivity}/10 avg</Text>
                </View>
              </View>
              <View style={styles.chartWrapper}>
                <LineChart
                  data={{
                    labels: trends.map((t) => formatTrendLabel(t.date)),
                    datasets: [{ data: trends.map((t) => Number(t.productivityScore || 0)) }],
                  }}
                  width={chartWidth}
                  height={210}
                  chartConfig={chartConfig}
                  bezier
                  fromZero
                  segments={5}
                  yAxisSuffix="/10"
                  style={{ borderRadius: BorderRadius.lg, marginLeft: -12 }}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.chartCard} onPress={() => navigation.navigate('Timer')}>
              <Text style={styles.chartTitle}>{t('no_data_yet')}</Text>
              <View style={styles.emptyState}>
                <Ionicons name="timer-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>Complete some focus sessions to see your trends</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* DETAILED INSIGHT CARDS - CLICKABLE */}
          <View style={styles.insightsGrid}>
            <TouchableOpacity
              style={styles.insightCard}
              onPress={() => handleInsightPress(
                'Best Score',
                `${productivityStats.best}/10`,
                'Your highest productivity score achieved!',
                'Timer'
              )}
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
              onPress={() => handleInsightPress(
                'Average Session',
                formatTime(focusStats.average),
                'Your average focus session length',
                'Timer'
              )}
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
              onPress={() => handleInsightPress(
                'Today',
                formatTime(focusStats.today),
                'Your focus time today!',
                'Timer'
              )}
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
              onPress={() => handleInsightPress(
                'Completion Rate',
                `${completionRate}%`,
                'Your task completion percentage',
                'Tasks'
              )}
            >
              <View style={styles.insightHeader}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.insightTitle}>Completion</Text>
              </View>
              <Text style={styles.insightValue}>{completionRate}%</Text>
              <Text style={styles.insightSubtext}>Tasks completed</Text>
            </TouchableOpacity>
          </View>

          {/* TASK COMPLETION PROGRESS BAR - CLICKABLE */}
          <TouchableOpacity
            style={styles.chartCard}
            onPress={handleProgressPress}
            activeOpacity={0.9}
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

          {/* PERSONALIZED RECOMMENDATION - CLICKABLE */}
          <TouchableOpacity style={styles.recommendationCard} onPress={handleRecommendationPress}>
            <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
            <Text style={styles.recommendationText}>{getRecommendations()}</Text>
          </TouchableOpacity>

          {/* QUICK ACTION BUTTONS - CLICKABLE */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('Tasks')}>
              <Ionicons name="list" size={24} color={colors.primary} />
              <Text style={styles.actionText}>{t('tasks')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleQuickAction('Timer')}>
              <Ionicons name="timer" size={24} color={colors.secondary} />
              <Text style={styles.actionText}>{t('focus')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSummaryPress}
            >
              <Ionicons name="analytics" size={24} color={colors.accent} />
              <Text style={styles.actionText}>{t('summary')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showWellnessScheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Schedule {selectedWellnessReminder?.label || 'Wellness'} Reminder
            </Text>
            <Text style={styles.modalSubtitle}>Choose when you want to be notified daily.</Text>
            {Platform.OS === 'ios' ? (
              <View style={styles.timePickerInlineWrap}>
                <View style={styles.reminderPickerButton}>
                  <Text style={styles.reminderPickerText}>{formatReminderTime(wellnessReminderTime)}</Text>
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                </View>
                <DateTimePicker
                  value={wellnessReminderTime}
                  mode="time"
                  display="spinner"
                  onChange={(_event, selectedDate) => {
                    if (selectedDate) {
                      setWellnessReminderTime(selectedDate);
                    }
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.reminderPickerButton}
                  onPress={() => setShowWellnessTimePicker(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.reminderPickerText}>{formatReminderTime(wellnessReminderTime)}</Text>
                  <Ionicons name="time-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
                {showWellnessTimePicker && (
                  <DateTimePicker
                    value={wellnessReminderTime}
                    mode="time"
                    display="default"
                    onChange={(_event, selectedDate) => {
                      setShowWellnessTimePicker(false);
                      if (selectedDate) {
                        setWellnessReminderTime(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleScheduleWellnessReminder}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Set Daily Reminder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => {
                setShowWellnessScheduleModal(false);
                setShowWellnessTimePicker(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
