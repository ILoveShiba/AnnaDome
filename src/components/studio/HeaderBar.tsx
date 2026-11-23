import React, { useRef, useState } from 'react';
import { useGuideStore } from '../../store/useGuideStore';
import { useAuthStore } from '../../store/useAuthStore';

export interface HeaderBarProps {
  lastSavedAt: string;
}

/**
 * 常駐頂部導覽與標題列 (#sticky-top-header)：
 * - 固定於畫面最上方 (sticky top-0 z-40)，不會隨畫面捲動而被捲走
 * - 僅保留雙欄同步模式，左側編輯表單、右側唯讀即時預覽
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({ lastSavedAt }) => {
  const guideTitle = useGuideStore((s) => s.guideTitle);
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
  const [justSavedToast, setJustSavedToast] = useState(false);

  const handleSaveToHub = () => {
    saveCurrentProjectToHub();
    setJustSavedToast(true);
    setTimeout(() => setJustSavedToast(false), 1800);
  };

  const handleExportJson = () => {
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
    if (window.confirm('確定要清空本專案已填寫的所有明細內容嗎？')) {
      resetToDefault();
    }
  };

  return (
    <header
      id="sticky-top-header"
      className="sticky top-0 z-40 bg-[#f4f6f8]/95 backdrop-blur-md border-b border-slate-300 shadow-sm no-print"
    >
      {/* 第一層：頂部迷你切換導覽列 (#mini-nav, #0f172a) */}
      <nav
        id="mini-nav"
        className="bg-[#0f172a] text-white px-4 py-2 border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isGuest ? (
              <button
                type="button"
                onClick={returnToHub}
                className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40 px-3 py-1 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                ⬅ 返回專案大廳
              </button>
            ) : (
              <span className="bg-emerald-700/80 border border-emerald-400/40 text-emerald-100 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
                👋 訪客共編模式
              </span>
            )}

            <span
              id="navCurrentTripName"
              className="text-[13.5px] font-semibold text-[#f4d068] truncate"
            >
              [{isGuest ? `訪客：${currentUser?.username}` : currentUser?.username}] 正在共編：{guideTitle.trim() || '新旅程（請於下方 0. 輸入名稱）'}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
                  {justSavedToast ? '✅ 已同步至大廳' : '💾 儲存專案至大廳'}
                </button>

                <button
                  type="button"
                  onClick={createNewBlankTripAndEnter}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  ＋ 建立全新空白旅程
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-700 px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                🚪 離開訪客共編
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 第二層：常駐標題橫幅與即時預覽／資料備份控制列 */}
      <div className="max-w-7xl mx-auto px-3 py-2">
        <div className="bg-gradient-to-r from-[#0d1b2a] via-[#1b263b] to-[#0d1b2a] text-white px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-base sm:text-[18px] font-bold text-[#f4d068] flex items-center gap-1.5">
              <span>✈️ 旅行手冊一鍵產生器</span>
            </h1>
          </div>

          {/* 即時預覽開窗（內含下載 PDF 與下載網頁）及暫存備份控制按鈕 */}
          <div className="flex flex-wrap items-center gap-1.5">
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
            <button
              type="button"
              onClick={handleExportJson}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1"
            >
              📥 資料備份
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1"
            >
              📤 資料匯入
            </button>
            <button
              type="button"
              onClick={handleClearProject}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer inline-flex items-center gap-1"
            >
              🗑️ 清空本專案內容
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 pt-1 text-[11px] text-slate-600" id="saveStatus">
          <span>
            💾 {lastSavedAt ? `已自動儲存至帳號「${currentUser?.username}」專屬空間 (${lastSavedAt})` : '已啟動會員專屬多專案自動暫存'}
          </span>
        </div>
      </div>
    </header>
  );
};
