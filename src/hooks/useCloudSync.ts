import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useGuideStore,
  upsertCollaboratorEntry,
} from '../store/useGuideStore';
import {
  useAuthStore,
  ADMIN_DEFAULT_FIREBASE_DB_URL,
  ADMIN_USER_ID,
} from '../store/useAuthStore';
import { PRESET_COVERS } from '../services/imageUtils';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/**
 * 單一專案共編雙向同步引擎（走 /shared_rooms/<roomId>.json 專用共編池）
 * - 隱藏內建共編通道網址（一般會員與訪客在設定中看不到 admin 的 Firebase 網址）
 * - 雲端空間自動瘦身保護：非 admin 帳號推播至 /shared_rooms/ 時，若封面為大型 Base64 圖片則自動替換為輕量網址，使單一房間僅占 ~4KB
 * - 支援自動推播與定期/視窗聚焦自動拉取旅伴更新
 */
export const useCloudSync = (localBuildTime: string) => {
  const activeView = useGuideStore((s) => s.activeView);
  const currentProjectId = useGuideStore((s) => s.currentProjectId);
  const firebaseDbUrl = useGuideStore((s) => s.firebaseDbUrl);
  const firebaseRoomId = useGuideStore((s) => s.firebaseRoomId);
  const isCoEditing = useGuideStore((s) => s.isCoEditing);
  const projects = useGuideStore((s) => s.projects);
  const buildTime = useGuideStore((s) => s.buildTime);
  const importFromJSON = useGuideStore((s) => s.importFromJSON);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);
  const removeSharedProjectDeletedByOwner = useGuideStore(
    (s) => s.removeSharedProjectDeletedByOwner
  );

  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const currentProjectMeta = projects.find((p) => p.id === currentProjectId);
  const isCollaboratorOrGuest = Boolean(
    currentProjectMeta?.isSharedWithMe || currentUser?.role === 'guest'
  );
  const isCoEditActive = Boolean(
    isCoEditing || currentProjectMeta?.isCoEditing || isCollaboratorOrGuest
  );

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [lastEditor, setLastEditor] = useState<string>('');
  const [message, setMessage] = useState<string>('已連線至共編頻道');

  const lastPushedBuildTimeRef = useRef<string>(localBuildTime);
  const isApplyingCloudRef = useRef<boolean>(false);

  const getEndpoint = useCallback(() => {
    const roomId = (firebaseRoomId || currentProjectId || '').trim();
    if (!roomId) return null;
    // 若使用者有自訂自己的 Firebase 則優先使用；否則自動走內建隱藏的 /shared_rooms/ 共編通道
    let base = (firebaseDbUrl || ADMIN_DEFAULT_FIREBASE_DB_URL).trim();
    if (!base.endsWith('/')) base += '/';
    return `${base}shared_rooms/${encodeURIComponent(roomId)}.json`;
  }, [firebaseDbUrl, firebaseRoomId, currentProjectId]);

  const pushToCloud = useCallback(async () => {
    const endpoint = getEndpoint();
    if (!endpoint) return false;
    setStatus('syncing');
    try {
      const currentState = getSnapshot();
      const isAdmin = currentUser?.userId === ADMIN_USER_ID;

      // 空間瘦身保護：非 admin 帳號在公共 /shared_rooms/ 共編時，不將肥大的 Base64 圖片寫入雲端
      const safeCoverUrl =
        !isAdmin && currentState.coverUrl && currentState.coverUrl.startsWith('data:image/')
          ? PRESET_COVERS[0]
          : currentState.coverUrl;

      const resolvedOwnerId = currentState.ownerId || currentUser?.userId || 'u_admin';
      const resolvedOwnerName = currentState.ownerName || currentUser?.username || '主揪';

      // 若推播者是受邀共編者（會員或訪客），自動在 collaborators 陣列中更新自己的最後共編時間
      const updatedCollaborators = isCollaboratorOrGuest
        ? upsertCollaboratorEntry(
            currentState.collaborators,
            {
              userId: currentUser?.userId || 'guest',
              name: currentUser?.username || '旅伴',
              role: currentUser?.role === 'guest' ? 'guest' : 'member',
            },
            resolvedOwnerId,
            resolvedOwnerName
          )
        : currentState.collaborators || [];

      const sanitizedState = {
        ...currentState,
        firebaseDbUrl: '', // 絕不在共編封包中暴露任何人的 Firebase 網址
        coverUrl: safeCoverUrl,
        isCoEditing: true,
        ownerId: resolvedOwnerId,
        ownerName: resolvedOwnerName,
        collaborators: updatedCollaborators,
      };

      const nowIso = new Date().toISOString();
      const editorName = currentUser?.username || '旅伴';
      lastPushedBuildTimeRef.current = nowIso;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: sanitizedState,
          updatedAt: nowIso,
          updatedBy: editorName,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('synced');
      const timeStr = new Date().toLocaleTimeString('zh-TW');
      setLastSyncedAt(timeStr);
      setLastEditor(editorName);
      setMessage(`已同步共編進度（由 ${editorName} 更新）`);
      return true;
    } catch (err) {
      console.warn('離線模式運行中，無法寫入共編房間:', err);
      setStatus('offline');
      setMessage('離線編輯中（待網路恢復後可同步）');
      return false;
    }
  }, [getEndpoint, getSnapshot, currentUser]);

  const syncWithCloud = useCallback(
    async (silent = false) => {
      const endpoint = getEndpoint();
      if (!endpoint) {
        setStatus('idle');
        setMessage('尚未指定共編房間 ID');
        return;
      }

      if (!silent) setStatus('syncing');
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // 若受邀共編者（或訪客）發現雲端房間已被專案主人刪除（deletedByOwner === true 或被永久刪除為 null）
        if (isCollaboratorOrGuest && (!data || data.deletedByOwner === true || !data.state)) {
          isApplyingCloudRef.current = true;
          const roomOrPid = currentProjectId || firebaseRoomId;
          if (currentUser?.role === 'guest') {
            alert('⚠️ 專案主人已刪除此共編專案，即將結束訪客共編模式。');
            logout();
          } else {
            alert('⚠️ 專案主人已刪除此共編專案，系統已自動從您的大廳移除此專案。');
            removeSharedProjectDeletedByOwner(roomOrPid || '');
          }
          return;
        }

        // 若受邀共編者（或訪客）被專案主人從「共編人清單」中移除
        if (
          isCollaboratorOrGuest &&
          Array.isArray(data?.state?.kickedCollaboratorIds) &&
          (data.state.kickedCollaboratorIds.includes(currentUser?.userId) ||
            data.state.kickedCollaboratorIds.includes(currentUser?.username))
        ) {
          isApplyingCloudRef.current = true;
          const roomOrPid = currentProjectId || firebaseRoomId;
          if (currentUser?.role === 'guest') {
            alert('⚠️ 您已被專案主人移出此共編房間。');
            logout();
          } else {
            alert('⚠️ 您已被專案主人移出此共編房間，系統已從您的大廳移除此專案。');
            removeSharedProjectDeletedByOwner(roomOrPid || '');
          }
          return;
        }

        const cloudTimestamp = data?.updatedAt ? new Date(data.updatedAt).getTime() : 0;
        const localTimestamp = new Date(
          lastPushedBuildTimeRef.current || buildTime || localBuildTime
        ).getTime();

        if (data?.state && cloudTimestamp > localTimestamp + 500) {
          isApplyingCloudRef.current = true;
          lastPushedBuildTimeRef.current = data.updatedAt;
          importFromJSON(data.state);
          setTimeout(() => {
            isApplyingCloudRef.current = false;
          }, 400);

          setStatus('synced');
          const timeStr = new Date(data.updatedAt).toLocaleTimeString('zh-TW');
          setLastSyncedAt(timeStr);
          const editor = data.updatedBy || '旅伴';
          setLastEditor(editor);
          setMessage(`已同步旅伴「${editor}」的最新編輯內容`);
        } else if (!data?.state && !isCollaboratorOrGuest && !silent) {
          // 僅限專案主人：雲端房間尚無資料時，主動將此專案初始化推上共編房間
          await pushToCloud();
        } else if (!silent) {
          setStatus('synced');
          if (data?.updatedBy) setLastEditor(data.updatedBy);
          setMessage(
            data?.updatedBy
              ? `目前已是最新版本（最後由「${data.updatedBy}」更新）`
              : '目前已是最新共編版本'
          );
        }
      } catch (err) {
        if (!silent) {
          console.warn('離線模式運行中，無法存取共編房間:', err);
          setStatus('offline');
          setMessage('離線模式運行中');
        }
      }
    },
    [getEndpoint, importFromJSON, buildTime, localBuildTime, pushToCloud]
  );

  // 初次進入產生器或切換房間時，僅在「已開啟共同編輯」的專案拉取最新共編狀態
  useEffect(() => {
    if (activeView === 'generator' && currentProjectId && isCoEditActive) {
      syncWithCloud(false);
    }
  }, [activeView, currentProjectId, firebaseRoomId, isCoEditActive]);

  // 當本地編輯內容變更且已開啟共同編輯時，防抖 1.5 秒自動推播至 /shared_rooms/ 共編房間
  useEffect(() => {
    if (activeView !== 'generator' || !currentProjectId || !buildTime || !isCoEditActive) return;
    if (isApplyingCloudRef.current) return;
    if (buildTime === lastPushedBuildTimeRef.current) return;

    const timer = window.setTimeout(() => {
      pushToCloud();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [buildTime, activeView, currentProjectId, isCoEditActive, pushToCloud]);

  // 視窗重新獲得焦點或每 15 秒背景輪詢檢查旅伴是否有新修改（僅限已開啟共編的專案）
  useEffect(() => {
    if (activeView !== 'generator' || !currentProjectId || !isCoEditActive) return;
    const onFocus = () => syncWithCloud(true);
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => {
      if (!isApplyingCloudRef.current) {
        syncWithCloud(true);
      }
    }, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [activeView, currentProjectId, isCoEditActive, syncWithCloud]);

  return {
    status,
    lastSyncedAt,
    lastEditor,
    message,
    syncWithCloud: () => syncWithCloud(false),
    pushToCloud,
  };
};

