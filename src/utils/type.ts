// utils/types.ts
export type Task = { 
  id: string; 
  title: string; 
  done: boolean; 
  createdAt: number;
  dueDate?: number | null;  // Optional due date
  reminder?: boolean;        // Reminder enabled
  reminderTime?: number | null; // Reminder time
  category?: 'work' | 'personal' | 'study' | 'health' | 'other';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
};

export type FocusSession = { 
  id: string; 
  seconds: number; 
  endedAt: number;
  taskId?: string | null;    // Associated task
  category?: string;
  productivity: number;       // Productivity score 1-10
  focusScore?: number;        // Focus score based on interruptions
};

export type ProductivityTrend = {
  date: string;
  totalFocus: number;
  tasksCompleted: number;
  productivityScore: number;
  sessionsCount: number;
};

export type Reminder = {
  id: string;
  taskId: string;
  title: string;
  time: number;
  triggered: boolean;
};