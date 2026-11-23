import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

/**
 * Reusable button component following the AnnaSathi AI design system.
 * Supports primary, secondary and outline variants with three sizes.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const sizeMap: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const variantMap: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0f392b] text-white hover:bg-emerald-800 dark:bg-blue-600 dark:hover:bg-blue-500 focus-visible:ring-emerald-600 dark:focus-visible:ring-blue-500 shadow-xs',
    secondary:
      'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus-visible:ring-emerald-500 dark:focus-visible:ring-blue-500 shadow-xs',
    outline:
      'border border-slate-200 dark:border-[#1E293B] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A232E] focus-visible:ring-emerald-600 dark:focus-visible:ring-blue-500',
  };

  return (
    <button
      className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};



