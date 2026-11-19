import React from 'react';
import { NavLink } from 'react-router-dom';

export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: UserRole[]; // if omitted, visible to all
}

interface SidebarProps {
  /** List of navigation items */
  items: SidebarItem[];
  /** Current user role */
  role: UserRole;
  /** Optional class name for wrapper */
  className?: string;
}

/**
 * Reusable sidebar component.
 * - Shows only items allowed for the given role.
 * - Highlights the active NavLink via NavLink's "isActive" prop.
 * - Collapsible on mobile via CSS utilities (handled by parent layout).
 */
export const Sidebar: React.FC<SidebarProps> = ({ items, role, className = '' }) => {
  const filtered = items.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <aside className={`sidebar ${className}`}>
      <nav className="flex flex-col py-4 space-y-1">
        {filtered.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md text-primary-text hover:bg-surface-container-low ${
                isActive ? 'bg-primary text-white font-medium' : ''
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
