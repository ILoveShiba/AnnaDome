import React from 'react';
import { useGuideStore } from '../../store/useGuideStore';

export const DocManager: React.FC = () => {
  const docs = useGuideStore((s) => s.docs);
  const addDoc = useGuideStore((s) => s.addDoc);
  const updateDoc = useGuideStore((s) => s.updateDoc);
  const deleteDoc = useGuideStore((s) => s.deleteDoc);

  return (
    <section
      data-sync-section
      data-sync-id="sync-extras"
      className="bg-white border border-[#dcd7d0] rounded-lg p-3 mb-3 shadow-2xs"
    >
      <div className="text-[15px] font-bold text-[#1a2a3a] border-l-4 border-[#c86d51] pl-2 mb-1.5">
        📎 7. 電子票券與重要文件 (超連結)
      </div>
      <div className="text-[12.5px] text-slate-500 mb-2">
        填寫車票 QR Code、登機憑證或 PDF 的線上網址，在手冊中以乾淨的超連結按鈕呈現，點擊直接另開。
      </div>

      <div id="docsContainer" className="space-y-2.5 mb-2">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="border-[1.5px] border-[#e2ded9] bg-[#fcfbf9] rounded-lg p-2.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#2b6cb0] text-sm">📎 票券 / 文件項目</span>
              <button
                type="button"
                onClick={() => deleteDoc(doc.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-[11.5px] font-bold cursor-pointer"
              >
                刪除此文件
              </button>
            </div>

            <div className="mb-2">
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                文件名稱：
              </label>
              <input
                type="text"
                placeholder="例：JR 列車 QRCODE"
                value={doc.title}
                onChange={(e) => updateDoc(doc.id, { title: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>

            <div className="mb-2">
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                備註說明：
              </label>
              <input
                type="text"
                placeholder="例：回程交通：從札幌到新千歲機場坐 JR 列車"
                value={doc.note}
                onChange={(e) => updateDoc(doc.id, { note: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-bold mb-1 text-slate-600">
                圖檔 / 票券連結網址：
              </label>
              <input
                type="text"
                placeholder="例：https://example.com/ticket.jpg 或 Google Drive 連結"
                value={doc.linkUrl}
                onChange={(e) => updateDoc(doc.id, { linkUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-sm bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addDoc}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-[12.5px] font-bold cursor-pointer mt-1"
      >
        + 新增重要文件 / 票券
      </button>
    </section>
  );
};
