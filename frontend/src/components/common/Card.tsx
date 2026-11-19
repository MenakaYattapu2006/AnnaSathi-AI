import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Simple card component following the design system.
 * Uses Tailwind utilities for surface color, rounded corners and shadow.
 */
export const Card: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-white dark:bg-[#11171D] border border-slate-200/80 dark:border-[#1E293B] text-slate-800 dark:text-slate-100 rounded-2xl shadow-sm transition-colors duration-200 p-4 ${className}`}>
      {children}
    </div>
  );
};
