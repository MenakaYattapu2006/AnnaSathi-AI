import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingProps {
  /** Optional loading message displayed below spinner */
  message?: string;
  /** Additional class names */
  className?: string;
}

/**
 * Simple centered loading spinner with optional accessible label.
 */
export const Loading: React.FC<LoadingProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`} role="status" aria-live="polite">
      <Loader className="animate-spin text-primary" size={48} aria-hidden="true" />
      {message && <p className="mt-4 text-base text-primary-text">{message}</p>}
    </div>
  );
};



