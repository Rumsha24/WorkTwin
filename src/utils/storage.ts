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
    return [];
  }
}

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
    return null;
  }
}

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
    return false;
  }
}

// ==================== FOCUS SESSIONS ====================
export async function loadFocus(): Promise<FocusSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.FOCUS);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as FocusSession[];
    return Array.isArray(sessions) ? sessions : [];
  } catch (error) {
    console.error("Error loading focus sessions:", error);
    return [];
  }
}

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
    return [];
  }
}

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


