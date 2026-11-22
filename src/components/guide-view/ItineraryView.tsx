import React, { useState } from 'react';
import {
  CalendarDays,
  MapPin,
  Navigation,
  Trash2,
  Train,
  StickyNote,
} from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { DetailsAccordion } from '../common/DetailsAccordion';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';
import { Button } from '../common/Button';
import { buildGoogleMapsSearchUrl } from '../../services/googleMaps';
import { RouteGeneratorDialog } from '../studio/ItineraryPlanner/RouteGeneratorDialog';

export interface ItineraryViewProps {
  isEditable: boolean;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ isEditable }) => {
  const days = useGuideStore((s) => s.days);
  const addDay = useGuideStore((s) => s.addDay);
  const updateDayTitle = useGuideStore((s) => s.updateDayTitle);
  const deleteDay = useGuideStore((s) => s.deleteDay);
  const addSpot = useGuideStore((s) => s.addSpot);
  const moveSpot = useGuideStore((s) => s.moveSpot);
  const updateSpot = useGuideStore((s) => s.updateSpot);
  const deleteSpot = useGuideStore((s) => s.deleteSpot);

  const [routeTarget, setRouteTarget] = useState<{
    dayIndex: number;
    spotId: string;
    origin: string;
    destination: string;
  } | null>(null);

  return (
    <div id="preview-sync-days" className="rounded-2xl transition-all duration-200">
      <DetailsAccordion
        title={`每日行程規劃 (${days.length} 天)`}
        icon={<CalendarDays className="w-5 h-5" />}
        defaultOpen={true}
        rightActions={
          isEditable ? (
            <Button size="sm" variant="primary" onClick={addDay}>
              ➕ 新增天數
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {days.map((day, dayIndex) => (
            <div
              key={day.id}
              id={`preview-sync-day-${day.id}`}
              className="rounded-xl transition-all duration-200"
            >
              <DetailsAccordion
                variant="day"
                defaultOpen={true}
                title={
                  <SchemeCPlaceholder
                    value={day.title}
                    placeholder={`Day ${dayIndex + 1}｜當日行程主題`}
                    isEditable={isEditable}
                    onValueChange={(val) => updateDayTitle(day.id, val)}
                  />
                }
                rightActions={
                  isEditable ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addSpot(dayIndex)}
                        className="!py-1 !px-2"
                      >
                        ➕ 景點
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteDay(day.id)}
                        className="!py-1 !px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : undefined
                }
              >
                <div className="space-y-3">
                  {day.spots.map((spot, spotIndex) => {
                    const spotSearchUrl = spot.enableMapLink
                      ? buildGoogleMapsSearchUrl(spot.spot)
                      : '';
                    const prevSpotName = spotIndex > 0 ? day.spots[spotIndex - 1].spot : '';

                    return (
                      <div
                        key={spot.id}
                        id={`preview-sync-spot-${spot.id}`}
                        className="border-l-4 border-amber-600 bg-stone-50/90 rounded-r-xl p-3.5 border-y border-r border-stone-200/80 transition-all duration-200 print-break-inside-avoid"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                              <SchemeCPlaceholder
                                value={spot.time}
                                placeholder="例：14:00 - 16:00"
                                isEditable={isEditable}
                                onValueChange={(val) =>
                                  updateSpot(dayIndex, spot.id, { time: val })
                                }
                              />
                            </span>

                            <h5 className="font-bold text-stone-900 text-sm sm:text-base">
                              <SchemeCPlaceholder
                                value={spot.spot}
                                placeholder="例：淺草寺 雷門"
                                isEditable={isEditable}
                                onValueChange={(val) =>
                                  updateSpot(dayIndex, spot.id, { spot: val })
                                }
                              />
                            </h5>
                          </div>

                          {/* 地圖按鈕與編輯模式控制項 */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {spot.enableMapLink && spotSearchUrl && (
                              <a
                                href={spotSearchUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                景點地圖
                              </a>
                            )}

                            {spot.routeUrl && (
                              <a
                                href={spot.routeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                Google 導航路線
                              </a>
                            )}

                            {isEditable && (
                              <div className="flex items-center gap-1 no-print">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSpot(dayIndex, spot.id, {
                                      enableMapLink: !spot.enableMapLink,
                                    })
                                  }
                                  className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer ${
                                    spot.enableMapLink
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                                  }`}
                                >
                                  {spot.enableMapLink ? '☑ 自動轉地圖' : '☐ 自動轉地圖'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRouteTarget({
                                      dayIndex,
                                      spotId: spot.id,
                                      origin: prevSpotName,
                                      destination: spot.spot,
                                    })
                                  }
                                  className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300"
                                >
                                  📍 點我編輯可生成 Google 路線
                                </button>
                                <button
                                  type="button"
                                  disabled={spotIndex === 0}
                                  onClick={() => moveSpot(dayIndex, spotIndex, 'UP')}
                                  className="px-2 py-1 text-xs rounded border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40"
                                  title="上移"
                                >
                                  ⬆
                                </button>
                                <button
                                  type="button"
                                  disabled={spotIndex === day.spots.length - 1}
                                  onClick={() => moveSpot(dayIndex, spotIndex, 'DOWN')}
                                  className="px-2 py-1 text-xs rounded border border-stone-300 bg-white hover:bg-stone-100 disabled:opacity-40"
                                  title="下移"
                                >
                                  ⬇
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSpot(dayIndex, spot.id)}
                                  className="px-2 py-1 text-xs rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  title="刪除景點"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs sm:text-sm text-stone-600 mt-2">
                          <div className="flex items-start gap-1.5">
                            <Train className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-1" />
                            <span className="font-semibold text-stone-700 shrink-0">交通：</span>
                            <SchemeCPlaceholder
                              value={spot.trans}
                              placeholder="例：搭乘銀座線至淺草站步行 3 分鐘"
                              isEditable={isEditable}
                              onValueChange={(val) =>
                                updateSpot(dayIndex, spot.id, { trans: val })
                              }
                            />
                          </div>

                          <div className="flex items-start gap-1.5">
                            <StickyNote className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-1" />
                            <span className="font-semibold text-stone-700 shrink-0">備註：</span>
                            <SchemeCPlaceholder
                              value={spot.note}
                              placeholder="例：必拍雷門大燈籠、品嚐仲見世通人形燒"
                              isEditable={isEditable}
                              multiline
                              onValueChange={(val) =>
                                updateSpot(dayIndex, spot.id, { note: val })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DetailsAccordion>
            </div>
          ))}
        </div>

        <RouteGeneratorDialog
          isOpen={Boolean(routeTarget)}
          defaultOrigin={routeTarget?.origin || ''}
          defaultDestination={routeTarget?.destination || ''}
          onClose={() => setRouteTarget(null)}
          onApplyRoute={(routeUrl) => {
            if (routeTarget) {
              updateSpot(routeTarget.dayIndex, routeTarget.spotId, { routeUrl });
            }
          }}
        />
      </DetailsAccordion>
    </div>
  );
};
