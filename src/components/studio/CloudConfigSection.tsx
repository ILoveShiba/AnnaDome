import React from 'react';
import { Settings } from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SyncStatus } from '../../hooks/useCloudSync';

export interface CloudConfigSectionProps {
  syncStatus: SyncStatus;
  syncMessage: string;
  lastSyncedAt: string;
  onSyncNow: () => void;
  onPushNow: () => void;
}

/**
 * 專案共編房間設定區塊（已精簡化）：
 * - 移除各別專案內的 Firebase Realtime Database 網址輸入框
 * - 自動引用會員在「⚙️ 設定」中儲存的全域儲存設定檔
 * - 專案表單內僅保留「行程共編房間 ID (firebaseRoomId)」單一欄位
 */
export const CloudConfigSection: React.FC<CloudConfigSectionProps> = ({
  syncStatus,
  syncMessage,
  lastSyncedAt,
  onSyncNow,
  onPushNow,
}) => {
  const firebaseRoomId = useGuideStore((s) => s.firebaseRoomId);
  const updateField = useGuideStore((s) => s.updateField);

  const settings = useAuthStore((s) => s.settings);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const isFirebaseEnabled =
    settings.storageMode === 'firebase' && Boolean(settings.firebaseDbUrl.trim());

  return (
    <section className="bg-[#ebf8ff] border-2 border-[#3182ce] rounded-lg p-3 mb-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="text-[15px] font-bold text-[#2b6cb0] border-l-4 border-[#3182ce] pl-2">
          🌐 行程共編房間設定（自動引用會員全域儲存設定檔）
        </div>

        <button
          type="button"
          onClick={() => setSettingsModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
        >
          <span>
            {isFirebaseEnabled
              ? '☁️ 已連結全域 Firebase 設定'
              : settings.localFolderName
              ? `📂 本機資料夾備份 (${settings.localFolderName})`
              : '⚙️ 點此設定儲存位置 / Firebase'}
          </span>
        </button>
      </div>

      <div>
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          行程共編房間 ID (英文或數字代碼，供旅伴共用同一本行程)：
        </label>
        <input
          type="text"
          id="firebaseRoomId"
          placeholder="例：hokkaido-2026-family"
          value={firebaseRoomId}
          onChange={(e) => updateField('firebaseRoomId', e.target.value)}
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white"
        />
      </div>

      {isFirebaseEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-blue-200 text-xs">
          <span className="text-slate-600">
            雲端狀態：{syncMessage} {lastSyncedAt && `(${lastSyncedAt})`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSyncNow}
              disabled={syncStatus === 'syncing'}
              className="bg-white border border-blue-400 text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded font-semibold cursor-pointer"
            >
              🔄 比對同步
            </button>
            <button
              type="button"
              onClick={onPushNow}
              disabled={syncStatus === 'syncing'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
            >
              ☁️ 強制推播至雲端
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
