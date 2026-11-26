import React, { useRef, useState, useEffect } from 'react';
import {
  useGuideStore,
  generateShortTripCode,
  isLegacyLongTripId,
} from '../../store/useGuideStore';
import { useAuthStore } from '../../store/useAuthStore';

export interface HeaderBarProps {
  lastSavedAt: string;
  onEnableCoEditing?: () => void;
}

/**
 * 雙層精簡常駐頂部導覽與標題列 (#sticky-top-header)：
 * - 固定於畫面最上方 (sticky top-0 z-40)
 * - 將「自動儲存狀態」整合至第一層，並將「資料備份 / 資料匯入 / 清空內容」收納進「⋯ 更多工具」選單，大幅釋放垂直畫面空間
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  lastSavedAt,
  onEnableCoEditing,
}) => {
  const guideTitle = useGuideStore((s) => s.guideTitle);
  const currentProjectId = useGuideStore((s) => s.currentProjectId);
  const firebaseRoomId = useGuideStore((s) => s.firebaseRoomId);
  const isCoEditing = useGuideStore((s) => s.isCoEditing);
  const projects = useGuideStore((s) => s.projects);
  const updateField = useGuideStore((s) => s.updateField);
  const returnToHub = useGuideStore((s) => s.returnToHub);
  const createNewBlankTripAndEnter = useGuideStore((s) => s.createNewBlankTripAndEnter);
  const saveCurrentProjectToHub = useGuideStore((s) => s.saveCurrentProjectToHub);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);
  const importFromJSON = useGuideStore((s) => s.importFromJSON);
  const resetToDefault = useGuideStore((s) => s.resetToDefault);
  const setPreviewModalOpen = useGuideStore((s) => s.setPreviewModalOpen);

  const currentUser = useAuthStore((s) => s.currentUser);
  const setSettingsModalOpen = useAuthStore((s) => s.setSettingsModalOpen);
  const logout = useAuthStore((s) => s.logout);
  const isGuest = currentUser?.role === 'guest';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [justSavedToast, setJustSavedToast] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveToHub = () => {
    saveCurrentProjectToHub();
    setJustSavedToast(true);
    setTimeout(() => setJustSavedToast(false), 1800);
  };

  const handleExportJson = () => {
    setMoreMenuOpen(false);
    const data = getSnapshot();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateSuffix = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${(data.guideTitle || 'travel_guide').replace(/[\\/:*?"<>|]/g, '_')}_${dateSuffix}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMoreMenuOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        importFromJSON(parsed);
        alert('🎉 行程資料匯入成功！');
      } catch {
        alert('JSON 格式錯誤，請確認檔案！');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearProject = () => {
    setMoreMenuOpen(false);
    if (window.confirm('確定要清空本專案已填寫的所有明細內容嗎？')) {
      resetToDefault();
    }
  };

  const isSharedWithMe = Boolean(
    projects.find((p) => p.id === currentProjectId)?.isSharedWithMe
  );
  const coEditActive = Boolean(isCoEditing || isSharedWithMe);

  return (
    <header
      id="sticky-top-header"
      className="sticky top-0 z-40 bg-[#f4f6f8]/95 backdrop-blur-md border-b border-slate-300 shadow-sm no-print"
    >
      {/* 第一層：頂部迷你導覽列 (#mini-nav, #0f172a) */}
      <nav
        id="mini-nav"
        className="bg-[#0f172a] text-white px-4 py-1.5 border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 min-h-[26px]">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isGuest ? (
              <button
                type="button"
                onClick={returnToHub}
                className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                ⬅ 返回大廳
              </button>
            ) : (
              <span className="bg-emerald-700/80 border border-emerald-400/40 text-emerald-100 px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap">
                👋 訪客共編
              </span>
            )}

            <span
              id="navCurrentTripName"
              className="text-[13px] font-semibold text-[#f4d068] truncate"
            >
              [{isGuest ? `訪客：${currentUser?.username}` : currentUser?.username}] {guideTitle.trim() || '未命名新旅程'}
            </span>

            <span
              id="saveStatus"
              className="hidden sm:inline-flex items-center text-[11px] text-slate-400 whitespace-nowrap"
            >
              {lastSavedAt ? `· 💾 已儲存 (${lastSavedAt})` : '· 💾 自動暫存中'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {!isGuest ? (
              <>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>⚙️ 設定</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToHub}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {justSavedToast ? '✅ 已同步' : '💾 儲存'}
                </button>

                <button
                  type="button"
                  onClick={createNewBlankTripAndEnter}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ＋ 新旅程
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                🚪 離開共編
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 第二層：精簡標題橫幅與主功能列 */}
      <div className="max-w-7xl mx-auto px-3 py-1.5">
        <div className="bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#0d1b2a] text-white px-3.5 py-2 rounded-lg flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <h1 className="m-0 text-sm sm:text-[16.5px] font-bold text-[#f4d068] flex items-center gap-1.5">
            <span>✈️ 旅行手冊一鍵產生器</span>
          </h1>

          {/* 主按鈕：開啟共同編輯 ＋ 即時預覽 ＋ 更多工具下拉選單 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {!isGuest && (
              <button
                type="button"
                onClick={() => {
                  if (isSharedWithMe) return;
                  const nextVal = !isCoEditing;
                  if (nextVal && isLegacyLongTripId(firebaseRoomId)) {
                    const existingIds = projects.flatMap((p) => [p.id, p.roomId || '']);
                    const shortCode = generateShortTripCode(existingIds);
                    updateField('firebaseRoomId', shortCode);
                  }
                  updateField('isCoEditing', nextVal);
                  if (nextVal && onEnableCoEditing) {
                    onEnableCoEditing();
                  }
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1 border transition-colors shadow-xs ${
                  coEditActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-400 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 border-blue-400/60 text-white'
                }`}
              >
                {coEditActive ? '👥 共同編輯開啟中' : '🤝 開啟共同編輯'}
              </button>
            )}

            <button
              type="button"
              id="btnPreview"
              onClick={() => {
                saveCurrentProjectToHub();
                setPreviewModalOpen(true);
              }}
              className="bg-[#c86d51] hover:bg-[#b55e43] border border-amber-400/50 text-white px-3 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs"
            >
              👁️ 即時預覽
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />

            {/* ⋯ 更多工具收納選單 */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((v) => !v)}
                className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <span>⋯ 更多工具</span>
              </button>

              {moreMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📥 資料備份 (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📤 資料匯入 (JSON)</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={handleClearProject}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <span>🗑️ 清空本專案內容</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
