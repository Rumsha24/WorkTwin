import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MedicineReminder {
  id: string;
  name: string;
  time: string;
  dosage: string;
  taken: boolean;
  notificationId?: string | null;
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

export function useHealth() {
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

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const mentalHealthScore = await AsyncStorage.getItem('mentalHealthScore');
      const lastMentalCheck = await AsyncStorage.getItem('lastMentalCheck');
      const sleepData = await AsyncStorage.getItem('sleepData');
      const stepData = await AsyncStorage.getItem('stepData');
      const medicines = await AsyncStorage.getItem('medicines');

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
  };

  const persistHealthData = async (data: HealthData) => {
    try {
      await AsyncStorage.setItem('mentalHealthScore', data.mentalHealthScore.toString());
      await AsyncStorage.setItem(
        'lastMentalCheck',
        data.lastMentalCheck ? data.lastMentalCheck.toString() : ''
      );
      await AsyncStorage.setItem('sleepData', JSON.stringify(data.sleepData));
      await AsyncStorage.setItem('stepData', JSON.stringify(data.stepData));
      await AsyncStorage.setItem('medicines', JSON.stringify(data.medicines));
      return true;
    } catch (error) {
      console.error('Error saving health data:', error);
      return false;
    }
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
    const today = new Date().toISOString().split('T')[0];
    const existingHistory = healthData.stepData.history || [];

    const existingIndex = existingHistory.findIndex((h) => h.date === today);
    let updatedHistory = [...existingHistory];

    if (existingIndex >= 0) {
      updatedHistory[existingIndex] = { date: today, steps };
    } else {
      updatedHistory.push({ date: today, steps });
    }

    updatedHistory = updatedHistory.slice(-30);

    const nextData: HealthData = {
      ...healthData,
      stepData: {
        ...healthData.stepData,
        steps,
        date: today,
        history: updatedHistory,
      },
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
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

  const addMedicine = async (name: string, time: string, dosage: string) => {
    const { notificationService } = await import('../services/NotificationService');

    let notificationId: string | null = null;

    try {
      const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
      if (match) {
        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const suffix = match[3]?.toLowerCase();

        if (suffix === 'pm' && hour < 12) hour += 12;
        if (suffix === 'am' && hour === 12) hour = 0;

        notificationId = await notificationService.scheduleMedicineReminder(
          name,
          hour,
          minute,
          dosage
        );
      }
    } catch (error) {
      console.error('Error scheduling medicine reminder:', error);
    }

    const newMedicine: MedicineReminder = {
      id: Date.now().toString(),
      name,
      time,
      dosage,
      taken: false,
      notificationId,
    };

    const nextData: HealthData = {
      ...healthData,
      medicines: [...healthData.medicines, newMedicine],
    };

    setHealthData(nextData);
    await persistHealthData(nextData);
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
    const { notificationService } = await import('../services/NotificationService');
    const medicine = healthData.medicines.find((med) => med.id === id);

    if (medicine?.notificationId) {
      try {
        await notificationService.cancelNotification(medicine.notificationId);
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

  const getMentalHealthFeedback = (): string => {
    const score = healthData.mentalHealthScore;

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
  };
}