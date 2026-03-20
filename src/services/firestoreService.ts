import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Task, FocusSession, UserProfile } from '../utils/types';
import uuid from 'react-native-uuid';

class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // User Profile Methods
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async createUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const docRef = doc(db, 'users', profile.id);
      await setDoc(docRef, profile);
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  // Task Methods
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const tasksRef = collection(db, 'users', userId, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async addTask(userId: string, task: Task): Promise<boolean> {
    try {
      const taskRef = doc(db, 'users', userId, 'tasks', task.id);
      await setDoc(taskRef, task);
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      return false;
    }
  }

  async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const taskRef = doc(db, 'users', userId, 'tasks', taskId);
      await updateDoc(taskRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    try {
      const taskRef = doc(db, 'users', userId, 'tasks', taskId);
      await deleteDoc(taskRef);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Focus Session Methods
  async addFocusSession(userId: string, session: FocusSession): Promise<boolean> {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
      await setDoc(sessionRef, session);
      return true;
    } catch (error) {
      console.error('Error adding focus session:', error);
      return false;
    }
  }

  async getFocusSessions(userId: string, days: number = 30): Promise<FocusSession[]> {
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      const q = query(
        sessionsRef, 
        where('endedAt', '>=', cutoffDate),
        orderBy('endedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FocusSession[];
    } catch (error) {
      console.error('Error getting focus sessions:', error);
      return [];
    }
  }
}

export const firestoreService = FirestoreService.getInstance();