import React, { useState } from 'react';
import { DayPlan } from '../../../types/guide';
import { useGuideStore } from '../../../store/useGuideStore';
import { SpotCard } from './SpotCard';

export interface DayCardProps {
  day: DayPlan;
  dayIndex: number;
  totalDays?: number;
  onDragStartDay?: (index: number) => void;
  onDragOverDay?: (index: number) => void;
  onDragEndDay?: () => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  dayIndex,
  totalDays = 1,
  onDragStartDay,
  onDragOverDay,
  onDragEndDay,
}) => {
  const updateDayTitle = useGuideStore((s) => s.updateDayTitle);
  const deleteDay = useGuideStore((s) => s.deleteDay);
  const moveDay = useGuideStore((s) => s.moveDay);
  const addSpot = useGuideStore((s) => s.addSpot);
  const moveSpot = useGuideStore((s) => s.moveSpot);
  const reorderSpots = useGuideStore((s) => s.reorderSpots);
  const updateSpot = useGuideStore((s) => s.updateSpot);
  const deleteSpot = useGuideStore((s) => s.deleteSpot);

  const [isDayDraggable, setIsDayDraggable] = useState(false);
  const [dragSpotIdx, setDragSpotIdx] = useState<number | null>(null);

  return (
    <div
      data-sync-id={`sync-day-${day.id}`}
      draggable={isDayDraggable}
      onDragStart={() => onDragStartDay?.(dayIndex)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverDay?.(dayIndex);
      }}
      onDragEnd={() => {
        setIsDayDraggable(false);
        onDragEndDay?.();
      }}
      className="border-[1.8px] border-slate-300 bg-[#fbfbfa] rounded-lg p-2.5 mb-3 transition-all"
    >
      <div className="flex items-center justify-between bg-slate-100 border border-slate-300 rounded-md px-2.5 py-1.5 mb-2">
        <span
          onMouseDown={() => setIsDayDraggable(true)}
          onMouseUp={() => setIsDayDraggable(false)}
          className="text-[13px] font-bold text-[#1a2a3a] cursor-grab select-none inline-flex items-center gap-1"
        >
          ☰ 拖曳整天排序 (<span>第 {dayIndex + 1} 天</span>)
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={dayIndex === 0}
            onClick={() => moveDay(dayIndex, 'UP')}
            title="上移整天"
            className="bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            ⬆
          </button>
          <button
            type="button"
            disabled={dayIndex === totalDays - 1}
            onClick={() => moveDay(dayIndex, 'DOWN')}
            title="下移整天"
            className="bg-slate-600 hover:bg-slate-700 disabled:opacity-40 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
          >
            ⬇
          </button>
          <button
            type="button"
            onClick={() => deleteDay(day.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11.5px] font-bold cursor-pointer"
          >
            刪除此天
          </button>
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-xs font-bold text-slate-600 mb-1">
          天數標題 (系統自動推算，亦可直接修改)：
        </label>
        <input
          type="text"
          value={day.title}
          placeholder={`例：Day ${dayIndex + 1} (08/15 六)｜抵達東京．景點名稱`}
          onChange={(e) => updateDayTitle(day.id, e.target.value)}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm font-bold bg-white"
        />
      </div>

      <div>
        {day.spots.map((spot, spotIndex) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            spotIndex={spotIndex}
            totalSpots={day.spots.length}
            previousSpotName={spotIndex > 0 ? day.spots[spotIndex - 1].spot : ''}
            onMove={(direction) => moveSpot(dayIndex, spotIndex, direction)}
            onUpdate={(partial) => updateSpot(dayIndex, spot.id, partial)}
            onDelete={() => deleteSpot(dayIndex, spot.id)}
            onDragStartSpot={(idx) => setDragSpotIdx(idx)}
            onDragOverSpot={(targetIdx) => {
              if (dragSpotIdx !== null && dragSpotIdx !== targetIdx) {
                reorderSpots(dayIndex, dragSpotIdx, targetIdx);
                setDragSpotIdx(targetIdx);
              }
            }}
            onDragEndSpot={() => setDragSpotIdx(null)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => addSpot(dayIndex)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer mt-1"
      >
        + 新增景點時段
      </button>
    </div>
  );
};
