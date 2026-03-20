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
    return [];
  }
}

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
    return null;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const tasks = await loadTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    return await saveTasks(filtered);
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
}

// Focus session operations
export async function loadFocus(): Promise<FocusSession[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FOCUS_SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading focus sessions:', error);
    return [];
  }
}

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
    return [];
  }
}

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