import React from 'react';
import { Ticket, FileText, ExternalLink } from 'lucide-react';
import { HeroBannerView } from './HeroBannerView';
import { FlightView } from './FlightView';
import { HotelView } from './HotelView';
import { ItineraryView } from './ItineraryView';
import { ShoppingView } from './ShoppingView';
import { DetailsAccordion } from '../common/DetailsAccordion';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';
import { useGuideStore } from '../../store/useGuideStore';

export interface GuideContainerProps {
  isEditable: boolean;
  isModalView?: boolean;
}

export const GuideContainer: React.FC<GuideContainerProps> = ({
  isEditable,
  isModalView = false,
}) => {
  const coupons = useGuideStore((s) => s.coupons);
  const docs = useGuideStore((s) => s.docs);
  const generalNote = useGuideStore((s) => s.generalNote) || '';
  const updateCoupon = useGuideStore((s) => s.updateCoupon);
  const updateDoc = useGuideStore((s) => s.updateDoc);
  const updateField = useGuideStore((s) => s.updateField);

  return (
    <div
      id={isModalView ? 'guide-modal-preview-container' : 'guide-preview-container'}
      className="w-full"
    >
      {isEditable && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between no-print">
          <span>
            💡 <strong>方案 C 行內編輯模式已開啟</strong>：點擊任何虛線框文字即可直接修改；若欄位為預設空白{' '}
            <code className="bg-amber-100 px-1 rounded">(例：...)</code>，點擊時會自動全選文字供直接覆蓋！
          </span>
        </div>
      )}

      <HeroBannerView isEditable={isEditable} />
      <FlightView isEditable={isEditable} />
      <HotelView isEditable={isEditable} />
      <ItineraryView isEditable={isEditable} />
      <ShoppingView isEditable={isEditable} />

      {/* 優惠券與憑證檔案折疊區塊（雙欄同步預設展開） */}
      {(coupons.length > 0 || docs.length > 0 || isEditable) && (
        <div id="preview-sync-extras" className="rounded-2xl transition-all duration-200">
          <DetailsAccordion
            title={`優惠券與重要憑證 (${coupons.length + docs.length})`}
            icon={<Ticket className="w-5 h-5" />}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 print-break-inside-avoid"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      優惠券 Coupon
                    </span>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        開啟條碼
                      </a>
                    )}
                  </div>
                  <div className="font-bold text-stone-800 text-sm mb-1">
                    <SchemeCPlaceholder
                      value={c.title}
                      placeholder="例：唐吉訶德 免稅 10% + 7% 折價券"
                      isEditable={isEditable}
                      onValueChange={(val) => updateCoupon(c.id, { title: val })}
                    />
                  </div>
                  <div className="text-xs text-stone-600">
                    <SchemeCPlaceholder
                      value={c.desc}
                      placeholder="例：結帳時出示手機條碼畫面"
                      isEditable={isEditable}
                      multiline
                      onValueChange={(val) => updateCoupon(c.id, { desc: val })}
                    />
                  </div>
                </div>
              ))}

              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 print-break-inside-avoid"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                      <FileText className="w-3 h-3" />
                      重要憑證 Document
                    </span>
                    {doc.linkUrl && (
                      <a
                        href={doc.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        開啟雲端檔案
                      </a>
                    )}
                  </div>
                  <div className="font-bold text-stone-800 text-sm mb-1">
                    <SchemeCPlaceholder
                      value={doc.title}
                      placeholder="例：Visit Japan Web 入境 QR Code"
                      isEditable={isEditable}
                      onValueChange={(val) => updateDoc(doc.id, { title: val })}
                    />
                  </div>
                  <div className="text-xs text-stone-600">
                    <SchemeCPlaceholder
                      value={doc.note}
                      placeholder="例：已截圖保存於手機相簿"
                      isEditable={isEditable}
                      onValueChange={(val) => updateDoc(doc.id, { note: val })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </DetailsAccordion>
        </div>
      )}

      {/* 7. 備註（純文字章節） */}
      {(generalNote.trim().length > 0 || isEditable) && (
        <div id="preview-sync-notes" className="rounded-2xl transition-all duration-200 mt-4">
          <DetailsAccordion
            title="備註"
            icon={<FileText className="w-5 h-5" />}
            defaultOpen={true}
          >
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-stone-700 whitespace-pre-line leading-relaxed print-break-inside-avoid">
              <SchemeCPlaceholder
                value={generalNote}
                placeholder="例：緊急聯絡資訊、集合提醒或行李打包清單"
                isEditable={isEditable}
                multiline
                onValueChange={(val) => updateField('generalNote', val)}
              />
            </div>
          </DetailsAccordion>
        </div>
      )}
    </div>
  );
};
