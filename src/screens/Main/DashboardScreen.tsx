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
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ProgressChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

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
import { BreathingExercise } from '../../components/health/BreathingExercise';
import { notificationService } from '../../services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

type WellnessReminderOption = {
  type: 'hydration' | 'break' | 'checkin' | 'breathing';
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
    stepTracking,
    syncTodayDeviceSteps,
  } = useHealth();

  const [refreshing, setRefreshing] = useState(false);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [focusStats, setFocusStats] = useState({ total: 0, today: 0, average: 0 });
  const [productivity, setProductivity] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [todaySessions, setTodaySessions] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | null>(null);
  const [lastPeriodDate, setLastPeriodDate] = useState<string | null>(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [periodDateInput, setPeriodDateInput] = useState('');
  const [periodNotesInput, setPeriodNotesInput] = useState('');
  const [periodDate, setPeriodDate] = useState(new Date());
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [showPeriodDatePicker, setShowPeriodDatePicker] = useState(false);
  const [selectedPeriodSymptoms, setSelectedPeriodSymptoms] = useState<string[]>([]);
  const [selectedPeriodMood, setSelectedPeriodMood] = useState<string | null>(null);

  // Health Modal States
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMentalModal, setShowMentalModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showWellnessScheduleModal, setShowWellnessScheduleModal] = useState(false);
  const [selectedWellnessReminder, setSelectedWellnessReminder] =
    useState<WellnessReminderOption | null>(null);
  const [wellnessReminderTime, setWellnessReminderTime] = useState(new Date());
  const [showWellnessTimePicker, setShowWellnessTimePicker] = useState(false);
  const [stepInput, setStepInput] = useState('');
  const [stepGoalInput, setStepGoalInput] = useState('');
  const [mentalQuestionIndex, setMentalQuestionIndex] = useState(0);
  const [mentalAnswers, setMentalAnswers] = useState<Record<string, string>>({});
  const [newMedicine, setNewMedicine] = useState({ name: '', time: '', dosage: '' });
  const [medicineReminderTime, setMedicineReminderTime] = useState(new Date());
  const [medicineSecondReminderTime, setMedicineSecondReminderTime] = useState(() => {
    const next = new Date();
    next.setHours(20, 0, 0, 0);
    return next;
  });
  const [showMedicineTimePicker, setShowMedicineTimePicker] = useState(false);
  const [showMedicineSecondTimePicker, setShowMedicineSecondTimePicker] = useState(false);
  const [medicineFrequency, setMedicineFrequency] = useState<'once' | 'twice'>('once');
  const [medicineMealTiming, setMedicineMealTiming] = useState<'before meal' | 'after meal'>('after meal');
  const [medicineDays, setMedicineDays] = useState<string[]>([
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ]);
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

  const periodSymptoms = [
    'Cramps',
    'Headache',
    'Bloating',
    'Back pain',
    'Fatigue',
    'Acne',
    'Tender breasts',
    'Cravings',
  ];

  const periodMoods = ['Calm', 'Happy', 'Sensitive', 'Irritable', 'Anxious', 'Tired'];
  const medicineDayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const medicineQuickTimes = [
    { label: 'Morning', hour: 8, minute: 0 },
    { label: 'Afternoon', hour: 1, minute: 0, meridiem: 'PM' as const },
    { label: 'Night', hour: 8, minute: 0, meridiem: 'PM' as const },
  ];

  const wellnessReminderOptions: WellnessReminderOption[] = [
    { type: 'hydration', label: 'Hydrate', time: '10:00 AM', hour: 10, minute: 0, icon: 'water' },
    { type: 'break', label: 'Break', time: '2:00 PM', hour: 14, minute: 0, icon: 'body' },
    { type: 'checkin', label: 'Check-in', time: '8:00 PM', hour: 20, minute: 0, icon: 'clipboard' },
    { type: 'breathing', label: 'Breathe', time: '9:00 PM', hour: 21, minute: 0, icon: 'leaf' },
  ];

  useFocusEffect(
    useCallback(() => {
      updateGreeting();
      const task = InteractionManager.runAfterInteractions(async () => {
        await Promise.all([loadStats(), loadHealthData(), loadProfileMeta()]);
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

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const formatDisplayDate = (dateKeyValue: string) => {
    const date = new Date(`${dateKeyValue}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dateKeyValue;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatClockTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const normalizeClockTime = (date: Date) => {
    const hours24 = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const suffix = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes} ${suffix}`;
  };

  const createTimeSlot = (hour: number, minute: number, meridiem?: 'AM' | 'PM') => {
    const next = new Date();
    let normalizedHour = hour;
    if (meridiem === 'PM' && normalizedHour < 12) normalizedHour += 12;
    if (meridiem === 'AM' && normalizedHour === 12) normalizedHour = 0;
    next.setHours(normalizedHour, minute, 0, 0);
    return next;
  };

  const formatMedicineDays = (days?: string[]) => {
    if (!days || days.length === 0 || days.length === 7) return 'Every day';
    return days.join(', ');
  };

  const formatMedicineTimes = (times?: string[], fallback?: string) => {
    if (times && times.length > 0) return times.join(' • ');
    return fallback || '';
  };

  const toggleMedicineDay = (day: string) => {
    setMedicineDays((current) => {
      if (current.includes(day)) {
        return current.length === 1 ? current : current.filter((item) => item !== day);
      }
      return [...current, day];
    });
  };

  const adjustPeriodDate = (days: number) => {
    setPeriodDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      const today = new Date();
      if (next > today) return today;
      setPeriodDateInput(formatDateKey(next));
      return next;
    });
  };

  const loadProfileMeta = async () => {
    if (!user?.uid) {
      setProfileGender(null);
      setLastPeriodDate(null);
      setPeriodLogs([]);
      return;
    }

    const [savedGender, savedPeriodDate, savedPeriodLogs] = await Promise.all([
      AsyncStorage.getItem(`profileGender:${user.uid}`),
      AsyncStorage.getItem(`lastPeriodDate:${user.uid}`),
      AsyncStorage.getItem(`periodLogs:${user.uid}`),
    ]);

    setProfileGender(savedGender === 'female' || savedGender === 'male' ? savedGender : null);
    setLastPeriodDate(savedPeriodDate);
    setPeriodLogs(savedPeriodLogs ? JSON.parse(savedPeriodLogs) : []);
  };

  const openPeriodModal = () => {
    const initialDate = lastPeriodDate ? new Date(`${lastPeriodDate}T12:00:00`) : new Date();
    setPeriodDate(Number.isNaN(initialDate.getTime()) ? new Date() : initialDate);
    setPeriodDateInput(lastPeriodDate || formatDateKey(new Date()));
    setPeriodNotesInput('');
    setSelectedPeriodSymptoms([]);
    setSelectedPeriodMood(null);
    setShowPeriodDatePicker(false);
    setShowPeriodModal(true);
  };

  const togglePeriodSymptom = (symptom: string) => {
    setSelectedPeriodSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  };

  const handleSavePeriodLog = async () => {
    if (!user?.uid) {
      Alert.alert('Login Required', 'Please login to save period logs.');
      return;
    }

    const date = formatDateKey(periodDate);

    const storageKey = `periodLogs:${user.uid}`;
    const existingLogs = await AsyncStorage.getItem(storageKey);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    const nextLogs = [
      {
        id: Date.now().toString(),
        date,
        symptoms: selectedPeriodSymptoms,
        mood: selectedPeriodMood,
        notes: periodNotesInput.trim(),
      },
      ...logs,
    ].slice(0, 12);

    await AsyncStorage.setItem(storageKey, JSON.stringify(nextLogs));
    await AsyncStorage.setItem(`lastPeriodDate:${user.uid}`, date);
    setLastPeriodDate(date);
    setPeriodLogs(nextLogs);
    setShowPeriodModal(false);
    setPeriodNotesInput('');
    setSelectedPeriodSymptoms([]);
    setSelectedPeriodMood(null);
    haptics.success();
    Alert.alert('Period Logged', 'Your period start date has been saved.');
  };

  const sanitizeText = (text: string) =>
    text.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();

  const openWellnessReminderScheduler = (option: WellnessReminderOption) => {
    const nextReminderTime = new Date();
    nextReminderTime.setHours(option.hour, option.minute, 0, 0);
    setSelectedWellnessReminder(option);
    setWellnessReminderTime(nextReminderTime);
    setShowWellnessTimePicker(false);
    setShowWellnessScheduleModal(true);
  };

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
      Alert.alert('Reminder Not Set', 'I could not schedule that wellness reminder. Please try again.');
      return;
    }

    await AsyncStorage.setItem(storageKey, notificationId);
    setShowWellnessScheduleModal(false);
    haptics.success();
    Alert.alert(
      'Reminder Set',
      `${selectedWellnessReminder.label} reminder will notify you daily at ${formatReminderTime(wellnessReminderTime)}.`
    );
  };

  const formatReminderTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const openAddMedicineModal = () => {
    setNewMedicine({ name: '', time: '', dosage: '' });
    setMedicineReminderTime(createTimeSlot(8, 0));
    setMedicineSecondReminderTime(createTimeSlot(20, 0));
    setMedicineFrequency('once');
    setMedicineMealTiming('after meal');
    setMedicineDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    setShowMedicineTimePicker(false);
    setShowMedicineSecondTimePicker(false);
    setShowAddMedicine(true);
  };

  const getMentalHealthFeedbackForScore = (score: number) => {
    if (score >= 80) {
      return 'Excellent mental wellness! Keep up the great habits!';
    }
    if (score >= 60) {
      return 'Good mental wellness. Small improvements can make a big difference!';
    }
    if (score >= 40) {
      return 'Moderate mental wellness. Consider some self-care activities.';
    }
    if (score >= 20) {
      return 'Low mental wellness. Please take time for yourself.';
    }

    return 'Please prioritize your mental health. Reach out to someone you trust.';
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
        `Your mental wellness score: ${score}/100\n\n${getMentalHealthFeedbackForScore(score)}`,
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
    Keyboard.dismiss();
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
    Alert.alert('Steps Updated', `${steps} steps recorded (${progress}% of daily goal)`);
  };

  const handleQuickAddSteps = async (extraSteps: number) => {
    Keyboard.dismiss();
    const nextTotal = Math.max(0, Number(healthData.stepData.steps || 0) + extraSteps);
    setStepInput(nextTotal.toString());
    haptics.light();
  };

  const handleUpdateStepGoal = async () => {
    Keyboard.dismiss();
    const goal = parseInt(stepGoalInput, 10);
    if (isNaN(goal) || goal < 100) {
      Alert.alert('Invalid Input', 'Please enter a valid step goal (minimum 100)');
      return;
    }
    await updateStepGoal(goal);
    setStepGoalInput('');
    haptics.success();
    Alert.alert('Goal Updated', `Daily step goal set to ${goal} steps`);
  };

  const handleAddMedicine = async () => {
    const name = newMedicine.name.trim();
    const time = normalizeClockTime(medicineReminderTime);
    const dosage = newMedicine.dosage.trim();
    const secondTime = normalizeClockTime(medicineSecondReminderTime);
    const selectedTimes = medicineFrequency === 'twice' ? [time, secondTime] : [time];

    if (!name || !dosage) {
      Alert.alert('Error', 'Please add medicine name and dosage');
      return;
    }

    const saved = await addMedicine(name, time, dosage, {
      times: selectedTimes,
      days: medicineDays,
      frequency: medicineFrequency,
      mealTiming: medicineMealTiming,
    });
    if (!saved) {
      Alert.alert('Error', 'Medicine could not be saved. Please try again.');
      return;
    }

    setNewMedicine({ name: '', time: '', dosage: '' });
    setMedicineReminderTime(new Date());
    setMedicineSecondReminderTime(createTimeSlot(20, 0));
    setShowMedicineTimePicker(false);
    setShowMedicineSecondTimePicker(false);
    setMedicineFrequency('once');
    setMedicineMealTiming('after meal');
    setMedicineDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    setShowAddMedicine(false);
    await loadHealthData();
    haptics.success();
      Alert.alert(
      'Medicine Added',
      `${name} set for ${formatMedicineDays(medicineDays)} at ${selectedTimes.join(' and ')} (${medicineMealTiming}).`
    );
  };

  const handleTakeMedicine = async (id: string, name: string) => {
    await takeMedicine(id);
    haptics.medium();
    Alert.alert('Medicine Taken', `${name} marked as taken. Great job staying healthy!`);
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

  const handleMedicineTimeChange = (_event: any, selectedDate?: Date) => {
    setShowMedicineTimePicker(false);
    if (selectedDate) {
      setMedicineReminderTime(selectedDate);
      setNewMedicine((current) => ({ ...current, time: normalizeClockTime(selectedDate) }));
    }
  };

  const handleMedicineSecondTimeChange = (_event: any, selectedDate?: Date) => {
    setShowMedicineSecondTimePicker(false);
    if (selectedDate) {
      setMedicineSecondReminderTime(selectedDate);
    }
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
  const taskCompletionPercent =
    taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
  const focusGoalSeconds = 60 * 60;
  const focusProgressPercent = Math.min(100, Math.round((focusStats.today / focusGoalSeconds) * 100));
  const chartWidth = Math.min(screenWidth - Spacing.lg * 2 - 40, 320);
  const nextTask = recentTasks.find((task) => !task.done);
  const focusNudge =
    focusStats.today >= focusGoalSeconds
      ? 'Focus goal reached today.'
      : `${Math.max(0, 60 - Math.round(focusStats.today / 60))} min left to reach 1h focus.`;

  const styles = StyleSheet.create({
    bg: { flex: 1, backgroundColor: colors.background },
    container: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
    header: { marginBottom: Spacing.lg },
    greeting: { ...Typography.h1, color: colors.text, fontSize: 30 },
    subGreeting: { ...Typography.body, color: colors.textSecondary, marginTop: Spacing.xs },
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      ...Shadows.large,
    },
    heroEyebrow: {
      ...Typography.caption,
      color: '#FFFFFF',
      opacity: 0.82,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: Spacing.xs,
    },
    heroTitle: {
      ...Typography.h1,
      color: '#FFFFFF',
      fontSize: 30,
      lineHeight: 36,
      marginBottom: Spacing.sm,
    },
    heroSubtitle: {
      ...Typography.body,
      color: '#FFFFFF',
      opacity: 0.86,
      lineHeight: 22,
      marginBottom: Spacing.lg,
    },
    heroActions: { flexDirection: 'row', gap: Spacing.sm },
    heroPrimaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.md,
      gap: Spacing.xs,
    },
    heroPrimaryText: { ...Typography.button, color: colors.primary },
    heroSecondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      gap: Spacing.xs,
    },
    heroSecondaryText: { ...Typography.button, color: '#FFFFFF' },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
      marginTop: Spacing.xs,
    },
    sectionTitle: { ...Typography.h3, color: colors.text },
    sectionLink: { ...Typography.caption, color: colors.primary, fontWeight: '700' },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.small,
    },
    emptyTitle: { ...Typography.h3, color: colors.text, marginBottom: Spacing.xs },
    emptyText: { ...Typography.caption, color: colors.textSecondary, lineHeight: 19 },
    periodCard: {
      backgroundColor: colors.accent + '12',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.accent + '35',
    },
    periodHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    periodTitle: { ...Typography.h3, color: colors.text },
    periodText: { ...Typography.caption, color: colors.textSecondary, lineHeight: 19 },
    periodButton: {
      marginTop: Spacing.md,
      backgroundColor: colors.accent,
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    periodButtonText: { ...Typography.button, color: '#FFFFFF' },
    periodLogList: {
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    periodLogItem: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.accent + '22',
    },
    periodLogDate: { ...Typography.body, color: colors.text, fontWeight: '700' },
    periodLogMeta: { ...Typography.caption, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    periodDateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodDateText: { ...Typography.body, color: colors.text, fontWeight: '600' },
    periodDateControls: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    periodDateControl: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodDateControlText: { ...Typography.caption, color: colors.text, fontWeight: '700' },
    pickerHelperText: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    periodPickerWrap: {
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    timePickerButton: {
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
    timePickerValue: { ...Typography.body, color: colors.text, fontWeight: '700' },
    timePickerInlineWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Platform.OS === 'ios' ? Spacing.xs : 0,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    quickTimeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    quickTimeChip: {
      flex: 1,
      minWidth: '30%',
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.round,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '24',
    },
    quickTimeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickTimeText: { ...Typography.caption, color: colors.primary, fontWeight: '700' },
    quickTimeTextActive: { color: '#FFFFFF' },
    quickTimeSubText: { ...Typography.caption, color: colors.textMuted, fontSize: 10, marginTop: 2 },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    periodChip: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodChipActive: {
      backgroundColor: colors.accent + '18',
      borderColor: colors.accent,
    },
    periodChipText: { ...Typography.caption, color: colors.textSecondary, fontWeight: '600' },
    periodChipTextActive: { color: colors.accent },
    overviewCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xxl,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
      ...Shadows.medium,
    },
    chartWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    overviewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    overviewTitle: { ...Typography.h2, color: colors.text, fontSize: 20 },
    overviewFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    overviewMetric: { flex: 1, alignItems: 'center' },
    overviewDot: { width: 12, height: 12, borderRadius: 6, marginBottom: Spacing.xs },
    overviewMetricLabel: { ...Typography.caption, color: colors.textSecondary, textAlign: 'center' },
    overviewMetricValue: { ...Typography.caption, color: colors.text, fontWeight: '700', marginTop: 2 },

    // Health Hero Card
    healthHeroCard: {
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      overflow: 'hidden',
      ...Shadows.medium,
    },
    healthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    healthTitle: { ...Typography.h2, color: colors.primary, fontSize: 20 },
    healthSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    healthMiniStat: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    healthMiniValue: { ...Typography.h3, color: colors.text },
    healthMiniLabel: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
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
    wellnessReminderCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.small,
    },
    reminderHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    reminderTitle: { ...Typography.h3, color: colors.text },
    reminderText: {
      ...Typography.caption,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: Spacing.md,
    },
    reminderGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    reminderChip: {
      flex: 1,
      minWidth: '47%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.primary + '10',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '24',
    },
    reminderChipText: { ...Typography.body, color: colors.text, fontWeight: '700' },
    reminderChipSub: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    reminderPickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: Spacing.md,
    },
    reminderPickerText: { ...Typography.h3, color: colors.text },

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
    medicineMeta: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },
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
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.md },
    statCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      minHeight: 132,
      ...Shadows.small,
    },
    statCardActive: {
      borderWidth: 1,
      borderColor: colors.primary + '35',
      backgroundColor: colors.primary + '08',
    },
    statValue: { ...Typography.h2, color: colors.text, marginTop: Spacing.sm, marginBottom: Spacing.xs },
    statLabel: { ...Typography.caption, color: colors.textSecondary },
    statHint: { ...Typography.caption, color: colors.primary, marginTop: Spacing.xs, fontWeight: '600' },

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
    modalScrollContent: {
      paddingBottom: Spacing.sm,
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
    autoStepCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor:
        stepTracking.status === 'active' ? colors.success + '12' : colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor:
        stepTracking.status === 'active' ? colors.success + '35' : colors.border,
      marginBottom: Spacing.md,
    },
    autoStepText: {
      ...Typography.caption,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    syncStepButton: {
      backgroundColor: colors.primary + '12',
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '30',
      marginBottom: Spacing.md,
    },
    syncStepButtonText: {
      ...Typography.caption,
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
              <Text style={styles.subGreeting}>Your daily command center is ready.</Text>
            </View>

            <View style={styles.heroCard}>
              <Text style={styles.heroEyebrow}>Today's Plan</Text>
              <Text style={styles.heroTitle}>
                {nextTask ? `Start with "${nextTask.title}"` : 'Build momentum with one clear task'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {nextTask
                  ? `${taskStats.pending} pending tasks. ${focusNudge}`
                  : 'Add a task, start a focus session, and let WorkTwin track your progress.'}
              </Text>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.heroPrimaryButton}
                  onPress={() => navigation.navigate('Timer')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="play" size={18} color={colors.primary} />
                  <Text style={styles.heroPrimaryText}>Start Focus</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroSecondaryButton}
                  onPress={() => navigation.navigate('Tasks')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.heroSecondaryText}>Add Task</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.overviewCard}
              onPress={() => navigation.navigate('Insights')}
              activeOpacity={0.88}
            >
              <View style={styles.overviewTitleRow}>
                <Ionicons name="bar-chart" size={22} color={colors.primary} />
                <Text style={styles.overviewTitle}>Your Progress Overview</Text>
              </View>
              <View style={styles.chartWrap}>
                <ProgressChart
                  data={{
                    labels: ['Tasks', 'Focus', 'Productivity'],
                    data: [
                      taskStats.total > 0 ? taskStats.completed / taskStats.total : 0,
                      Math.min(focusStats.today / focusGoalSeconds, 1),
                      Math.min(productivity / 10, 1),
                    ],
                  }}
                  width={chartWidth}
                  height={150}
                  strokeWidth={12}
                  radius={28}
                  chartConfig={chartConfig}
                  hideLegend
                />
              </View>
              <View style={styles.overviewFooter}>
                <View style={styles.overviewMetric}>
                  <View style={[styles.overviewDot, { backgroundColor: colors.primary }]} />
                  <Text style={styles.overviewMetricLabel}>Tasks Done</Text>
                  <Text style={styles.overviewMetricValue}>{taskCompletionPercent}%</Text>
                </View>
                <View style={styles.overviewMetric}>
                  <View style={[styles.overviewDot, { backgroundColor: colors.secondary }]} />
                  <Text style={styles.overviewMetricLabel}>Today's Focus</Text>
                  <Text style={styles.overviewMetricValue}>{focusProgressPercent}%</Text>
                </View>
                <View style={styles.overviewMetric}>
                  <View style={[styles.overviewDot, { backgroundColor: colors.accent }]} />
                  <Text style={styles.overviewMetricLabel}>Productivity</Text>
                  <Text style={styles.overviewMetricValue}>{Math.round(productivity * 10)}%</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Statistics Section */}
            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={[styles.statCard, styles.statCardActive]}
                onPress={() => navigation.navigate('Tasks')}
                activeOpacity={0.85}
              >
                <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
                <Text style={styles.statValue}>
                  {taskStats.completed}/{taskStats.total}
                </Text>
                <Text style={styles.statLabel}>Tasks Completed</Text>
                <Text style={styles.statHint}>{taskCompletionPercent}% complete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('Timer')}
                activeOpacity={0.85}
              >
                <Ionicons name="timer-outline" size={24} color={colors.secondary} />
                <Text style={styles.statValue}>{formatTime(focusStats.today)}</Text>
                <Text style={styles.statLabel}>Today's Focus</Text>
                <Text style={styles.statHint}>{focusProgressPercent}% of 1h</Text>
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

            {/* Health & Wellness Card */}
            <Animated.View style={[styles.healthHeroCard, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.healthHeader}>
                <Text style={styles.healthTitle}>Wellness Check</Text>
                <Ionicons name="heart" size={28} color={colors.primary} />
              </View>

              <View style={styles.chartWrap}>
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
                  width={chartWidth}
                  height={145}
                  strokeWidth={11}
                  radius={25}
                  chartConfig={chartConfig}
                  hideLegend
                />
              </View>

              <Text style={styles.healthScore}>{healthData.mentalHealthScore}/100</Text>
              <Text style={styles.healthScoreLabel}>Mental Wellness Score</Text>
              <Text style={styles.healthFeedback}>{sanitizeText(getMentalHealthFeedback())}</Text>

              <View style={styles.healthSummaryRow}>
                <View style={styles.healthMiniStat}>
                  <Text style={styles.healthMiniValue}>{getStepProgress()}%</Text>
                  <Text style={styles.healthMiniLabel}>Step goal</Text>
                </View>
                <View style={styles.healthMiniStat}>
                  <Text style={styles.healthMiniValue}>{getRecentSleepAverage(7)}h</Text>
                  <Text style={styles.healthMiniLabel}>Avg sleep</Text>
                </View>
                <View style={styles.healthMiniStat}>
                  <Text style={styles.healthMiniValue}>{healthData.medicines.length}</Text>
                  <Text style={styles.healthMiniLabel}>Medicines</Text>
                </View>
              </View>

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
                  onPress={() => setShowBreathingModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="leaf" size={18} color={colors.accent} />
                  <Text style={styles.statLabel}>Breathe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.healthButton}
                  onPress={() => {
                    if (healthData.medicines.length === 0) {
                      openAddMedicineModal();
                    } else {
                      setShowMedicineModal(true);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="medkit" size={18} color={colors.warning} />
                  <Text style={styles.statLabel}>Medicines</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <View style={styles.wellnessReminderCard}>
              <View style={styles.reminderHeaderRow}>
                <Text style={styles.reminderTitle}>Wellness Reminders</Text>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.reminderText}>
                Tap once to schedule daily wellness notifications for healthy focus habits.
              </Text>
              <View style={styles.reminderGrid}>
                {wellnessReminderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.type}
                    style={styles.reminderChip}
                    onPress={() => openWellnessReminderScheduler(option)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={option.icon} size={22} color={colors.primary} />
                    <View>
                      <Text style={styles.reminderChipText}>{option.label}</Text>
                      <Text style={styles.reminderChipSub}>{option.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {profileGender === 'female' && (
              <View style={styles.periodCard}>
                <View style={styles.periodHeader}>
                  <Text style={styles.periodTitle}>Period Log</Text>
                  <Ionicons name="calendar-outline" size={22} color={colors.accent} />
                </View>
                <Text style={styles.periodText}>
                  {lastPeriodDate
                    ? `Last period start: ${lastPeriodDate}. Keep this updated for better health tracking.`
                    : 'Track your period start date so your wellness overview feels more personal.'}
                </Text>
                <TouchableOpacity
                  style={styles.periodButton}
                  onPress={openPeriodModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.periodButtonText}>Log Period</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Medicine Reminders Section */}
            <View style={styles.medicineSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medicine Reminders</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (healthData.medicines.length === 0) {
                      openAddMedicineModal();
                    } else {
                      setShowMedicineModal(true);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sectionLink}>
                    {healthData.medicines.length === 0 ? 'Add' : 'Manage'}
                  </Text>
                </TouchableOpacity>
              </View>
              {healthData.medicines.length > 0 ? (
                <>
                  {healthData.medicines.slice(0, 3).map((med) => (
                    <View key={med.id} style={styles.medicineItem}>
                      <View style={styles.medicineInfo}>
                        <Text style={styles.medicineName}>{med.name}</Text>
                        <Text style={styles.medicineDosage}>{med.dosage}</Text>
                        <Text style={styles.medicineTime}>
                          {formatMedicineTimes(med.times, med.time)}
                        </Text>
                        <Text style={styles.medicineMeta}>
                          {formatMedicineDays(med.days)} • {med.mealTiming || 'After meal'}
                        </Text>
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
                          <Text style={[styles.takenText, { color: colors.success }]}>Taken</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              ) : (
                <TouchableOpacity
                  style={styles.emptyCard}
                  onPress={openAddMedicineModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyTitle}>No medicine reminders yet</Text>
                  <Text style={styles.emptyText}>Add your first reminder so health habits stay visible beside your productivity goals.</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recent Tasks */}
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Tasks</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Tasks')} activeOpacity={0.85}>
                  <Text style={styles.sectionLink}>View all</Text>
                </TouchableOpacity>
              </View>
              {recentTasks.length > 0 ? (
                <>
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
                </>
              ) : (
                <TouchableOpacity
                  style={styles.emptyCard}
                  onPress={() => navigation.navigate('Tasks')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyTitle}>No tasks yet</Text>
                  <Text style={styles.emptyText}>Create a small first task and WorkTwin will turn it into today's plan.</Text>
                </TouchableOpacity>
              )}
            </View>

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
            <Text style={styles.modalTitle}>Sleep Log</Text>

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
            <Text style={styles.modalTitle}>Step Tracker</Text>
            <Text style={styles.modalSubtitle}>
              Current: {healthData.stepData.steps} / {healthData.stepData.goal} steps
            </Text>
            <View style={styles.autoStepCard}>
              <Ionicons
                name={stepTracking.status === 'active' ? 'walk' : 'information-circle-outline'}
                size={22}
                color={stepTracking.status === 'active' ? colors.success : colors.primary}
              />
              <Text style={styles.autoStepText}>{stepTracking.message}</Text>
            </View>
            {stepTracking.available ? (
              <TouchableOpacity
                style={styles.syncStepButton}
                onPress={async () => {
                  await syncTodayDeviceSteps();
                  haptics.success();
                  Alert.alert('Steps Synced', 'Today\'s device step count has been refreshed.');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.syncStepButtonText}>Sync Device Steps</Text>
              </TouchableOpacity>
            ) : null}
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
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
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
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
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
            <Text style={styles.modalTitle}>Medicine Reminders</Text>

            {healthData.medicines.length === 0 ? (
              <Text style={styles.modalText}>No medicines added yet.</Text>
            ) : (
              healthData.medicines.map((med) => (
                <View key={med.id} style={styles.medicineItem}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{med.name}</Text>
                    <Text style={styles.medicineDosage}>{med.dosage}</Text>
                    <Text style={styles.medicineTime}>
                      {formatMedicineTimes(med.times, med.time)}
                    </Text>
                    <Text style={styles.medicineMeta}>
                      {formatMedicineDays(med.days)} • {med.mealTiming || 'After meal'}
                    </Text>
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
              onPress={() => {
                setShowMedicineModal(false);
                openAddMedicineModal();
              }}
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Add Medicine</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Medicine Name"
                placeholderTextColor={colors.textMuted}
                value={newMedicine.name}
                onChangeText={(text) => setNewMedicine({ ...newMedicine, name: text })}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Dosage (e.g., 1 tablet)"
                placeholderTextColor={colors.textMuted}
                value={newMedicine.dosage}
                onChangeText={(text) => setNewMedicine({ ...newMedicine, dosage: text })}
              />

              <Text style={styles.modalSubtitle}>How often</Text>
              <View style={styles.quickTimeRow}>
                {(['once', 'twice'] as const).map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickTimeChip,
                      medicineFrequency === value && styles.quickTimeChipActive,
                    ]}
                    onPress={() => setMedicineFrequency(value)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.quickTimeText,
                        medicineFrequency === value && styles.quickTimeTextActive,
                      ]}
                    >
                      {value === 'once' ? 'Once a day' : 'Twice a day'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSubtitle}>Meal timing</Text>
              <View style={styles.quickTimeRow}>
                {(['before meal', 'after meal'] as const).map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickTimeChip,
                      medicineMealTiming === value && styles.quickTimeChipActive,
                    ]}
                    onPress={() => setMedicineMealTiming(value)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.quickTimeText,
                        medicineMealTiming === value && styles.quickTimeTextActive,
                      ]}
                    >
                      {value === 'before meal' ? 'Before meal' : 'After meal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSubtitle}>Reminder days</Text>
              <View style={styles.chipGrid}>
                {medicineDayOptions.map((day) => {
                  const selected = medicineDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.periodChip, selected && styles.periodChipActive]}
                      onPress={() => toggleMedicineDay(day)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.periodChipText, selected && styles.periodChipTextActive]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalSubtitle}>Primary reminder</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => {
                  setShowMedicineTimePicker((visible) => !visible);
                  setShowMedicineSecondTimePicker(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.timePickerValue}>
                  {newMedicine.time || formatClockTime(medicineReminderTime)}
                </Text>
                <Ionicons name="time-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              {showMedicineTimePicker && (
                <View style={styles.timePickerInlineWrap}>
                  <DateTimePicker
                    value={medicineReminderTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={handleMedicineTimeChange}
                  />
                </View>
              )}
              <View style={styles.quickTimeRow}>
                {medicineQuickTimes.map((item) => {
                  const chipTime = createTimeSlot(item.hour, item.minute, item.meridiem);
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={styles.quickTimeChip}
                      onPress={() => {
                        setMedicineReminderTime(chipTime);
                        setNewMedicine({ ...newMedicine, time: normalizeClockTime(chipTime) });
                        setShowMedicineTimePicker(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.quickTimeText}>{item.label}</Text>
                      <Text style={styles.quickTimeSubText}>{formatClockTime(chipTime)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {medicineFrequency === 'twice' ? (
                <>
                  <Text style={styles.modalSubtitle}>Second reminder</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => {
                      setShowMedicineSecondTimePicker((visible) => !visible);
                      setShowMedicineTimePicker(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.timePickerValue}>
                      {formatClockTime(medicineSecondReminderTime)}
                    </Text>
                    <Ionicons name="time-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                  {showMedicineSecondTimePicker && (
                    <View style={styles.timePickerInlineWrap}>
                      <DateTimePicker
                        value={medicineSecondReminderTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'compact' : 'default'}
                        onChange={handleMedicineSecondTimeChange}
                      />
                    </View>
                  )}
                  <View style={styles.quickTimeRow}>
                    {medicineQuickTimes.map((item) => {
                      const chipTime = createTimeSlot(item.hour, item.minute, item.meridiem);
                      return (
                        <TouchableOpacity
                          key={`second-${item.label}`}
                          style={styles.quickTimeChip}
                          onPress={() => {
                            setMedicineSecondReminderTime(chipTime);
                            setShowMedicineSecondTimePicker(false);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.quickTimeText}>{item.label}</Text>
                          <Text style={styles.quickTimeSubText}>{formatClockTime(chipTime)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddMedicine}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Add Medicine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => {
                setShowAddMedicine(false);
                setShowMedicineTimePicker(false);
                setShowMedicineSecondTimePicker(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPeriodModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>Period Log</Text>
              <Text style={styles.modalSubtitle}>Start Date</Text>
              <View style={styles.periodDateControls}>
                <TouchableOpacity
                  style={styles.periodDateControl}
                  onPress={() => adjustPeriodDate(-1)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.periodDateControlText}>Previous Day</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.periodDateControl}
                  onPress={() => {
                    const today = new Date();
                    setPeriodDate(today);
                    setPeriodDateInput(formatDateKey(today));
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.periodDateControlText}>Today</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.periodDateButton}
                onPress={() => setShowPeriodDatePicker((visible) => !visible)}
                activeOpacity={0.85}
              >
                <Text style={styles.periodDateText}>{formatDisplayDate(formatDateKey(periodDate))}</Text>
                <Ionicons name="calendar-outline" size={22} color={colors.accent} />
              </TouchableOpacity>
              <Text style={styles.pickerHelperText}>Tap the date box to open the calendar picker.</Text>
              {showPeriodDatePicker && (
                <View style={styles.timePickerInlineWrap}>
                  <DateTimePicker
                    value={periodDate}
                    mode="date"
                    maximumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={(_event, selectedDate) => {
                      setShowPeriodDatePicker(false);
                      if (selectedDate) {
                        setPeriodDate(selectedDate);
                        setPeriodDateInput(formatDateKey(selectedDate));
                      }
                    }}
                  />
                </View>
              )}

              <Text style={styles.modalSubtitle}>Major Symptoms</Text>
              <View style={styles.chipGrid}>
                {periodSymptoms.map((symptom) => {
                  const selected = selectedPeriodSymptoms.includes(symptom);
                  return (
                    <TouchableOpacity
                      key={symptom}
                      style={[styles.periodChip, selected && styles.periodChipActive]}
                      onPress={() => togglePeriodSymptom(symptom)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.periodChipText, selected && styles.periodChipTextActive]}>
                        {symptom}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalSubtitle}>Mood</Text>
              <View style={styles.chipGrid}>
                {periodMoods.map((mood) => {
                  const selected = selectedPeriodMood === mood;
                  return (
                    <TouchableOpacity
                      key={mood}
                      style={[styles.periodChip, selected && styles.periodChipActive]}
                      onPress={() => setSelectedPeriodMood(mood)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.periodChipText, selected && styles.periodChipTextActive]}>
                        {mood}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalSubtitle}>Optional Notes</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 90, textAlignVertical: 'top' }]}
                placeholder="Anything else you want to remember"
                placeholderTextColor={colors.textMuted}
                value={periodNotesInput}
                onChangeText={setPeriodNotesInput}
                multiline
              />
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSavePeriodLog}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>Save Period Log</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowPeriodModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showWellnessScheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Schedule {selectedWellnessReminder?.label || 'Wellness'} Reminder
            </Text>
            <Text style={styles.modalSubtitle}>Choose a daily reminder time</Text>
            <TouchableOpacity
              style={styles.reminderPickerButton}
              onPress={() => setShowWellnessTimePicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.reminderPickerText}>{formatReminderTime(wellnessReminderTime)}</Text>
              <Ionicons name="time-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            {showWellnessTimePicker && (
              <View style={styles.timePickerInlineWrap}>
                <DateTimePicker
                  value={wellnessReminderTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_event, selectedDate) => {
                    if (Platform.OS !== 'ios') {
                      setShowWellnessTimePicker(false);
                    }
                    if (selectedDate) {
                      setWellnessReminderTime(selectedDate);
                    }
                  }}
                />
              </View>
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

      <BreathingExercise visible={showBreathingModal} onClose={() => setShowBreathingModal(false)} />
    </SafeAreaView>
  );
}
