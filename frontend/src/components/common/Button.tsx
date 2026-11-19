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
    'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const sizeMap: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  const variantMap: Record<ButtonVariant, string> = {
    primary:
      'bg-primary text-white hover:bg-secondary focus-visible:ring-primary',
    secondary:
      'bg-secondary text-white hover:bg-primary focus-visible:ring-secondary',
    outline:
      'border border-border text-primary hover:bg-primary hover:text-white focus-visible:ring-primary',
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
