import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple badge component with variant and size support.
 * Uses Tailwind classes that map to the design-system colors defined in tailwind.config.cjs.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) => {
  const base = 'font-medium rounded-full inline-flex items-center justify-center';
  const sizeMap: Record<BadgeSize, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const variantMap: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 dark:bg-blue-950/40 text-emerald-700 dark:text-blue-300 border border-emerald-200/50 dark:border-blue-800/40',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40',
    info: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40',
    neutral: 'bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-300',
  };

  return (
    <span className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
};



