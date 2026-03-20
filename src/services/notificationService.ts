import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface ScheduledNotification {
  id: string;
  taskId?: string;
  taskTitle: string;
  time: number;
  type: 'task' | 'session' | 'daily';
}

class NotificationService {
  private static instance: NotificationService;
  private readonly NOTIFICATIONS_KEY = 'worktwin_notifications';

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
        });

        await Notifications.setNotificationChannelAsync('tasks', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
        });

        await Notifications.setNotificationChannelAsync('timer', {
          name: 'Timer Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EC4899',
        });
      }

      this.setupNotificationListeners();
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private setupNotificationListeners(): void {
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.identifier);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response.notification.request.content.data);
    });
  }

  async scheduleTaskReminder(
    taskId: string,
    taskTitle: string,
    reminderTime: number
  ): Promise<string | null> {
    try {
      const triggerDate = new Date(reminderTime);

      if (triggerDate.getTime() < Date.now()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Reminder',
          subtitle: "Don't forget your task",
          body: `"${taskTitle}" is due soon`,
          data: {
            type: 'task',
            taskId,
            taskTitle,
            screen: 'Tasks',
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      await this.storeNotification({
        id: notificationId,
        taskId,
        taskTitle,
        time: reminderTime,
        type: 'task',
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling task reminder:', error);
      return null;
    }
  }

  async scheduleTimerComplete(minutes: number): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Timer Complete!',
          subtitle: 'Great job!',
          body: `You've completed a ${minutes} minute focus session.`,
          data: {
            type: 'timer',
            screen: 'Timer',
          },
          sound: true,
        },
        trigger: null,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling timer complete:', error);
      return null;
    }
  }

  async scheduleDailySummary(hour = 20, minute = 0): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Daily Summary',
          body: 'Check your productivity stats for today',
          data: {
            type: 'daily',
            screen: 'Insights',
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily summary:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeStoredNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error canceling notification:', error);
      return false;
    }
  }

  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      return true;
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      return false;
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  private async storeNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const existing = await this.getStoredNotifications();
      existing.push(notification);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  private async getStoredNotifications(): Promise<ScheduledNotification[]> {
    try {
      const data = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  private async removeStoredNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const updated = notifications.filter((n) => n.id !== notificationId);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing stored notification:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();