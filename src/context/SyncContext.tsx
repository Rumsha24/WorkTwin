import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { offlineService } from '../services/offlineService';
import { useAuth } from '../hooks/useAuth';
import { testFirebaseConnection } from '../utils/testFirebase';
import { auth } from '../services/firebaseConfig';

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

  // Function to check actual connection status
  const checkConnection = useCallback(async () => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isNetworkConnected = netInfo.isConnected ?? true;
      
      if (!isNetworkConnected) {
        console.log('📶 Network offline');
        return false;
      }
      
      // Check Firebase connectivity by trying to get a reference
      // This is a lightweight check
      try {
        // Check if auth is initialized (doesn't require network call)
        const isAuthInitialized = !!auth;
        
        if (isAuthInitialized) {
          console.log('✅ Firebase auth initialized');
          return true;
        }
        return false;
      } catch (fbError) {
        console.log('Firebase check failed:', fbError);
        return false;
      }
    } catch (error) {
      console.error('Connection check error:', error);
      return true; // Default to online on error
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const updateConnection = async () => {
      const online = await checkConnection();
      if (mounted && online !== isOnline) {
        setIsOnline(online);
        console.log('📶 Connection status changed:', online ? 'Online ✅' : 'Offline ❌');
        
        if (online && !isOnline && pendingChanges > 0) {
          triggerSync();
        }
      }
    };

    // Initial check
    updateConnection();

    // Check every 10 seconds
    interval = setInterval(updateConnection, 10000);

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(() => {
      updateConnection();
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOnline, pendingChanges, checkConnection]);

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
    if (!user || syncStatus === 'syncing') {
      console.log('Sync skipped:', { hasUser: !!user, syncStatus });
      return;
    }

    setSyncStatus('syncing');
    console.log('🔄 Starting sync...');

    try {
      const success = await offlineService.syncPending(user.uid);
      if (success) {
        setSyncStatus('idle');
        setLastSyncTime(Date.now());
        setPendingChanges(0);
        setRetryCount(0);
        console.log('✅ Sync completed successfully');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setSyncStatus('error');
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          if (user) {
            triggerSync();
          }
        }, delay);
      }
    }
  }, [user, syncStatus, retryCount]);

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
