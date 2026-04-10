import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, FocusSession, ProductivityTrend } from './types';

const TASKS_KEY = 'WORKTWIN_TASKS';
const FOCUS_KEY = 'WORKTWIN_FOCUS';
const PRODUCTIVITY_KEY = 'WORKTWIN_PRODUCTIVITY';

let activeStorageUserId: string | null = null;

export const setActiveStorageUser = (userId: string | null) => {
  activeStorageUserId = userId;
};

export const getScopedStorageKey = (key: string, userId = activeStorageUserId): string =>
  userId ? `${key}:${userId}` : key;

// Task Operations
export const loadTasks = async (): Promise<Task[]> => {
  try {
    const data = await AsyncStorage.getItem(getScopedStorageKey(TASKS_KEY));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('loadTasks error:', error);
    return [];
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(getScopedStorageKey(TASKS_KEY), JSON.stringify(tasks));
  } catch (error) {
    console.error('saveTasks error:', error);
  }
};

export const addTask = async (task: Task): Promise<boolean> => {
  try {
    const tasks = await loadTasks();
    tasks.push(task);
    await saveTasks(tasks);
    return true;
  } catch (error) {
    console.error('addTask error:', error);
    return false;
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task | null> => {
  try {
    const tasks = await loadTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
    await saveTasks(tasks);
    return tasks[index];
  } catch (error) {
    console.error('updateTask error:', error);
    return null;
  }
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const tasks = await loadTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    await saveTasks(filtered);
    return true;
  } catch (error) {
    console.error('deleteTask error:', error);
    return false;
  }
};

// Focus Session Operations
export const loadFocus = async (): Promise<FocusSession[]> => {
  try {
    const data = await AsyncStorage.getItem(getScopedStorageKey(FOCUS_KEY));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('loadFocus error:', error);
    return [];
  }
};

export const saveFocus = async (sessions: FocusSession[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(getScopedStorageKey(FOCUS_KEY), JSON.stringify(sessions));
  } catch (error) {
    console.error('saveFocus error:', error);
  }
};

export const addFocusSession = async (session: FocusSession): Promise<boolean> => {
  try {
    const sessions = await loadFocus();
    sessions.push(session);
    await saveFocus(sessions);
    await updateProductivityTrend(session);
    return true;
  } catch (error) {
    console.error('addFocusSession error:', error);
    return false;
  }
};

// Productivity Trends
export const loadProductivityTrends = async (): Promise<ProductivityTrend[]> => {
  try {
    const data = await AsyncStorage.getItem(getScopedStorageKey(PRODUCTIVITY_KEY));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('loadProductivityTrends error:', error);
    return [];
  }
};

const updateProductivityTrend = async (session: FocusSession): Promise<void> => {
  try {
    const trends = await loadProductivityTrends();
    const sessionDate = new Date(session.endedAt).toISOString().split('T')[0];
    const productivity = session.productivity ?? 5;
    const totalFocus = session.seconds ?? 0;

    const existingIndex = trends.findIndex((t) => t.date === sessionDate);

    if (existingIndex >= 0) {
      const existing = trends[existingIndex];
      const newTotalFocus = existing.totalFocus + totalFocus;
      const weightedScore = newTotalFocus > 0
        ? Math.round(((existing.productivityScore * existing.totalFocus + productivity * totalFocus) / newTotalFocus) * 10) / 10
        : productivity;

      trends[existingIndex] = {
        date: sessionDate,
        productivityScore: weightedScore,
        totalFocus: newTotalFocus,
      };
    } else {
      trends.push({
        date: sessionDate,
        productivityScore: productivity,
        totalFocus,
      });
    }

    await AsyncStorage.setItem(getScopedStorageKey(PRODUCTIVITY_KEY), JSON.stringify(trends));
  } catch (error) {
    console.error('updateProductivityTrend error:', error);
  }
};

// Stats Functions
export const getProductivityStats = async () => {
  const trends = await loadProductivityTrends();

  if (trends.length === 0) {
    return { average: 0, best: 0, worst: 0 };
  }

  const scores = trends.map((t) => t.productivityScore || 0);

  return {
    average: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    best: Math.max(...scores),
    worst: Math.min(...scores),
  };
};

export const getCompletionRate = async (): Promise<number> => {
  const tasks = await loadTasks();

  if (tasks.length === 0) return 0;

  const completed = tasks.filter((t) => t.done).length;
  return Math.round((completed / tasks.length) * 100);
};

export const getFocusStats = async () => {
  const sessions = await loadFocus();

  if (sessions.length === 0) {
    return { total: 0, today: 0, average: 0 };
  }

  const total = sessions.reduce((acc, s) => acc + (s.seconds || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];

  const today = sessions
    .filter((s) => new Date(s.endedAt).toISOString().split('T')[0] === todayStr)
    .reduce((acc, s) => acc + (s.seconds || 0), 0);

  const average = sessions.length > 0 ? total / sessions.length : 0;

  return {
    total,
    today,
    average: Math.round(average),
  };
};

export const getTaskStats = async () => {
  const tasks = await loadTasks();
  const completed = tasks.filter((t) => t.done).length;

  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
  };
};

// Helper Functions
export const formatDateTime = (timestamp?: number | null): string => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  const safeSeconds = Number(seconds || 0);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const scopedPrefix = activeStorageUserId ? `:${activeStorageUserId}` : '';
    const removablePrefixes = [
      TASKS_KEY,
      FOCUS_KEY,
      PRODUCTIVITY_KEY,
      'mentalHealthScore',
      'lastMentalCheck',
      'sleepData',
      'stepData',
      'medicines',
      'periodLogs',
      'lastPeriodDate',
      'profileGender',
      'profile',
      'waterIntake',
      'wellnessReminder',
      'worktwin_notifications',
    ];

    const removableKeys = allKeys.filter((key) => {
      if (
        key === TASKS_KEY ||
        key === FOCUS_KEY ||
        key === PRODUCTIVITY_KEY ||
        key.startsWith(`${TASKS_KEY}:`) ||
        key.startsWith(`${FOCUS_KEY}:`) ||
        key.startsWith(`${PRODUCTIVITY_KEY}:`)
      ) {
        return true;
      }

      return removablePrefixes.some((prefix) => {
        if (scopedPrefix) {
          return key === `${prefix}${scopedPrefix}` || key.startsWith(`${prefix}:${activeStorageUserId}`);
        }
        return key === prefix || key.startsWith(`${prefix}:`);
      });
    });

    if (removableKeys.length > 0) {
      await AsyncStorage.multiRemove(removableKeys);
    }
    return true;
  } catch (error) {
    console.error('clearAllData error:', error);
    return false;
  }
};
