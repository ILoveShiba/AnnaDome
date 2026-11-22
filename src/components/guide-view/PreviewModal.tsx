import React, { useEffect } from 'react';
import { GuideContainer } from './GuideContainer';
import { exportGuideToPdf, setAllAccordionsOpen } from '../../services/pdfExport';
import { downloadSingleHtml } from '../../services/singleFileCompiler';
import { useGuideStore } from '../../store/useGuideStore';

/**
 * 手冊即時預覽唯讀彈出視窗 (PreviewModal)
 * - 可從「旅行手冊一鍵產生器」頂部工具列的「👁️ 即時預覽」按鈕開啟
 * - 亦可從「專案大廳」各專案卡片的「📖 翻閱手冊」按鈕直接開啟（無需進入編輯模式）
 * - 下方固定呈現「📄 下載 PDF」與「💾 下載網頁」2 個按鈕
 */
export const PreviewModal: React.FC = () => {
  const isPreviewModalOpen = useGuideStore((s) => s.isPreviewModalOpen);
  const setPreviewModalOpen = useGuideStore((s) => s.setPreviewModalOpen);
  const activeView = useGuideStore((s) => s.activeView);
  const currentProjectId = useGuideStore((s) => s.currentProjectId);
  const openProjectInGenerator = useGuideStore((s) => s.openProjectInGenerator);
  const guideTitle = useGuideStore((s) => s.guideTitle);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);
  const saveCurrentProjectToHub = useGuideStore((s) => s.saveCurrentProjectToHub);

  useEffect(() => {
    if (isPreviewModalOpen) {
      setTimeout(() => {
        setAllAccordionsOpen(true);
      }, 60);
    }
  }, [isPreviewModalOpen]);

  if (!isPreviewModalOpen) return null;

  const handleEditGuide = () => {
    setPreviewModalOpen(false);
    if (activeView === 'hub' && currentProjectId) {
      openProjectInGenerator(currentProjectId, false);
    }
  };

  const handleDownloadPdf = () => {
    saveCurrentProjectToHub();
    exportGuideToPdf();
  };

  const handleDownloadHtml = () => {
    saveCurrentProjectToHub();
    downloadSingleHtml(getSnapshot());
  };

  return (
    <div
      id="preview-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print"
      onClick={() => setPreviewModalOpen(false)}
    >
      <div
        id="preview-modal-dialog"
        className="bg-[#f7f6f3] border border-slate-300 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 彈窗頂部標題列 */}
        <div className="bg-[#0f172a] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-bold text-[#f4d068] truncate">
              📖 手冊即時預覽：{guideTitle || '未命名旅程'}
            </span>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">
              唯讀檢視模式
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleEditGuide}
              title="切換至雙欄編輯器修改此手冊"
              className="bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400/40 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors"
            >
              ✏️ 編輯手冊
            </button>
            <button
              type="button"
              onClick={() => setAllAccordionsOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            >
              📂 全部展開
            </button>
            <button
              type="button"
              onClick={() => setAllAccordionsOpen(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer"
            >
              📁 全部收合
            </button>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ml-1"
            >
              ✕ 關閉視窗
            </button>
          </div>
        </div>

        {/* 彈窗中間：唯讀手冊內容捲動區 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <GuideContainer isEditable={false} isModalView={true} />
        </div>

        {/* 彈窗下方：固定呈現「📄 下載 PDF」與「💾 下載網頁」2 個按鈕 */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 max-w-xs py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-700 hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
          >
            📄 下載 PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="flex-1 max-w-xs py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#1a2a3a] hover:bg-[#0f172a] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
          >
            💾 下載網頁
          </button>
        </div>
      </div>
    </div>
  );
};
