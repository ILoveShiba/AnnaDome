import React, { useRef, useEffect } from 'react';
import clsx from 'clsx';

export interface SchemeCPlaceholderProps {
  value: string;
  placeholder: string;
  isEditable: boolean;
  onValueChange: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
}

/**
 * 方案 C：Placeholder 互動式行內編輯元件
 * - 當值為空時，呈現 `(例：...)`，淺灰 (`#9ca3af`) 與斜體 (`italic`)
 * - 點擊/聚焦時自動調用 `window.getSelection()` 全選文字，輸入即直接覆蓋
 * - 支援 multiline 多段落換行（保留 \n 並以 whitespace-pre-line 渲染）
 */
export const SchemeCPlaceholder: React.FC<SchemeCPlaceholderProps> = ({
  value,
  placeholder,
  isEditable,
  onValueChange,
  className,
  multiline = false,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const cleanPlaceholder = placeholder.replace(/^\(|\)$/g, '');
  const isDefault = !value || value.trim() === '';
  const displayContent = isDefault ? `(${cleanPlaceholder})` : value;

  useEffect(() => {
    if (spanRef.current && document.activeElement !== spanRef.current) {
      const currentText = multiline
        ? spanRef.current.innerText
        : spanRef.current.textContent;
      if (currentText !== displayContent) {
        if (multiline) {
          spanRef.current.innerText = displayContent;
        } else {
          spanRef.current.textContent = displayContent;
        }
      }
    }
  }, [displayContent, multiline]);

  const handleFocus = () => {
    if (!isEditable || !spanRef.current) return;
    const currentText = (
      multiline ? spanRef.current.innerText : spanRef.current.textContent
    )?.trim() || '';
    if (isDefault || currentText === `(${cleanPlaceholder})`) {
      requestAnimationFrame(() => {
        if (!spanRef.current) return;
        const range = document.createRange();
        range.selectNodeContents(spanRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (!isEditable) return;
    // multiline 使用 innerText 以完整保留使用者按 Enter 產生的換行 (\n)
    const rawText = (
      multiline ? e.currentTarget.innerText : e.currentTarget.textContent
    )
      ?.replace(/\r\n/g, '\n')
      .trim() || '';

    if (!rawText || rawText === `(${cleanPlaceholder})`) {
      e.currentTarget.textContent = `(${cleanPlaceholder})`;
      onValueChange('');
    } else {
      onValueChange(rawText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <span
      ref={spanRef}
      contentEditable={isEditable}
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      title={
        isEditable
          ? multiline
            ? '點擊可直接編輯（按 Enter 可換行分段）'
            : '點擊可直接編輯（自動全選預設文字）'
          : undefined
      }
      className={clsx(
        'transition-colors min-w-[2ch]',
        multiline ? ' whitespace-pre-line block w-full' : 'inline-block',
        isEditable &&
          'outline-dashed outline-1 outline-amber-600/60 bg-amber-50/30 hover:bg-amber-50/60 focus:bg-white focus:text-stone-900 focus:outline-amber-600 px-1.5 py-0.5 rounded cursor-text',
        isDefault ? '!text-[#9ca3af] italic font-normal' : clsx('font-normal', className)
      )}
    >
      {displayContent}
    </span>
  );
};
