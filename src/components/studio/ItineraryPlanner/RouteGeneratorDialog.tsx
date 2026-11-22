import React, { useState, useEffect } from 'react';
import { Navigation, X, ExternalLink } from 'lucide-react';
import { Button } from '../../common/Button';
import { TextInput } from '../../common/TextInput';
import { buildGoogleMapsDirectionUrl, TravelMode } from '../../../services/googleMaps';

export interface RouteGeneratorDialogProps {
  isOpen: boolean;
  defaultOrigin?: string;
  defaultDestination?: string;
  onClose: () => void;
  onApplyRoute: (routeUrl: string, summaryText?: string) => void;
}

export const RouteGeneratorDialog: React.FC<RouteGeneratorDialogProps> = ({
  isOpen,
  defaultOrigin = '',
  defaultDestination = '',
  onClose,
  onApplyRoute,
}) => {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [mode, setMode] = useState<TravelMode>('transit');

  useEffect(() => {
    if (isOpen) {
      setOrigin(defaultOrigin);
      setDestination(defaultDestination);
    }
  }, [isOpen, defaultOrigin, defaultDestination]);

  if (!isOpen) return null;

  const previewUrl = buildGoogleMapsDirectionUrl(origin, destination, mode);

  const modeLabels: Record<TravelMode, string> = {
    transit: '🚇 大眾運輸 (Transit)',
    walking: '🚶 步行前往 (Walking)',
    driving: '🚗 開車自駕 (Driving)',
    bicycling: '🚲 單車騎行 (Bicycling)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-stone-800 text-base">
              📍 Google Maps 導航路線快速產生器
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <TextInput
            label="出發地 (Origin)"
            placeholder="例：銀座三井花園飯店 或 上一站在地名稱"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <TextInput
            label="目的地 (Destination)"
            placeholder="例：淺草寺 雷門"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-stone-700">交通方式 (Travel Mode)</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(modeLabels) as TravelMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`text-xs font-medium py-2 px-3 rounded-xl border text-left transition-all ${
                    mode === m
                      ? 'bg-amber-50 border-amber-600 text-amber-900 font-semibold'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>
          </div>

          {previewUrl && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs">
              <div className="font-semibold text-stone-700 mb-1">生成的 Google 導航連結預覽：</div>
              <div className="text-stone-500 break-all line-clamp-2 mb-2">{previewUrl}</div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                在新分頁測試開啟此路線
              </a>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-stone-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!previewUrl}
            onClick={() => {
              onApplyRoute(previewUrl);
              onClose();
            }}
          >
            套用路線網址
          </Button>
        </div>
      </div>
    </div>
  );
};

