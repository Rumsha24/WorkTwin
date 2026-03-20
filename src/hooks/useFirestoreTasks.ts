import { useState, useEffect, useCallback } from 'react';
import { Task } from '../utils/types';
import { firestoreService } from '../services/firestoreService';
import { offlineService } from '../services/offlineService';
import { useAuth } from './useAuth';
import { useSync } from '../context/SyncContext';
import uuid from 'react-native-uuid';
import { loadTasks, saveTasks, addTask as addLocalTask, updateTask as updateLocalTask, deleteTask as deleteLocalTask } from '../utils/storage';

export function useFirestoreTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isOnline, pendingChanges, triggerSync } = useSync();

  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  useEffect(() => {
    if (user && isOnline) {
      syncWithFirestore();
    }
  }, [user, isOnline]);

  const loadTasksFromStorage = async () => {
    try {
      const storedTasks = await loadTasks();
      setTasks(storedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncWithFirestore = async () => {
    if (!user) return;

    try {
      const firestoreTasks = await firestoreService.getTasks(user.uid);
      
      const localTasks = await loadTasks();
      const mergedTasks = mergeTasks(localTasks, firestoreTasks);
      
      await saveTasks(mergedTasks);
      setTasks(mergedTasks);
    } catch (error) {
      console.error('Error syncing with Firestore:', error);
    }
  };

  const mergeTasks = (local: Task[], remote: Task[]): Task[] => {
    const taskMap = new Map<string, Task>();
    
    // Add all remote tasks first
    remote.forEach(task => taskMap.set(task.id, task));
    
    // Merge local tasks, keeping the most recent version
    local.forEach(localTask => {
      const remoteTask = taskMap.get(localTask.id);
      if (!remoteTask) {
        // Task exists only locally
        taskMap.set(localTask.id, localTask);
      } else if (localTask.updatedAt && remoteTask.updatedAt) {
        // Keep the most recently updated version
        if (localTask.updatedAt > remoteTask.updatedAt) {
          taskMap.set(localTask.id, localTask);
        }
      } else if (localTask.createdAt && remoteTask.createdAt) {
        // Fallback to creation date if no update date
        if (localTask.createdAt > remoteTask.createdAt) {
          taskMap.set(localTask.id, localTask);
        }
      }
    });
    
    return Array.from(taskMap.values());
  };

  const addTask = useCallback(async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: uuid.v4() as string,
      title: '',
      done: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...taskData,
    };

    try {
      // Add to local storage first
      await addLocalTask(newTask);
      setTasks(prev => [...prev, newTask]);

      // Sync with Firestore if user is authenticated
      if (user) {
        if (isOnline) {
          // Online: directly add to Firestore
          await firestoreService.addTask(user.uid, newTask);
        } else {
          // Offline: queue for later sync
          await offlineService.queueChange(user.uid, {
            type: 'add',
            collection: 'tasks',
            data: newTask,
            timestamp: Date.now(),
          });
          triggerSync(); // Trigger sync when back online
        }
      }

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  }, [user, isOnline, triggerSync]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      // Update local storage first
      const updatedTask = await updateLocalTask(taskId, updates);
      
      if (!updatedTask) return false;

      // Update state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: Date.now() } : task
      ));

      // Sync with Firestore if user is authenticated
      if (user) {
        if (isOnline) {
          // Online: directly update Firestore
          await firestoreService.updateTask(user.uid, taskId, updates);
        } else {
          // Offline: queue for later sync
          await offlineService.queueChange(user.uid, {
            type: 'update',
            collection: 'tasks',
            documentId: taskId,
            data: updates,
            timestamp: Date.now(),
          });
          triggerSync(); // Trigger sync when back online
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      return false;
    }
  }, [user, isOnline, triggerSync]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      // Delete from local storage first
      await deleteLocalTask(taskId);
      
      // Update state
      setTasks(prev => prev.filter(task => task.id !== taskId));

      // Sync with Firestore if user is authenticated
      if (user) {
        if (isOnline) {
          // Online: directly delete from Firestore
          await firestoreService.deleteTask(user.uid, taskId);
        } else {
          // Offline: queue for later sync
          await offlineService.queueChange(user.uid, {
            type: 'delete',
            collection: 'tasks',
            documentId: taskId,
            timestamp: Date.now(),
          });
          triggerSync(); // Trigger sync when back online
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }, [user, isOnline, triggerSync]);

  const getTask = useCallback((taskId: string) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  const getTasksByCategory = useCallback((category: string) => {
    return tasks.filter(task => task.category === category);
  }, [tasks]);

  const getTasksByPriority = useCallback((priority: string) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);

  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => !task.done);
  }, [tasks]);

  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.done);
  }, [tasks]);

  const getOverdueTasks = useCallback(() => {
    const now = Date.now();
    return tasks.filter(task => 
      !task.done && task.dueDate && task.dueDate < now
    );
  }, [tasks]);

  const getTasksDueToday = useCallback(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
    
    return tasks.filter(task => 
      !task.done && task.dueDate && task.dueDate >= startOfDay && task.dueDate <= endOfDay
    );
  }, [tasks]);

  return {
    tasks,
    loading,
    isOnline,
    syncStatus: pendingChanges > 0 ? 'pending' : 'idle',
    addTask,
    updateTask,
    deleteTask,
    getTask,
    getTasksByCategory,
    getTasksByPriority,
    getPendingTasks,
    getCompletedTasks,
    getOverdueTasks,
    getTasksDueToday,
  };
}