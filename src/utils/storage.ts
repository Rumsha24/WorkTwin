<<<<<<< HEAD
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, FocusSession, ProductivityTrend } from './types';

const KEYS = {
  TASKS: 'worktwin_tasks',
  FOCUS_SESSIONS: 'worktwin_focus',
  PRODUCTIVITY_TRENDS: 'worktwin_trends',
} as const;

// Task operations
export async function loadTasks(): Promise<Task[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading tasks:', error);
=======
// utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task, FocusSession, ProductivityTrend, Reminder } from "./type";

const KEYS = {
  TASKS: "worktwin_tasks_v2",
  FOCUS: "worktwin_focus_v2",
  TRENDS: "worktwin_trends_v1",
  REMINDERS: "worktwin_reminders_v1",
} as const;

// ==================== TASKS ====================
export async function loadTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TASKS);
    if (!raw) return [];
    const tasks = JSON.parse(raw) as Task[];
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error("Error loading tasks:", error);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    return [];
  }
}

<<<<<<< HEAD
export async function saveTasks(tasks: Task[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    return false;
  }
}

export async function addTask(task: Task): Promise<boolean> {
  try {
    const tasks = await loadTasks();
    tasks.push(task);
    return await saveTasks(tasks);
  } catch (error) {
    console.error('Error adding task:', error);
    return false;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    const tasks = await loadTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };
    await saveTasks(tasks);
    return tasks[index];
  } catch (error) {
    console.error('Error updating task:', error);
=======
export async function saveTasks(tasks: Task[]) {
  try {
    const validTasks = Array.isArray(tasks) ? tasks : [];
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(validTasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

export async function addTask(task: Omit<Task, 'id' | 'createdAt'>) {
  try {
    const tasks = await loadTasks();
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: Date.now(),
      dueDate: task.dueDate || null,
      reminder: task.reminder || false,
      reminderTime: task.reminderTime || null,
      category: task.category || 'other',
      priority: task.priority || 'medium',
      notes: task.notes || '',
    };
    const updatedTasks = [newTask, ...tasks];
    await saveTasks(updatedTasks);

    // Schedule reminder if enabled
    if (newTask.reminder && newTask.reminderTime) {
      await scheduleReminder(newTask);
    }

    return newTask;
  } catch (error) {
    console.error("Error adding task:", error);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    return null;
  }
}

<<<<<<< HEAD
export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const tasks = await loadTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    return await saveTasks(filtered);
  } catch (error) {
    console.error('Error deleting task:', error);
=======
export async function updateTask(id: string, updates: Partial<Task>) {
  try {
    const tasks = await loadTasks();
    const oldTask = tasks.find(t => t.id === id);
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    await saveTasks(updatedTasks);

    // Handle reminder updates
    const updatedTask = updatedTasks.find(t => t.id === id);
    if (updatedTask) {
      if (updatedTask.reminder && updatedTask.reminderTime) {
        await scheduleReminder(updatedTask);
      } else if (oldTask?.reminder) {
        await cancelReminder(id);
      }
    }

    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    return null;
  }
}

export async function deleteTask(id: string) {
  try {
    const tasks = await loadTasks();
    const updatedTasks = tasks.filter(task => task.id !== id);
    await saveTasks(updatedTasks);
    await cancelReminder(id);
    return true;
  } catch (error) {
    console.error("Error deleting task:", error);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    return false;
  }
}

<<<<<<< HEAD
// Focus session operations
export async function loadFocus(): Promise<FocusSession[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FOCUS_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading focus sessions:', error);
=======
// ==================== FOCUS SESSIONS ====================
export async function loadFocus(): Promise<FocusSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FOCUS);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as FocusSession[];
    return Array.isArray(sessions) ? sessions : [];
  } catch (error) {
    console.error("Error loading focus sessions:", error);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    return [];
  }
}

<<<<<<< HEAD
export async function saveFocus(sessions: FocusSession[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
    await updateProductivityTrends(sessions);
    return true;
  } catch (error) {
    console.error('Error saving focus sessions:', error);
    return false;
  }
}

export async function addFocusSession(session: FocusSession): Promise<boolean> {
  try {
    const sessions = await loadFocus();
    sessions.push(session);
    return await saveFocus(sessions);
  } catch (error) {
    console.error('Error adding focus session:', error);
    return false;
  }
}

// Productivity trends
export async function loadProductivityTrends(): Promise<ProductivityTrend[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PRODUCTIVITY_TRENDS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading productivity trends:', error);
=======
export async function addFocusSession(session: Omit<FocusSession, 'id'>) {
  try {
    const prev = await loadFocus();
    const newSession: FocusSession = {
      ...session,
      id: Date.now().toString(),
      productivity: session.productivity || 5,
      focusScore: session.focusScore || 7,
    };
    const next = [newSession, ...prev].slice(0, 100); // keep last 100
    await AsyncStorage.setItem(KEYS.FOCUS, JSON.stringify(next));

    // Update productivity trends
    await updateProductivityTrend(newSession);

    return next;
  } catch (error) {
    console.error("Error adding focus session:", error);
    return [];
  }
}

// ==================== PRODUCTIVITY TRENDS ====================
export async function loadProductivityTrends(): Promise<ProductivityTrend[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRENDS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error loading trends:", error);
>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
    return [];
  }
}

<<<<<<< HEAD
async function updateProductivityTrends(sessions: FocusSession[]): Promise<void> {
  try {
    const trendsMap: Record<string, { 
      date: string; 
      productivityScore: number; 
      totalFocus: number; 
      sessionCount: number 
    }> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.endedAt).toLocaleDateString();
      if (!trendsMap[date]) {
        trendsMap[date] = {
          date,
          productivityScore: 0,
          totalFocus: 0,
          sessionCount: 0,
        };
      }
      
      trendsMap[date].totalFocus += session.seconds;
      trendsMap[date].productivityScore += session.productivity || 5;
      trendsMap[date].sessionCount += 1;
    });

    const trendArray: ProductivityTrend[] = Object.values(trendsMap).map(t => ({
      date: t.date,
      productivityScore: Math.round((t.productivityScore / t.sessionCount) * 10) / 10,
      totalFocus: t.totalFocus,
    }));

    await AsyncStorage.setItem(KEYS.PRODUCTIVITY_TRENDS, JSON.stringify(trendArray));
  } catch (error) {
    console.error('Error updating productivity trends:', error);
  }
}

