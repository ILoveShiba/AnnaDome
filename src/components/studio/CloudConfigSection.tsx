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
 * - 專案主人專屬：提供預設收合的「👥 共編人清單 (N)」按鈕，點擊才展開檢視或移除共編者，平時完全不占版面
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
  const collaborators = useGuideStore((s) => s.collaborators) || [];
  const projects = useGuideStore((s) => s.projects);
  const updateField = useGuideStore((s) => s.updateField);
  const removeCollaboratorByOwner = useGuideStore((s) => s.removeCollaboratorByOwner);

  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useAuthStore((s) => s.settings);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const [copiedToast, setCopiedToast] = useState(false);
  const [showCollabList, setShowCollabList] = useState(false);

  const isGuest = currentUser?.role === 'guest';
  const currentProjectMeta = projects.find((p) => p.id === currentProjectId);
  const isSharedWithMe = Boolean(currentProjectMeta?.isSharedWithMe);

  // 只有此專案的建立者（主人）才有權限修改共編房間 ID 與檢視／管理共編人清單
  const isProjectOwner =
    !isGuest &&
    !isSharedWithMe &&
    (!ownerId || ownerId === currentUser?.userId);

  // 尚未開啟共同編輯且非受邀共編專案時，預設隱藏共編設定區塊
  if (!isCoEditing && !isSharedWithMe && !isGuest) {
    return null;
  }

  const effectiveRoomId = (firebaseRoomId || currentProjectId || 'trip_room').trim();
  const activeCollaborators =
    collaborators.length > 0
      ? collaborators
      : currentProjectMeta?.collaborators || [];

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
    <section className="bg-[#ebf8ff] border-2 border-[#3182ce] rounded-lg px-2.5 py-2 mb-2 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="text-[14.5px] leading-tight font-bold text-[#2b6cb0] border-l-4 border-[#3182ce] pl-2">
            共編設定
          </div>
          {!isProjectOwner && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              👤 擁有者：{ownerName || currentProjectMeta?.ownerName || '主揪'}（ID 唯讀）
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* 專案主人專屬：平時收合的「👥 共編人清單 (N)」按鈕 */}
          {isProjectOwner && (
            <button
              type="button"
              onClick={() => setShowCollabList((prev) => !prev)}
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
                showCollabList
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
              }`}
            >
              <span>👥 共編人清單 ({activeCollaborators.length})</span>
              <span className="text-[10px]">{showCollabList ? '▲' : '▼'}</span>
            </button>
          )}

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

      {/* 點擊「👥 共編人清單」後才展開的名單面板（平時隱藏不占版面） */}
      {isProjectOwner && showCollabList && (
        <div className="mb-2.5 bg-white border border-indigo-200 rounded-lg p-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-950 mb-1.5 pb-1 border-b border-slate-100">
            <span>👥 已加入此專案的共編旅伴（共 {activeCollaborators.length} 人）</span>
            <button
              type="button"
              onClick={() => setShowCollabList(false)}
              className="text-slate-400 hover:text-slate-600 text-[11px] cursor-pointer"
            >
              收起 ▲
            </button>
          </div>

          {activeCollaborators.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
              {activeCollaborators.map((collab) => {
                const timeStr = collab.lastActiveAt
                  ? new Date(collab.lastActiveAt).toLocaleString('zh-TW', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                return (
                  <div
                    key={`${collab.role}_${collab.userId}_${collab.name}`}
                    className="py-1.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          collab.role === 'guest'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {collab.role === 'guest' ? '👋 訪客' : '👤 會員'}
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {collab.name}
                      </span>
                      {timeStr && (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          · 最後活躍 {timeStr}
                        </span>
                      )}
                    </div>

                    {currentProjectId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `確定要將「${collab.name}」從此專案的共編人清單移除嗎？`
                            )
                          ) {
                            removeCollaboratorByOwner(
                              currentProjectId,
                              collab.userId || collab.name
                            );
                          }
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                      >
                        ✕ 移除
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2 text-center">
              目前尚無旅伴加入（點擊「🔗 複製共編連結」分享給旅伴登入後，名單將自動顯示於此）
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
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
          placeholder="例：tripK8M3"
          value={firebaseRoomId}
          onChange={(e) => {
            if (!isProjectOwner) return;
            updateField('firebaseRoomId', e.target.value);
          }}
          className={`w-full px-2 py-1 border rounded-md text-[13.5px] leading-snug ${
            !isProjectOwner
              ? 'bg-slate-100 border-slate-200 text-slate-600 font-medium cursor-not-allowed select-none'
              : 'bg-white border-slate-300'
          }`}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-blue-200 text-xs">
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
            🔄 同步最新
          </button>
          <button
            type="button"
            onClick={() => onPushNow()}
            disabled={syncStatus === 'syncing'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold cursor-pointer"
          >
            ☁️ 立即推播
          </button>
        </div>
      </div>
    </section>
  );
};
