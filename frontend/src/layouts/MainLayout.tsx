import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom';
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
import { BrandLogo } from '../components/common/BrandLogo';
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

/**
 * Enterprise MainLayout component for authenticated modules (Admin, Donor, NGO, Volunteer).
 * Features a sticky frosted-glass navigation bar, high-contrast sidebar, and responsive mobile drawer.
 */
export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingNGOsCount, setPendingNGOsCount] = useState<number>(0);

  // Load pending NGO count for Admin navigation badge
  useEffect(() => {
    if (user?.role !== 'admin') return;

    let isMounted = true;
    const fetchPendingNGOs = async () => {
      try {
        const statsRes = await apiClient.admin.getStats();
        if (statsRes?.data?.ngos && isMounted) {
          const pending = statsRes.data.ngos.find(
            (n: any) => n.verification_status?.toLowerCase() === 'pending'
          )?.count;
          setPendingNGOsCount(Number(pending || 0));
        }
      } catch (err) {
        // graceful fallback
      }
    };

    fetchPendingNGOs();
    // Poll occasionally to keep badge updated
    const interval = setInterval(fetchPendingNGOs, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.role]);

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

  const navItems = getNavItems(user.role, { pendingNGOs: pendingNGOsCount });
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-100 dark:selection:bg-blue-900 selection:text-emerald-900 dark:selection:text-blue-100 transition-colors duration-200">
      {/* ───── Top Header Bar ───── */}
      <header
        className="sticky top-0 z-40 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E293B] h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 transition-all duration-200"
        data-purpose="global-header"
      >
        {/* Left: Hamburger (Mobile) + Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] rounded-lg transition-colors focus:outline-none"
            aria-label={sidebarOpen ? 'Close sidebar drawer' : 'Open sidebar drawer'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink
            to={`/${user.role}/dashboard`}
            aria-label="AnnaSathi AI Dashboard"
            className="flex items-center no-underline"
          >
            <BrandLogo size="md" />
          </NavLink>
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
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-blue-500/20 focus:border-emerald-600 dark:focus:border-blue-500 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
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
              className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-blue-500"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 dark:bg-blue-400 rounded-full ring-2 ring-white dark:ring-[#111827]" />
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-slate-200/90 dark:border-[#1E293B] py-2 z-50 text-left">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#1E293B] flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-700 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1E293B] custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3.5 text-xs hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-colors cursor-pointer ${n.status === 'unread' ? 'bg-emerald-50/40 dark:bg-blue-950/20 font-medium' : 'text-slate-600 dark:text-slate-400'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                          {n.status === 'unread' && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-blue-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 block font-mono">
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

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700/60" />

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 pl-1 py-1 pr-2.5 rounded-full border border-slate-200/80 dark:border-[#1E293B] bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#0f392b] dark:bg-blue-600 dark:border dark:border-blue-400/30 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[140px]">
                  {user.name || 'User'}
                </span>
                <span className="text-[10px] font-medium text-emerald-800 dark:text-blue-400">
                  {getRoleSubtitle(user.role)}
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-blue-950/80 text-emerald-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full ml-1 capitalize">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            {/* Exit / Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors focus:outline-none"
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
            <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-[#1E293B] z-50 md:hidden flex flex-col overflow-y-auto">
              {/* Navigation Links */}
              <nav aria-label="Mobile Navigation" className="flex-1 p-3 space-y-1.5">
                {sidebarItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      isActive
                        ? 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#0f392b] dark:bg-blue-950/70 dark:border dark:border-blue-500/30 text-white dark:text-blue-200 shadow-sm shadow-[#0f392b]/20 group transition-all'
                        : 'flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#0f392b] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition-all group'
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-emerald-400 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge !== null && (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${isActive
                                ? 'bg-emerald-800 dark:bg-blue-900 text-emerald-200 dark:text-blue-200'
                                : 'bg-slate-100 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400'
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (item.badge === undefined || item.badge === null) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-blue-400" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* Mobile User Profile & Logout */}
              <div className="p-4 border-t border-slate-100 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#0F172A] mt-auto space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0f392b] dark:bg-blue-600 dark:border dark:border-blue-400/30 text-white flex items-center justify-center font-bold text-xs">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                    <span className="text-[10px] text-emerald-800 dark:text-blue-400 font-medium capitalize">
                      {ROLE_LABELS[user.role]} • {getRoleSubtitle(user.role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    closeSidebar();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content Workspace (Smooth Page Transition on Navigation) */}
        <main
          className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 lg:p-9 space-y-6 sm:space-y-8 bg-[#f8fafc] dark:bg-[#0B0F17] transition-colors duration-200"
          data-purpose="dashboard-workspace"
        >
          <div key={location.pathname} className="page-transition-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating System Status Pill & Interactive AI Assistant */}
      <AIChatbotModal />
    </div>
  );
};


