import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { auth } from './firebaseConfig';
import {
  loadTasks,
  loadFocus,
  loadProductivityTrends,
  saveTasks,
  saveFocus,
} from '../utils/storage';
import { Task, FocusSession, ProductivityTrend } from '../utils/types';

interface ExportData {
  version: string;
  exportDate: string;
  user: {
    uid: string;
    email: string | null;
    isAnonymous: boolean;
  };
  data: {
    tasks: Task[];
    focusSessions: FocusSession[];
    trends: ProductivityTrend[];
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    totalFocusSessions: number;
    totalFocusTime: number;
    dateRange: {
      earliest: string | null;
      latest: string | null;
    };
  };
}

class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportData(format: 'json' | 'csv' = 'json'): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const [tasks, sessions, trends] = await Promise.all([
        loadTasks(),
        loadFocus(),
        loadProductivityTrends(),
      ]);

      const exportData: ExportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous,
        },
        data: {
          tasks,
          focusSessions: sessions,
          trends,
        },
        summary: this.generateSummary(tasks, sessions),
      };

      if (format === 'json') {
        return await this.saveJsonFile(exportData);
      }

      return await this.saveCsvFiles(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  async importFromFile(uri: string): Promise<boolean> {
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      const data: ExportData = JSON.parse(content);

      if (data.data.tasks) {
        await saveTasks(data.data.tasks);
      }

      if (data.data.focusSessions) {
        await saveFocus(data.data.focusSessions);
      }

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  private generateSummary(tasks: Task[], sessions: FocusSession[]): ExportData['summary'] {
    const completedTasks = tasks.filter((t) => t.done).length;
    const totalFocusTime = sessions.reduce((acc, s) => acc + s.seconds, 0);

    const timestamps = [
      ...tasks.map((t) => t.createdAt).filter(Boolean),
      ...sessions.map((s) => s.endedAt).filter(Boolean),
    ] as number[];

    const earliest =
      timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null;
    const latest =
      timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null;

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalFocusSessions: sessions.length,
      totalFocusTime,
      dateRange: {
        earliest,
        latest,
      },
    };
  }

  private async saveJsonFile(data: ExportData): Promise<string> {
    if (!FileSystem.documentDirectory) {
      throw new Error('File system not available');
    }

    const fileName = `worktwin_export_${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    const jsonString = JSON.stringify(data, null, 2);

    await FileSystem.writeAsStringAsync(filePath, jsonString);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export WorkTwin Data',
      });
    }

    return filePath;
  }

  private async saveCsvFiles(data: ExportData): Promise<string> {
    if (!FileSystem.documentDirectory) {
      throw new Error('File system not available');
    }

    const timestamp = Date.now();
    const baseDir = FileSystem.documentDirectory;

    const tasksCsv = this.convertTasksToCsv(data.data.tasks);
    const tasksPath = `${baseDir}tasks_${timestamp}.csv`;
    await FileSystem.writeAsStringAsync(tasksPath, tasksCsv);

    const sessionsCsv = this.convertSessionsToCsv(data.data.focusSessions);
    const sessionsPath = `${baseDir}sessions_${timestamp}.csv`;
    await FileSystem.writeAsStringAsync(sessionsPath, sessionsCsv);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(tasksPath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Tasks CSV',
      });
    }

    return tasksPath;
  }

  private convertTasksToCsv(tasks: Task[]): string {
    const headers = [
      'ID',
      'Title',
      'Done',
      'Created At',
      'Due Date',
      'Category',
      'Priority',
      'Notes',
    ];

    const rows = tasks.map((task) => [
      task.id,
      this.escapeCsv(task.title),
      task.done ? 'Yes' : 'No',
      task.createdAt ? new Date(task.createdAt).toLocaleString() : '',
      task.dueDate ? new Date(task.dueDate).toLocaleString() : '',
      task.category || '',
      task.priority || '',
      this.escapeCsv(task.notes || ''),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private convertSessionsToCsv(sessions: FocusSession[]): string {
    const headers = [
      'ID',
      'Duration (seconds)',
      'Duration (minutes)',
      'Ended At',
      'Task ID',
      'Productivity',
      'Focus Score',
      'Interruptions',
    ];

    const rows = sessions.map((session) => [
      session.id,
      String(session.seconds),
      String(Math.round(session.seconds / 60)),
      session.endedAt ? new Date(session.endedAt).toLocaleString() : '',
      session.taskId || '',
      session.productivity != null ? String(session.productivity) : '',
      session.focusScore != null ? String(session.focusScore) : '',
      session.interruptions != null ? String(session.interruptions) : '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsv(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}

export const exportService = ExportService.getInstance();