import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Optional error message displayed below the input */
  error?: string;
  /** Additional wrapper class names */
  wrapperClassName?: string;
}

/**
 * Reusable input field component following the AnnaSathi AI design system.
 * Supports label, error state, and all native input attributes.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  wrapperClassName = '',
  className = '',
  id,
  ...rest
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`mb-4 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-text mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border bg-white text-primary-text px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 ${
          error ? 'border-red-500' : 'border-border'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
