import { useEffect, useState } from 'react';
import { useGuideStore } from '../store/useGuideStore';

/**
 * 本機 LocalStorage 自動寫入與狀態指示 Hook (Debounce 300ms)
 */
export const useAutoSave = () => {
  const buildTime = useGuideStore((s) => s.buildTime);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setIsSaving(true);
    const timer = window.setTimeout(() => {
      try {
        const snapshot = getSnapshot();
        localStorage.setItem('travel_guide_autosave_backup', JSON.stringify(snapshot));
        const now = new Date();
        setLastSavedAt(
          now.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } catch (err) {
        console.warn('AutoSave failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [buildTime, getSnapshot]);

  return { lastSavedAt, isSaving };
};

