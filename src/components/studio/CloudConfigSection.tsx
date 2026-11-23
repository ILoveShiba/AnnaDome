import React, { useState } from 'react';
import { useGuideStore } from '../../store/useGuideStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SyncStatus } from '../../hooks/useCloudSync';

export interface CloudConfigSectionProps {
  syncStatus: SyncStatus;
  syncMessage: string;
  lastSyncedAt: string;
  onSyncNow: () => void;
  onPushNow: () => Promise<boolean> | void;
}

/**
 * 單一專案共編設定與專屬連結分享區塊：
 * - 僅針對當前開啟的特定旅遊專案設定共編
 * - 只保留單一「🔗 複製此專案共編連結」按鈕（不顯示複製房間代碼，且隱藏底層 Firebase 網址）
 * - 點擊複製連結時自動將此專案推播至 /shared_rooms/<roomId>.json
 */
export const CloudConfigSection: React.FC<CloudConfigSectionProps> = ({
  syncStatus,
  syncMessage,
  lastSyncedAt,
  onSyncNow,
  onPushNow,
}) => {
  const firebaseRoomId = useGuideStore((s) => s.firebaseRoomId);
  const currentProjectId = useGuideStore((s) => s.currentProjectId);
  const updateField = useGuideStore((s) => s.updateField);

  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useAuthStore((s) => s.settings);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const [copiedToast, setCopiedToast] = useState(false);

  const isGuest = currentUser?.role === 'guest';
  const effectiveRoomId = (firebaseRoomId || currentProjectId || 'trip_room').trim();

  const handleCopyShareLink = async () => {
    try {
      await onPushNow();
    } catch {}

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?room=${encodeURIComponent(effectiveRoomId)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <section className="bg-[#ebf8ff] border-2 border-[#3182ce] rounded-lg p-3 mb-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="text-[15px] font-bold text-[#2b6cb0] border-l-4 border-[#3182ce] pl-2">
          🤝 單一專案旅伴共編設定
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
          >
            <span>
              {copiedToast
                ? '✅ 已複製此專案共編連結！可貼給旅伴'
                : '🔗 複製此專案共編連結'}
            </span>
          </button>

          {!isGuest && settings.localFolderName && (
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
            >
              <span>📂 本機備份 ({settings.localFolderName})</span>
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          此專案專屬共編房間 ID（可自訂英文或數字代碼，僅限擁有此專案共編連結的旅伴共同編輯）：
        </label>
        <input
          type="text"
          id="firebaseRoomId"
          readOnly={isGuest}
          placeholder="例：coast-2026"
          value={firebaseRoomId}
          onChange={(e) => updateField('firebaseRoomId', e.target.value)}
          className={`w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm ${
            isGuest ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white'
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-blue-200 text-xs">
        <span className="text-slate-600 font-medium">
          🟢 共編狀態：{syncMessage} {lastSyncedAt && `(${lastSyncedAt})`}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSyncNow}
            disabled={syncStatus === 'syncing'}
            className="bg-white border border-blue-400 text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded font-semibold cursor-pointer"
          >
            🔄 拉取最新共編內容
          </button>
          <button
            type="button"
            onClick={() => onPushNow()}
            disabled={syncStatus === 'syncing'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
          >
            ☁️ 立即推播更新
          </button>
        </div>
      </div>
    </section>
  );
};
