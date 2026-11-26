import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const DocManager: React.FC = () => {
  const docs = useGuideStore((s) => s.docs);
  const addDoc = useGuideStore((s) => s.addDoc);
  const updateDoc = useGuideStore((s) => s.updateDoc);
  const deleteDoc = useGuideStore((s) => s.deleteDoc);

  return (
    <details
      id="studio-sec-7"
      open
      data-sync-section
      data-sync-id="sync-extras"
      className="group bg-white border border-[#dcd7d0] rounded-lg px-2.5 py-2 mb-2 shadow-2xs"
    >
      <summary className="list-none cursor-pointer select-none flex items-center justify-between">
        <div className="text-[14.5px] leading-tight font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2">
          📎 7. 電子票券與重要文件
        </div>
        <span className="text-xs text-slate-400 font-semibold group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>

      <div className="mt-1.5">
        <div id="docsContainer" className="space-y-1.5 mb-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[#2b6cb0] text-[13px] leading-tight">
                  📎 票券 / 文件項目
                </span>
                <button
                  type="button"
                  onClick={() => deleteDoc(doc.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                >
                  刪除
                </button>
              </div>

              <div className="mb-1.5">
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  文件名稱：
                </label>
                <input
                  type="text"
                  placeholder="例：Visit Japan Web QR Code"
                  value={doc.title}
                  onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>

              <div className="mb-1.5">
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  備註說明：
                </label>
                <input
                  type="text"
                  placeholder="例：下機後連機場 Wi-Fi 開啟"
                  value={doc.note}
                  onChange={(e) => updateDoc(doc.id, { note: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] leading-tight font-bold mb-0.5 text-slate-600">
                  票券 / 檔案連結網址：
                </label>
                <input
                  type="text"
                  placeholder="例：https://... 或雲端硬碟連結"
                  value={doc.linkUrl}
                  onChange={(e) => updateDoc(doc.id, { linkUrl: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-[13.5px] leading-snug bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addDoc}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer"
        >
          + 新增票券 / 文件
        </button>
      </div>
    </details>
  );
};
