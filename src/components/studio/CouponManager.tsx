import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const CouponManager: React.FC = () => {
  const coupons = useGuideStore((s) => s.coupons);
  const addCoupon = useGuideStore((s) => s.addCoupon);
  const updateCoupon = useGuideStore((s) => s.updateCoupon);
  const deleteCoupon = useGuideStore((s) => s.deleteCoupon);

  return (
    <details
      id="studio-sec-6"
      open
      data-sync-section
      data-sync-id="sync-extras"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          🎁 6. 電子優惠券
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div id="couponsContainer" className="space-y-1.5 mb-1.5">
          {coupons.map((c, idx) => (
            <div
              key={c.id}
              className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#c86d51] text-[13px] leading-tight">
                  🎁 優惠券 #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => deleteCoupon(c.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                >
                  刪除
                </button>
              </div>

              <div className="mb-1.5">
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  優惠券名稱：
                </label>
                <input
                  type="text"
                  placeholder="例：🐧 唐吉訶德免稅優惠券"
                  value={c.title}
                  onChange={(e) => updateCoupon(c.id, { title: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>

              <div className="mb-1.5">
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  優惠券網址：
                </label>
                <input
                  type="text"
                  placeholder="例：https://..."
                  value={c.url}
                  onChange={(e) => updateCoupon(c.id, { url: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  折扣說明：
                </label>
                <textarea
                  rows={2}
                  placeholder="例：滿 10,000 日圓享 10% 免稅 + 5% OFF"
                  value={c.desc}
                  onChange={(e) => updateCoupon(c.id, { desc: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCoupon}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
        >
          + 新增優惠券
        </button>
      </div>
    </details>
  );
};
