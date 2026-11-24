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
  const ownerId = useGuideStore((s) => s.ownerId);
  const ownerName = useGuideStore((s) => s.ownerName);
  const isCoEditing = useGuideStore((s) => s.isCoEditing);
  const projects = useGuideStore((s) => s.projects);
  const updateField = useGuideStore((s) => s.updateField);

  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useAuthStore((s) => s.settings);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const [copiedToast, setCopiedToast] = useState(false);

  const isGuest = currentUser?.role === 'guest';
  const currentProjectMeta = projects.find((p) => p.id === currentProjectId);
  const isSharedWithMe = Boolean(currentProjectMeta?.isSharedWithMe);

  // 只有此專案的建立者（主人）才有權限修改共編房間 ID；受邀登入的共編會員或訪客一律唯讀
  const isProjectOwner =
    !isGuest &&
    !isSharedWithMe &&
    (!ownerId || ownerId === currentUser?.userId);

  // 尚未開啟共同編輯且非受邀共編專案時，預設隱藏共編設定區塊
  if (!isCoEditing && !isSharedWithMe && !isGuest) {
    return null;
  }

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
        <div className="flex items-center gap-2">
          <div className="text-[15px] font-bold text-[#2b6cb0] border-l-4 border-[#3182ce] pl-2">
            共編設定
          </div>
          {!isProjectOwner && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              👤 專案擁有者：{ownerName || currentProjectMeta?.ownerName || '主揪'}（共編房間 ID 唯讀）
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs transition-colors"
          >
            <span>
              {copiedToast ? '✅ 已複製共編連結！' : '🔗 複製共編連結'}
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
          共編房間 ID（英文或數字代碼）：
        </label>
        <input
          type="text"
          id="firebaseRoomId"
          readOnly={!isProjectOwner}
          title={
            isProjectOwner
              ? '您是此專案的主人，可自訂共編房間 ID'
              : '只有此共編房間的主人才有權限更改共編 ID（目前為唯讀）'
          }
          placeholder="例：coast-2026"
          value={firebaseRoomId}
          onChange={(e) => {
            if (!isProjectOwner) return;
            updateField('firebaseRoomId', e.target.value);
          }}
          className={`w-full px-2.5 py-2 border rounded-md text-sm ${
            !isProjectOwner
              ? 'bg-slate-100 border-slate-200 text-slate-600 font-medium cursor-not-allowed select-none'
              : 'bg-white border-slate-300'
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
