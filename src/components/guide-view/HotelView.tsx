import React from 'react';
import { Building2, MapPin, Calendar, Train } from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { DetailsAccordion } from '../common/DetailsAccordion';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';
import { Button } from '../common/Button';
import { buildGoogleMapsSearchUrl } from '../../services/googleMaps';

export interface HotelViewProps {
  isEditable: boolean;
}

export const HotelView: React.FC<HotelViewProps> = ({ isEditable }) => {
  const hotels = useGuideStore((s) => s.hotels);
  const addHotel = useGuideStore((s) => s.addHotel);
  const updateHotel = useGuideStore((s) => s.updateHotel);
  const deleteHotel = useGuideStore((s) => s.deleteHotel);

  return (
    <div id="preview-sync-hotels" className="rounded-2xl transition-all duration-200">
      <DetailsAccordion
        title={`住宿飯店 (${hotels.length})`}
        icon={<Building2 className="w-5 h-5" />}
        defaultOpen={true}
        rightActions={
          isEditable ? (
            <Button size="sm" variant="primary" onClick={addHotel}>
              ➕ 新增飯店
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {hotels.map((hotel, index) => {
            const mapUrl = buildGoogleMapsSearchUrl(`${hotel.name} ${hotel.address}`.trim());

            return (
              <div
                key={hotel.id}
                id={`preview-sync-hotel-${hotel.id}`}
                className="bg-stone-50 border border-stone-200 rounded-xl p-4 transition-all duration-200 print-break-inside-avoid"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      住宿 #{index + 1}
                    </span>
                    <h4 className="font-bold text-stone-800 text-sm sm:text-base flex flex-wrap items-center gap-1.5">
                      <SchemeCPlaceholder
                        value={hotel.name}
                        placeholder="例：銀座三井花園飯店"
                        isEditable={isEditable}
                        onValueChange={(val) => updateHotel(hotel.id, { name: val })}
                      />
                      {(hotel.engName || isEditable) && (
                        <span className="text-xs font-normal text-stone-500">
                          <SchemeCPlaceholder
                            value={hotel.engName || ''}
                            placeholder="英文名稱"
                            isEditable={isEditable}
                            onValueChange={(val) => updateHotel(hotel.id, { engName: val })}
                          />
                        </span>
                      )}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {mapUrl && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Google Maps 導航
                      </a>
                    )}
                    {isEditable && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteHotel(hotel.id)}
                      >
                        ✕ 刪除飯店
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 mt-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-semibold">入住期間：</span>
                    {isEditable ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="date"
                          value={hotel.checkIn}
                          onChange={(e) => updateHotel(hotel.id, { checkIn: e.target.value })}
                          className="border border-stone-300 rounded px-1.5 py-0.5 text-xs bg-white"
                        />
                        <span>~</span>
                        <input
                          type="date"
                          value={hotel.checkOut}
                          onChange={(e) => updateHotel(hotel.id, { checkOut: e.target.value })}
                          className="border border-stone-300 rounded px-1.5 py-0.5 text-xs bg-white"
                        />
                      </div>
                    ) : (
                      <span>
                        {hotel.checkIn || '(未填入住日)'} ~ {hotel.checkOut || '(未填退房日)'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="font-semibold">地址：</span>
                    <SchemeCPlaceholder
                      value={hotel.address}
                      placeholder="例：東京都中央區銀座 8-13-1"
                      isEditable={isEditable}
                      onValueChange={(val) => updateHotel(hotel.id, { address: val })}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-stone-600 mt-2 pt-2 border-t border-stone-200/70">
                  <Train className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span className="font-semibold shrink-0">交通方式：</span>
                  <SchemeCPlaceholder
                    value={hotel.trans}
                    placeholder="例：新橋站 1 號出口步行 4 分鐘"
                    isEditable={isEditable}
                    onValueChange={(val) => updateHotel(hotel.id, { trans: val })}
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
