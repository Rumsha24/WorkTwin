import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../context/ThemeContext";
import { Spacing, BorderRadius, Typography, Shadows } from "../../theme/worktwinTheme";
import { 
  addFocusSession, 
  loadTasks,
  formatDuration,
  loadProductivityTrends,
  loadFocus,
  getScopedStorageKey,
} from "../../utils/storage";
import { OfflineStatus } from "../../components/common/OfflineStatus";
import { haptics } from "../../utils/haptics";
import { Task, FocusSession, ProductivityTrend } from "../../utils/types";
import { LineChart } from "react-native-chart-kit";
import { BreathingExercise } from "../../components/health/BreathingExercise";

const { width: screenWidth } = Dimensions.get('window');

// Timer Presets
interface TimerPreset {
  id: string;
  name: string;
  minutes: number;
  icon: string;
  color: string;
}

const defaultPresets: TimerPreset[] = [
  { id: 'pomodoro', name: 'Pomodoro', minutes: 25, icon: 'timer', color: '#6366F1' },
  { id: 'deep-work', name: 'Deep Work', minutes: 50, icon: 'bulb', color: '#8B5CF6' },
  { id: 'quick', name: 'Quick Focus', minutes: 15, icon: 'flash', color: '#10B981' },
  { id: 'break', name: 'Break', minutes: 5, icon: 'cafe', color: '#F59E0B' },
];

