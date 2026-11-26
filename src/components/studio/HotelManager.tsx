import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const HotelManager: React.FC = () => {
  const hotels = useGuideStore((s) => s.hotels);
  const addHotel = useGuideStore((s) => s.addHotel);
  const updateHotel = useGuideStore((s) => s.updateHotel);
  const deleteHotel = useGuideStore((s) => s.deleteHotel);

  return (
    <details
      id="studio-sec-3"
      open
      data-sync-section
      data-sync-id="sync-hotels"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          🏨 3. 飯店資訊
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div id="hotelsContainer" className="space-y-1.5 mb-1.5">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              data-sync-id={`sync-hotel-${hotel.id}`}
              className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#c86d51] text-[13px] leading-tight">
                  🏨 住宿飯店設定
                </span>
                <button
                  type="button"
                  onClick={() => deleteHotel(hotel.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                >
                  刪除
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                    入住日期：
                  </label>
                  <input
                    type="date"
                    value={hotel.checkIn}
                    onChange={(e) => updateHotel(hotel.id, { checkIn: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                    退房日期：
                  </label>
                  <input
                    type="date"
                    value={hotel.checkOut}
                    onChange={(e) => updateHotel(hotel.id, { checkOut: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                    飯店中文名稱：
                    <span className="text-[11px] text-slate-400 font-normal ml-1">
                      （自動產生 Google 地圖連結）
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例：銀座三井花園飯店"
                    value={hotel.name}
                    onChange={(e) => updateHotel(hotel.id, { name: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                    飯店英文名稱：
                  </label>
                  <input
                    type="text"
                    placeholder="例：Mitsui Garden Hotel Ginza"
                    value={hotel.engName || ''}
                    onChange={(e) => updateHotel(hotel.id, { engName: e.target.value })}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                  />
                </div>
              </div>

              <div className="mb-1.5">
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  飯店地址：
                </label>
                <input
                  type="text"
                  placeholder="例：東京都中央區銀座 8-13-1"
                  value={hotel.address}
                  onChange={(e) => updateHotel(hotel.id, { address: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  交通方式：
                </label>
                <input
                  type="text"
                  placeholder="例：新橋站 1 號出口步行 4 分鐘"
                  value={hotel.trans}
                  onChange={(e) => updateHotel(hotel.id, { trans: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addHotel}
          className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-2.5 py-1.5 rounded-md text-xs font-bold cursor-pointer"
        >
          + 新增飯店
        </button>
      </div>
    </details>
  );
};
