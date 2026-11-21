import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Bell, LogOut, Menu, X, Search, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getNavItems, ROLE_LABELS } from '../routes/navigation';
import { Sidebar } from '../components/common/Sidebar';
import { AIChatbotModal } from '../components/common/AIChatbotModal';
import { apiClient, mapNotificationFromDb } from '../lib/apiClient';
import { mockDataService } from '../lib/mockDataService';
import type { Notification } from '../types/notification';

const isProduction = Boolean((import.meta as any).env?.PROD);

const getInitials = (name?: string): string => {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

const getRoleSubtitle = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Root Governance';
    case 'donor':
      return 'Food Donor Partner';
    case 'ngo':
      return 'Verified NGO Partner';
    case 'volunteer':
      return 'Agile Logistics Partner';
    default:
      return 'Network Partner';
  }
};

const getSearchPlaceholder = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Search telemetry, NGOs...';
    case 'donor':
      return 'Search surplus food listings...';
    case 'ngo':
      return 'Search available donations...';
    case 'volunteer':
      return 'Search rescue courier tasks...';
    default:
      return 'Search network...';
  }
};

/**
 * Enterprise MainLayout component for authenticated modules (Admin, Donor, NGO, Volunteer).
 * Features a sticky frosted-glass navigation bar, high-contrast sidebar, and responsive mobile drawer.
 */
export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiClient.notifications.getAll();
      if (res?.notifications) {
        setNotifications(res.notifications.map(mapNotificationFromDb));
        return;
      }
    } catch {
      if (isProduction) return;
    }
    if (user) {
      setNotifications(mockDataService.getNotificationsByUser(user.id));
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.notifications.markRead(id);
    } catch {
      // offline dev fallback
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'read' as const } : n))
    );
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.notifications.markAllRead();
    } catch {
      // offline dev fallback
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' as const })));
  };

  // Close notifications dropdown on outside click
  useEffect(() => {
    if (!notifMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifMenuOpen]);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sidebarOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!user) return null;

  const navItems = getNavItems(user.role);
  const sidebarItems = navItems.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    badge: (item as any).badge,
  }));

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile drawer overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#11171D] z-50 transform transition-transform duration-200 ease-out">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1E293B]">
              <span className="text-lg font-bold text-[#0f392b] dark:text-emerald-400">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-emerald-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar items={sidebarItems} role={user.role as any} onItemClick={closeSidebar} className="h-full" />
          </aside>
        </>
      )}
      {/* Main layout wrapper */}
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090D10] text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-200">
        {/* ───── Top Header Bar ───── */}
        <header
          className="sticky top-0 z-40 bg-white/90 dark:bg-[#11171D]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E293B] h-16 flex items-center justify-between px-4 lg:px-7 transition-all duration-200"
          data-purpose="global-header"
        >
          {/* Left: Hamburger (Mobile) + Brand Logo & Title */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1A232E] rounded-lg transition-colors focus:outline-none"
              aria-label={sidebarOpen ? 'Close sidebar drawer' : 'Open sidebar drawer'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <NavLink
              to={`/${user.role}/dashboard`}
              aria-label="AnnaSathi AI Dashboard"
              className="flex items-center gap-2.5 group no-underline"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0f392b] flex items-center justify-center text-emerald-400 shadow-sm shadow-[#07241b]/20 group-hover:scale-105 transition-transform duration-200">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-[#0f392b] dark:text-emerald-400 leading-tight">
                  AnnaSathi <span className="text-emerald-600 dark:text-emerald-300 font-extrabold">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Zero-Waste Network
                </span>
              </div>
            </NavLink>
          </div>

          {/* Right: Search, Notifications & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Search Input Shortcut */}
            <div className="relative hidden xl:block w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getSearchPlaceholder(user.role)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-[#131B22] border border-slate-200 dark:border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-600 absolute left-2.5 top-2.5" />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme Mode"
              className="group relative flex items-center p-1 rounded-full bg-slate-100 dark:bg-[#1A232E] border border-slate-200 dark:border-[#263342] hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs"
            >
              <div className="flex items-center gap-0.5 px-0.5">
                {/* Sun icon – active in light mode */}
                <span className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                  theme === 'light' ? 'bg-white text-amber-500 shadow-sm' : 'bg-transparent text-slate-500'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 001.06 1.06l1.59-1.59a.75.75 0 00-1.061-1.061l-1.59 1.59z" />
                  </svg>
                </span>
                {/* Moon icon – active in dark mode */}
                <span className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 ${
                  theme === 'dark' ? 'bg-[#11171D] text-emerald-400 shadow-sm' : 'bg-transparent text-slate-400'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => {
                  setNotifMenuOpen((prev) => !prev);
                  loadNotifications();
                }}
                aria-label="Notifications"
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-[#1A232E] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white shadow">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#11171D] border border-slate-200 dark:border-[#1E293B] rounded-md shadow-lg z-20">
                  <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B]">
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 dark:text-slate-400">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 border-b border-slate-200 dark:border-[#1E293B] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1A232E] ${n.status === 'unread' ? 'bg-emerald-50 dark:bg-[#0f392b]' : ''}`}
                          onClick={() => handleMarkRead(n.id)}
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Menu */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="relative w-8 h-8 rounded-full bg-[#0f392b] flex items-center justify-center text-emerald-400">
                  {getInitials(user.fullName)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-800 dark:text-slate-200">
                  {user.fullName}
                </span>
              </button>
              {/* Placeholder for future dropdown */}
            </div>
          </div>
        </header>

        {/* Main content outlet */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer (optional) */}
        <footer className="bg-white dark:bg-[#11171D] py-4 text-center text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} AnnaSathi AI. All rights reserved.
        </footer>
      </div>
    </>
  );
};
