import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText } from 'lucide-react';
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

const ROLE_SECTIONS: Record<UserRole, { title: string; tag: string }> = {
  admin: { title: 'Governance Console', tag: 'Enterprise' },
  donor: { title: 'Surplus Dispatch', tag: 'Partner' },
  ngo: { title: 'Relief Operations', tag: 'Verified NGO' },
  volunteer: { title: 'Field Operations', tag: 'Courier' },
};

/**
 * Reusable sidebar component matching the AnnaSathi AI enterprise design system.
 * - Highlights the active NavLink with dark forest green background and emerald indicator.
 * - Shows role-specific context tag, secondary compliance sections, and cluster sync telemetry.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  items,
  role,
  className = '',
  onItemClick,
}) => {
  const filtered = items.filter((it) => !it.roles || it.roles.includes(role));
  const section = ROLE_SECTIONS[role] || { title: 'Operations Console', tag: 'Active' };

  return (
    <aside
      className={`hidden md:flex flex-col w-64 border-r border-slate-200 bg-white flex-shrink-0 min-h-[calc(100vh-4rem)] ${className}`}
      data-purpose="primary-sidebar"
    >
      {/* Quick Context Switcher / Section Tag */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          {section.title}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
          {section.tag}
        </span>
      </div>

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

        {/* Secondary Section Divider for Admin Compliance */}
        {role === 'admin' && (
          <>
            <div className="pt-4 pb-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3.5">
                Compliance &amp; System
              </div>
            </div>
            <NavLink
              to="/admin/reports"
              onClick={onItemClick}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#0f392b] text-white shadow-sm shadow-[#0f392b]/20 group transition-all'
                  : 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:text-[#0f392b] hover:bg-slate-50 transition-all group'
              }
            >
              {({ isActive }) => (
                <>
                  <FileText
                    className={`w-5 h-5 ${
                      isActive
                        ? 'text-emerald-400'
                        : 'text-slate-400 group-hover:text-emerald-700 transition-colors'
                    }`}
                  />
                  <span className="flex-1 truncate">Audit Trail</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Sidebar Footer / System Telemetry Pill */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium">Cluster Sync</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 99.98%
          </span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
        </div>
      </div>
    </aside>
  );
};
