import { useState, useEffect, useCallback } from 'react';
import { Task } from '../utils/types';
import { firestoreService } from '../services/firestoreService';
import { offlineService } from '../services/offlineService';
import { useAuth } from './useAuth';
import { useSync } from '../context/SyncContext';
import uuid from 'react-native-uuid';
import { loadTasks, saveTasks, addTask as addLocalTask, updateTask as updateLocalTask, deleteTask as deleteLocalTask } from '../utils/storage';
import { Alert } from 'react-native';

export function useFirestoreTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isOnline } = useSync();

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
    remote.forEach(task => taskMap.set(task.id, task));
    local.forEach(localTask => {
      const remoteTask = taskMap.get(localTask.id);
      if (!remoteTask) {
        taskMap.set(localTask.id, localTask);
      } else if (localTask.updatedAt && remoteTask.updatedAt) {
        if (localTask.updatedAt > remoteTask.updatedAt) {
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
      await addLocalTask(newTask);
      setTasks(prev => [...prev, newTask]);

      Alert.alert('✅ Task Added', `"${newTask.title}" has been added successfully!`);

      if (user && isOnline) {
        await firestoreService.addTask(user.uid, newTask);
      } else if (user && !isOnline) {
        await offlineService.queueChange(user.uid, {
          type: 'add',
          collection: 'tasks',
          data: newTask,
          timestamp: Date.now(),
        });
      }

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('❌ Error', 'Failed to add task. Please try again.');
      return null;
    }
  }, [user, isOnline]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await updateLocalTask(taskId, updates);
      if (!updatedTask) return false;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates, updatedAt: Date.now() } : task
      ));

      Alert.alert('✅ Task Updated', `Task has been updated successfully!`);

      if (user && isOnline) {
        await firestoreService.updateTask(user.uid, taskId, updates);
      } else if (user && !isOnline) {
        await offlineService.queueChange(user.uid, {
          type: 'update',
          collection: 'tasks',
          documentId: taskId,
          data: updates,
          timestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('❌ Error', 'Failed to update task.');
      return false;
    }
  }, [user, isOnline]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const taskToDelete = tasks.find(t => t.id === taskId);
      await deleteLocalTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));

      Alert.alert('🗑️ Task Deleted', `"${taskToDelete?.title}" has been deleted.`);

      if (user && isOnline) {
        await firestoreService.deleteTask(user.uid, taskId);
      } else if (user && !isOnline) {
        await offlineService.queueChange(user.uid, {
          type: 'delete',
          collection: 'tasks',
          documentId: taskId,
          timestamp: Date.now(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('❌ Error', 'Failed to delete task.');
      return false;
    }
  }, [user, isOnline, tasks]);

  return {
    tasks,
    loading,
    isOnline,
    addTask,
    updateTask,
    deleteTask,
  };
}