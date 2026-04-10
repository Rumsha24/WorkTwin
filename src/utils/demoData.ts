import AsyncStorage from '@react-native-async-storage/async-storage';

import { FocusSession, ProductivityTrend, Task } from './types';
import {
  loadFocus,
  loadProductivityTrends,
  loadTasks,
  getScopedStorageKey,
  saveFocus,
  saveTasks,
  setActiveStorageUser,
} from './storage';

export const DEMO_USER = {
  name: 'Rumsha Ahmed',
  email: 'rumsha@worktwin.com',
  password: 'WorkTwin123!',
  gender: 'female' as const,
};

const dateKey = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const atHour = (hour: number, offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
};

export const seedPresentationData = async (userId: string) => {
  const now = Date.now();
  setActiveStorageUser(userId);
  const [existingTasks, existingFocus, existingProductivity] = await Promise.all([
    loadTasks(),
    loadFocus(),
    loadProductivityTrends(),
  ]);

  const tasks: Task[] = [
    {
      id: 'demo-task-1',
      title: 'Finish capstone presentation slides',
      done: false,
      category: 'study',
      priority: 'high',
      dueDate: atHour(20),
      reminder: true,
      reminderTime: atHour(18),
      notes: 'Add screenshots of dashboard, period log, and medicine reminders.',
      createdAt: now - 1000 * 60 * 60 * 5,
      updatedAt: now - 1000 * 60 * 45,
    },
    {
      id: 'demo-task-2',
      title: 'Review Firebase authentication flow',
      done: true,
      category: 'work',
      priority: 'medium',
      dueDate: atHour(13),
      reminder: false,
      reminderTime: null,
      notes: 'Mention guest and registered account support.',
      createdAt: now - 1000 * 60 * 60 * 26,
      updatedAt: now - 1000 * 60 * 60 * 3,
    },
    {
      id: 'demo-task-3',
      title: 'Log today wellness check',
      done: true,
      category: 'health',
      priority: 'low',
      dueDate: null,
      reminder: false,
      reminderTime: null,
      notes: 'Show how health tracking connects with productivity.',
      createdAt: now - 1000 * 60 * 60 * 8,
      updatedAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: 'demo-task-4',
      title: 'Practice 10 minute demo script',
      done: false,
      category: 'personal',
      priority: 'medium',
      dueDate: atHour(17),
      reminder: true,
      reminderTime: atHour(16),
      notes: 'Open with WorkTwin goal: focus smarter, track better.',
      createdAt: now - 1000 * 60 * 60 * 2,
      updatedAt: now - 1000 * 60 * 30,
    },
  ];

  const focusSessions: FocusSession[] = [
    {
      id: 'demo-focus-today-1',
      seconds: 1500,
      endedAt: atHour(10),
      productivity: 8,
      focusScore: 92,
      interruptions: 1,
    },
    {
      id: 'demo-focus-today-2',
      seconds: 1800,
      endedAt: atHour(15),
      productivity: 9,
      focusScore: 95,
      interruptions: 0,
    },
    {
      id: 'demo-focus-yesterday',
      seconds: 2100,
      endedAt: atHour(16, -1),
      productivity: 7,
      focusScore: 84,
      interruptions: 2,
    },
  ];

  const productivity: ProductivityTrend[] = [
    { date: dateKey(-6), productivityScore: 6.8, totalFocus: 1800 },
    { date: dateKey(-5), productivityScore: 7.4, totalFocus: 2400 },
    { date: dateKey(-4), productivityScore: 8.2, totalFocus: 3000 },
    { date: dateKey(-3), productivityScore: 7.8, totalFocus: 2100 },
    { date: dateKey(-2), productivityScore: 8.6, totalFocus: 3300 },
    { date: dateKey(-1), productivityScore: 7.5, totalFocus: 2100 },
    { date: dateKey(), productivityScore: 8.7, totalFocus: 3300 },
  ];

  const sleepData = [
    { date: dateKey(), hours: 8, quality: 4 },
    { date: dateKey(-1), hours: 7, quality: 3 },
    { date: dateKey(-2), hours: 7, quality: 4 },
    { date: dateKey(-3), hours: 6, quality: 3 },
    { date: dateKey(-4), hours: 8, quality: 4 },
  ];

  const stepData = {
    steps: 7420,
    goal: 10000,
    date: dateKey(),
    history: [
      { date: dateKey(-6), steps: 6800 },
      { date: dateKey(-5), steps: 8200 },
      { date: dateKey(-4), steps: 9100 },
      { date: dateKey(-3), steps: 7600 },
      { date: dateKey(-2), steps: 10400 },
      { date: dateKey(-1), steps: 8700 },
      { date: dateKey(), steps: 7420 },
    ],
  };

  const medicines = [
    {
      id: 'demo-med-1',
      name: 'Vitamin D',
      time: '9:00 AM',
      dosage: '1 tablet',
      taken: true,
      notificationId: null,
    },
    {
      id: 'demo-med-2',
      name: 'Iron Supplement',
      time: '8:00 PM',
      dosage: '1 capsule',
      taken: false,
      notificationId: null,
    },
  ];

  const periodLogs = [
    {
      id: 'demo-period-1',
      date: dateKey(-7),
      symptoms: ['Cramps', 'Fatigue', 'Cravings'],
      mood: 'Sensitive',
      notes: 'Mild cramps, managed with rest and water.',
    },
  ];

  const setIfMissing = async (key: string, value: string) => {
    const scopedKey = getScopedStorageKey(key, userId);
    const existing = await AsyncStorage.getItem(scopedKey);
    if (!existing) {
      await AsyncStorage.setItem(scopedKey, value);
    }
  };

  await Promise.all([
    existingTasks.length === 0 ? saveTasks(tasks) : Promise.resolve(),
    existingFocus.length === 0 ? saveFocus(focusSessions) : Promise.resolve(),
    existingProductivity.length === 0
      ? AsyncStorage.setItem(
          getScopedStorageKey('WORKTWIN_PRODUCTIVITY', userId),
          JSON.stringify(productivity)
        )
      : Promise.resolve(),
    setIfMissing('mentalHealthScore', '84'),
    setIfMissing('lastMentalCheck', now.toString()),
    setIfMissing('sleepData', JSON.stringify(sleepData)),
    setIfMissing('stepData', JSON.stringify(stepData)),
    setIfMissing('medicines', JSON.stringify(medicines)),
    setIfMissing(`profileGender:${userId}`, DEMO_USER.gender),
    setIfMissing(`lastPeriodDate:${userId}`, dateKey(-7)),
    setIfMissing(`periodLogs:${userId}`, JSON.stringify(periodLogs)),
  ]);
};