// Get task statistics
export async function getTaskStats(): Promise<{ total: number; completed: number; pending: number }> {
  try {
    const tasks = await loadTasks();
    const completed = tasks.filter(t => t.done).length;
    return {
      total: tasks.length,
      completed,
      pending: tasks.length - completed,
    };
  } catch (error) {
    console.error('Error getting task stats:', error);
    return { total: 0, completed: 0, pending: 0 };
  }
}

// Get focus statistics
export async function getFocusStats(): Promise<{ total: number; today: number; average: number }> {
  try {
    const sessions = await loadFocus();
    const total = sessions.reduce((acc, s) => acc + s.seconds, 0);
    
    const today = new Date().setHours(0, 0, 0, 0);
    const todaySessions = sessions.filter(s => s.endedAt >= today);
    const todayTotal = todaySessions.reduce((acc, s) => acc + s.seconds, 0);
    
    const average = sessions.length > 0 ? total / sessions.length : 0;
    
    return {
      total,
      today: todayTotal,
      average,
    };
  } catch (error) {
    console.error('Error getting focus stats:', error);
    return { total: 0, today: 0, average: 0 };
  }
}

// Get productivity statistics
export async function getProductivityStats(): Promise<{ average: number; best: number; worst: number }> {
  try {
    const sessions = await loadFocus();
    const productiveSessions = sessions.filter(s => s.productivity);
    
    if (productiveSessions.length === 0) {
      return { average: 0, best: 0, worst: 0 };
    }

    const productivities = productiveSessions.map(s => s.productivity || 0);
    const average = productivities.reduce((a, b) => a + b, 0) / productivities.length;
    const best = Math.max(...productivities);
    const worst = Math.min(...productivities);

    return {
      average: Math.round(average * 10) / 10,
      best,
      worst,
    };
  } catch (error) {
    console.error('Error getting productivity stats:', error);
    return { average: 0, best: 0, worst: 0 };
  }
}

// Utility functions
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export async function clearAllData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([KEYS.TASKS, KEYS.FOCUS_SESSIONS, KEYS.PRODUCTIVITY_TRENDS]);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

