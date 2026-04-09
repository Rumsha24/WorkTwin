import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';

export interface HealthMetrics {
  mentalHealthScore: number;
  lastMentalCheck: string | null;
  sleepHours: number[];
  sleepQuality: number[];
  stepCounts: number[];
  stepGoal: number;
  medicines: Array<{
    id: string;
    name: string;
    time: string;
    dosage: string;
    taken: boolean;
    notificationId?: string | null;
  }>;
  hydrationReminders: boolean;
  breakReminders: boolean;
}

class HealthService {
  private static instance: HealthService;
  private readonly STORAGE_KEY = 'worktwin_health';

  private constructor() {}

  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async getHealthData(): Promise<HealthMetrics> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...this.getDefaultHealthData(),
          ...parsed,
          medicines: parsed.medicines || [],
        };
      }
      return this.getDefaultHealthData();
    } catch (error) {
      console.error('Error getting health data:', error);
      return this.getDefaultHealthData();
    }
  }

  private getDefaultHealthData(): HealthMetrics {
    return {
      mentalHealthScore: 0,
      lastMentalCheck: null,
      sleepHours: [],
      sleepQuality: [],
      stepCounts: [],
      stepGoal: 10000,
      medicines: [],
      hydrationReminders: true,
      breakReminders: true,
    };
  }

  async saveHealthData(data: HealthMetrics): Promise<boolean> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving health data:', error);
      return false;
    }
  }

  async updateMentalHealthScore(score: number): Promise<boolean> {
    const data = await this.getHealthData();
    data.mentalHealthScore = score;
    data.lastMentalCheck = new Date().toISOString();
    return this.saveHealthData(data);
  }

  async addSleepLog(hours: number, quality: number): Promise<boolean> {
    const data = await this.getHealthData();
    data.sleepHours.unshift(hours);
    data.sleepQuality.unshift(quality);
    if (data.sleepHours.length > 30) data.sleepHours.pop();
    if (data.sleepQuality.length > 30) data.sleepQuality.pop();
    return this.saveHealthData(data);
  }

  async addStepCount(steps: number): Promise<boolean> {
    const data = await this.getHealthData();
    data.stepCounts.unshift(steps);
    if (data.stepCounts.length > 30) data.stepCounts.pop();
    return this.saveHealthData(data);
  }

  async updateStepGoal(goal: number): Promise<boolean> {
    const data = await this.getHealthData();
    data.stepGoal = goal;
    return this.saveHealthData(data);
  }

  private parseReminderTime(time: string): { hour: number; minute: number } | null {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const suffix = match[3]?.toLowerCase();

    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;

    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
  }

  async addMedicine(name: string, time: string, dosage: string): Promise<boolean> {
    const data = await this.getHealthData();

    let notificationId: string | null = null;
    try {
      const parsed = this.parseReminderTime(time);
      if (parsed) {
        notificationId = await notificationService.scheduleMedicineReminder(
          name,
          parsed.hour,
          parsed.minute,
          dosage
        );
      }
    } catch (error) {
      console.error('Error scheduling medicine reminder:', error);
    }

    data.medicines.push({
      id: Date.now().toString(),
      name,
      time,
      dosage,
      taken: false,
      notificationId,
    });

    return this.saveHealthData(data);
  }

  async markMedicineTaken(id: string): Promise<boolean> {
    const data = await this.getHealthData();
    const medicine = data.medicines.find((m) => m.id === id);
    if (medicine) {
      medicine.taken = true;
      return this.saveHealthData(data);
    }
    return false;
  }

  async deleteMedicine(id: string): Promise<boolean> {
    const data = await this.getHealthData();
    const medicine = data.medicines.find((m) => m.id === id);

    if (medicine?.notificationId) {
      try {
        await notificationService.cancelNotification(medicine.notificationId);
      } catch (error) {
        console.error('Error cancelling medicine reminder:', error);
      }
    }

    data.medicines = data.medicines.filter((m) => m.id !== id);
    return this.saveHealthData(data);
  }

  async toggleHydrationReminders(): Promise<boolean> {
    const data = await this.getHealthData();
    data.hydrationReminders = !data.hydrationReminders;
    return this.saveHealthData(data);
  }

  async toggleBreakReminders(): Promise<boolean> {
    const data = await this.getHealthData();
    data.breakReminders = !data.breakReminders;
    return this.saveHealthData(data);
  }

  async getAverageSleepHours(days: number = 7): Promise<number> {
    const data = await this.getHealthData();
    const recent = data.sleepHours.slice(0, days);
    if (recent.length === 0) return 0;
    const total = recent.reduce((sum, h) => sum + h, 0);
    return Math.round(total / recent.length);
  }

  async getAverageStepCount(days: number = 7): Promise<number> {
    const data = await this.getHealthData();
    const recent = data.stepCounts.slice(0, days);
    if (recent.length === 0) return 0;
    const total = recent.reduce((sum, s) => sum + s, 0);
    return Math.round(total / recent.length);
  }

  async getStepCompletionRate(): Promise<number> {
    const data = await this.getHealthData();
    const recentSteps = data.stepCounts.slice(0, 7);
    if (recentSteps.length === 0) return 0;
    const totalSteps = recentSteps.reduce((sum, s) => sum + s, 0);
    const target = data.stepGoal * recentSteps.length;
    return Math.min(100, Math.round((totalSteps / target) * 100));
  }
}

export const healthService = HealthService.getInstance();