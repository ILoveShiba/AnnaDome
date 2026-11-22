import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const HotelManager: React.FC = () => {
  const hotels = useGuideStore((s) => s.hotels);
  const addHotel = useGuideStore((s) => s.addHotel);
  const updateHotel = useGuideStore((s) => s.updateHotel);
  const deleteHotel = useGuideStore((s) => s.deleteHotel);

  return (
    <section
      data-sync-section
      data-sync-id="sync-hotels"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
        🏨 3. 飯店資訊
      </div>

      <div id="hotelsContainer" className="space-y-2.5 mb-2.5">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            data-sync-id={`sync-hotel-${hotel.id}`}
            className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#c86d51] text-[13.5px]">🏨 住宿飯店設定</span>
              <button
                type="button"
                onClick={() => deleteHotel(hotel.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11.5px] font-bold cursor-pointer"
              >
                刪除此飯店
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                  入住日期 (點選日曆)：
                </label>
                <input
                  type="date"
                  value={hotel.checkIn}
                  onChange={(e) => updateHotel(hotel.id, { checkIn: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                  退房日期 (點選日曆)：
                </label>
                <input
                  type="date"
                  value={hotel.checkOut}
                  onChange={(e) => updateHotel(hotel.id, { checkOut: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                  飯店中文名稱：
                  <span className="text-[11px] text-slate-400 font-normal ml-1">
                    （自動產生 Google 地圖連結）
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="例：千禧三井花園飯店 東京"
                  value={hotel.name}
                  onChange={(e) => updateHotel(hotel.id, { name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                  飯店英文名稱：
                </label>
                <input
                  type="text"
                  placeholder="例：Millennium Mitsui Garden Hotel Tokyo"
                  value={hotel.engName || ''}
                  onChange={(e) => updateHotel(hotel.id, { engName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                飯店地址：
                <span className="text-[11px] text-slate-400 font-normal ml-1">
                  （自動產生 Google 地圖連結）
                </span>
              </label>
              <input
                type="text"
                placeholder="例：東京都中央區銀座 5-11-1"
                value={hotel.address}
                onChange={(e) => updateHotel(hotel.id, { address: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                交通引導說明：
              </label>
              <input
                type="text"
                placeholder="例：都營淺草線 / 日比谷線「東銀座站」A1 出口地下連通道直通。"
                value={hotel.trans}
                onChange={(e) => updateHotel(hotel.id, { trans: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addHotel}
        className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-3 py-2 rounded-md text-[13px] font-bold cursor-pointer"
      >
        + 新增飯店
      </button>
    </section>
  );
};
