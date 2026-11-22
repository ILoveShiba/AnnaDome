import React from 'react';
import clsx from 'clsx';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  hint,
  rightSlot,
  className,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 tracking-wide">{label}</label>
          {rightSlot}
        </div>
      )}
      <input
        className={clsx(
          'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 placeholder:italic focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all',
          className
        )}
        {...props}
      />
      {hint && <span className="text-[11px] text-stone-500">{hint}</span>}
    </div>
  );
};

