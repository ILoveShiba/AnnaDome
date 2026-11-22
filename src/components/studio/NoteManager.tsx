import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const NoteManager: React.FC = () => {
  const generalNote = useGuideStore((s) => s.generalNote) || '';
  const updateField = useGuideStore((s) => s.updateField);

  return (
    <section
      data-sync-section
      data-sync-id="sync-notes"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-1.5">
        📝 8. 備註
      </div>
      <div className="text-[12.5px] text-slate-500 mb-2">
        自由記錄旅程注意事項、緊急聯絡電話、當地電壓或打包提醒（僅允許輸入純文字）。
      </div>

      <textarea
        rows={4}
        placeholder="請輸入純文字備註內容（例：緊急聯絡資訊、集合提醒、行李打包清單...）"
        value={generalNote}
        onChange={(e) => updateField('generalNote', e.target.value)}
        className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-blue-600 focus:outline-none"
      />
    </section>
  );
};
