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
    <section
      data-sync-section
      data-sync-id="sync-hero"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-2.5">
        🌟 0. 旅遊手冊命名與副標題（自動同步更新大廳卡片）
      </div>

      <div className="mb-2.5">
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          手冊大標題（專案名稱）：
        </label>
        <input
          type="text"
          id="guideTitle"
          placeholder="例：東京 5 Days 口袋隨身手冊"
          value={guideTitle}
          onChange={(e) => updateField('guideTitle', e.target.value)}
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>

      <div className="mb-2.5">
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          手冊副標題：
        </label>
        <input
          type="text"
          id="guideSubtitle"
          placeholder="例：東京夏日漫步 ｜ 08/15 (六) － 08/19 (三)"
          value={guideSubtitle}
          onChange={(e) => updateField('guideSubtitle', e.target.value)}
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5 items-start">
        <div>
          <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
            出發日期（自動連動去程航班）：
          </label>
          <input
            type="text"
            readOnly
            value={startDate ? startDate.replace(/-/g, '/') : '請於下方去程航班選擇日期'}
            title="此欄位為唯讀，自動串聯下方「2. 航班時間資訊 - 去程航班」的日期"
            className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
            結束日期（自動連動回程航班）：
          </label>
          <input
            type="text"
            readOnly
            value={endDate ? endDate.replace(/-/g, '/') : '請於下方回程航班選擇日期'}
            title="此欄位為唯讀，自動串聯下方「2. 航班時間資訊 - 回程航班」的日期"
            className="w-full px-2.5 py-2 border border-slate-200 rounded-md text-sm bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
          />
        </div>
      </div>

      <div className="mb-2.5">
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          大廳卡片封面圖片（網址或本機上傳）：
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="貼上圖片網址，或點右側上傳本機照片..."
            value={isDataUrl ? '（已內嵌本機上傳照片，自動同步雲端與JSON）' : coverUrl}
            readOnly={isDataUrl}
            onChange={(e) => updateField('coverUrl', e.target.value)}
            className={`flex-1 min-w-0 px-2.5 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-600 focus:outline-none ${
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
            title="從電腦或手機上傳照片（自動壓縮並存入 JSON 與 Firebase 雲端）"
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-2 rounded-md text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            {isUploadingCover ? '處理中...' : '📁 上傳照片'}
          </button>
          {trimmedCoverUrl && (
            <button
              type="button"
              onClick={() => updateField('coverUrl', '')}
              title="清除自訂封面，恢復預設封面"
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-2 rounded-md text-xs font-bold cursor-pointer shrink-0"
            >
              ✕
            </button>
          )}
        </div>
        {trimmedCoverUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 px-2.5 py-1 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span>🖼️ 封面圖片即時預覽</span>
              {isDataUrl && (
                <span className="text-[10px] text-emerald-700 font-bold">
                  ✓ 已轉為雲端跨瀏覽器相容格式
                </span>
              )}
            </div>
            <img
              src={trimmedCoverUrl}
              alt="大廳卡片封面預覽"
              className="w-full h-28 object-cover block"
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
        <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
          首頁重點摘要：
        </label>
        <textarea
          id="guideSummary"
          rows={3}
          placeholder="此欄位請自由填寫，如成員、重點行程、行前須知等（每行自動轉為條列清單）"
          value={guideSummary}
          onChange={(e) => updateField('guideSummary', e.target.value)}
          className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-sm bg-white focus:border-blue-600 focus:outline-none"
        />
      </div>
    </section>
  );
};
