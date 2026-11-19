import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  X,
  Search,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

const getRoleSectionTitle = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Governance Console';
    case 'donor':
      return 'Surplus Dispatch';
    case 'ngo':
      return 'Relief Operations';
    case 'volunteer':
      return 'Field Operations';
    default:
      return 'Operations Console';
  }
};

const getRoleSectionTag = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Enterprise';
    case 'donor':
      return 'Partner';
    case 'ngo':
      return 'Verified NGO';
    case 'volunteer':
      return 'Courier';
    default:
      return 'Active';
  }
};

/**
 * Enterprise MainLayout component for authenticated modules (Admin, Donor, NGO, Volunteer).
 * Features a sticky frosted-glass navigation bar, high-contrast sidebar, and responsive mobile drawer.
 */
export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* ───── Top Header Bar ───── */}
      <header
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 lg:px-7 transition-all duration-200"
        data-purpose="global-header"
      >
        {/* Left: Hamburger (Mobile) + Brand Logo & Title */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-[#0f392b] hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
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
              <span className="text-lg font-bold tracking-tight text-[#0f392b] leading-tight">
                AnnaSathi <span className="text-emerald-600 font-extrabold">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Zero-Waste Network
              </span>
            </div>
          </NavLink>

          {/* Quick Divider */}
          <div className="hidden md:block h-5 w-px bg-slate-200" />

          {/* Environment / Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-900">Production Node</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-emerald-800 shadow-xs border border-emerald-100">
              v4.0.2
            </span>
          </div>
        </div>

        {/* Right: Search, Notifications & User Profile Menu */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Search Input Shortcut */}
          <div className="relative hidden xl:block w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getSearchPlaceholder(user.role)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 text-slate-700 placeholder-slate-400 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => {
                setNotifMenuOpen((prev) => !prev);
                loadNotifications();
              }}
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:text-[#0f392b] hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 text-left">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                          n.status === 'unread' ? 'bg-emerald-50/40 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900">{n.title}</p>
                          {n.status === 'unread' && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 pl-1 py-1 pr-2.5 rounded-full border border-slate-200/80 bg-white hover:border-slate-300 transition-colors shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#0f392b] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[140px]">
                  {user.name || 'User'}
                </span>
                <span className="text-[10px] font-medium text-emerald-800">
                  {getRoleSubtitle(user.role)}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-full ml-1 capitalize">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            {/* Exit / Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus:outline-none"
              title="Sign Out"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ───── Main Dashboard Workspace Layout ───── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar */}
        <Sidebar items={sidebarItems} role={user.role} />

        {/* Mobile Sidebar Overlay & Drawer */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
              onClick={closeSidebar}
              aria-hidden="true"
            />
            <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 z-50 md:hidden flex flex-col overflow-y-auto">
              {/* Context Tag */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  {getRoleSectionTitle(user.role)}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                  {getRoleSectionTag(user.role)}
                </span>
              </div>

              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation" className="flex-1 p-3 space-y-1.5">
                {sidebarItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      isActive
                        ? 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#0f392b] text-white shadow-sm shadow-[#0f392b]/20 group transition-all'
                        : 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:text-[#0f392b] hover:bg-slate-50 transition-all group'
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
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

              {/* Mobile User Profile & Logout */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0f392b] text-white flex items-center justify-center font-bold text-xs">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">{user.name}</span>
                    <span className="text-[10px] text-emerald-800 font-medium capitalize">
                      {ROLE_LABELS[user.role]} • {getRoleSubtitle(user.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    closeSidebar();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Workspace (Preserves inside content untouched) */}
        <main
          className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-9 space-y-8 bg-[#f8fafc]"
          data-purpose="dashboard-workspace"
        >
          <Outlet />
        </main>
      </div>

      {/* Floating System Status Pill & Interactive AI Assistant */}
      <AIChatbotModal />
    </div>
  );
};
