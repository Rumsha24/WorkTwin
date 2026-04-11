import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { useAuth } from './useAuth';
import { getScopedStorageKey } from '../utils/storage';

interface MedicineReminder {
  id: string;
  name: string;
  time: string;
  times?: string[];
  dosage: string;
  days?: string[];
  frequency?: 'once' | 'twice';
  mealTiming?: 'before meal' | 'after meal';
  taken: boolean;
  notificationId?: string | null;
  notificationIds?: string[];
}

interface SleepData {
  date: string;
  hours: number;
  quality: number;
}

interface StepData {
  steps: number;
  goal: number;
  date: string;
  history: { date: string; steps: number }[];
}

interface HealthData {
  mentalHealthScore: number;
  lastMentalCheck: number | null;
  sleepData: SleepData[];
  stepData: StepData;
  medicines: MedicineReminder[];
}

interface StepTrackingState {
  available: boolean;
  active: boolean;
  status: 'checking' | 'active' | 'denied' | 'unavailable' | 'manual';
  message: string;
}

export function useHealth() {
  const { user } = useAuth();
  const scopedKey = useCallback((key: string) => getScopedStorageKey(key, user?.uid ?? null), [user?.uid]);
  const [healthData, setHealthData] = useState<HealthData>({
    mentalHealthScore: 0,
    lastMentalCheck: null,
    sleepData: [],
    stepData: {
      steps: 0,
      goal: 10000,
      date: new Date().toISOString().split('T')[0],
      history: [],
    },
    medicines: [],
  });

  const [loading, setLoading] = useState(true);
  const [stepTracking, setStepTracking] = useState<StepTrackingState>({
    available: false,
    active: false,
    status: 'checking',
    message: 'Checking step sensor...',
  });
  const healthDataRef = useRef(healthData);
  const liveStepBaseRef = useRef(0);

  useEffect(() => {
    healthDataRef.current = healthData;
  }, [healthData]);

  const loadHealthData = useCallback(async () => {
    try {
      const mentalHealthScore = await AsyncStorage.getItem(scopedKey('mentalHealthScore'));
      const lastMentalCheck = await AsyncStorage.getItem(scopedKey('lastMentalCheck'));
      const sleepData = await AsyncStorage.getItem(scopedKey('sleepData'));
      const stepData = await AsyncStorage.getItem(scopedKey('stepData'));
      const medicines = await AsyncStorage.getItem(scopedKey('medicines'));

      setHealthData({
        mentalHealthScore: mentalHealthScore ? parseInt(mentalHealthScore, 10) : 0,
        lastMentalCheck: lastMentalCheck ? parseInt(lastMentalCheck, 10) : null,
        sleepData: sleepData ? JSON.parse(sleepData) : [],
        stepData: stepData
          ? JSON.parse(stepData)
          : {
              steps: 0,
              goal: 10000,
              date: new Date().toISOString().split('T')[0],
              history: [],
            },
        medicines: medicines ? JSON.parse(medicines) : [],
      });
    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  }, [scopedKey]);

  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  useEffect(() => {
    if (loading) return undefined;

    let subscription: Pedometer.Subscription | null = null;
    let mounted = true;

    const startStepTracking = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!mounted) return;

        if (!available) {
          setStepTracking({
            available: false,
            active: false,
            status: 'unavailable',
            message: 'Automatic step tracking is not available on this device.',
          });
          return;
        }

        const existingPermission = await Pedometer.getPermissionsAsync();
        const permission =
          existingPermission.granted ? existingPermission : await Pedometer.requestPermissionsAsync();

        if (!mounted) return;

        if (!permission.granted) {
          setStepTracking({
            available: true,
            active: false,
            status: 'denied',
            message: 'Step permission is off. You can still enter steps manually.',
          });
          return;
        }

        await syncTodayDeviceSteps();

        liveStepBaseRef.current = healthDataRef.current.stepData.steps || 0;
        subscription = Pedometer.watchStepCount((result) => {
          persistStepCount(liveStepBaseRef.current + (result.steps || 0));
        });

        setStepTracking({
          available: true,
          active: true,
          status: 'active',
          message: 'Automatic step tracking is active while the app is open.',
        });
      } catch (error) {
        console.error('Step tracking error:', error);
        if (!mounted) return;
        setStepTracking({
          available: false,
          active: false,
          status: 'manual',
          message: 'Automatic tracking could not start. Manual step entry is still available.',
        });
      }
    };

    startStepTracking();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [loading, scopedKey]);

  const persistHealthData = async (data: HealthData) => {
    try {
      await AsyncStorage.setItem(scopedKey('mentalHealthScore'), data.mentalHealthScore.toString());
      await AsyncStorage.setItem(
        scopedKey('lastMentalCheck'),
        data.lastMentalCheck ? data.lastMentalCheck.toString() : ''
      );
      await AsyncStorage.setItem(scopedKey('sleepData'), JSON.stringify(data.sleepData));
      await AsyncStorage.setItem(scopedKey('stepData'), JSON.stringify(data.stepData));
      await AsyncStorage.setItem(scopedKey('medicines'), JSON.stringify(data.medicines));
      return true;
    } catch (error) {
      console.error('Error saving health data:', error);
      return false;
    }
  };

  const persistStepCount = async (steps: number) => {
    const safeSteps = Math.max(0, Math.round(steps));
    const today = new Date().toISOString().split('T')[0];
    const currentData = healthDataRef.current;
    const existingHistory = currentData.stepData.history || [];

    const existingIndex = existingHistory.findIndex((h) => h.date === today);
    let updatedHistory = [...existingHistory];

    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = { date: today, steps: safeSteps };
    } else {
      updatedHistory.push({ date: today, steps: safeSteps });
    }

    updatedHistory = updatedHistory.slice(-30);

    const nextData: HealthData = {
      ...currentData,
      stepData: {
        ...currentData.stepData,
        steps: safeSteps,
        date: today,
        history: updatedHistory,
      },
    };

    healthDataRef.current = nextData;
    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const syncTodayDeviceSteps = async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, new Date());
    const currentSteps = healthDataRef.current.stepData.steps || 0;
    await persistStepCount(Math.max(currentSteps, result.steps || 0));
  };

  const updateMentalHealthScore = async (score: number) => {
    const nextData: HealthData = {
      ...healthData,
      mentalHealthScore: score,
      lastMentalCheck: Date.now(),
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const addSleepLog = async (hours: number, quality: number) => {
    const newSleep: SleepData = {
      date: new Date().toISOString().split('T')[0],
      hours,
      quality,
    };

    const nextData: HealthData = {
      ...healthData,
      sleepData: [newSleep, ...healthData.sleepData.slice(0, 6)],
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const updateSteps = async (steps: number) => {
    await persistStepCount(steps);
  };

  const addSteps = async (additionalSteps: number) => {
    const newStepCount = healthData.stepData.steps + additionalSteps;
    await updateSteps(newStepCount);
  };

  const updateStepGoal = async (goal: number) => {
    const nextData: HealthData = {
      ...healthData,
      stepData: {
        ...healthData.stepData,
        goal,
      },
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const resetDailySteps = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (healthData.stepData.date !== today) {
      const nextData: HealthData = {
        ...healthData,
        stepData: {
          ...healthData.stepData,
          steps: 0,
          date: today,
        },
      };
      setHealthData(nextData);
      await persistHealthData(nextData);
    }
  };

  const getWeeklySteps = () => {
    const history = healthData.stepData.history || [];
    const last7Days = history.slice(-7);
    return last7Days.map((day) => day.steps);
  };

  const addMedicine = async (
    name: string,
    time: string,
    dosage: string,
    options?: {
      times?: string[];
      days?: string[];
      frequency?: 'once' | 'twice';
      mealTiming?: 'before meal' | 'after meal';
    }
  ): Promise<boolean> => {
    const { notificationService } = await import('../services/notificationService');
    const trimmedName = name.trim();
    const trimmedTime = time.trim();
    const trimmedDosage = dosage.trim();
    const selectedTimes = (options?.times && options.times.length > 0 ? options.times : [trimmedTime]).map((item) =>
      item.trim()
    );
    const selectedDays = options?.days && options.days.length > 0 ? options.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let notificationId: string | null = null;
    let notificationIds: string[] = [];

    try {
      const notificationsEnabled = await notificationService.initialize();
      if (!notificationsEnabled) {
        notificationIds = [];
      }

      const parseTime = (value: string) => {
        const normalized = value
          .replace(/\u202F|\u00A0/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();
        const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
        if (!match) return null;
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const suffix = match[3]?.toLowerCase();

        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;

        return { hour, minute };
      };

      const weekdayMap: Record<string, number> = {
        Sun: 1,
        Mon: 2,
        Tue: 3,
        Wed: 4,
        Thu: 5,
        Fri: 6,
        Sat: 7,
      };

      const parsedTimes = selectedTimes.map(parseTime).filter(Boolean) as Array<{ hour: number; minute: number }>;
      const parsedDays = selectedDays.map((day) => weekdayMap[day]).filter(Boolean);

      if (!notificationsEnabled) {
        notificationIds = [];
        notificationId = null;
      } else if (parsedTimes.length > 1 || parsedDays.length < 7) {
        notificationIds = await notificationService.scheduleMedicinePlan(
          trimmedName,
          parsedTimes,
          parsedDays,
          trimmedDosage,
          options?.mealTiming
        );
        notificationId = notificationIds[0] || null;
      } else if (parsedTimes.length === 1) {
        notificationId = await notificationService.scheduleMedicineReminder(
          trimmedName,
          parsedTimes[0].hour,
          parsedTimes[0].minute,
          trimmedDosage,
          options?.mealTiming
        );
        notificationIds = notificationId ? [notificationId] : [];
      }
    } catch (error) {
      console.error('Error scheduling medicine reminder:', error);
    }

    const newMedicine: MedicineReminder = {
      id: Date.now().toString(),
      name: trimmedName,
      time: trimmedTime,
      times: selectedTimes,
      dosage: trimmedDosage,
      days: selectedDays,
      frequency: options?.frequency || (selectedTimes.length > 1 ? 'twice' : 'once'),
      mealTiming: options?.mealTiming,
      taken: false,
      notificationId,
      notificationIds,
    };

    const nextData = {
      ...healthData,
      medicines: [...healthData.medicines, newMedicine],
    };
    setHealthData(nextData);
    return persistHealthData(nextData);
  };

  const takeMedicine = async (id: string) => {
    const nextData: HealthData = {
      ...healthData,
      medicines: healthData.medicines.map((med) =>
        med.id === id ? { ...med, taken: true } : med
      ),
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const deleteMedicine = async (id: string) => {
    const { notificationService } = await import('../services/notificationService');
    const medicine = healthData.medicines.find((med) => med.id === id);

    const idsToCancel = medicine?.notificationIds?.length
      ? medicine.notificationIds
      : medicine?.notificationId
      ? [medicine.notificationId]
      : [];

    if (idsToCancel.length > 0) {
      try {
        await Promise.all(idsToCancel.map((id) => notificationService.cancelNotification(id)));
      } catch (error) {
        console.error('Error cancelling medicine reminder:', error);
      }
    }

    const nextData: HealthData = {
      ...healthData,
      medicines: healthData.medicines.filter((med) => med.id !== id),
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
  };

  const calculateMentalHealthScore = (answers: Record<string, string>): number => {
    const scoreMap: Record<string, Record<string, number>> = {
      mood: {
        '😊 Great': 20,
        '🙂 Good': 15,
        '😐 Neutral': 10,
        '😔 Low': 5,
        '😢 Very Low': 0,
      },
      anxiety: {
        None: 20,
        Mild: 15,
        Moderate: 10,
        High: 5,
        Severe: 0,
      },
      sleep: {
        Excellent: 20,
        Good: 15,
        Fair: 10,
        Poor: 5,
        'Very Poor': 0,
      },
      stress: {
        'Very Low': 20,
        Low: 15,
        Moderate: 10,
        High: 5,
        'Very High': 0,
      },
      energy: {
        'Very High': 20,
        High: 15,
        Normal: 10,
        Low: 5,
        'Very Low': 0,
      },
    };

    let totalScore = 0;
    let answeredCount = 0;

    Object.entries(answers).forEach(([question, answer]) => {
      const score = scoreMap[question]?.[answer];
      totalScore += score ?? 10;
      answeredCount++;
    });

    return answeredCount > 0 ? Math.round(totalScore / answeredCount) * 5 : 0;
  };

  const getStepProgress = (): number => {
    return Math.min(
      100,
      Math.round((healthData.stepData.steps / healthData.stepData.goal) * 100)
    );
  };

  const getRecentSleepAverage = (days: number = 7): number => {
    const recent = healthData.sleepData.slice(0, days);
    if (recent.length === 0) return 0;

    const total = recent.reduce((sum, s) => sum + s.hours, 0);
    return Math.round(total / recent.length);
  };

  const getMentalHealthFeedback = (scoreOverride?: number): string => {
    const score = scoreOverride ?? healthData.mentalHealthScore;

    if (score >= 80) {
      return 'Excellent mental wellness! Keep up the great habits! 🌟';
    }
    if (score >= 60) {
      return 'Good mental wellness. Small improvements can make a big difference! 💪';
    }
    if (score >= 40) {
      return 'Moderate mental wellness. Consider some self-care activities. 🧘';
    }
    if (score >= 20) {
      return 'Low mental wellness. Please take time for yourself. 💙';
    }

    return 'Please prioritize your mental health. Reach out to someone you trust. 🤝';
  };

  return {
    healthData,
    loading,
    updateMentalHealthScore,
    addSleepLog,
    updateSteps,
    addSteps,
    updateStepGoal,
    resetDailySteps,
    getWeeklySteps,
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
  };
}
