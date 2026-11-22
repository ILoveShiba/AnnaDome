import React from 'react';
import { Plane, Sparkles } from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';

export interface HeroBannerViewProps {
  isEditable: boolean;
}

export const HeroBannerView: React.FC<HeroBannerViewProps> = ({ isEditable }) => {
  const guideTitle = useGuideStore((s) => s.guideTitle);
  const guideSubtitle = useGuideStore((s) => s.guideSubtitle);
  const guideSummary = useGuideStore((s) => s.guideSummary);
  const companions = useGuideStore((s) => s.companions) || '';
  const coverUrl = useGuideStore((s) => s.coverUrl) || '';
  const updateField = useGuideStore((s) => s.updateField);

  const activeCoverUrl =
    coverUrl.trim() ||
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=80';

  return (
    <div
      id="preview-sync-hero"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white p-6 sm:p-8 mb-5 shadow-xl transition-all duration-200 print-break-inside-avoid"
    >
      {/* 底層：專案封面圖片背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-[1.02]"
        style={{ backgroundImage: `url('${activeCoverUrl}')` }}
      />
      {/* 中層：左深右透漸層遮罩，讓封面圖片風景透出同時確保白字清晰好讀 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/35" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-black/35 backdrop-blur-xs border border-white/15 text-amber-200 mb-3">
          <Plane className="w-3.5 h-3.5" />
          <span>TRAVEL HANDBOOK · 互動式旅行手冊</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-snug mb-2 drop-shadow-sm">
          <SchemeCPlaceholder
            value={guideTitle}
            placeholder="大標題"
            isEditable={isEditable}
            onValueChange={(val) => updateField('guideTitle', val)}
            className="text-white !font-bold"
          />
        </h1>

        <div className="text-sm sm:text-base text-amber-200/95 font-medium mb-3 drop-shadow-xs">
          <SchemeCPlaceholder
            value={guideSubtitle}
            placeholder="副標題：例 5天4夜 自由行手冊"
            isEditable={isEditable}
            onValueChange={(val) => updateField('guideSubtitle', val)}
            className="text-amber-200"
          />
        </div>

        {(companions.trim().length > 0 || isEditable) && (
          <div
            id="preview-sync-companions"
            className="inline-flex flex-wrap items-center gap-1.5 bg-black/35 backdrop-blur-xs border border-white/20 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-amber-100 font-medium mb-4 transition-all duration-200"
          >
            <span className="font-bold text-amber-300">👥 旅行夥伴：</span>
            <SchemeCPlaceholder
              value={companions}
              placeholder="例：Anna、Charles"
              isEditable={isEditable}
              onValueChange={(val) => updateField('companions', val)}
              className="text-white"
            />
          </div>
        )}

        <div className="bg-black/45 backdrop-blur-xs border-l-4 border-amber-400 rounded-xl p-3.5 text-xs sm:text-sm text-stone-100 leading-relaxed">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>行程摘要與重點提醒</span>
          </div>
          <SchemeCPlaceholder
            value={guideSummary}
            placeholder="例：精選市區與近郊景點，點擊各項目即可直接開啟 Google Maps 導航"
            isEditable={isEditable}
            multiline
            onValueChange={(val) => updateField('guideSummary', val)}
            className="text-stone-100"
          />
        </div>
      </div>
    </div>
  );
};
