export type TaskCategory = 'work' | 'personal' | 'study' | 'health' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  updatedAt?: number;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: number | null;
  reminder?: boolean;
  reminderTime?: number | null;
  notes?: string;
}

export interface FocusSession {
  id: string;
  seconds: number;
  endedAt: number;
  taskId?: string | null;
  productivity?: number;
  focusScore?: number;
  interruptions?: number;
}

export interface ProductivityTrend {
  date: string;
  productivityScore: number;
  totalFocus: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  occupation?: string;
  dailyGoal: number;
  weeklyGoal: number;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    taskReminders: boolean;
    sessionReminders: boolean;
    dailySummary: boolean;
    sound: boolean;
    vibration: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  work: { label: 'Work', icon: 'briefcase', color: '#6366F1' },
  personal: { label: 'Personal', icon: 'person', color: '#8B5CF6' },
  study: { label: 'Study', icon: 'school', color: '#EC4899' },
  health: { label: 'Health', icon: 'fitness', color: '#10B981' },
  other: { label: 'Other', icon: 'apps', color: '#6B7280' },
};