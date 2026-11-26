import React, { useState } from 'react';
import { SpotItem } from '../../../types/guide';

export interface SpotCardProps {
  spot: SpotItem;
  spotIndex: number;
  totalSpots: number;
  previousSpotName?: string;
  onMove: (direction: 'UP' | 'DOWN') => void;
  onUpdate: (partial: Partial<SpotItem>) => void;
  onDelete: () => void;
  onDragStartSpot?: (index: number) => void;
  onDragOverSpot?: (index: number) => void;
  onDragEndSpot?: () => void;
}

export const SpotCard: React.FC<SpotCardProps> = ({
  spot,
  spotIndex,
  totalSpots,
  previousSpotName = '',
  onMove,
  onUpdate,
  onDelete,
  onDragStartSpot,
  onDragOverSpot,
  onDragEndSpot,
}) => {
  const [mapStart, setMapStart] = useState('');
  const [mapEnd, setMapEnd] = useState('');
  const [isDraggable, setIsDraggable] = useState(false);

  const handleBuildMapUrl = () => {
    const start = mapStart.trim() || previousSpotName.trim();
    const end = mapEnd.trim() || spot.spot.trim();
    if (start && end) {
      onUpdate({
        routeUrl: `https://www.google.com/maps/dir/${encodeURIComponent(start)}/${encodeURIComponent(end)}`,
      });
    } else if (end) {
      onUpdate({
        routeUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(end)}`,
      });
    } else {
      alert('請至少填寫「終點」或「景點名稱」！');
    }
  };

  return (
    <div
      data-sync-id={`sync-spot-${spot.id}`}
      draggable={isDraggable}
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStartSpot?.(spotIndex);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOverSpot?.(spotIndex);
      }}
      onDragEnd={(e) => {
        e.stopPropagation();
        setIsDraggable(false);
        onDragEndSpot?.();
      }}
      className="bg-white border border-slate-300 rounded-md p-2 mb-1.5"
    >
      {/* Spot Header */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-0.5 mb-1.5">
        <span
          onMouseDown={() => setIsDraggable(true)}
          onMouseUp={() => setIsDraggable(false)}
          className="text-xs leading-tight font-bold text-slate-600 cursor-grab select-none inline-flex items-center gap-1"
        >
          ☰ 景點 #{spotIndex + 1}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={spotIndex === 0}
            onClick={() => onMove('UP')}
            title="上移"
            className="bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            ⬆
          </button>
          <button
            type="button"
            disabled={spotIndex === totalSpots - 1}
            onClick={() => onMove('DOWN')}
            title="下移"
            className="bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            ⬇️
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            ✕ 刪除
          </button>
        </div>
      </div>

      {/* Time & Spot Name */}
      <div className="flex flex-wrap gap-1.5 mb-1">
        <div className="flex-[0.35] min-w-[120px]">
          <label className="block text-[11.5px] leading-tight font-bold text-slate-500 mb-0.5">
            時間：
          </label>
          <input
            type="text"
            value={spot.time}
            placeholder="例：14:00 - 16:00"
            onChange={(e) => onUpdate({ time: e.target.value })}
            className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
          />
        </div>
        <div className="flex-[0.65] min-w-[180px]">
          <label className="block text-[11.5px] leading-tight font-bold text-slate-500 mb-0.5">
            景點名稱：
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={spot.spot}
              placeholder="例：Hekkelun (ヘッケルン)"
              onChange={(e) => onUpdate({ spot: e.target.value })}
              className="flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
            />
            <button
              type="button"
              onClick={() => onUpdate({ enableMapLink: !spot.enableMapLink })}
              className={`px-2 py-1 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap border transition-colors inline-flex items-center gap-1 ${
                spot.enableMapLink
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{spot.enableMapLink ? '☑' : '☐'}</span>
              <span>自動轉地圖</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trans */}
      <div className="mb-1">
        <label className="block text-[11.5px] leading-tight font-bold text-slate-500 mb-0.5">
          交通路線：
        </label>
        <input
          type="text"
          value={spot.trans}
          placeholder="例：搭計程車15分 / 搭JR第AA123車次約30分 / 步行10分見7-11左轉"
          onChange={(e) => onUpdate({ trans: e.target.value })}
          className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
        />
      </div>

      {/* Inline Google Maps Route Generator Box */}
      <div className="bg-[#ebf8ff] border border-dashed border-[#bee3f8] rounded-md px-2 py-1.5 my-1">
        <div className="text-[11.5px] leading-tight font-bold text-[#2b6cb0] mb-0.5">
          🗺️ Google Maps 導航生成器
        </div>
        <div className="flex flex-wrap gap-1">
          <input
            type="text"
            value={mapStart}
            onChange={(e) => setMapStart(e.target.value)}
            placeholder={`起點 (預設：${previousSpotName || '東銀座站'})`}
            className="flex-1 min-w-[120px] px-2 py-1 border border-slate-300 rounded text-[13px] leading-snug bg-white"
          />
          <input
            type="text"
            value={mapEnd}
            onChange={(e) => setMapEnd(e.target.value)}
            placeholder={`終點 (預設：${spot.spot || 'Hekkelun'})`}
            className="flex-1 min-w-[120px] px-2 py-1 border border-slate-300 rounded text-[13px] leading-snug bg-white"
          />
          <button
            type="button"
            onClick={handleBuildMapUrl}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            ⚡ 生成
          </button>
        </div>
        <input
          type="text"
          value={spot.routeUrl}
          onChange={(e) => onUpdate({ routeUrl: e.target.value })}
          placeholder="生成的 Google 導航網址"
          className="w-full mt-1 px-2 py-1 border border-slate-300 rounded text-[13px] leading-snug bg-white"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-[11.5px] leading-tight font-bold text-slate-500 mb-0.5">
          注意事項 / 備註：
        </label>
        <input
          type="text"
          value={spot.note}
          placeholder="例：品嚐老老闆特大焦糖布丁。"
          onChange={(e) => onUpdate({ note: e.target.value })}
          className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
        />
      </div>
    </div>
  );
};