export default function TimerScreen() {
  const { colors } = useTheme();
  
  // Timer states
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(25);
  const [selectedPreset, setSelectedPreset] = useState<string>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  
  // Session tracking
  const [interruptions, setInterruptions] = useState(0);
  const [focusScore, setFocusScore] = useState(10);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  // Task linking
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Productivity tracking
  const [productivityScore, setProductivityScore] = useState(5);
  const [trends, setTrends] = useState<ProductivityTrend[]>([]);
  const [showTrends, setShowTrends] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    averageProductivity: 0,
    bestStreak: 0,
    currentStreak: 0,
  });
  
  // Health & Wellness
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showHydrationReminder, setShowHydrationReminder] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const timeOptions = [5, 10, 15, 25, 45];

  // Set up health reminder intervals when timer is running
  useEffect(() => {
    let hydrationInterval: NodeJS.Timeout;
    let breakInterval: NodeJS.Timeout;
    
    if (running) {
      hydrationInterval = setInterval(() => {
        setShowHydrationReminder(true);
      }, 15 * 60 * 1000); // Every 15 minutes
      
      breakInterval = setInterval(() => {
        setShowBreakReminder(true);
      }, 20 * 60 * 1000); // Every 20 minutes
    }
    
    return () => {
      if (hydrationInterval) clearInterval(hydrationInterval);
      if (breakInterval) clearInterval(breakInterval);
    };
  }, [running]);

  useEffect(() => {
    loadTasksData();
    loadTrendsData();
    loadStats();
    loadWaterIntake();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0 && running) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [running, seconds]);

  useEffect(() => {
    if (running) {
      // Pulse animation
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

      // Slow rotation for outer ring
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 30000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [running]);

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Health Reminder Handlers
  const handleHydrationReminder = () => {
    setShowHydrationReminder(false);
    haptics.medium();
    Alert.alert('💧 Hydration Reminder', 'Time to drink some water! Staying hydrated helps maintain focus.', [
      { text: 'Got it!' }
    ]);
  };

  const handleBreakReminder = () => {
    setShowBreakReminder(false);
    haptics.medium();
    Alert.alert('🧘 Break Time', 'Take a moment to stretch your neck, shoulders, and back. Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.', [
      { text: 'Take a Break', onPress: () => setShowBreathingModal(true) },
      { text: 'Later' }
    ]);
  };

  const handleStartBreakTimer = () => {
    const breakPreset = defaultPresets.find((preset) => preset.id === 'break');
    const breakMinutes = breakPreset?.minutes || 5;
    setShowBreakReminder(false);
    setRunning(false);
    setSelectedPreset('break');
    setSelectedTime(breakMinutes);
    setSeconds(breakMinutes * 60);
    setInterruptions(0);
    setFocusScore(10);
    haptics.medium();
    Alert.alert('Break Timer Ready', 'Your 5 minute break timer is ready. Press Start when you begin your break.');
  };

  const handleHydrationDone = () => {
    setShowHydrationReminder(false);
    haptics.medium();
  };

  const waterGoalMl = 2000;
  const waterProgress = Math.min(100, Math.round((waterTodayMl / waterGoalMl) * 100));

  const loadWaterIntake = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(getScopedStorageKey(`waterIntake:${today}`));
      setWaterTodayMl(stored ? Number(stored) : 0);
    } catch (error) {
      console.error('Error loading water intake:', error);
    }
  };

  const addWater = async (amountMl: number) => {
    const today = new Date().toISOString().split('T')[0];
    const nextTotal = Math.max(0, waterTodayMl + amountMl);
    setWaterTodayMl(nextTotal);
    await AsyncStorage.setItem(getScopedStorageKey(`waterIntake:${today}`), nextTotal.toString());
    haptics.light();
  };

  const loadTasksData = async () => {
    try {
      const loadedTasks = await loadTasks();
      setTasks(loadedTasks.filter((t: Task) => !t.done));
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const loadTrendsData = async () => {
    try {
      const loadedTrends = await loadProductivityTrends();
      setTrends(loadedTrends.slice(-7));
    } catch (error) {
      console.error("Error loading trends:", error);
    }
  };

  const loadStats = async () => {
    try {
      const sessions = await loadFocus();
      const totalSessions = sessions.length;
      const totalFocusTime = sessions.reduce((acc: number, s: FocusSession) => acc + s.seconds, 0);
      const avgProductivity = sessions.filter((s: FocusSession) => s.productivity)
        .reduce((acc: number, s: FocusSession) => acc + (s.productivity || 0), 0) / 
        sessions.filter((s: FocusSession) => s.productivity).length || 0;

      let currentStreak = 0;
      const today = new Date().setHours(0, 0, 0, 0);
      const hasTodaySession = sessions.some((s: FocusSession) => s.endedAt >= today);
      if (hasTodaySession) currentStreak = 1;

      setStats({
        totalSessions,
        totalFocusTime,
        averageProductivity: Math.round(avgProductivity * 10) / 10,
        bestStreak: 0,
        currentStreak,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleStart = () => {
    animateButton();
    haptics.medium();
    setRunning(true);
    setInterruptions(0);
    setFocusScore(10);
  };

  const handlePause = () => {
    animateButton();
    haptics.light();
    setRunning(false);
    Alert.alert('⏸️ Timer Paused', 'You can resume anytime!');
  };

  const handleReset = () => {
    animateButton();
    haptics.medium();
    setRunning(false);
    setSeconds(selectedTime * 60);
    setInterruptions(0);
    setFocusScore(10);
    Alert.alert('🔄 Timer Reset', 'Timer has been reset.');
  };

  const handleInterruption = () => {
    animateButton();
    haptics.warning();
    setInterruptions(prev => prev + 1);
    setFocusScore(prev => Math.max(1, prev - 1));
    Vibration.vibrate(100);
    Alert.alert('⚠️ Interruption Logged', `Focus score decreased to ${focusScore - 1}/10`);
  };

  const handleSessionComplete = () => {
    setRunning(false);
    haptics.timerComplete();
    Vibration.vibrate(500);
    
    const calculatedProductivity = Math.max(1, Math.min(10, 
      Math.round((focusScore / 10) * (1 - interruptions / 10) * 10)
    ));
    
    const session = {
      id: Date.now().toString(),
      seconds: selectedTime * 60,
      endedAt: Date.now(),
      taskId: selectedTaskId,
      interruptions,
      focusScore,
      productivity: calculatedProductivity,
    };
    
    setCurrentSession(session);
    setProductivityScore(calculatedProductivity);
    setShowCompletionModal(true);
  };

  const handleSaveSession = async (productivityRating: number) => {
    animateButton();
    haptics.success();
    try {
      if (currentSession) {
        await addFocusSession({
          ...currentSession,
          productivity: productivityRating,
        });
        setShowCompletionModal(false);
        handleReset();
        loadTrendsData();
        loadStats();
        Alert.alert('🎉 Session Saved!', 'Great job! Check insights for your progress.');
      }
    } catch (error) {
      haptics.error();
      console.error("Error saving session:", error);
      Alert.alert('❌ Error', 'Failed to save session');
    }
  };

  const handleTimeSelect = (minutes: number) => {
    animateButton();
    haptics.light();
    setSelectedTime(minutes);
    setSeconds(minutes * 60);
    setRunning(false);
    setInterruptions(0);
    setFocusScore(10);
    setShowCustomInput(false);
    Alert.alert('⏱️ Timer Set', `${minutes} minute timer selected!`);
    
    const preset = defaultPresets.find(p => p.minutes === minutes);
    if (preset) setSelectedPreset(preset.id);
  };

  const handlePresetSelect = (preset: TimerPreset) => {
    animateButton();
    haptics.light();
    setSelectedPreset(preset.id);
    setSelectedTime(preset.minutes);
    setSeconds(preset.minutes * 60);
    setRunning(false);
    setInterruptions(0);
    setFocusScore(10);
    setShowCustomInput(false);
    Alert.alert('✨ Preset Applied', `${preset.name} - ${preset.minutes} minutes`);
  };

  const handleCustomTime = () => {
    const minutes = parseInt(customMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 120) {
      Alert.alert('❌ Invalid Time', 'Please enter a time between 1 and 120 minutes');
      return;
    }
    animateButton();
    handleTimeSelect(minutes);
    setCustomMinutes("");
    setShowCustomInput(false);
    setSelectedPreset('');
    Alert.alert('⏱️ Custom Timer', `${minutes} minute custom timer set!`);
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
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    style: { borderRadius: BorderRadius.lg },
    propsForDots: { r: "6", strokeWidth: "2", stroke: colors.primary },
  };

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg, alignItems: "center" },
    title: { ...Typography.h1, color: colors.text, marginTop: Spacing.md, marginBottom: Spacing.xl },
    
    timerCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      alignItems: "center",
      ...Shadows.medium,
      marginBottom: Spacing.xl,
    },
    progressCircle: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
      borderWidth: 4,
      borderColor: colors.primary + "40",
      overflow: "hidden",
      position: 'relative',
    },
    progressRing: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary + "30",
      height: "0%",
    },
    time: { ...Typography.h1, fontSize: 48, color: colors.text, zIndex: 1 },
    liveStats: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginTop: Spacing.sm,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
    statText: { ...Typography.caption, color: colors.textSecondary, fontSize: 13 },
    
    presetsSection: { width: "100%", marginBottom: Spacing.lg },
    sectionLabel: { ...Typography.body, fontWeight: '600', color: colors.text, marginBottom: Spacing.sm, textAlign: 'left', alignSelf: 'flex-start' },
    presetsContainer: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
    presetBtn: {
      flex: 1,
      minWidth: "30%",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    presetBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    presetText: { ...Typography.caption, color: colors.textSecondary, marginTop: Spacing.xs },
    presetTextSelected: { color: colors.text },
    
    // Health & Wellness Section - NEW
    healthSection: { width: "100%", marginBottom: Spacing.lg },
    healthIntro: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      alignSelf: 'flex-start',
    },
    healthButtons: { flexDirection: "row", gap: Spacing.sm },
    healthBtn: {
      flex: 1,
      backgroundColor: colors.card,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 104,
      ...Shadows.small,
    },
    healthIconBubble: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    healthBtnTitle: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: '700',
      textAlign: 'center',
    },
    healthBtnSub: {
      ...Typography.caption,
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 2,
      textAlign: 'center',
    },
    
    taskSelector: { width: "100%", marginBottom: Spacing.lg },
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
    taskChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    taskChipText: { color: colors.textMuted, fontSize: 14 },
    taskChipTextSelected: { color: colors.text },
    
    timeSelector: { width: "100%", marginBottom: Spacing.lg },
    timeOptions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.sm },
    timeBtn: {
      minWidth: 60,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    timeBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    timeBtnText: { ...Typography.body, color: colors.textSecondary },
    timeBtnTextSelected: { color: colors.text },
    customInputContainer: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
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
    customBtn: { backgroundColor: colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
    
    interruptionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.warning + '20',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    interruptionText: { color: colors.warning, fontSize: 16, fontWeight: "600" },
    controls: { flexDirection: "row", gap: Spacing.lg, marginBottom: Spacing.xl },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      gap: Spacing.sm,
      ...Shadows.small,
      minWidth: 120,
    },
    pauseBtn: { backgroundColor: colors.warning },
    btnText: { color: colors.text, fontSize: 18, fontWeight: "600" },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.round,
      borderWidth: 1,
      borderColor: colors.border,
      gap: Spacing.sm,
      minWidth: 120,
    },
    secondaryBtnText: { color: colors.textSecondary, fontSize: 16 },
    disabled: { opacity: 0.5 },
    
    statsContainer: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: "center",
      ...Shadows.small,
    },
    statCardValue: { ...Typography.h3, color: colors.primary, marginBottom: Spacing.xs },
    statCardLabel: { ...Typography.caption, color: colors.textSecondary, textAlign: "center" },
    
    trendsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, paddingVertical: Spacing.md, marginBottom: Spacing.md },
    trendsBtnText: { color: colors.primary, fontSize: 16, fontWeight: "500" },
    trendsContainer: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      ...Shadows.small,
    },
    trendsTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.md },
    chartWrapper: { alignItems: "center", marginBottom: Spacing.lg },
    trendItem: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.sm },
    trendDate: { ...Typography.caption, color: colors.textSecondary, width: 70, fontSize: 11 },
    trendBar: {
      flex: 1,
      height: 8,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      marginHorizontal: Spacing.sm,
      overflow: "hidden",
    },
    trendFill: { height: "100%", borderRadius: BorderRadius.round },
    trendScore: { ...Typography.caption, color: colors.textSecondary, width: 35, textAlign: "right" },
    noTrendsText: { ...Typography.caption, color: colors.textMuted, textAlign: 'center', marginVertical: Spacing.md },
    trendStats: { ...Typography.body, color: colors.text, marginTop: Spacing.md, textAlign: "center" },
    
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      width: "90%",
      alignItems: "center",
      ...Shadows.medium,
    },
    modalTitle: { ...Typography.h2, color: colors.text, marginVertical: Spacing.md },
    sessionStats: { width: "100%", backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
    statLabel: { ...Typography.body, color: colors.text, marginBottom: Spacing.xs },
    modalSubtitle: { ...Typography.body, fontWeight: "600", color: colors.text, marginBottom: Spacing.md },
    ratingContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: Spacing.sm, marginBottom: Spacing.lg },
    ratingBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    ratingBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    ratingText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    ratingTextSelected: { color: colors.text },
    modalButtons: { flexDirection: "row", gap: Spacing.md, width: "100%" },
    modalBtn: { flex: 1, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, alignItems: "center" },
    cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    saveBtn: { backgroundColor: colors.primary },
    cancelText: { color: colors.textSecondary, fontWeight: "600" },
    saveText: { color: colors.text, fontWeight: "600" },
    
    // Health Reminder Modal Styles
    reminderModalContent: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.lg,
      width: "100%",
      maxWidth: 390,
      maxHeight: "86%",
      alignItems: "center",
      ...Shadows.medium,
    },
    modalCloseButton: {
      position: 'absolute',
      right: Spacing.md,
      top: Spacing.md,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 2,
    },
    reminderIcon: { marginBottom: Spacing.sm },
    hydrateIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.info + '18',
      marginBottom: Spacing.md,
    },
    reminderTitle: { ...Typography.h2, color: colors.text, marginBottom: Spacing.xs, textAlign: 'center' },
    reminderText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.md,
      lineHeight: 21,
    },
    waterTotalCard: {
      width: '100%',
      backgroundColor: colors.info + '12',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.info + '35',
      marginBottom: Spacing.md,
    },
    waterTotalText: {
      ...Typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    waterGoalText: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    waterProgressTrack: {
      height: 9,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      overflow: 'hidden',
    },
    waterProgressFill: {
      height: '100%',
      backgroundColor: colors.info,
      borderRadius: BorderRadius.round,
    },
    waterButtonGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    waterButton: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    waterPrimaryButton: {
      width: '100%',
      backgroundColor: colors.info,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Shadows.small,
    },
    hydrationDoneButton: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    hydrationDoneText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    waterPrimaryButtonText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '800',
    },
    waterButtonText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    waterButtonSub: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
  });

  return (
    <SafeAreaView style={styles.bg}>
      <OfflineStatus />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <Text style={styles.title}>Focus Timer</Text>

          <Animated.View style={[styles.timerCard, { transform: [{ scale: pulseAnim }] }]}>
            <Animated.View style={[styles.progressCircle, { transform: [{ rotate: spin }] }]}>
              <Animated.View style={[styles.progressRing, { height: `${progress}%` }]} />
              <Text style={styles.time}>
                {String(minutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
              </Text>
            </Animated.View>
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

          {/* Timer Presets */}
          <View style={styles.presetsSection}>
            <Text style={styles.sectionLabel}>Quick Presets</Text>
            <View style={styles.presetsContainer}>
              {defaultPresets.map((preset) => (
                <Animated.View key={preset.id} style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity
                    style={[styles.presetBtn, selectedPreset === preset.id && styles.presetBtnSelected]}
                    onPress={() => handlePresetSelect(preset)}
                  >
                    <Ionicons name={preset.icon as any} size={20} color={selectedPreset === preset.id ? colors.text : preset.color} />
                    <Text style={[styles.presetText, selectedPreset === preset.id && styles.presetTextSelected]}>{preset.name}</Text>
                    <Text style={[styles.presetText, selectedPreset === preset.id && styles.presetTextSelected]}>{preset.minutes}m</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Health & Wellness Buttons - NEW */}
          <View style={styles.healthSection}>
            <Text style={styles.sectionLabel}>Wellness</Text>
            <Text style={styles.healthIntro}>Quick support tools for healthier focus sessions.</Text>
            <View style={styles.healthButtons}>
              <TouchableOpacity 
                style={styles.healthBtn} 
                onPress={() => setShowBreathingModal(true)}
              >
                <View style={[styles.healthIconBubble, { backgroundColor: colors.success + '18' }]}>
                  <Ionicons name="leaf" size={21} color={colors.success} />
                </View>
                <Text style={styles.healthBtnTitle}>Breathing</Text>
                <Text style={styles.healthBtnSub}>Calm reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.healthBtn} 
                onPress={() => setShowHydrationReminder(true)}
              >
                <View style={[styles.healthIconBubble, { backgroundColor: colors.info + '18' }]}>
                  <Ionicons name="water" size={21} color={colors.info} />
                </View>
                <Text style={styles.healthBtnTitle}>Hydrate</Text>
                <Text style={styles.healthBtnSub}>Drink water</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.healthBtn} 
                onPress={() => setShowBreakReminder(true)}
              >
                <View style={[styles.healthIconBubble, { backgroundColor: colors.warning + '18' }]}>
                  <Ionicons name="body" size={21} color={colors.warning} />
                </View>
                <Text style={styles.healthBtnTitle}>Break</Text>
                <Text style={styles.healthBtnSub}>5 min timer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Linking */}
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
                <Text style={!selectedTaskId ? styles.taskChipTextSelected : styles.taskChipText}>None</Text>
              </TouchableOpacity>
              {tasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.taskChip, selectedTaskId === task.id && styles.taskChipSelected]}
                  onPress={() => {
                    haptics.light();
                    setSelectedTaskId(task.id);
                  }}
                >
                  <Text style={selectedTaskId === task.id ? styles.taskChipTextSelected : styles.taskChipText}>
                    {task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Time Options */}
          <View style={styles.timeSelector}>
            <Text style={styles.sectionLabel}>Session Duration</Text>
            <View style={styles.timeOptions}>
              {timeOptions.map((time) => (
                <Animated.View key={time} style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity
                    style={[styles.timeBtn, selectedTime === time && !showCustomInput && styles.timeBtnSelected]}
                    onPress={() => handleTimeSelect(time)}
                  >
                    <Text style={[styles.timeBtnText, selectedTime === time && !showCustomInput && styles.timeBtnTextSelected]}>{time}m</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
              <TouchableOpacity
                style={[styles.timeBtn, showCustomInput && styles.timeBtnSelected]}
                onPress={() => {
                  haptics.light();
                  setShowCustomInput(!showCustomInput);
                  setSelectedTime(0);
                }}
              >
                <Text style={[styles.timeBtnText, showCustomInput && styles.timeBtnTextSelected]}>Custom</Text>
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

          {/* Interruption Button */}
          {running && (
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity style={styles.interruptionBtn} onPress={handleInterruption}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={styles.interruptionText}>Log Interruption</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Control Buttons */}
          <View style={styles.controls}>
            {!running ? (
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity
                  style={[styles.primaryBtn, seconds === 0 && styles.disabled]}
                  onPress={handleStart}
                  disabled={seconds === 0}
                >
                  <Ionicons name="play" size={24} color={colors.text} />
                  <Text style={styles.btnText}>Start</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity style={[styles.primaryBtn, styles.pauseBtn]} onPress={handlePause}>
                  <Ionicons name="pause" size={24} color={colors.text} />
                  <Text style={styles.btnText}>Pause</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleReset}>
                <Ionicons name="refresh" size={20} color={colors.textSecondary} />
                <Text style={styles.secondaryBtnText}>Reset</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quick Stats */}
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

          {/* Productivity Trends Toggle */}
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

          {/* Productivity Trends */}
          {showTrends && (
            <View style={styles.trendsContainer}>
              <Text style={styles.trendsTitle}>Last 7 Days</Text>
              
              {trends.length > 0 ? (
                <>
                  <View style={styles.chartWrapper}>
                    <LineChart
                      data={{
                        labels: trends.map(t => t.date.split('/')[0]),
                        datasets: [{ data: trends.map(t => t.productivityScore) }],
                      }}
                      width={screenWidth - Spacing.xl * 2}
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
                              backgroundColor: getProductivityColor(trend.productivityScore)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.trendScore}>{trend.productivityScore}/10</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noTrendsText}>No trends data yet. Complete some sessions to see your progress!</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Session Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
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
              <Text style={styles.statLabel}>Task: {tasks.find(t => t.id === selectedTaskId)?.title || 'No task'}</Text>
            </View>
            <Text style={styles.modalSubtitle}>Rate your productivity:</Text>
            <View style={styles.ratingContainer}>
              {[1,2,3,4,5,6,7,8,9,10].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingBtn,
                    productivityScore === rating && styles.ratingBtnSelected,
                    { borderColor: getProductivityColor(rating) }
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

      {/* Hydration Reminder Modal - NEW */}
      <Modal
        visible={showHydrationReminder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHydrationReminder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHydrationReminder(false)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.hydrateIconCircle}>
              <Ionicons name="water" size={34} color={colors.info} />
            </View>
            <Text style={styles.reminderTitle}>Hydration</Text>
            <Text style={styles.reminderText}>
              Add your water intake for today. Small hydration habits help focus and energy.
            </Text>
            <View style={styles.waterTotalCard}>
              <Text style={styles.waterTotalText}>{waterTodayMl} ml</Text>
              <Text style={styles.waterGoalText}>
                {waterProgress}% of {waterGoalMl} ml daily goal
              </Text>
              <View style={styles.waterProgressTrack}>
                <View style={[styles.waterProgressFill, { width: `${waterProgress}%` }]} />
              </View>
            </View>

            <TouchableOpacity style={styles.waterPrimaryButton} onPress={() => addWater(250)}>
              <Text style={styles.waterPrimaryButtonText}>Add Water - 1 Glass</Text>
            </TouchableOpacity>

            <View style={styles.waterButtonGrid}>
              <TouchableOpacity style={styles.waterButton} onPress={() => addWater(250)}>
                <Text style={styles.waterButtonText}>+1 Glass</Text>
                <Text style={styles.waterButtonSub}>250 ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterButton} onPress={() => addWater(500)}>
                <Text style={styles.waterButtonText}>+Bottle</Text>
                <Text style={styles.waterButtonSub}>500 ml</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterButton} onPress={() => addWater(100)}>
                <Text style={styles.waterButtonText}>+100 ml</Text>
                <Text style={styles.waterButtonSub}>Small sip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.waterButton} onPress={() => addWater(-250)}>
                <Text style={styles.waterButtonText}>-1 Glass</Text>
                <Text style={styles.waterButtonSub}>Undo</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.hydrationDoneButton}
              onPress={handleHydrationDone}
            >
              <Text style={styles.hydrationDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Break Reminder Modal - NEW */}
      <Modal
        visible={showBreakReminder}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBreakReminder(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reminderModalContent}>
            <Ionicons name="body" size={50} color={colors.warning} style={styles.reminderIcon} />
            <Text style={styles.reminderTitle}>🧘 Break Time</Text>
            <Text style={styles.reminderText}>
              Take a moment to stretch your neck, shoulders, and back. Look away from your screen for 20 seconds.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowBreakReminder(false)}
              >
                <Text style={styles.cancelText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleStartBreakTimer}
              >
                <Text style={styles.saveText}>Take Break</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Breathing Exercise Modal - NEW */}
      <BreathingExercise visible={showBreathingModal} onClose={() => setShowBreathingModal(false)} />
    </SafeAreaView>
  );
}
