import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from './Button';

interface BreadcrumbItem {
  label: string;
  href?: string; // if omitted, rendered as plain text
}

interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional action button shown on the right */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  /** Optional breadcrumb trail */
  breadcrumb?: BreadcrumbItem[];
  /** Additional class name */
  className?: string;
}

/**
 * Page header component used at the top of most screens.
 * - Shows breadcrumb (if any), then title & description.
 * - Provides an optional CTA button on the right side.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  breadcrumb,
  className = '',
}) => {
  return (
    <header className={`mb-6 ${className}`}> 
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex text-xs font-medium text-slate-500 dark:text-slate-400 mb-2" aria-label="breadcrumb">
          {breadcrumb.map((item, idx) => (
            <span key={idx} className="flex items-center">
              {item.href ? (
                <NavLink to={item.href} className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400">
                  {item.label}
                </NavLink>
              ) : (
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{item.label}</span>
              )}
              {idx < breadcrumb.length - 1 && <span className="mx-2 text-slate-400 dark:text-slate-600">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>}
        </div>
        {action && (
          <Button variant={action.variant ?? 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </header>
  );
};
