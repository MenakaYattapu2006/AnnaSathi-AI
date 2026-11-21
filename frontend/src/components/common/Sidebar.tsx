import React, { useEffect, useState } from 'react';
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

/** Returns true when viewport width >= 768px (Tailwind md breakpoint) */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
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
  const isDesktop = useIsDesktop();
  const filtered = items.filter((it) => !it.roles || it.roles.includes(role));

  if (!isDesktop) return null;

  return (
    <aside
      className={`flex flex-col w-64 border-r border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#11171D] flex-shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200 ${className}`}
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
                ? 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#0f392b] dark:bg-emerald-950/70 dark:border dark:border-emerald-600/30 text-white shadow-sm shadow-[#0f392b]/20 group transition-all'
                : 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-[#1A232E] transition-all group'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors'
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
                        : 'bg-slate-100 dark:bg-[#1A232E] text-slate-500 dark:text-slate-400'
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
