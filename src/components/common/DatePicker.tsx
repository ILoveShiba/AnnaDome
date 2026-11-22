import React from 'react';
import clsx from 'clsx';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-xs font-semibold text-stone-700">{label}</label>}
      <input
        type="date"
        className={clsx(
          'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all',
          className
        )}
        {...props}
      />
    </div>
  );
};

