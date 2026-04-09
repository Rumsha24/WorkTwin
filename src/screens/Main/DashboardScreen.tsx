import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ProgressChart } from 'react-native-chart-kit';

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useHealth } from '../../hooks/useHealth';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import {
  loadTasks,
  loadFocus,
  loadProductivityTrends,
} from '../../utils/storage';
import { Task, FocusSession } from '../../utils/types';
import { haptics } from '../../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    healthData,
    updateMentalHealthScore,
    addSleepLog,
    updateSteps,
    addSteps,
    updateStepGoal,
    addMedicine,
    takeMedicine,
    deleteMedicine,
    calculateMentalHealthScore,
    getStepProgress,
    getRecentSleepAverage,
    getMentalHealthFeedback,
    loadHealthData,
  } = useHealth();

  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [focusStats, setFocusStats] = useState({ total: 0, today: 0, average: 0 });
  const [productivity, setProductivity] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [todaySessions, setTodaySessions] = useState(0);
  const [greeting, setGreeting] = useState('');

  // Health Modal States
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMentalModal, setShowMentalModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [stepGoalInput, setStepGoalInput] = useState('');
  const [mentalQuestionIndex, setMentalQuestionIndex] = useState(0);
  const [mentalAnswers, setMentalAnswers] = useState<Record<string, string>>({});
  const [newMedicine, setNewMedicine] = useState({ name: '', time: '', dosage: '' });
  const [showAddMedicine, setShowAddMedicine] = useState(false);

  // Sleep modal selected state
  const [selectedSleepHours, setSelectedSleepHours] = useState<number | null>(null);
  const [selectedSleepQuality, setSelectedSleepQuality] = useState<number | null>(null);

  // Pie chart data
  const [pieChartData, setPieChartData] = useState({
    labels: ['Tasks', 'Focus', 'Productivity'],
    data: [0, 0, 0],
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mentalScaleAnim = useRef(new Animated.Value(0.96)).current;

  // Health Questions
  const healthQuestions = [
    { id: 'mood', question: 'How would you rate your mood today?', emoji: '😊', options: ['😊 Great', '🙂 Good', '😐 Neutral', '😔 Low', '😢 Very Low'] },
    { id: 'anxiety', question: 'How anxious have you felt?', emoji: '😰', options: ['None', 'Mild', 'Moderate', 'High', 'Severe'] },
    { id: 'sleep', question: 'How well did you sleep last night?', emoji: '😴', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'] },
    { id: 'stress', question: 'What is your stress level?', emoji: '😫', options: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] },
    { id: 'energy', question: 'How is your energy level?', emoji: '⚡', options: ['Very High', 'High', 'Normal', 'Low', 'Very Low'] },
  ];

  useFocusEffect(
    useCallback(() => {
      updateGreeting();
      const task = InteractionManager.runAfterInteractions(async () => {
        await Promise.all([loadStats(), loadHealthData()]);
      });

      return () => task.cancel();
    }, [loadHealthData])
  );

  useEffect(() => {
    animateEntrance();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (showMentalModal) {
      mentalScaleAnim.setValue(0.96);
      Animated.spring(mentalScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [showMentalModal]);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  };

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

      setTaskStats({ total: tasks.length, completed, pending });
      setRecentTasks(tasks.slice(0, 5));

      const totalFocusSeconds = sessions.reduce((acc: number, session: FocusSession) => acc + session.seconds, 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayFocusSessions = sessions.filter(
        (session: FocusSession) => session.endedAt >= todayStart.getTime()
      );
      const todayFocusSeconds = todayFocusSessions.reduce(
        (acc: number, session: FocusSession) => acc + session.seconds,
        0
      );
      const averageFocus = sessions.length > 0 ? Math.round(totalFocusSeconds / sessions.length) : 0;

      setFocusStats({ total: totalFocusSeconds, today: todayFocusSeconds, average: averageFocus });
      setTodaySessions(todayFocusSessions.length);

      let avgProductivity = 0;
      if (trends.length > 0) {
        const avg = trends.reduce((acc, item) => acc + item.productivityScore, 0) / trends.length;
        avgProductivity = Math.round(avg * 10) / 10;
        setProductivity(avgProductivity);
      } else {
        setProductivity(0);
      }

      const taskProgress = tasks.length > 0 ? completed / tasks.length : 0;
      const focusProgress = todayFocusSeconds > 0 ? Math.min(todayFocusSeconds / 3600, 1) : 0;
      const productivityProgress = avgProductivity / 10;

      setPieChartData({
        labels: ['Tasks Done', "Today's Focus", 'Productivity'],
        data: [taskProgress, focusProgress, productivityProgress],
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await Promise.all([loadStats(), loadHealthData()]);
    setRefreshing(false);
    haptics.success();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getDisplayName = () => {
    if (user?.isAnonymous) return 'Guest';
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const handleMentalAnswer = async (answer: string) => {
    const currentQ = healthQuestions[mentalQuestionIndex];
    const newAnswers = { ...mentalAnswers, [currentQ.id]: answer };
    setMentalAnswers(newAnswers);

    if (mentalQuestionIndex < healthQuestions.length - 1) {
      setMentalQuestionIndex(mentalQuestionIndex + 1);
    } else {
      const score = calculateMentalHealthScore(newAnswers);
      await updateMentalHealthScore(score);
      setShowMentalModal(false);
      setMentalQuestionIndex(0);
      setMentalAnswers({});
      haptics.success();
      Alert.alert(
        '✅ Health Check Complete',
        `Your mental wellness score: ${score}/100\n\n${getMentalHealthFeedback()}`,
        [{ text: 'Great!' }]
      );
    }
  };

  const handleSaveSleep = async () => {
    if (!selectedSleepHours || !selectedSleepQuality) {
      Alert.alert('Incomplete', 'Please select both sleep hours and sleep quality.');
      return;
    }

    await addSleepLog(selectedSleepHours, selectedSleepQuality);
    setSelectedSleepHours(null);
    setSelectedSleepQuality(null);
    setShowSleepModal(false);
    haptics.success();

    Alert.alert(
      '😴 Sleep Logged',
      `${selectedSleepHours} hours sleep recorded with ${
        selectedSleepQuality === 4
          ? 'Excellent'
          : selectedSleepQuality === 3
          ? 'Good'
          : selectedSleepQuality === 2
          ? 'Fair'
          : 'Poor'
      } quality`
    );
  };

  const handleAddSteps = async () => {
    const steps = parseInt(stepInput, 10);
    if (isNaN(steps) || steps < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of steps');
      return;
    }
    await updateSteps(steps);
    setStepInput('');
    setShowStepModal(false);
    haptics.success();
    const progress = Math.round((steps / healthData.stepData.goal) * 100);
    Alert.alert('👟 Steps Updated', `${steps} steps recorded (${progress}% of daily goal)`);
  };

  const handleQuickAddSteps = async (extraSteps: number) => {
    await addSteps(extraSteps);
    haptics.light();
  };

  const handleUpdateStepGoal = async () => {
    const goal = parseInt(stepGoalInput, 10);
    if (isNaN(goal) || goal < 100) {
      Alert.alert('Invalid Input', 'Please enter a valid step goal (minimum 100)');
      return;
    }
    await updateStepGoal(goal);
    setStepGoalInput('');
    haptics.success();
    Alert.alert('🎯 Goal Updated', `Daily step goal set to ${goal} steps`);
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.time || !newMedicine.dosage) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    await addMedicine(newMedicine.name, newMedicine.time, newMedicine.dosage);
    setNewMedicine({ name: '', time: '', dosage: '' });
    setShowAddMedicine(false);
    haptics.success();
    Alert.alert('✅ Medicine Added', `${newMedicine.name} at ${newMedicine.time}`);
  };

  const handleTakeMedicine = async (id: string, name: string) => {
    await takeMedicine(id);
    haptics.medium();
    Alert.alert('💊 Medicine Taken', `${name} marked as taken. Great job staying healthy!`);
  };

  const handleDeleteMedicine = (id: string, name: string) => {
    Alert.alert('Delete Medicine', `Remove "${name}" from your reminders?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedicine(id);
          haptics.heavy();
        },
      },
    ]);
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

  const mentalProgressPercent = ((mentalQuestionIndex + 1) / healthQuestions.length) * 100;

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
    header: { marginBottom: Spacing.xl },
    greeting: { ...Typography.h1, color: colors.text, fontSize: 30 },
    subGreeting: { ...Typography.body, color: colors.textSecondary, marginTop: Spacing.xs },

    // Health Hero Card
    healthHeroCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      ...Shadows.medium,
    },
    healthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    healthTitle: { ...Typography.h2, color: colors.primary, fontSize: 20 },
    healthScore: {
      ...Typography.h1,
      fontSize: 36,
      color: colors.primary,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    healthScoreLabel: { ...Typography.caption, color: colors.textSecondary, textAlign: 'center' },
    healthFeedback: {
      ...Typography.caption,
      color: colors.primary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      fontStyle: 'italic',
    },

    // Health Actions
    healthActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
    healthButton: {
      flex: 1,
      minWidth: '22%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.lg,
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // Medicine List
    medicineSection: { marginBottom: Spacing.lg },
    medicineTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.sm },
    medicineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    medicineInfo: { flex: 1 },
    medicineName: { ...Typography.body, fontWeight: '600', color: colors.text },
    medicineDosage: { ...Typography.caption, color: colors.textSecondary },
    medicineTime: { ...Typography.caption, color: colors.primary, marginTop: 2 },
    takenBtn: {
      backgroundColor: colors.success,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.round,
    },
    takenText: { color: colors.text, fontSize: 12, fontWeight: '600' },

    // Progress Card
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
      marginBottom: Spacing.md,
    },
    progressHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    progressValue: { ...Typography.h1, fontSize: 44, color: colors.primary },
    progressBar: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginTop: Spacing.sm,
    },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: BorderRadius.round },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    statCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.small,
    },
    statValue: { ...Typography.h2, color: colors.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    statLabel: { ...Typography.caption, color: colors.textSecondary },

    // Recent Tasks
    recentTaskCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.small,
    },
    taskDot: { width: 10, height: 10, borderRadius: 5, marginRight: Spacing.md },
    taskTitle: { ...Typography.body, color: colors.text, flex: 1 },
    taskDone: { textDecorationLine: 'line-through', color: colors.textMuted },

    // Quick Actions
    quickActions: { flexDirection: 'row', gap: Spacing.md },
    actionButton: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      ...Shadows.small,
    },
    actionText: { ...Typography.caption, color: colors.text, marginTop: Spacing.sm, textAlign: 'center' },

    // Modal Styles - Centered UI
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: '90%',
      maxHeight: '85%',
      ...Shadows.medium,
    },
    modalTitle: { ...Typography.h2, color: colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
    modalSubtitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    modalText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    modalInput: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      color: colors.text,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
      textAlign: 'center',
    },
    modalButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    modalButtonText: { ...Typography.button, color: colors.text },
    modalButtonSecondary: {
      backgroundColor: colors.surface,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonSecondaryText: { ...Typography.button, color: colors.textSecondary },

    // Sleep Options
    sleepRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    sleepOption: {
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      minWidth: 70,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sleepOptionActive: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
    },
    sleepOptionText: { ...Typography.body, color: colors.text },

    // Mental Health Options
    questionOption: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    questionOptionText: { ...Typography.body, color: colors.text, textAlign: 'center' },
    progressIndicator: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
    mentalProgressTrack: {
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    mentalProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.round,
      width: `${mentalProgressPercent}%`,
    },

    // Step quick add
    quickStepRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    quickStepChip: {
      backgroundColor: colors.primary + '12',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    quickStepChipText: {
      color: colors.primary,
      fontWeight: '700',
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.greeting}>
                {greeting}, {getDisplayName()}!
              </Text>
              <Text style={styles.subGreeting}>Ready to focus and get things done?</Text>
            </View>

            {/* Health & Wellness Card */}
            <Animated.View style={[styles.healthHeroCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.healthHeader}>
                <Text style={styles.healthTitle}>💚 Health & Wellness</Text>
                <Ionicons name="heart" size={28} color={colors.primary} />
              </View>

              <ProgressChart
                data={{
                  labels: ['Mental', 'Sleep', 'Steps', 'Tasks'],
                  data: [
                    healthData.mentalHealthScore / 100,
                    getRecentSleepAverage(7) / 12,
                    getStepProgress() / 100,
                    taskStats.completed / (taskStats.total || 1),
                  ],
                }}
                width={screenWidth - Spacing.xl * 2 - 32}
                height={180}
                strokeWidth={12}
                radius={28}
                chartConfig={chartConfig}
                hideLegend={false}
              />

              <Text style={styles.healthScore}>{healthData.mentalHealthScore}/100</Text>
              <Text style={styles.healthScoreLabel}>Mental Wellness Score</Text>
              <Text style={styles.healthFeedback}>{getMentalHealthFeedback()}</Text>

              <View style={styles.healthActions}>
                <TouchableOpacity
                  style={styles.healthButton}
                  onPress={() => setShowMentalModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="clipboard" size={18} color={colors.primary} />
                  <Text style={styles.statLabel}>Check-in</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.healthButton}
                  onPress={() => setShowSleepModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bed" size={18} color={colors.info} />
                  <Text style={styles.statLabel}>Sleep</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.healthButton}
                  onPress={() => setShowStepModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="walk" size={18} color={colors.success} />
                  <Text style={styles.statLabel}>Steps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.healthButton}
                  onPress={() => setShowMedicineModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="medkit" size={18} color={colors.warning} />
                  <Text style={styles.statLabel}>Medicines</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Medicine Reminders Section */}
            {healthData.medicines.length > 0 && (
              <View style={styles.medicineSection}>
                <Text style={styles.medicineTitle}>💊 Today's Medicines</Text>
                {healthData.medicines.slice(0, 3).map((med) => (
                  <View key={med.id} style={styles.medicineItem}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{med.name}</Text>
                      <Text style={styles.medicineDosage}>{med.dosage}</Text>
                      <Text style={styles.medicineTime}>⏰ {med.time}</Text>
                    </View>
                    {!med.taken ? (
                      <TouchableOpacity
                        style={styles.takenBtn}
                        onPress={() => handleTakeMedicine(med.id, med.name)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.takenText}>Take</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.takenBtn, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.takenText, { color: colors.success }]}>✓ Taken</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Statistics Section */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.85}
              >
                <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>
                  {taskStats.completed}/{taskStats.total}
                </Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Timer')}
                activeOpacity={0.85}
              >
                <Ionicons name="timer-outline" size={24} color={colors.secondary} />
                <Text style={styles.statValue}>{formatTime(focusStats.today)}</Text>
                <Text style={styles.statLabel}>Today's Focus</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Insights')}
                activeOpacity={0.85}
              >
                <Ionicons name="trending-up" size={24} color={colors.accent} />
                <Text style={styles.statValue}>{productivity}/10</Text>
                <Text style={styles.statLabel}>Avg Productivity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => setShowStepModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="walk" size={24} color={colors.success} />
                <Text style={styles.statValue}>{healthData.stepData.steps}</Text>
                <Text style={styles.statLabel}>Steps Today</Text>
              </TouchableOpacity>
            </View>

            {/* Productivity Section */}
            <TouchableOpacity
              style={styles.progressCard}
              onPress={() => navigation.navigate('Insights')}
              activeOpacity={0.85}
            >
              <View style={styles.progressHeader}>
                <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                <Text style={styles.medicineTitle}>Productivity Score</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={styles.progressValue}>{productivity}</Text>
                <Text style={styles.statLabel}>/ 10</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(productivity * 10, 100)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* Recent Tasks */}
            {recentTasks.length > 0 && (
              <View>
                <Text style={styles.medicineTitle}>📋 Recent Tasks</Text>
                {recentTasks.slice(0, 3).map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.recentTaskCard}
                    onPress={() => navigation.navigate('Tasks')}
                    activeOpacity={0.85}
                  >
                    <View
                      style={[
                        styles.taskDot,
                        { backgroundColor: task.done ? colors.success : colors.primary },
                      ]}
                    />
                    <Text style={[styles.taskTitle, task.done && styles.taskDone]}>
                      {task.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Timer')}
                activeOpacity={0.85}
              >
                <Ionicons name="play-circle-outline" size={28} color={colors.secondary} />
                <Text style={styles.actionText}>Start Timer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Insights')}
                activeOpacity={0.85}
              >
                <Ionicons name="analytics-outline" size={28} color={colors.accent} />
                <Text style={styles.actionText}>Insights</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Mental Health Modal - Centered UI */}
      <Modal visible={showMentalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ scale: mentalScaleAnim }] },
            ]}
          >
            <Text style={styles.modalTitle}>
              💚 {healthQuestions[mentalQuestionIndex].emoji} {healthQuestions[mentalQuestionIndex].question}
            </Text>

            <View style={styles.mentalProgressTrack}>
              <View style={styles.mentalProgressFill} />
            </View>

            {healthQuestions[mentalQuestionIndex].options.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.questionOption}
                onPress={() => handleMentalAnswer(option)}
                activeOpacity={0.85}
              >
                <Text style={styles.questionOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.progressIndicator}>
              {mentalQuestionIndex + 1}/{healthQuestions.length}
            </Text>

            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowMentalModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Sleep Modal - Fixed Flow */}
      <Modal visible={showSleepModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>😴 Sleep Log</Text>

            <Text style={styles.modalSubtitle}>Hours of Sleep</Text>
            <View style={styles.sleepRow}>
              {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.sleepOption,
                    selectedSleepHours === h && styles.sleepOptionActive,
                  ]}
                  onPress={() => setSelectedSleepHours(h)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sleepOptionText}>{h}h</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>Sleep Quality</Text>
            <View style={styles.sleepRow}>
              {[
                { label: '🌟 Excellent', value: 4 },
                { label: '😊 Good', value: 3 },
                { label: '🙂 Fair', value: 2 },
                { label: '😴 Poor', value: 1 },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.sleepOption,
                    selectedSleepQuality === item.value && styles.sleepOptionActive,
                  ]}
                  onPress={() => setSelectedSleepQuality(item.value)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sleepOptionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveSleep}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Save Sleep Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => {
                setSelectedSleepHours(null);
                setSelectedSleepQuality(null);
                setShowSleepModal(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Step Modal */}
      <Modal visible={showStepModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>👟 Step Tracker</Text>
            <Text style={styles.modalSubtitle}>
              Current: {healthData.stepData.steps} / {healthData.stepData.goal} steps
            </Text>
            <Text style={styles.modalSubtitle}>Progress: {getStepProgress()}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getStepProgress()}%` }]} />
            </View>

            <View style={styles.quickStepRow}>
              {[500, 1000, 2000, 5000].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={styles.quickStepChip}
                  onPress={() => handleQuickAddSteps(value)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.quickStepChipText}>+{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter today's steps"
              placeholderTextColor={colors.textMuted}
              value={stepInput}
              onChangeText={setStepInput}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddSteps}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Update Steps</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.modalInput}
              placeholder="Set new daily goal"
              placeholderTextColor={colors.textMuted}
              value={stepGoalInput}
              onChangeText={setStepGoalInput}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={handleUpdateStepGoal}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Update Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowStepModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Medicine Modal */}
      <Modal visible={showMedicineModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💊 Medicine Reminders</Text>

            {healthData.medicines.length === 0 ? (
              <Text style={styles.modalText}>No medicines added yet.</Text>
            ) : (
              healthData.medicines.map((med) => (
                <View key={med.id} style={styles.medicineItem}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineDosage}>{med.dosage}</Text>
                    <Text style={styles.medicineTime}>⏰ {med.time}</Text>
                  </View>
                  {!med.taken ? (
                    <TouchableOpacity
                      style={styles.takenBtn}
                      onPress={() => handleTakeMedicine(med.id, med.name)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.takenText}>Take</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.takenText, { color: colors.success }]}>✓ Taken</Text>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteMedicine(med.id, med.name)}
                    style={{ marginLeft: Spacing.sm }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAddMedicine(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>+ Add Medicine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowMedicineModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Medicine Modal */}
      <Modal visible={showAddMedicine} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Add Medicine</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Medicine Name"
              placeholderTextColor={colors.textMuted}
              value={newMedicine.name}
              onChangeText={(text) => setNewMedicine({ ...newMedicine, name: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Time (e.g., 9:00 AM)"
              placeholderTextColor={colors.textMuted}
              value={newMedicine.time}
              onChangeText={(text) => setNewMedicine({ ...newMedicine, time: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Dosage (e.g., 1 tablet)"
              placeholderTextColor={colors.textMuted}
              value={newMedicine.dosage}
              onChangeText={(text) => setNewMedicine({ ...newMedicine, dosage: text })}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddMedicine}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Add Medicine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowAddMedicine(false)}
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