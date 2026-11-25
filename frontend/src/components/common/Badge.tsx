import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard badge component with variant, size, and optional indicator dot.
 * Enforces AnnaSathi's emerald, amber, rose, sky, and slate brand theme.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
}) => {
  const base = 'font-medium rounded-full inline-flex items-center justify-center gap-1.5';
  const sizeMap: Record<BadgeSize, string> = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-3.5 py-1.5',
  };

  const variantMap: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200/80 shadow-xs',
    info: 'bg-sky-50 text-sky-800 border border-sky-200/80 shadow-xs',
    neutral: 'bg-slate-100 border border-slate-200 text-slate-700 shadow-xs',
    brand: 'bg-[#0f392b]/10 text-[#0f392b] border border-[#0f392b]/20 font-semibold shadow-xs',
  };

  const dotColorMap: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    brand: 'bg-[#0f392b]',
  };

  return (
    <span className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`}>
      {dot && (
        <span className="relative flex h-2 w-2 items-center justify-center flex-shrink-0">
          {(variant === 'warning' || variant === 'info' || variant === 'success') && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColorMap[variant]} opacity-75`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColorMap[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};



