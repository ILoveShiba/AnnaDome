import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useGuideStore } from '../../store/useGuideStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ProjectMeta } from '../../types/guide';
import {
  compressImageFileToDataUrl,
  PRESET_COVERS,
} from '../../services/imageUtils';

type HubSortField = 'startDate' | 'title';
type HubSortOrder = 'asc' | 'desc';

export const ProjectHubView: React.FC = () => {
  const projects = useGuideStore((s) => s.projects);
  const trashedProjects = useGuideStore((s) => s.trashedProjects);
  const openProjectInGenerator = useGuideStore((s) => s.openProjectInGenerator);
  const openProjectInPreviewModal = useGuideStore((s) => s.openProjectInPreviewModal);
  const createNewBlankTripAndEnter = useGuideStore((s) => s.createNewBlankTripAndEnter);
  const deleteProjectFromHub = useGuideStore((s) => s.deleteProjectFromHub);
  const deleteAllProjectsToTrash = useGuideStore((s) => s.deleteAllProjectsToTrash);
  const restoreProjectFromTrash = useGuideStore((s) => s.restoreProjectFromTrash);
  const permanentlyDeleteFromTrash = useGuideStore((s) => s.permanentlyDeleteFromTrash);
  const emptyTrash = useGuideStore((s) => s.emptyTrash);
  const importProjectToHubFromJSON = useGuideStore((s) => s.importProjectToHubFromJSON);
  const updateProjectCover = useGuideStore((s) => s.updateProjectCover);
  const activeView = useGuideStore((s) => s.activeView);
  const autoPullHubFromCloudIfConfigured = useGuideStore(
    (s) => s.autoPullHubFromCloudIfConfigured
  );
  const pruneDeletedSharedProjectsForCollaborator = useGuideStore(
    (s) => s.pruneDeletedSharedProjectsForCollaborator
  );

  const currentUser = useAuthStore((s) => s.currentUser);
  const settings = useAuthStore((s) => s.settings);
  const logout = useAuthStore((s) => s.logout);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);

  const [sortField, setSortField] = useState<HubSortField>('startDate');
  const [sortOrder, setSortOrder] = useState<HubSortOrder>('asc');
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // 更換封面圖片彈窗狀態
  const [coverModalProject, setCoverModalProject] = useState<ProjectMeta | null>(null);
  const [coverDraftUrl, setCoverDraftUrl] = useState<string>('');
  const [isCompressingCover, setIsCompressingCover] = useState<boolean>(false);
  const coverUploadInputRef = useRef<HTMLInputElement>(null);

  // 登入或進入大廳時，若該帳號已設定 Firebase 雲端網址，自動拉取最新專案與封面圖片，並自動巡檢受邀共編專案是否已被主人刪除
  useEffect(() => {
    if (currentUser && activeView === 'hub') {
      autoPullHubFromCloudIfConfigured();
      pruneDeletedSharedProjectsForCollaborator();
    }
  }, [currentUser?.userId, activeView]);

  // 在大廳視窗重新獲得焦點或每 15 秒定期巡檢「受邀參與的他人共編專案」是否已被原主人刪除
  useEffect(() => {
    if (!currentUser || activeView !== 'hub') return;
    const onFocus = () => {
      pruneDeletedSharedProjectsForCollaborator();
    };
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(() => {
      pruneDeletedSharedProjectsForCollaborator();
    }, 15000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [currentUser?.userId, activeView]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const sortProjectList = (list: ProjectMeta[]): ProjectMeta[] => {
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '', 'zh-Hant-TW', {
          numeric: true,
        });
      } else {
        const da = a.startDate || '';
        const db = b.startDate || '';
        cmp = da.localeCompare(db);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  };

  const activeProjects = useMemo(
    () =>
      sortProjectList(
        projects.filter((p) => !p.isSharedWithMe && (!p.endDate || p.endDate >= today))
      ),
    [projects, today, sortField, sortOrder]
  );

  const sharedWithMeProjects = useMemo(
    () => sortProjectList(projects.filter((p) => Boolean(p.isSharedWithMe))),
    [projects, sortField, sortOrder]
  );

  const completedProjects = useMemo(
    () =>
      sortProjectList(
        projects.filter((p) => !p.isSharedWithMe && Boolean(p.endDate && p.endDate < today))
      ),
    [projects, today, sortField, sortOrder]
  );

  const handleHubImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result));
        const fallbackName = file.name.replace(/\.json$/i, '');
        const importedTitle = importProjectToHubFromJSON(parsed, fallbackName);
        alert(`🎉 已成功將「${importedTitle}」匯入您的個人專案大廳！`);
      } catch {
        alert('JSON 檔案格式錯誤，請確認是否為本產生器匯出的備份檔！');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const renderCard = (project: ProjectMeta, isCompleted: boolean) => {
    const coverUrl =
      project.cover ||
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';

    const isSharedProject = Boolean(project.isSharedWithMe);
    const isOwnerCoEditing = !isSharedProject && Boolean(project.isCoEditing);

    const isTravelingNow =
      !isCompleted &&
      Boolean(project.startDate) &&
      Boolean(project.endDate) &&
      project.startDate <= today &&
      today <= project.endDate;

    return (
      <div
        key={project.id}
        className={`bg-white border rounded-[14px] overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col ${
          isDeleteMode
            ? 'border-rose-300 ring-2 ring-rose-200/80'
            : isSharedProject
              ? 'border-indigo-300 ring-1 ring-indigo-100'
              : isOwnerCoEditing
                ? 'border-emerald-300 ring-1 ring-emerald-100'
                : 'border-slate-200'
        }`}
      >
        <div
          className="h-[135px] bg-cover bg-center relative bg-slate-300 group"
          style={{ backgroundImage: `url('${coverUrl}')` }}
        >
          {/* 左上角：自行更換封面圖片按鈕（每一項專案皆可直接點擊換圖） */}
          <button
            type="button"
            onClick={() => {
              setCoverModalProject(project);
              setCoverDraftUrl(project.cover || '');
            }}
            title="更換此專案的封面圖片（支援上傳本機照片、貼上網址或選擇主題圖庫）"
            className="absolute top-2.5 left-2.5 text-xs px-2.5 py-1 rounded-md font-semibold bg-slate-900/75 hover:bg-blue-600 text-white backdrop-blur-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
          >
            <span>🖼️ 更換封面</span>
          </button>

          <span
            className={`absolute top-2.5 right-2.5 text-xs px-2.5 py-1 rounded-md font-semibold text-white shadow-xs ${
              isCompleted
                ? 'bg-slate-500/85'
                : isTravelingNow
                  ? 'bg-emerald-600/95 ring-2 ring-emerald-300/70'
                  : 'bg-slate-900/75'
            }`}
          >
            {isCompleted ? '已完結' : isTravelingNow ? '✈️ 旅行中' : '籌備中'}
          </span>

          {/* 受邀共編者視角：於封面底部顯示紫色／藍色「👤 擁有者」提醒標籤 */}
          {isSharedProject && (
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-600/95 text-white shadow-xs backdrop-blur-xs inline-flex items-center gap-1">
                <span>👤 擁有者：{project.ownerName || '旅伴'}</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-700/90 text-purple-100 shadow-xs">
                🤝 受邀共編
              </span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          {/* 共編房間主人端的大廳卡片：呈現一個【共編中】的提醒小視窗 */}
          {isOwnerCoEditing && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-emerald-800 inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>【共編中】旅伴共同編輯已開啟</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                ID: {project.roomId || project.id}
              </span>
            </div>
          )}

          {/* 受邀共編者端的大廳卡片：呈現擁有者與共編房間資訊 */}
          {isSharedProject && (
            <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-2 text-xs">
              <span className="font-bold text-indigo-900">
                👤 擁有者：{project.ownerName || '旅伴'}
              </span>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded">
                ID: {project.roomId || project.id}
              </span>
            </div>
          )}

          <div className="text-[1.1rem] font-bold text-slate-900 mb-1.5 line-clamp-1">
            {project.title}
          </div>
          <div className="text-[0.85rem] text-slate-500 mb-4">
            📅 {project.startDate || '未定'} ~ {project.endDate || '未定'}
          </div>

          <div className="mt-auto flex items-center gap-2">
            {/* 籌備中專案或受邀共編專案皆可點擊編輯行程 */}
            {(!isCompleted || isSharedProject) && (
              <button
                type="button"
                onClick={() => openProjectInGenerator(project.id, false)}
                className="flex-1 text-center py-2 px-2.5 text-[0.85rem] rounded-md font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                ✏️ 編輯行程
              </button>
            )}
            <button
              type="button"
              onClick={() => openProjectInPreviewModal(project.id)}
              className="flex-1 text-center py-2 px-2.5 text-[0.85rem] rounded-md font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              📖 翻閱手冊
            </button>
            {isDeleteMode && (
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    title: '🗑️ 移至刪除暫存區提醒',
                    message: `確定要刪除「${project.title}」嗎？\n\n系統會先將此專案與本機 JSON 檔案移至「刪除暫存區」保留 10 天，10 天後才會自動永久刪除，期間內您隨時可以一鍵還原！`,
                    confirmLabel: '確定移至暫存區 (保留10天)',
                    onConfirm: () => {
                      deleteProjectFromHub(project.id);
                      if (projects.length <= 1) {
                        setIsDeleteMode(false);
                      }
                    },
                  });
                }}
                title="移至刪除暫存區（保留 10 天後自動刪除）"
                className="w-[38px] py-2 text-center text-[0.85rem] rounded-md font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="hub-view" className="min-h-screen bg-slate-50 px-4 pt-6 pb-20 no-print">
      <div className="max-w-[1080px] mx-auto">
        {/* 會員／管理者資訊與全域儲存狀態頂部列 */}
        <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold bg-blue-600/30 border border-blue-400/40 text-blue-200 px-2.5 py-1 rounded-full">
              <span>
                {currentUser?.username === 'admin'
                  ? `🛡️ 管理者：${currentUser?.username}`
                  : `👤 會員：${currentUser?.username}`}
              </span>
            </span>

            <span className="inline-flex items-center gap-1 text-slate-300">
              {settings.storageMode === 'firebase' ? (
                <span>
                  ☁️ 儲存模式：Firebase 雲端{' '}
                  {settings.firebaseDbUrl ? '(已設定網址)' : '(尚未填寫網址)'}
                </span>
              ) : (
                <span>
                  💾 儲存模式：本機儲存{' '}
                  {settings.localFolderName
                    ? `(已綁定資料夾：${settings.localFolderName})`
                    : '(瀏覽器 LocalStorage)'}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>⚙️ 設定 (儲存位置 / Firebase)</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>🚪 登出</span>
            </button>
          </div>
        </div>

        {/* 頂部標題列 */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-[1.6rem] font-bold text-slate-900 flex items-center gap-2">
              <span>✈️ 旅遊手冊管理中心</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              僅顯示帳號「{currentUser?.username}」專屬存取權限的旅遊專案
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 專案排序下拉選單與正序／倒序切換 */}
            <div className="flex items-center gap-1.5 bg-white border-[1.5px] border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700">
              <span className="text-slate-500">🔃 排序依據：</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as HubSortField)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="startDate">依出發日期</option>
                <option value="title">依手冊大標題</option>
              </select>
              <span className="text-slate-300">|</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as HubSortOrder)}
                className="bg-transparent font-bold text-blue-700 focus:outline-none cursor-pointer"
              >
                <option value="asc">
                  {sortField === 'startDate' ? '正序（由近到遠）' : '正序（A → Z / 筆畫）'}
                </option>
                <option value="desc">
                  {sortField === 'startDate' ? '倒序（由遠到近）' : '倒序（Z → A / 筆畫）'}
                </option>
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleHubImport}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-slate-700 border-[1.5px] border-slate-300 hover:bg-slate-100 hover:border-slate-400 px-4 py-2.5 rounded-lg font-semibold text-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>📤 匯入舊專案 JSON</span>
            </button>

            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDeleteMode((prev) => !prev)}
                className={`px-3.5 py-2.5 rounded-lg font-semibold text-sm inline-flex items-center gap-1.5 transition-all cursor-pointer border-[1.5px] ${
                  isDeleteMode
                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                }`}
              >
                <span>{isDeleteMode ? '✓ 完成刪除' : '🗑️ 刪除'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={createNewBlankTripAndEnter}
              className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-[0.95rem] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>➕ 開啟新旅程</span>
            </button>
          </div>
        </div>

        {/* 籌備與進行中專案 */}
        <div className="text-[1.15rem] font-semibold my-6 mb-4 flex items-center gap-2 text-slate-700">
          <span>🧳 籌備與進行中專案</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
            {activeProjects.length}
          </span>
        </div>

        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProjects.map((p) => renderCard(p, false))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm">
            目前沒有籌備中的個人旅程，點擊右上角「➕ 開啟新旅程」立即開始規劃！
          </div>
        )}

        {/* 受邀參與的他人共編專案（區分他人擁有的專案 vs 個人專案） */}
        <div className="text-[1.15rem] font-semibold mt-9 mb-4 flex items-center gap-2 text-indigo-900">
          <span>🤝 受邀參與的他人共編專案</span>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
            {sharedWithMeProjects.length}
          </span>
        </div>

        {sharedWithMeProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sharedWithMeProjects.map((p) =>
              renderCard(p, Boolean(p.endDate && p.endDate < today))
            )}
          </div>
        ) : (
          <div className="bg-indigo-50/40 border border-dashed border-indigo-200 rounded-xl p-6 text-center text-slate-400 text-sm">
            目前尚無受邀參與的他人共編專案（當您點擊旅伴分享的專屬共編連結並以帳號登入時，該專案將自動歸類於此區塊）
          </div>
        )}

        {/* 典藏回憶｜已完成專案 */}
        <div className="text-[1.15rem] font-semibold mt-9 mb-4 flex items-center gap-2 text-slate-700">
          <span>📜 典藏回憶｜已完成專案</span>
          <span className="text-xs bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
            {completedProjects.length}
          </span>
        </div>

        {completedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completedProjects.map((p) => renderCard(p, true))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-sm">
            尚無已完結的過往旅程紀錄
          </div>
        )}

        {/* 刪除暫存區（保留 10 天後自動永久刪除） */}
        <details
          open={trashedProjects.length > 0}
          className="mt-10 bg-white border border-rose-200 rounded-xl overflow-hidden shadow-2xs"
        >
          <summary className="px-4 py-3 bg-rose-50/70 border-b border-rose-100 flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-rose-900">
                🗑️ 刪除暫存區（保留 10 天後自動永久刪除）
              </span>
              <span className="text-xs font-bold bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                {trashedProjects.length}
              </span>
            </div>

            {trashedProjects.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDialog({
                    title: '🚨 永久清空暫存區提醒',
                    message: `確定要立即永久刪除暫存區內的全部 ${trashedProjects.length} 筆專案嗎？\n\n注意：清空後將一併從本機硬碟暫存資料夾移除，無法再還原！`,
                    confirmLabel: '確定永久清空',
                    onConfirm: () => emptyTrash(),
                  });
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
              >
                🔥 立即清空暫存區
              </button>
            )}
          </summary>

          <div className="p-4">
            {trashedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashedProjects.map((entry) => {
                  const remainMs = Math.max(
                    0,
                    new Date(entry.expiresAt).getTime() - Date.now()
                  );
                  const remainDays = Math.max(
                    1,
                    Math.ceil(remainMs / (24 * 60 * 60 * 1000))
                  );
                  return (
                    <div
                      key={entry.project.id}
                      className="border border-slate-200 bg-slate-50 rounded-xl p-3.5 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            ⏳ 剩餘 {remainDays} 天自動刪除
                          </span>
                          <span className="text-[11px] text-slate-400">
                            刪除於 {new Date(entry.deletedAt).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm line-clamp-1">
                          {entry.project.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          📅 {entry.project.startDate || '未定'} ~ {entry.project.endDate || '未定'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                        <button
                          type="button"
                          onClick={() => restoreProjectFromTrash(entry.project.id)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          ↩️ 還原專案
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialog({
                              title: '🚨 永久刪除此專案提醒',
                              message: `確定要立即永久刪除「${entry.project.title}」嗎？\n永久刪除後將無法從暫存區恢復！`,
                              confirmLabel: '立即永久刪除',
                              onConfirm: () =>
                                permanentlyDeleteFromTrash(entry.project.id),
                            });
                          }}
                          className="py-1.5 px-2.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                        >
                          永久刪除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-3">
                目前暫存區沒有已刪除的專案（刪除的專案與本機 JSON 檔案會在此保留 10 天以防誤刪）
              </div>
            )}
          </div>
        </details>
      </div>

      {/* 更換專案封面圖片彈窗（支援上傳本機照片自動轉 Base64 同步雲端、貼上圖片網址、或套用精選主題圖庫） */}
      {coverModalProject && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCoverModalProject(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  🖼️ 更換專案封面圖片
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  專案名稱：<span className="font-bold text-blue-600">{coverModalProject.title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoverModalProject(null)}
                className="text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 即時封面預覽區 */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>目前封面預覽：</span>
                {coverDraftUrl.startsWith('data:image/') && (
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    ✓ 本機照片已壓縮內嵌（換瀏覽器或雲端同步皆可直接顯示）
                  </span>
                )}
              </div>
              <div
                className="h-40 w-full rounded-xl bg-cover bg-center border border-slate-200 bg-slate-100 shadow-inner"
                style={{
                  backgroundImage: `url('${
                    coverDraftUrl.trim() ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=80'
                  }')`,
                }}
              />
            </div>

            {/* 方式一：從電腦或手機上傳照片 */}
            <div className="mb-4 bg-blue-50/60 border border-blue-200 rounded-xl p-3.5">
              <div className="text-xs font-bold text-blue-950 mb-1">
                📁 方式 1：從電腦／手機上傳照片（自動壓縮存入 JSON 與 Firebase 雲端）
              </div>
              <p className="text-[11px] text-slate-600 mb-2.5">
                上傳的照片會自動最佳化並內嵌至專案資料與 Firebase 資料庫中，換另一台電腦或瀏覽器登入也能直接看到照片！
              </p>
              <input
                ref={coverUploadInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsCompressingCover(true);
                  try {
                    const dataUrl = await compressImageFileToDataUrl(file);
                    setCoverDraftUrl(dataUrl);
                  } catch (err: any) {
                    alert(err?.message || '圖片處理失敗');
                  } finally {
                    setIsCompressingCover(false);
                    e.target.value = '';
                  }
                }}
              />
              <button
                type="button"
                disabled={isCompressingCover}
                onClick={() => coverUploadInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>{isCompressingCover ? '⏳ 正在壓縮處理照片...' : '📁 選擇本機照片上傳'}</span>
              </button>
            </div>

            {/* 方式二：貼上網路圖片網址 */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                🔗 方式 2：貼上網路圖片網址 (URL)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={
                    coverDraftUrl.startsWith('data:image/')
                      ? ''
                      : coverDraftUrl
                  }
                  onChange={(e) => setCoverDraftUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 方式三：一鍵套用內建 14 張精選封面（純圖片無文字標籤） */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-700 mb-2">
                🎨 方式 3：或點選下方精選封面
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {PRESET_COVERS.map((presetUrl, idx) => (
                  <button
                    key={presetUrl}
                    type="button"
                    onClick={() => setCoverDraftUrl(presetUrl)}
                    className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      coverDraftUrl === presetUrl
                        ? 'border-blue-600 ring-2 ring-blue-300 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={presetUrl}
                      alt={`精選封面 ${idx + 1}`}
                      className="w-full h-full object-cover block"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCoverModalProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  updateProjectCover(coverModalProject.id, coverDraftUrl);
                  setCoverModalProject(null);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                💾 儲存封面圖片
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除／一鍵刪除防誤刪確認提醒視窗 */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed mb-5">
              {confirmDialog.message}
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  fn();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
