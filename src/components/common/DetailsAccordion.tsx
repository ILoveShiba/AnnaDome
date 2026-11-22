import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useAccordionSync } from '../../services/pdfExport';

export interface DetailsAccordionProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'section' | 'day';
  rightActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * 支援預設全收合的細節折疊卡片
 * 關鍵設計：始終保持 <details open> 避免瀏覽器 Shadow DOM 阻擋列印，
 * 改由 CSS `.accordion-collapsed` 在螢幕上隱藏內容，並在 `@media print` 強制 100% 展開。
 */
export const DetailsAccordion: React.FC<DetailsAccordionProps> = ({
  title,
  icon,
  badge,
  defaultOpen = false,
  variant = 'section',
  rightActions,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useAccordionSync(defaultOpen);

  const handleSummaryClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <details
      open
      data-accordion-open={isOpen ? 'true' : 'false'}
      className={clsx(
        'transition-all print-accordion',
        variant === 'section'
          ? 'bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden mb-4'
          : 'bg-white border border-amber-200/80 rounded-xl overflow-hidden mb-3',
        className
      )}
    >
      <summary
        onClick={handleSummaryClick}
        className={clsx(
          'cursor-pointer select-none flex items-center justify-between gap-3 transition-colors',
          variant === 'section'
            ? clsx(
                'px-5 py-4 bg-white hover:bg-stone-50/80',
                isOpen && 'bg-stone-50/90 border-b border-stone-200'
              )
            : clsx(
                'px-4 py-3 bg-amber-50/60 hover:bg-amber-50',
                isOpen && 'border-b border-amber-200/70'
              )
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-amber-700 shrink-0">{icon}</span>}
          <div
            className={clsx(
              'font-bold truncate',
              variant === 'section'
                ? 'text-base sm:text-lg text-stone-800'
                : 'text-sm sm:text-base text-amber-950'
            )}
          >
            {title}
          </div>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightActions && (
            <div onClick={(e) => e.stopPropagation()} className="no-print flex items-center gap-1">
              {rightActions}
            </div>
          )}
          <ChevronDown
            className={clsx(
              'w-5 h-5 text-stone-400 transition-transform duration-200 no-print',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </summary>

      <div
        className={clsx(
          'accordion-content',
          !isOpen && 'accordion-collapsed',
          variant === 'section' ? 'p-5' : 'p-4 bg-white'
        )}
      >
        {children}
      </div>
    </details>
  );
};
