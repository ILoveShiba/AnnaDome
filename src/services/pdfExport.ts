import { useState, useEffect } from 'react';

type AccordionCommandListener = (open: boolean) => void;
const commandListeners = new Set<AccordionCommandListener>();

/**
 * 全域控制所有折疊面板展開或收合（供 FloatingActionBar 與列印前呼叫）
 */
export const setAllAccordionsOpen = (open: boolean): void => {
  commandListeners.forEach((fn) => fn(open));
};

export const useAccordionSync = (defaultOpen = false): [boolean, (val: boolean) => void] => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    const handler: AccordionCommandListener = (open) => setIsOpen(open);
    commandListeners.add(handler);
    return () => {
      commandListeners.delete(handler);
    };
  }, []);

  return [isOpen, setIsOpen];
};

/**
 * 無痕列印與 PDF 匯出服務：
 * 1. 觸發 React 狀態將所有折疊面板展開，並記錄原本展開狀態
 * 2. 配合 @media print 純 CSS 規則強制顯示所有 .accordion-content
 * 3. 列印視窗關閉 (afterprint) 後恢復原本折疊狀態
 */
export const exportGuideToPdf = (): void => {
  const accordionEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-accordion-open]')
  );
  const previousStates = accordionEls.map(
    (el) => el.getAttribute('data-accordion-open') === 'true'
  );

  setAllAccordionsOpen(true);

  let restored = false;
  const restoreStates = () => {
    if (restored) return;
    restored = true;
    // 若原本全部都是收合，恢復收合；否則依各別面板點擊紀錄恢復
    const anyWasOpen = previousStates.some(Boolean);
    if (!anyWasOpen) {
      setAllAccordionsOpen(false);
    }
    window.removeEventListener('afterprint', restoreStates);
  };

  window.addEventListener('afterprint', restoreStates, { once: true });

  requestAnimationFrame(() => {
    setTimeout(() => {
      window.print();
    }, 100);
  });
};
