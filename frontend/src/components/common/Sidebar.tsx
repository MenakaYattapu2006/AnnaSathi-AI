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
}

/**
 * Clean and minimal enterprise sidebar component.
 * Displays strictly the navigation pages for the user's role.
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
      className={`hidden md:flex flex-col w-64 border-r border-slate-200 bg-white flex-shrink-0 min-h-[calc(100vh-4rem)] ${className}`}
      data-purpose="primary-sidebar"
    >
      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {filtered.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onItemClick}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#0f392b] text-white shadow-sm shadow-[#0f392b]/20 group transition-all'
                : 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:text-[#0f392b] hover:bg-slate-50 transition-all group'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-emerald-700 transition-colors'
                  }
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (item.badge === undefined || item.badge === null) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
