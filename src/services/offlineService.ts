import AsyncStorage from '@react-native-async-storage/async-storage';
import { firestoreService } from './firestoreService';
import { Task, FocusSession } from '../utils/types';

interface PendingChange {
  id: string;
  type: 'add' | 'update' | 'delete';
  collection: 'tasks' | 'sessions';
  documentId?: string;
  data?: any;
  timestamp: number;
}

class OfflineService {
  private static instance: OfflineService;
  private readonly PENDING_KEY = 'pending_changes';

  private constructor() {}

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async queueChange(userId: string, change: Omit<PendingChange, 'id'>): Promise<void> {
    try {
      const key = `${this.PENDING_KEY}_${userId}`;
      const existing = await AsyncStorage.getItem(key);
      const changes: PendingChange[] = existing ? JSON.parse(existing) : [];
      
      changes.push({
        ...change,
        id: Date.now().toString(),
      });

      await AsyncStorage.setItem(key, JSON.stringify(changes));
    } catch (error) {
      console.error('Error queuing change:', error);
    }
  }

  async getPendingChanges(userId: string): Promise<PendingChange[]> {
    try {
      const key = `${this.PENDING_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending changes:', error);
      return [];
    }
  }

  async getPendingCount(userId: string): Promise<number> {
    const changes = await this.getPendingChanges(userId);
    return changes.length;
  }

  async clearPendingChanges(userId: string): Promise<void> {
    try {
      const key = `${this.PENDING_KEY}_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing pending changes:', error);
    }
  }

  async syncPending(userId: string): Promise<boolean> {
    try {
      const changes = await this.getPendingChanges(userId);
      
      for (const change of changes) {
        switch (change.type) {
          case 'add':
            if (change.collection === 'tasks') {
              await firestoreService.addTask(userId, change.data);
            }
            break;
          case 'update':
            if (change.collection === 'tasks' && change.documentId) {
              await firestoreService.updateTask(userId, change.documentId, change.data);
            }
            break;
          case 'delete':
            if (change.collection === 'tasks' && change.documentId) {
              await firestoreService.deleteTask(userId, change.documentId);
            }
            break;
        }
      }

      await this.clearPendingChanges(userId);
      return true;
    } catch (error) {
      console.error('Error syncing changes:', error);
      return false;
    }
  }
}

export const offlineService = OfflineService.getInstance();