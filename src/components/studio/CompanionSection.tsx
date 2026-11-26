import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const CompanionSection: React.FC = () => {
  const companions = useGuideStore((s) => s.companions) || '';
  const updateField = useGuideStore((s) => s.updateField);

  return (
    <details
      id="studio-sec-1"
      open
      data-sync-section
      data-sync-id="sync-companions"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          👥 1. 旅行夥伴
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
          同行成員：
        </label>
        <input
          type="text"
          id="guideCompanions"
          placeholder="例：Anna、Charles、爸媽"
          value={companions}
          onChange={(e) => updateField('companions', e.target.value)}
          className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>
    </details>
  );
};
