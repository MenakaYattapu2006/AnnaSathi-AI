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
    <div className={`bg-surface rounded-lg shadow-sm p-4 ${className}`}>
      {children}
    </div>
  );
};
