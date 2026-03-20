import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineService } from '../services/offlineService';
import { useAuth } from '../hooks/useAuth';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: 'idle' | 'pending' | 'syncing' | 'error';
  lastSyncTime: number | null;
  pendingChanges: number;
  triggerSync: () => Promise<void>;
  retryFailedSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'pending' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      const wasOffline = !isOnline;
      setIsOnline(online);
      if (online && wasOffline && pendingChanges > 0) {
        triggerSync();
      }
    });
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, [isOnline, pendingChanges]);

  useEffect(() => {
    if (user) {
      loadPendingCount();
    } else {
      setPendingChanges(0);
    }
  }, [user]);

  const loadPendingCount = async () => {
    if (!user) return;
    try {
      const changes = await offlineService.getPendingChanges(user.uid);
      setPendingChanges(changes.length);
      if (changes.length > 0 && isOnline) {
        setSyncStatus('pending');
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  const triggerSync = useCallback(async () => {
    if (!isOnline || !user || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    try {
      const success = await offlineService.syncPending(user.uid);
      if (success) {
        setSyncStatus('idle');
        setLastSyncTime(Date.now());
        setPendingChanges(0);
        setRetryCount(0);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setRetryCount(prev => prev + 1);
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          if (isOnline && user) {
            triggerSync();
          }
        }, delay);
      }
    }
  }, [isOnline, user, syncStatus, retryCount]);

  const retryFailedSync = useCallback(async () => {
    if (syncStatus === 'error') {
      setRetryCount(0);
      await triggerSync();
    }
  }, [syncStatus, triggerSync]);

  const value = {
    isOnline,
    syncStatus,
    lastSyncTime,
    pendingChanges,
    triggerSync,
    retryFailedSync,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}