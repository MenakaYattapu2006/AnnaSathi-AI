import React, { useState, useCallback, useEffect } from 'react';
import { Menu, X, Bell } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarProps {
  /** Optional list of navigation items (desktop & mobile) */
  items?: NavItem[];
  /** User name or avatar placeholder */
  userName?: string;
}

/**
 * Responsive top navigation bar.
 * - Shows logo/name on the left.
 * - Desktop shows nav items and notification icon.
 * - Mobile collapses into a hamburger menu.
 * - Escape key closes the mobile menu.
 */
export const Navbar: React.FC<NavbarProps> = ({ items = [], userName = 'User' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMenu = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen, closeMenu]);

  // Prevent body scrolling while mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="site-header">
      {/* Left: logo/name — white text on green background */}
      <div className="flex items-center gap-2">
        <svg
          className="h-6 w-6 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        </svg>
        <span className="font-bold text-lg text-white">AnnaSathi AI</span>
      </div>

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center gap-4">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="text-white/80 hover:text-white px-3 py-2 rounded-md font-medium"
          >
            {item.label}
          </a>
        ))}
        <button
          className="text-white/80 hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
        <span className="text-white font-medium">{userName}</span>
      </nav>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-white focus:outline-none"
        onClick={toggleMenu}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <div className="fixed top-0 left-0 w-64 h-full bg-surface shadow-lg z-50 p-4 md:hidden">
          <div className="flex items-center justify-between mb-6">
            <span className="font-bold text-lg text-primary-text">Menu</span>
            <button
              onClick={closeMenu}
              className="text-primary-text hover:text-primary"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex flex-col gap-2">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link"
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
            <button className="text-primary-text hover:text-primary text-left" aria-label="Notifications">
              <Bell size={20} className="inline mr-2" />
              Notifications
            </button>
            <span className="text-primary-text mt-4 font-medium">{userName}</span>
          </nav>
        </div>
      )}
    </header>
  );
};



