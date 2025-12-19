/**
 * ============================================
 * OFFLINE PROVIDER
 * ============================================
 * Provider para manejar estado offline y sincronización
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncService, SyncResult } from '../../services/SyncService';
import { notificationService } from '../../services/NotificationService';

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSync: Date | null;
  syncNow: () => Promise<void>;
  syncResult: SyncResult | null;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Actualizar estado de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notificationService.notifyOnline();
    };

    const handleOffline = () => {
      setIsOnline(false);
      notificationService.notifyOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Suscribirse a eventos de sincronización
  useEffect(() => {
    const handleSyncResult = (result: SyncResult) => {
      setSyncResult(result);
      setLastSync(new Date());
      setIsSyncing(false);

      // Notificar resultado
      if (result.status === 'success' && (result.uploaded > 0 || result.downloaded > 0)) {
        notificationService.notifySyncSuccess(result.uploaded, result.downloaded);
      } else if (result.status === 'error' && result.errors.length > 0) {
        notificationService.notifySyncError(result.errors[0]);
      }
    };

    const unsubscribe = syncService.subscribe(handleSyncResult);
    return unsubscribe;
  }, []);

  // Actualizar contador de operaciones pendientes
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await syncService.getPendingOperationsCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Función para sincronizar manualmente
  const syncNow = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      await syncService.forceSync();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const value: OfflineContextValue = {
    isOnline,
    isSyncing,
    pendingCount,
    lastSync,
    syncNow,
    syncResult,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOffline = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
};
