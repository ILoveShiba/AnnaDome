import React from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useGuideStore } from '../../store/useGuideStore';
import { DetailsAccordion } from '../common/DetailsAccordion';
import { SchemeCPlaceholder } from '../common/SchemeCPlaceholder';
import { Button } from '../common/Button';

export interface ShoppingViewProps {
  isEditable: boolean;
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({ isEditable }) => {
  const shopping = useGuideStore((s) => s.shopping);
  const addShopping = useGuideStore((s) => s.addShopping);
  const updateShopping = useGuideStore((s) => s.updateShopping);
  const deleteShopping = useGuideStore((s) => s.deleteShopping);

  return (
    <div id="preview-sync-shopping" className="rounded-2xl transition-all duration-200">
      <DetailsAccordion
        title={`必買伴手禮與採買清單 (${shopping.length})`}
        icon={<ShoppingBag className="w-5 h-5" />}
        defaultOpen={true}
        rightActions={
          isEditable ? (
            <Button size="sm" variant="primary" onClick={addShopping}>
              ➕ 新增列
            </Button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                <th className="py-3 px-4 font-bold w-2/5 border-r border-stone-200">
                  類別 / 採買品項
                </th>
                <th className="py-3 px-4 font-bold">建議地點與提醒</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {shopping.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/70 print-break-inside-avoid">
                  <td className="py-3 px-4 align-top font-semibold text-stone-800 border-r border-stone-200">
                    <SchemeCPlaceholder
                      value={item.cat}
                      placeholder="例：合利他命 EX Plus"
                      isEditable={isEditable}
                      onValueChange={(val) => updateShopping(item.id, { cat: val })}
                    />
                  </td>
                  <td className="py-3 px-4 align-top text-stone-600">
                    <div className="flex items-start justify-between gap-2">
                      <SchemeCPlaceholder
                        value={item.desc}
                        placeholder="例：松本清或大國藥妝，滿 5,500 日圓出示護照免稅 10%"
                        isEditable={isEditable}
                        multiline
                        onValueChange={(val) => updateShopping(item.id, { desc: val })}
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => deleteShopping(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded shrink-0 no-print"
                          title="刪除此列"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailsAccordion>
    </div>
  );
};
