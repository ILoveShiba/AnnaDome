import { useEffect } from 'react';
import { setAllAccordionsOpen } from './pdfExport';

/**
 * 將右側預覽面板捲動對齊至指定的 data-sync-id 目標並顯示高亮提示
 */
export function scrollPreviewToSyncId(syncId: string, highlight = true): void {
  const guidePanel = document.getElementById('guide-scroll-viewport');
  const targetEl =
    document.getElementById(`preview-${syncId}`) ||
    (syncId === 'sync-companions' ? document.getElementById('preview-sync-hero') : null);
  if (!guidePanel || !targetEl) return;

  // 確保目標所在的折疊面板是展開的
  const parentDetails = targetEl.closest('details');
  if (parentDetails) {
    parentDetails.setAttribute('data-accordion-open', 'true');
    const content = parentDetails.querySelector('.accordion-content');
    if (content) content.classList.remove('accordion-collapsed');
  }

  const panelRect = guidePanel.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const offsetInsidePanel = targetRect.top - panelRect.top + guidePanel.scrollTop - 16;

  guidePanel.scrollTo({
    top: Math.max(0, offsetInsidePanel),
    behavior: 'smooth',
  });

  if (highlight) {
    document.querySelectorAll('.sync-highlight-active').forEach((el) => {
      el.classList.remove('sync-highlight-active', 'ring-2', 'ring-amber-500');
    });
    targetEl.classList.add('sync-highlight-active', 'ring-2', 'ring-amber-500');
  }
}

/**
 * 雙欄同步對應 Hook：
 * 1. 初次進入產生器時預設全部展開右側所有區塊
 * 2. 監聽左欄 (#studio-panel) 的 focusin / input / click 事件，即時將右欄對齊至正在編輯的區塊或單一景點/飯店/航班
 * 3. 監聽視窗捲動 (scroll)，當使用者捲動左欄表單時，右欄預覽自動跟隨捲動至對應段落
 */
export function usePreviewSync(activeView: 'hub' | 'generator'): void {
  useEffect(() => {
    if (activeView !== 'generator') return;

    // 預設全部打開右側折疊面板
    setAllAccordionsOpen(true);

    let isUserInteractingWithForm = false;
    let interactionTimeout: number | undefined;

    const handleFormInteraction = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const syncNode = target.closest<HTMLElement>('[data-sync-id]');
      if (!syncNode) return;

      const syncId = syncNode.getAttribute('data-sync-id');
      if (syncId) {
        isUserInteractingWithForm = true;
        window.clearTimeout(interactionTimeout);
        interactionTimeout = window.setTimeout(() => {
          isUserInteractingWithForm = false;
        }, 900);
        scrollPreviewToSyncId(syncId, true);
      }
    };

    const handleWindowScroll = () => {
      if (isUserInteractingWithForm) return;
      const studioPanel = document.getElementById('studio-panel');
      if (!studioPanel) return;

      const stickyHeaderHeight =
        document.getElementById('sticky-top-header')?.getBoundingClientRect().height || 150;
      const anchorLineY = stickyHeaderHeight + 40;

      const syncBlocks = Array.from(
        studioPanel.querySelectorAll<HTMLElement>('[data-sync-section]')
      );
      let activeBlock: HTMLElement | null = null;

      for (const block of syncBlocks) {
        const rect = block.getBoundingClientRect();
        if (rect.top <= anchorLineY + 60 && rect.bottom >= anchorLineY - 20) {
          activeBlock = block;
          break;
        }
      }

      if (activeBlock) {
        const syncId = activeBlock.getAttribute('data-sync-id');
        if (syncId) {
          scrollPreviewToSyncId(syncId, false);
        }
      }
    };

    const studioPanel = document.getElementById('studio-panel');
    studioPanel?.addEventListener('focusin', handleFormInteraction);
    studioPanel?.addEventListener('input', handleFormInteraction);
    studioPanel?.addEventListener('click', handleFormInteraction);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      studioPanel?.removeEventListener('focusin', handleFormInteraction);
      studioPanel?.removeEventListener('input', handleFormInteraction);
      studioPanel?.removeEventListener('click', handleFormInteraction);
      window.removeEventListener('scroll', handleWindowScroll);
      window.clearTimeout(interactionTimeout);
    };
  }, [activeView]);
}
