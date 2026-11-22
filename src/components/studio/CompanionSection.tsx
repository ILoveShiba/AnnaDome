import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const CompanionSection: React.FC = () => {
  const companions = useGuideStore((s) => s.companions) || '';
  const updateField = useGuideStore((s) => s.updateField);

  return (
    <section
      data-sync-section
      data-sync-id="sync-companions"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
        👥 1. 旅行夥伴
      </div>

      <div>
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          旅行夥伴（同行成員名稱或備註）：
        </label>
        <input
          type="text"
          id="guideCompanions"
          placeholder="例：Anna、Charles、爸媽（共 4 人）"
          value={companions}
          onChange={(e) => updateField('companions', e.target.value)}
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>
    </section>
  );
};
