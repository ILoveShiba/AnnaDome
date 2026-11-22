import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const ShoppingManager: React.FC = () => {
  const shopping = useGuideStore((s) => s.shopping);
  const addShopping = useGuideStore((s) => s.addShopping);
  const updateShopping = useGuideStore((s) => s.updateShopping);
  const deleteShopping = useGuideStore((s) => s.deleteShopping);

  return (
    <section
      data-sync-section
      data-sync-id="sync-shopping"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
        🛍️ 5. 購物採買清單
      </div>

      <div id="shoppingContainer" className="space-y-2 mb-2">
        {shopping.map((item) => (
          <div key={item.id} className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={item.cat}
              placeholder="類別 (例：1. 無印良品)"
              onChange={(e) => updateShopping(item.id, { cat: e.target.value })}
              className="flex-[0.35] min-w-[140px] px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white"
            />
            <input
              type="text"
              value={item.desc}
              placeholder="購買地點與退稅提醒"
              onChange={(e) => updateShopping(item.id, { desc: e.target.value })}
              className="flex-[0.6] min-w-[180px] px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white"
            />
            <button
              type="button"
              onClick={() => deleteShopping(item.id)}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-2 rounded-md text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addShopping}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer mt-1"
      >
        + 新增購物項目
      </button>
    </section>
  );
};
