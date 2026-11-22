import React from 'react';
import { exportGuideToPdf } from '../../services/pdfExport';
import { downloadSingleHtml } from '../../services/singleFileCompiler';
import { useGuideStore } from '../../store/useGuideStore';

export interface FloatingActionBarProps {
  onTriggerPreview?: () => void;
}

/**
 * 產生器底部固定操作列 (.action-bar)
 * 僅在進入「手冊產生器模式」時才顯示；切換回「專案大廳模式」時一併隱藏
 */
export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  onTriggerPreview,
}) => {
  const activeView = useGuideStore((s) => s.activeView);
  const getSnapshot = useGuideStore((s) => s.getSnapshot);
  const saveCurrentProjectToHub = useGuideStore((s) => s.saveCurrentProjectToHub);

  if (activeView !== 'generator') {
    return null;
  }

  const handleDownloadHtml = () => {
    saveCurrentProjectToHub();
    downloadSingleHtml(getSnapshot());
  };

  const handleDownloadPdf = () => {
    saveCurrentProjectToHub();
    exportGuideToPdf();
  };

  return (
    <div
      id="generatorActionBar"
      className="action-bar fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md p-2.5 border-t border-[#e2ded9] shadow-[0_-2px_10px_rgba(0,0,0,0.08)] flex gap-2 no-print"
    >
      <div className="max-w-[920px] w-full mx-auto flex gap-2">
        <button
          type="button"
          id="btnPreview"
          onClick={onTriggerPreview}
          className="flex-1 py-2.5 px-2 rounded-md text-[13.5px] font-bold text-white bg-[#c86d51] hover:bg-[#b55e43] transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
        >
          👁️ 即時預覽
        </button>

        <button
          type="button"
          id="btnPrintPdf"
          onClick={handleDownloadPdf}
          className="flex-1 py-2.5 px-2 rounded-md text-[13.5px] font-bold text-white bg-slate-600 hover:bg-slate-700 transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
        >
          📄 下載 PDF
        </button>

        <button
          type="button"
          id="btnDownload"
          onClick={handleDownloadHtml}
          className="flex-1 py-2.5 px-2 rounded-md text-[13.5px] font-bold text-white bg-[#1a2a3a] hover:bg-[#0f172a] transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
        >
          💾 下載網頁
        </button>
      </div>
    </div>
  );
};
