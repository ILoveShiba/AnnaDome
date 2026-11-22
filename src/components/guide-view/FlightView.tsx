import React from 'react';
import { PlaneTakeoff, PlaneLanding, Clock, ArrowRight } from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { DetailsAccordion } from '../common/DetailsAccordion';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';
import { Button } from '../common/Button';

export interface FlightViewProps {
  isEditable: boolean;
}

export const FlightView: React.FC<FlightViewProps> = ({ isEditable }) => {
  const flights = useGuideStore((s) => s.flights);
  const addFlight = useGuideStore((s) => s.addFlight);
  const updateFlight = useGuideStore((s) => s.updateFlight);
  const deleteFlight = useGuideStore((s) => s.deleteFlight);

  return (
    <div id="preview-sync-flights" className="rounded-2xl transition-all duration-200">
      <DetailsAccordion
        title={`航班資訊 (${flights.length} 段航程)`}
        icon={<PlaneTakeoff className="w-5 h-5" />}
        defaultOpen={true}
        rightActions={
          isEditable ? (
            <Button size="sm" variant="primary" onClick={addFlight}>
              ➕ 新增航班
            </Button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flights.map((flight, index) => {
            const isReturn =
              flight.direction === 'inbound' ||
              (!flight.direction && (flight.type.includes('回') || index % 2 === 1));
            return (
              <div
                key={flight.id}
                id={`preview-sync-flight-${flight.id}`}
                className="bg-stone-50 border border-stone-200 rounded-xl p-4 transition-all duration-200 print-break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      isReturn
                        ? 'bg-stone-200 text-stone-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {isReturn ? (
                      <PlaneLanding className="w-3.5 h-3.5" />
                    ) : (
                      <PlaneTakeoff className="w-3.5 h-3.5" />
                    )}
                    <SchemeCPlaceholder
                      value={flight.type}
                      placeholder={index === 0 ? '去程航班' : '回程航班'}
                      isEditable={isEditable}
                      onValueChange={(val) => updateFlight(flight.id, { type: val })}
                    />
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-800">
                      <SchemeCPlaceholder
                        value={flight.flightNo}
                        placeholder="例：JX800 星宇航空"
                        isEditable={isEditable}
                        onValueChange={(val) => updateFlight(flight.id, { flightNo: val })}
                      />
                    </span>

                    {isEditable && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteFlight(flight.id)}
                        className="!px-2 !py-0.5"
                      >
                        ✕ 刪除
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-2">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>時間：</span>
                  <SchemeCPlaceholder
                    value={flight.time}
                    placeholder="例：2026/11/20 08:30 - 12:35"
                    isEditable={isEditable}
                    onValueChange={(val) => updateFlight(flight.id, { time: val })}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium bg-white border border-stone-200/80 rounded-lg px-3 py-2">
                  <SchemeCPlaceholder
                    value={flight.dep}
                    placeholder="例：TPE 桃園 T1"
                    isEditable={isEditable}
                    onValueChange={(val) => updateFlight(flight.id, { dep: val })}
                  />
                  <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
                  <SchemeCPlaceholder
                    value={flight.arr}
                    placeholder="例：NRT 成田 T2"
                    isEditable={isEditable}
                    onValueChange={(val) => updateFlight(flight.id, { arr: val })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </DetailsAccordion>
    </div>
  );
};
