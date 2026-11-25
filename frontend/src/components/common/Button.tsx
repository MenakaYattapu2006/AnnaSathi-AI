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
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] select-none';

  const sizeMap: Record<ButtonSize, string> = {
    sm: 'text-xs sm:text-sm px-3.5 py-2 font-semibold',
    md: 'text-sm sm:text-base px-4.5 py-2.5 font-semibold',
    lg: 'text-base sm:text-lg px-6 py-3 font-semibold',
  };

  const variantMap: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0f392b] text-white hover:bg-emerald-800 focus-visible:ring-emerald-600 shadow-sm hover:shadow-md hover:shadow-emerald-900/10',
    secondary:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-sm hover:shadow-md hover:shadow-emerald-600/15',
    outline:
      'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 focus-visible:ring-emerald-600 shadow-xs hover:shadow-sm',
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



