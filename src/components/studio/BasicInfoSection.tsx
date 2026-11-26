import React, { useRef, useState } from 'react';
import { useGuideStore } from '../../store/useGuideStore';
import { compressImageFileToDataUrl } from '../../services/imageUtils';

export const BasicInfoSection: React.FC = () => {
  const guideTitle = useGuideStore((s) => s.guideTitle);
  const guideSubtitle = useGuideStore((s) => s.guideSubtitle);
  const guideSummary = useGuideStore((s) => s.guideSummary);
  const startDate = useGuideStore((s) => s.startDate) || '';
  const endDate = useGuideStore((s) => s.endDate) || '';
  const coverUrl = useGuideStore((s) => s.coverUrl) || '';

  const updateField = useGuideStore((s) => s.updateField);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const trimmedCoverUrl = coverUrl.trim();
  const isDataUrl = trimmedCoverUrl.startsWith('data:image/');

  const handleUploadLocalCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      updateField('coverUrl', dataUrl);
    } catch (err: any) {
      alert(err?.message || '處理封面圖片失敗！');
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  return (
    <details
      id="studio-sec-0"
      open
      data-sync-section
      data-sync-id="sync-hero"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          🌟 0. 旅遊手冊命名與副標題
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div className="mb-1.5">
          <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
            手冊大標題：
          </label>
          <input
            type="text"
            id="guideTitle"
            placeholder="例：東京 5 日隨身手冊"
            value={guideTitle}
            onChange={(e) => updateField('guideTitle', e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="mb-1.5">
          <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
            手冊副標題：
          </label>
          <input
            type="text"
            id="guideSubtitle"
            placeholder="例：東京夏日漫步 ｜ 08/15 (六) － 08/19 (三)"
            value={guideSubtitle}
            onChange={(e) => updateField('guideSubtitle', e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-1.5 items-start">
          <div>
            <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
              出發日期（連動去程）：
            </label>
            <input
              type="text"
              readOnly
              value={startDate ? startDate.replace(/-/g, '/') : '自動帶入去程日期'}
              title="唯讀，自動串聯下方去程航班日期"
              className="w-full px-2 py-1 border border-slate-200 rounded-md text-[13.5px] leading-snug bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
            />
          </div>
          <div>
            <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
              結束日期（連動回程）：
            </label>
            <input
              type="text"
              readOnly
              value={endDate ? endDate.replace(/-/g, '/') : '自動帶入回程日期'}
              title="唯讀，自動串聯下方回程航班日期"
              className="w-full px-2 py-1 border border-slate-200 rounded-md text-[13.5px] leading-snug bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
            />
          </div>
        </div>

        <div className="mb-1.5">
          <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
            大廳卡片封面圖片（網址或本機上傳）：
            <span className="text-[11px] text-slate-400 font-normal ml-1">
              （建議橫式 16:9 或 1200×480 px，主體置中避免上下裁切）
            </span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="貼上圖片網址，或點右側上傳照片..."
              value={isDataUrl ? '（已套用本機上傳照片）' : coverUrl}
              readOnly={isDataUrl}
              onChange={(e) => updateField('coverUrl', e.target.value)}
              className={`flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug focus:border-blue-600 focus:outline-none ${
                isDataUrl ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'bg-white'
              }`}
            />
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadLocalCover}
            />
            <button
              type="button"
              disabled={isUploadingCover}
              onClick={() => coverFileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              {isUploadingCover ? '處理中...' : '📁 上傳照片'}
            </button>
            {trimmedCoverUrl && (
              <button
                type="button"
                onClick={() => updateField('coverUrl', '')}
                title="清除自訂封面"
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            )}
          </div>
          {trimmedCoverUrl && (
            <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
              <div className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <span>🖼️ 封面預覽</span>
                {isDataUrl && (
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ✓ 已壓縮內嵌
                  </span>
                )}
              </div>
              <img
                src={trimmedCoverUrl}
                alt="封面預覽"
                className="w-full h-24 object-cover block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                onLoad={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'block';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
            首頁重點摘要：
          </label>
          <textarea
            id="guideSummary"
            rows={2}
            placeholder="自由填寫重點行程或行前須知（每行自動轉為條列）"
            value={guideSummary}
            onChange={(e) => updateField('guideSummary', e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>
    </details>
  );
};
