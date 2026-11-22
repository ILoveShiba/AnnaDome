import { useEffect, useState, useCallback } from 'react';
import { useGuideStore } from '../store/useGuideStore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/**
 * 雲端雙向同步與版本時間戳記防護 (`updatedAt` vs `localBuildTime`)
 */
export const useCloudSync = (localBuildTime: string) => {
  const firebaseDbUrl = useGuideStore((s) => s.firebaseDbUrl);
  const firebaseRoomId = useGuideStore((s) => s.firebaseRoomId);
  const importFromJSON = useGuideStore((s) => s.importFromJSON);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [message, setMessage] = useState<string>('尚未設定雲端同步');

  const getEndpoint = useCallback(() => {
    if (!firebaseDbUrl.trim() || !firebaseRoomId.trim()) return null;
    let base = firebaseDbUrl.trim();
    if (!base.endsWith('/')) base += '/';
    return `${base}guides/${encodeURIComponent(firebaseRoomId.trim())}.json`;
  }, [firebaseDbUrl, firebaseRoomId]);

  const pushToCloud = useCallback(async () => {
    const endpoint = getEndpoint();
    if (!endpoint) return false;
    setStatus('syncing');
    try {
      const currentState = getSnapshot();
      const nowIso = new Date().toISOString();
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: currentState,
          updatedAt: nowIso,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString('zh-TW'));
      setMessage('已推播最新狀態至 Firebase 雲端');
      return true;
    } catch (err) {
      console.warn('離線模式運行中，無法寫入 Firebase:', err);
      setStatus('offline');
      setMessage('離線模式運行中，無法連線至 Firebase');
      return false;
    }
  }, [getEndpoint, getSnapshot]);

  const syncWithCloud = useCallback(async () => {
    const endpoint = getEndpoint();
    if (!endpoint) {
      setStatus('idle');
      setMessage('未啟用雲端同步（選填）');
      return;
    }

    setStatus('syncing');
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const cloudTimestamp = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
      const localTimestamp = new Date(localBuildTime).getTime();

      if (data?.state && cloudTimestamp > localTimestamp) {
        // 雲端資料較新：執行更新
        importFromJSON(data.state);
        setStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('zh-TW'));
        setMessage('已從雲端拉取較新版本手冊');
      } else {
        // 本地資料較新：推播覆蓋雲端，校正遠端舊紀錄
        await pushToCloud();
      }
    } catch (err) {
      console.warn('離線模式運行中，無法存取 Firebase:', err);
      setStatus('offline');
      setMessage('離線模式運行中，無法存取 Firebase');
    }
  }, [getEndpoint, importFromJSON, localBuildTime, pushToCloud]);

  useEffect(() => {
    syncWithCloud();
  }, [syncWithCloud]);

  return {
    status,
    lastSyncedAt,
    message,
    syncWithCloud,
    pushToCloud,
  };
};

