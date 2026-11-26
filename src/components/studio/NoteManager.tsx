import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const NoteManager: React.FC = () => {
  const generalNote = useGuideStore((s) => s.generalNote) || '';
  const updateField = useGuideStore((s) => s.updateField);

  return (
    <details
      id="studio-sec-8"
      open
      data-sync-section
      data-sync-id="sync-notes"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          📝 8. 備註
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div className="text-[12px] leading-tight text-slate-500 mb-1.5">
          自由記錄旅程注意事項、緊急聯絡電話、當地電壓或打包提醒（僅允許輸入純文字）。
        </div>
        <textarea
          rows={3}
          placeholder="自由記錄注意事項、緊急聯絡電話或打包清單..."
          value={generalNote}
          onChange={(e) => updateField('generalNote', e.target.value)}
          className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>
    </details>
  );
};
