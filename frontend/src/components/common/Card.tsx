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
    <div className={`bg-white border border-slate-200/80 text-slate-800 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-200 p-5 ${className}`}>
      {children}
    </div>
  );
};