// Backup and restore functions
export async function exportAllData(): Promise<string> {
  try {
    const [tasks, focusSessions, trends] = await Promise.all([
      loadTasks(),
      loadFocus(),
      loadProductivityTrends(),
    ]);

    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      data: {
        tasks,
        focusSessions,
        trends,
      },
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

export async function importAllData(jsonData: string): Promise<boolean> {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.version || !importData.data) {
      throw new Error('Invalid import data format');
    }

    if (importData.data.tasks) {
      await saveTasks(importData.data.tasks);
    }
    
    if (importData.data.focusSessions) {
      await saveFocus(importData.data.focusSessions);
    }

    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// Cleanup old data
export async function cleanupOldData(daysToKeep: number = 30): Promise<void> {
  try {
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // Clean up old focus sessions
    const sessions = await loadFocus();
    const recentSessions = sessions.filter(s => s.endedAt >= cutoffDate);
    await saveFocus(recentSessions);
    
    // Productivity trends will be automatically recalculated
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

// Migration function for future versions
export async function migrateDataIfNeeded(): Promise<void> {
  try {
    const version = await AsyncStorage.getItem('worktwin_version');
    
    if (!version) {
      // First time running, set version
      await AsyncStorage.setItem('worktwin_version', '1.0.0');
      return;
    }

    // Add migration logic here for future versions
    // if (version === '1.0.0') {
    //   await migrateToVersion1_1_0();
    // }
    
  } catch (error) {
    console.error('Error checking/migrating data version:', error);
  }
}

// Get session count for today
export async function getTodaySessionCount(): Promise<number> {
  try {
    const sessions = await loadFocus();
    const today = new Date().setHours(0, 0, 0, 0);
    return sessions.filter(s => s.endedAt >= today).length;
  } catch (error) {
    console.error('Error getting today session count:', error);
    return 0;
  }
}

// Get total focus time for a specific date range
export async function getFocusTimeInRange(startDate: number, endDate: number): Promise<number> {
  try {
    const sessions = await loadFocus();
    return sessions
      .filter(s => s.endedAt >= startDate && s.endedAt <= endDate)
      .reduce((acc, s) => acc + s.seconds, 0);
  } catch (error) {
    console.error('Error getting focus time in range:', error);
    return 0;
  }
}

// Get completion rate
export async function getCompletionRate(): Promise<number> {
  try {
    const tasks = await loadTasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.done).length;
    return Math.round((completed / tasks.length) * 100);
  } catch (error) {
    console.error('Error getting completion rate:', error);
    return 0;
  }
}
=======
async function updateProductivityTrend(session: FocusSession) {
  try {
    const trends = await loadProductivityTrends();
    const date = new Date(session.endedAt).toDateString();
    
    const existingTrend = trends.find(t => t.date === date);
    const tasksCompleted = await getTasksCompletedForDate(session.endedAt);
    
    if (existingTrend) {
      existingTrend.totalFocus += session.seconds;
      existingTrend.sessionsCount += 1;
      existingTrend.tasksCompleted = tasksCompleted;
      existingTrend.productivityScore = calculateProductivityScore(
        existingTrend.totalFocus,
        existingTrend.tasksCompleted,
        existingTrend.sessionsCount
      );
    } else {
      trends.push({
        date,
        totalFocus: session.seconds,
        tasksCompleted,
        sessionsCount: 1,
        productivityScore: calculateProductivityScore(session.seconds, tasksCompleted, 1),
      });
    }

    // Keep last 30 days
    const sortedTrends = trends.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 30);

    await AsyncStorage.setItem(KEYS.TRENDS, JSON.stringify(sortedTrends));
  } catch (error) {
    console.error("Error updating trend:", error);
  }
}

async function getTasksCompletedForDate(timestamp: number): Promise<number> {
  const tasks = await loadTasks();
  const date = new Date(timestamp).toDateString();
  return tasks.filter(task => {
    if (!task.done) return false;
    const taskDate = new Date(task.createdAt).toDateString();
    return taskDate === date;
  }).length;
}

function calculateProductivityScore(focusTime: number, tasksCompleted: number, sessions: number): number {
  // Simple algorithm: (focus hours * 2 + tasks completed * 3) / (sessions)
  const focusHours = focusTime / 3600;
  if (sessions === 0) return 0;
  return Math.min(10, Math.round(((focusHours * 2) + (tasksCompleted * 3)) / sessions));
}

// ==================== REMINDERS ====================
export async function scheduleReminder(task: Task) {
  try {
    if (!task.reminderTime) return;

    const reminders = await loadReminders();
    const newReminder: Reminder = {
      id: `reminder_${task.id}`,
      taskId: task.id,
      title: task.title,
      time: task.reminderTime,
      triggered: false,
    };

    const filteredReminders = reminders.filter(r => r.taskId !== task.id);
    await AsyncStorage.setItem(
      KEYS.REMINDERS,
      JSON.stringify([...filteredReminders, newReminder])
    );

    console.log("Reminder scheduled for:", new Date(task.reminderTime).toLocaleString());
    // In a real app, you'd use expo-notifications here
  } catch (error) {
    console.error("Error scheduling reminder:", error);
  }
}

export async function loadReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.REMINDERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error loading reminders:", error);
    return [];
  }
}

export async function cancelReminder(taskId: string) {
  try {
    const reminders = await loadReminders();
    const filtered = reminders.filter(r => r.taskId !== taskId);
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error canceling reminder:", error);
  }
}

// ==================== CLEAR DATA ====================
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([KEYS.TASKS, KEYS.FOCUS, KEYS.TRENDS, KEYS.REMINDERS]);
    return true;
  } catch (error) {
    console.error("Error clearing data:", error);
    return false;
  }
}

// ==================== FORMATTERS ====================
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

export function formatHumanSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (h > 0) {
    return `${h} hr ${m} min`;
  }
  return `${m} min`;
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


>>>>>>> 6f54f8ac3d4b22949ba7c8c7b5ce04f3e9fef90b
