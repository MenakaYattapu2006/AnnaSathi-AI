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
    <div className={`bg-white border border-slate-200/90 text-slate-800 rounded-2xl shadow-xs hover:shadow-sm transition-all duration-200 p-5 ${className}`}>
      {children}
    </div>
  );
};



