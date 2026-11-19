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
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white dark:bg-[#131B22] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-3.5 py-2.5 text-sm transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-50 ${
          error ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-[#1E293B]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  );
};
