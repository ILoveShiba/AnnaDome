import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const ShoppingManager: React.FC = () => {
  const shopping = useGuideStore((s) => s.shopping);
  const addShopping = useGuideStore((s) => s.addShopping);
  const updateShopping = useGuideStore((s) => s.updateShopping);
  const deleteShopping = useGuideStore((s) => s.deleteShopping);

  return (
    <details
      id="studio-sec-5"
      open
      data-sync-section
      data-sync-id="sync-shopping"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          🛍️ 5. 購物採買清單
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div id="shoppingContainer" className="space-y-1.5 mb-1.5">
          {shopping.map((item) => (
            <div key={item.id} className="flex flex-wrap gap-1.5 items-center">
              <input
                type="text"
                value={item.cat}
                placeholder="品項 (例：1. 合利他命)"
                onChange={(e) => updateShopping(item.id, { cat: e.target.value })}
                className="flex-[0.35] min-w-[140px] px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
              />
              <input
                type="text"
                value={item.desc}
                placeholder="購買地點與退稅提醒"
                onChange={(e) => updateShopping(item.id, { desc: e.target.value })}
                className="flex-[0.6] min-w-[180px] px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
              />
              <button
                type="button"
                onClick={() => deleteShopping(item.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-md text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addShopping}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
        >
          + 新增購物項目
        </button>
      </div>
    </details>
  );
};
