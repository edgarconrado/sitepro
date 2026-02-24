/**
 * SitePro — Hook de estado de red
 * Usa AppState + fetch para detectar conectividad sin dependencias extra
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSyncStore } from '@components/ui/SyncManager';

async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch('https://www.gstatic.com/generate_204', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return res.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const { markOffline, markOnline, status } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasOffline = useRef(false);

  const check = async () => {
    const online = await checkConnectivity();
    if (!online) {
      wasOffline.current = true;
      markOffline();
    } else if (wasOffline.current) {
      wasOffline.current = false;
      markOnline();
    }
  };

  useEffect(() => {
    // Check on mount
    check();

    // Poll every 5 seconds
    intervalRef.current = setInterval(check, 5000);

    // Also check on app foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return status === 'offline';
}
