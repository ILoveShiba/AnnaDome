import React from 'react';
import { FlightItem } from '../../types/guide';
import { useGuideStore, parseFlightDateAndTimes } from '../../store/useGuideStore';

export const FlightSection: React.FC = () => {
  const flights = useGuideStore((s) => s.flights);
  const addFlight = useGuideStore((s) => s.addFlight);
  const updateFlight = useGuideStore((s) => s.updateFlight);
  const deleteFlight = useGuideStore((s) => s.deleteFlight);

  const outboundFlights = flights.filter((f, idx) =>
    f.direction ? f.direction === 'outbound' : !f.type?.includes('回') && idx === 0
  );
  const inboundFlights = flights.filter((f, idx) =>
    f.direction ? f.direction === 'inbound' : f.type?.includes('回') || idx > 0
  );

  const renderFlightCard = (
    flight: FlightItem,
    indexInGroup: number,
    direction: 'outbound' | 'inbound'
  ) => {
    const isOutbound = direction === 'outbound';
    const fallbackParsed = parseFlightDateAndTimes(flight.time);
    const dateVal = flight.date !== undefined ? flight.date : fallbackParsed.date;
    const depTimeVal = flight.depTime !== undefined ? flight.depTime : fallbackParsed.depTime;
    const arrTimeVal = flight.arrTime !== undefined ? flight.arrTime : fallbackParsed.arrTime;

    return (
      <div
        key={flight.id}
        data-sync-id={`sync-flight-${flight.id}`}
        className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                isOutbound ? 'bg-[#1a2a3a]' : 'bg-[#7c2d12]'
              }`}
            >
              {isOutbound ? `去程 #${indexInGroup + 1}` : `回程 #${indexInGroup + 1}`}
            </span>
            <input
              type="text"
              value={flight.type}
              onChange={(e) => updateFlight(flight.id, { type: e.target.value })}
              placeholder={isOutbound ? '例：去程航班 / 去程轉機' : '例：回程航班 / 回程轉機'}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-bold text-[#c86d51] bg-white w-40"
            />
          </div>

          <button
            type="button"
            onClick={() => deleteFlight(flight.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11.5px] font-bold cursor-pointer"
          >
            刪除此航班
          </button>
        </div>

        {/* 第一排：日期開窗選取器 + 起飛時間選取器 + 抵達時間選取器 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              {isOutbound && indexInGroup === 0
                ? '航班日期 (自動連動出發日期與天數)：'
                : !isOutbound
                  ? '航班日期 (自動連動結束日期)：'
                  : '航班日期 (點選日曆)：'}
            </label>
            <input
              type="date"
              value={dateVal}
              onChange={(e) =>
                updateFlight(flight.id, {
                  direction,
                  date: e.target.value,
                  depTime: depTimeVal,
                  arrTime: arrTimeVal,
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              起飛時間 (點選時間)：
            </label>
            <input
              type="time"
              value={depTimeVal}
              onChange={(e) =>
                updateFlight(flight.id, {
                  direction,
                  date: dateVal,
                  depTime: e.target.value,
                  arrTime: arrTimeVal,
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              抵達時間 (點選時間)：
            </label>
            <input
              type="time"
              value={arrTimeVal}
              onChange={(e) =>
                updateFlight(flight.id, {
                  direction,
                  date: dateVal,
                  depTime: depTimeVal,
                  arrTime: e.target.value,
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>
        </div>

        {/* 第二排：班機代號 + 出發機場 + 抵達機場 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              班機代號：
            </label>
            <input
              type="text"
              placeholder="例：BR198 / JX800"
              value={flight.flightNo}
              onChange={(e) => updateFlight(flight.id, { flightNo: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              出發機場：
            </label>
            <input
              type="text"
              placeholder="例：桃園機場 T2"
              value={flight.dep}
              onChange={(e) => updateFlight(flight.id, { dep: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold mb-1 text-slate-600">
              抵達機場：
            </label>
            <input
              type="text"
              placeholder="例：成田機場 T1"
              value={flight.arr}
              onChange={(e) => updateFlight(flight.id, { arr: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      data-sync-section
      data-sync-id="sync-flights"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-3">
        ✈️ 2. 航班時間資訊（自動串聯上方出發日期與結束日期）
      </div>

      {/* 區塊 A：去程航班區塊 */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-2.5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13.5px] font-bold text-[#1a2a3a] flex items-center gap-1.5">
            🛫 去程航班區塊（首段日期自動設為旅程「出發日期」）
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            共 {outboundFlights.length} 段
          </span>
        </div>

        <div className="space-y-2.5 mb-2.5">
          {outboundFlights.length > 0 ? (
            outboundFlights.map((flight, idx) =>
              renderFlightCard(flight, idx, 'outbound')
            )
          ) : (
            <div className="text-xs text-slate-400 bg-white border border-dashed border-slate-300 rounded p-3 text-center">
              尚未新增去程航班，請點擊下方「+ 新增去程航班」
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => addFlight('outbound')}
          className="bg-[#1a2a3a] hover:bg-[#0f172a] text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer"
        >
          + 新增去程航班
        </button>
      </div>

      {/* 區塊 B：回程航班區塊 */}
      <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13.5px] font-bold text-[#7c2d12] flex items-center gap-1.5">
            🛬 回程航班區塊（末段日期自動設為旅程「結束日期」）
          </span>
          <span className="text-xs text-slate-500 font-semibold">
            共 {inboundFlights.length} 段
          </span>
        </div>

        <div className="space-y-2.5 mb-2.5">
          {inboundFlights.length > 0 ? (
            inboundFlights.map((flight, idx) =>
              renderFlightCard(flight, idx, 'inbound')
            )
          ) : (
            <div className="text-xs text-slate-400 bg-white border border-dashed border-slate-300 rounded p-3 text-center">
              尚未新增回程航班，請點擊下方「+ 新增回程航班」
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => addFlight('inbound')}
          className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer"
        >
          + 新增回程航班
        </button>
      </div>
    </section>
  );
};
