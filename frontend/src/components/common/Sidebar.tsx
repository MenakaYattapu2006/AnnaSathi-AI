import React from 'react';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../../types/user';

export interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  roles?: UserRole[];
}

interface SidebarProps {
  /** List of navigation items */
  items: SidebarItem[];
  /** Current user role */
  role: UserRole;
  /** Optional class name for wrapper */
  className?: string;
  /** Callback when item is clicked (for closing mobile overlay) */
  onItemClick?: () => void;
  /** Mobile open state */
  isOpen?: boolean;
}

/**
 * Enterprise sidebar component.
 * - Always visible on desktop (full w-64 with labels and badges)
 * - Always visible on phone/mobile (compact responsive rail with icons & labels)
 * - Displays all navigation pages for the user's role
 */
export const Sidebar: React.FC<SidebarProps> = ({
  items,
  role,
  className = '',
  onItemClick,
}) => {
  const filtered = items.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <aside
      className={`hidden md:flex flex-col w-20 md:w-64 border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#11171D] flex-shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-200 ${className}`}
      data-purpose="primary-sidebar"
    >
      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 p-2 md:p-3 space-y-1.5 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            title={item.label}
            className={({ isActive }) =>
              isActive
                ? 'flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-1.5 md:px-3.5 py-2 md:py-2.5 text-xs md:text-sm font-semibold rounded-xl bg-[#0f392b] dark:bg-emerald-950/70 dark:border dark:border-emerald-600/30 text-white shadow-sm shadow-[#0f392b]/20 group transition-all text-center md:text-left'
                : 'flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-1.5 md:px-3.5 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1A232E] transition-all group text-center md:text-left'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex-shrink-0 ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'
                  }`}
                >
                  {item.icon}
                </span>

                {/* Mobile compact label */}
                <span className="block md:hidden text-[10px] leading-tight truncate max-w-[64px] font-medium">
                  {item.label}
                </span>

                {/* Desktop full label */}
                <span className="hidden md:inline flex-1 truncate">
                  {item.label}
                </span>

                {/* Badge count */}
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`hidden md:inline px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-slate-100 dark:bg-[#1A232E] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active indicator dot */}
                {isActive && (item.badge === undefined || item.badge === null) && (
                  <span className="hidden md:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
