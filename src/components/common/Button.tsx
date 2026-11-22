import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary: 'bg-amber-700 hover:bg-amber-800 text-white shadow-sm',
    secondary: 'bg-stone-800 hover:bg-stone-900 text-white shadow-sm',
    outline: 'border border-stone-300 bg-white hover:bg-stone-50 text-stone-700',
    ghost: 'bg-transparent hover:bg-stone-100 text-stone-600 hover:text-stone-900',
    danger: 'border border-red-200 bg-red-50 hover:bg-red-100 text-red-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  return (
    <button
      type="button"
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

