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
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
    neutral: 'bg-surface border border-border text-primary-text',
  };

  return (
    <span className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${className}`}>
      {children}
    </span>
  );
};
