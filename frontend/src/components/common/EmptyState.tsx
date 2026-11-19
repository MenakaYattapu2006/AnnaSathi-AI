import React from 'react';
import { XCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Primary headline */
  title: string;
  /** Supporting text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /** Additional class names */
  className?: string;
}

/**
 * Empty state placeholder used when a list or data set has no items.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}> 
      {icon ?? <XCircle className="text-primary" size={64} />}
      <h2 className="mt-4 text-xl font-medium text-primary-text">{title}</h2>
      {description && (
        <p className="mt-2 text-base text-secondary-text text-center max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button
          className="mt-6"
          variant={action.variant ?? 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
