import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Easing,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../../theme/worktwinTheme';
import {
  addFocusSession,
  loadTasks,
  formatDuration,
  loadProductivityTrends,
  loadFocus,
} from '../../utils/storage';
import { OfflineStatus } from '../../components/common/OfflineStatus';
import { haptics } from '../../utils/haptics';
import { Task, FocusSession } from '../../utils/types';

type TrendPoint = {
  date: string;
  productivityScore: number;
  totalFocus: number;
};

export default function TimerScreen() {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width - Spacing.xl * 2;

  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const [interruptions, setInterruptions] = useState(0);
  const [focusScore, setFocusScore] = useState(10);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [productivityScore, setProductivityScore] = useState(5);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [showTrends, setShowTrends] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    averageProductivity: 0,
    bestStreak: 0,
    currentStreak: 0,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const timeOptions = [5, 10, 15, 25, 45];

  useEffect(() => {
    loadTasksData();
    loadTrendsData();
    loadStats();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (running && seconds > 0) {
      interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (seconds === 0 && running) {
      handleSessionComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, seconds]);

  useEffect(() => {
    if (running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [running, pulseAnim, rotateAnim]);

  const loadTasksData = async () => {
    try {
      const loadedTasks = await loadTasks();
      setTasks(loadedTasks.filter((t: Task) => !t.done));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadTrendsData = async () => {
    try {
      const loadedTrends = (await loadProductivityTrends()) as TrendPoint[];
      setTrends(loadedTrends.slice(-7));
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const loadStats = async () => {
    try {
      const sessions = await loadFocus();
      const totalSessions = sessions.length;
      const totalFocusTime = sessions.reduce((acc: number, s: FocusSession) => acc + s.seconds, 0);

      const rated = sessions.filter((s: FocusSession) => typeof s.productivity === 'number');
      const avgProductivity =
        rated.length > 0
          ? rated.reduce((acc: number, s: FocusSession) => acc + (s.productivity || 0), 0) / rated.length
          : 0;

      let currentStreak = 0;
      const bestStreak = 0;
      const today = new Date().setHours(0, 0, 0, 0);
      const hasTodaySession = sessions.some((s: FocusSession) => s.endedAt >= today);
      if (hasTodaySession) currentStreak = 1;

      setStats({
        totalSessions,
        totalFocusTime,
        averageProductivity: Math.round(avgProductivity * 10) / 10,
        bestStreak,
        currentStreak,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStart = () => {
    haptics.medium();
    setRunning(true);
    setInterruptions(0);
    setFocusScore(10);
  };

  const handlePause = () => {
    haptics.light();
    setRunning(false);
  };

  const handleReset = () => {
    haptics.medium();
    setRunning(false);
    setSeconds(selectedTime * 60);
    setInterruptions(0);
    setFocusScore(10);
  };

  const handleInterruption = () => {
    haptics.warning();
    setInterruptions((prev) => prev + 1);
    setFocusScore((prev) => Math.max(1, prev - 1));
    Vibration.vibrate(100);
  };

  const handleSessionComplete = () => {
    setRunning(false);
    haptics.timerComplete();
    Vibration.vibrate(500);

    const calculatedProductivity = Math.max(
      1,
      Math.min(10, Math.round((focusScore / 10) * (1 - interruptions / 10) * 10))
    );

    const session: FocusSession = {
      id: `session_${Date.now()}`,
      seconds: selectedTime * 60,
      endedAt: Date.now(),
      taskId: selectedTaskId || undefined,
      interruptions,
      focusScore,
      productivity: calculatedProductivity,
    };

    setCurrentSession(session);
    setProductivityScore(calculatedProductivity);
    setShowCompletionModal(true);
  };

  const handleSaveSession = async (rating: number) => {
    haptics.success();
    try {
      if (currentSession) {
        await addFocusSession({
          ...currentSession,
          productivity: rating,
        });
        setShowCompletionModal(false);
        handleReset();
        loadTrendsData();
        loadStats();
        Alert.alert('Success', 'Session saved!');
      }
    } catch (error) {
      haptics.error();
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  const handleTimeSelect = (minutes: number) => {
    haptics.light();
    setSelectedTime(minutes);
    setSeconds(minutes * 60);
    setRunning(false);
    setInterruptions(0);
    setFocusScore(10);
    setShowCustomInput(false);
  };

  const handleCustomTime = () => {
    const minutes = parseInt(customMinutes, 10);
    if (Number.isNaN(minutes) || minutes < 1 || minutes > 120) {
      Alert.alert('Invalid Time', 'Please enter a time between 1 and 120 minutes');
      return;
    }
    handleTimeSelect(minutes);
    setCustomMinutes('');
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const progress = ((selectedTime * 60 - seconds) / (selectedTime * 60)) * 100;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getProductivityColor = (score: number) => {
    if (score >= 8) return colors.success;
    if (score >= 5) return colors.warning;
    return colors.danger;
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: () => colors.primary,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg, alignItems: 'center' },
    title: { ...Typography.h1, color: colors.text, marginTop: Spacing.md, marginBottom: Spacing.xl },

    timerCard: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      alignItems: 'center',
      ...Shadows.medium,
      marginBottom: Spacing.xl,
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    progressCircle: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: colors.primary + '20',
      overflow: 'hidden',
    },
    progressRing: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary + '20',
    },
    time: { ...Typography.h1, fontSize: 52, color: colors.text, zIndex: 1 },
    timeLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    liveStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: Spacing.sm,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statText: { ...Typography.caption, color: colors.textSecondary, fontSize: 13 },

    taskSelector: { width: '100%', marginBottom: Spacing.lg },
    sectionLabel: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Spacing.sm,
      alignSelf: 'flex-start',
    },
    taskList: { flexDirection: 'row', maxHeight: 50 },
    taskChip: {
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      marginRight: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    taskChipText: { color: colors.textMuted, fontSize: 14 },
    taskChipTextSelected: { color: colors.text },

    timeSelector: { width: '100%', marginBottom: Spacing.lg },
    timeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    timeBtn: {
      minWidth: 60,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    timeBtnSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeBtnText: { ...Typography.body, color: colors.textSecondary },
    timeBtnTextSelected: { color: colors.text },
    customInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    customInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
    },

    interruptionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
      ...Shadows.small,
    },
    interruptionText: { color: colors.text, fontSize: 16, fontWeight: '600' },
    controls: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      ...Shadows.small,
    },
    pauseBtn: { backgroundColor: colors.warning },
    btnText: { color: colors.text, fontSize: 18, fontWeight: '600' },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
    },
    secondaryBtnText: { color: colors.textSecondary, fontSize: 16 },
    disabled: { opacity: 0.5 },

    statsContainer: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      ...Shadows.small,
    },
    statCardValue: {
      ...Typography.h3,
      color: colors.primary,
      marginBottom: Spacing.xs,
    },
    statCardLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    trendsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      marginBottom: Spacing.md,
    },
    trendsBtnText: { color: colors.primary, fontSize: 16, fontWeight: '500' },
    trendsContainer: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    trendsTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.md },
    chartWrapper: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    trendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    trendDate: { ...Typography.caption, color: colors.textSecondary, width: 70, fontSize: 11 },
    trendBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginHorizontal: Spacing.sm,
      overflow: 'hidden',
    },
    trendFill: {
      height: '100%',
      borderRadius: BorderRadius.round,
    },
    trendScore: { ...Typography.caption, color: colors.textSecondary, width: 35, textAlign: 'right' },
    noTrendsText: { ...Typography.caption, color: colors.textMuted, textAlign: 'center', marginVertical: Spacing.md },
    trendStats: { ...Typography.body, color: colors.text, marginTop: Spacing.md, textAlign: 'center' },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: '90%',
      alignItems: 'center',
      ...Shadows.medium,
    },
    modalTitle: { ...Typography.h2, color: colors.text, marginVertical: Spacing.md },
    sessionStats: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    statLabel: { ...Typography.body, color: colors.text, marginBottom: Spacing.xs },
    modalSubtitle: { ...Typography.body, fontWeight: '600', color: colors.text, marginBottom: Spacing.md },
    ratingContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    ratingBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    ratingBtnSelected: {
      backgroundColor: colors.primary,
    },
    ratingText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    ratingTextSelected: { color: colors.text },
    modalButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      width: '100%',
    },
    modalBtn: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    saveBtn: { backgroundColor: colors.primary },
    cancelText: { color: colors.textSecondary, fontWeight: '600' },
    saveText: { color: colors.text, fontWeight: '600' },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <OfflineStatus />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Focus Timer</Text>

          <Animated.View style={[styles.timerCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.timerContainer}>
              <Animated.View style={[styles.progressCircle, { transform: [{ rotate: spin }] }]}>
                <View style={[styles.progressRing, { height: `${progress}%` }]} />
                <Text style={styles.time}>
                  {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
                </Text>
              </Animated.View>
              <Text style={styles.timeLabel}>
                {selectedTime > 0 ? `${selectedTime} minute session` : 'Custom session'}
              </Text>
            </View>

            {running && (
              <View style={styles.liveStats}>
                <View style={styles.statItem}>
                  <Ionicons name="alert-circle" size={16} color={colors.warning} />
                  <Text style={styles.statText}>Interruptions: {interruptions}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={styles.statText}>Focus: {focusScore}/10</Text>
                </View>
              </View>
            )}
          </Animated.View>

          <View style={styles.taskSelector}>
            <Text style={styles.sectionLabel}>Link to Task (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskList}>
              <TouchableOpacity
                style={[styles.taskChip, !selectedTaskId && styles.taskChipSelected]}
                onPress={() => {
                  haptics.light();
                  setSelectedTaskId(null);
                }}
              >
                <Text style={!selectedTaskId ? styles.taskChipTextSelected : styles.taskChipText}>
                  None
                </Text>
              </TouchableOpacity>

              {tasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskChip, selectedTaskId === task.id && styles.taskChipSelected]}
                  onPress={() => {
                    haptics.light();
                    setSelectedTaskId(task.id);
                  }}
                >
                  <Text style={selectedTaskId === task.id ? styles.taskChipTextSelected : styles.taskChipText}>
                    {task.title.length > 20 ? `${task.title.substring(0, 20)}...` : task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeSelector}>
            <Text style={styles.sectionLabel}>Session Duration</Text>

            <View style={styles.timeOptions}>
              {timeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeBtn, selectedTime === time && !showCustomInput && styles.timeBtnSelected]}
                  onPress={() => handleTimeSelect(time)}
                >
                  <Text style={[styles.timeBtnText, selectedTime === time && !showCustomInput && styles.timeBtnTextSelected]}>
                    {time}m
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.timeBtn, showCustomInput && styles.timeBtnSelected]}
                onPress={() => {
                  haptics.light();
                  setShowCustomInput(!showCustomInput);
                  if (!showCustomInput) setSelectedTime(0);
                }}
              >
                <Text style={[styles.timeBtnText, showCustomInput && styles.timeBtnTextSelected]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {showCustomInput && (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Minutes (1-120)"
                  placeholderTextColor={colors.textMuted}
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <TouchableOpacity style={styles.customBtn} onPress={handleCustomTime}>
                  <Ionicons name="checkmark" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {running && (
            <TouchableOpacity style={styles.interruptionBtn} onPress={handleInterruption}>
              <Ionicons name="warning" size={20} color={colors.text} />
              <Text style={styles.interruptionText}>Log Interruption</Text>
            </TouchableOpacity>
          )}

          <View style={styles.controls}>
            {!running ? (
              <TouchableOpacity
                style={[styles.primaryBtn, seconds === 0 && styles.disabled]}
                onPress={handleStart}
                disabled={seconds === 0}
              >
                <Ionicons name="play" size={24} color={colors.text} />
                <Text style={styles.btnText}>Start</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.primaryBtn, styles.pauseBtn]} onPress={handlePause}>
                <Ionicons name="pause" size={24} color={colors.text} />
                <Text style={styles.btnText}>Pause</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{stats.totalSessions}</Text>
              <Text style={styles.statCardLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{formatDuration(stats.totalFocusTime)}</Text>
              <Text style={styles.statCardLabel}>Total Focus</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{stats.averageProductivity}/10</Text>
              <Text style={styles.statCardLabel}>Avg Productivity</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{stats.currentStreak}</Text>
              <Text style={styles.statCardLabel}>Current Streak</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.trendsBtn}
            onPress={() => {
              haptics.light();
              setShowTrends(!showTrends);
            }}
          >
            <Ionicons name="trending-up" size={20} color={colors.primary} />
            <Text style={styles.trendsBtnText}>
              {showTrends ? 'Hide Productivity Trends' : 'View Productivity Trends'}
            </Text>
          </TouchableOpacity>

          {showTrends && (
            <View style={styles.trendsContainer}>
              <Text style={styles.trendsTitle}>Last 7 Days</Text>

              {trends.length > 0 ? (
                <>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={{
                        labels: trends.map((t) => t.date.split('/')[0]),
                        datasets: [{ data: trends.map((t) => t.productivityScore) }],
                      }}
                      width={screenWidth}
                      height={180}
                      chartConfig={chartConfig}
                      bezier
                      style={{ borderRadius: BorderRadius.lg }}
                    />
                  </View>

                  {trends.map((trend, index) => (
                    <View key={index} style={styles.trendItem}>
                      <Text style={styles.trendDate}>{trend.date}</Text>
                      <View style={styles.trendBar}>
                        <View
                          style={[
                            styles.trendFill,
                            {
                              width: `${(trend.productivityScore / 10) * 100}%`,
                              backgroundColor: getProductivityColor(trend.productivityScore),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.trendScore}>{trend.productivityScore}/10</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noTrendsText}>
                  No trends data yet. Complete some sessions to see your progress!
                </Text>
              )}

              {trends.length > 0 && (
                <Text style={styles.trendStats}>
                  Total Focus: {formatDuration(trends.reduce((acc, t) => acc + t.totalFocus, 0))}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={60} color={colors.warning} />
            <Text style={styles.modalTitle}>Great Focus Session!</Text>

            <View style={styles.sessionStats}>
              <Text style={styles.statLabel}>Duration: {formatDuration(selectedTime * 60)}</Text>
              <Text style={styles.statLabel}>Interruptions: {interruptions}</Text>
              <Text style={styles.statLabel}>Focus Score: {focusScore}/10</Text>
              <Text style={styles.statLabel}>
                Task: {tasks.find((t) => t.id === selectedTaskId)?.title || 'No task'}
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>Rate your productivity:</Text>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingBtn,
                    productivityScore === rating && styles.ratingBtnSelected,
                    { borderColor: getProductivityColor(rating) },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setProductivityScore(rating);
                  }}
                >
                  <Text style={[styles.ratingText, productivityScore === rating && styles.ratingTextSelected]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  haptics.light();
                  setShowCompletionModal(false);
                  handleReset();
                }}
              >
                <Text style={styles.cancelText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={() => handleSaveSession(productivityScore)}
              >
                <Text style={styles.saveText}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}