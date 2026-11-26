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
        className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
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
              placeholder={isOutbound ? '例：去程航班' : '例：回程航班'}
              className="px-2 py-0.5 border border-slate-300 rounded text-xs font-bold text-[#c86d51] bg-white w-36"
            />
          </div>

          <button
            type="button"
            onClick={() => deleteFlight(flight.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            刪除
          </button>
        </div>

        {/* 第一排：日期 + 起飛時間 + 抵達時間 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-1.5">
          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              航班日期：
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
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>

          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              起飛時間：
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
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>

          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              抵達時間：
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
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>
        </div>

        {/* 第二排：班機代號 + 出發機場 + 抵達機場 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              班機代號：
            </label>
            <input
              type="text"
              placeholder="例：JX800"
              value={flight.flightNo}
              onChange={(e) => updateFlight(flight.id, { flightNo: e.target.value })}
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>

          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              出發機場：
            </label>
            <input
              type="text"
              placeholder="例：桃園機場 T1"
              value={flight.dep}
              onChange={(e) => updateFlight(flight.id, { dep: e.target.value })}
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>

          <div>
            <label className="block text-[11.5px] leading-tight font-bold mb-0.5 text-slate-600">
              抵達機場：
            </label>
            <input
              type="text"
              placeholder="例：成田機場 T2"
              value={flight.arr}
              onChange={(e) => updateFlight(flight.id, { arr: e.target.value })}
              className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <details
      id="studio-sec-2"
      open
      data-sync-section
      data-sync-id="sync-flights"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          ✈️ 2. 航班時間資訊
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        {/* 區塊 A：去程航班 */}
        <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] leading-tight font-bold text-[#1a2a3a] flex items-center gap-1">
              🛫 去程航班
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {outboundFlights.length} 段
            </span>
          </div>

          <div className="space-y-1.5 mb-1.5">
            {outboundFlights.length > 0 ? (
              outboundFlights.map((flight, idx) =>
                renderFlightCard(flight, idx, 'outbound')
              )
            ) : (
              <div className="text-xs text-slate-400 bg-white border border-dashed border-slate-300 rounded p-2 text-center">
                尚無去程航班
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => addFlight('outbound')}
            className="bg-[#1a2a3a] hover:bg-[#0f172a] text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
          >
            + 新增去程航班
          </button>
        </div>

        {/* 區塊 B：回程航班 */}
        <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] leading-tight font-bold text-[#7c2d12] flex items-center gap-1">
              🛬 回程航班
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {inboundFlights.length} 段
            </span>
          </div>

          <div className="space-y-1.5 mb-1.5">
            {inboundFlights.length > 0 ? (
              inboundFlights.map((flight, idx) =>
                renderFlightCard(flight, idx, 'inbound')
              )
            ) : (
              <div className="text-xs text-slate-400 bg-white border border-dashed border-slate-300 rounded p-2 text-center">
                尚無回程航班
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => addFlight('inbound')}
            className="bg-[#c86d51] hover:bg-[#b55e43] text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
          >
            + 新增回程航班
          </button>
        </div>
      </div>
    </details>
  );
};
