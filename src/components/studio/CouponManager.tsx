import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const CouponManager: React.FC = () => {
  const coupons = useGuideStore((s) => s.coupons);
  const addCoupon = useGuideStore((s) => s.addCoupon);
  const updateCoupon = useGuideStore((s) => s.updateCoupon);
  const deleteCoupon = useGuideStore((s) => s.deleteCoupon);

  return (
    <section
      data-sync-section
      data-sync-id="sync-extras"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
        🎁 6. 電子優惠券設定
      </div>

      <div id="couponsContainer" className="space-y-2.5 mb-2">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#c86d51] text-sm">🎁 電子優惠券項目</span>
              <button
                type="button"
                onClick={() => deleteCoupon(c.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11.5px] font-bold cursor-pointer"
              >
                刪除此優惠券
              </button>
            </div>

            <div className="mb-2">
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                優惠券名稱：
              </label>
              <input
                type="text"
                placeholder="例：🐧 唐吉訶德免稅電子優惠券"
                value={c.title}
                onChange={(e) => updateCoupon(c.id, { title: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>

            <div className="mb-2">
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                優惠券連結網址：
              </label>
              <input
                type="text"
                placeholder="例：https://japanportal.donki-global.com/coupon/..."
                value={c.url}
                onChange={(e) => updateCoupon(c.id, { url: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                折扣條件與說明：
              </label>
              <textarea
                rows={3}
                placeholder="例：• 滿 10,000 日圓以上：享 10% 免稅 + 5% OFF 折扣"
                value={c.desc}
                onChange={(e) => updateCoupon(c.id, { desc: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCoupon}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer mt-1"
      >
        + 新增電子優惠券
      </button>
    </section>
  );
};
