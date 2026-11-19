import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Bell, LogOut, Menu, X, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import { getNavItems, ROLE_LABELS } from '../routes/navigation';
import { Sidebar } from '../components/common/Sidebar';
import { Badge } from '../components/common/Badge';
import { apiClient, mapNotificationFromDb } from '../lib/apiClient';
import { mockDataService } from '../lib/mockDataService';
import type { Notification } from '../types/notification';

const isProduction = Boolean((import.meta as any).env?.PROD);

const ALL_ROLES: UserRole[] = ['donor', 'ngo', 'volunteer', 'admin'];

/**
 * Main application layout.
 * Renders the top header bar, desktop sidebar, mobile sidebar overlay,
 * and the main content area (<Outlet />).
 */
export const MainLayout: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

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

  // Close role dropdown on outside click
  useEffect(() => {
    if (!roleMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [roleMenuOpen]);

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
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Close mobile sidebar on route change (via click)
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!user) return null;

  const navItems = getNavItems(user.role);

  // Map navigation items into the shape Sidebar expects
  const sidebarItems = navItems.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setRoleMenuOpen(false);
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ───── Top header bar ───── */}
      <header className="site-header sticky top-0 z-30">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <NavLink to={`/${user.role}/dashboard`} className="flex items-center gap-2 no-underline">
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            <span className="font-bold text-lg text-white hidden sm:inline">AnnaSathi AI</span>
          </NavLink>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-3">
          {/* Role switcher (dev convenience) */}
          <div ref={roleMenuRef} className="relative hidden md:block">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
              aria-haspopup="true"
              aria-expanded={roleMenuOpen}
            >
              <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
                {ROLE_LABELS[user.role]}
              </Badge>
              <ChevronDown size={14} />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-md shadow-lg border border-border py-1 z-50">
                <div className="px-3 py-1.5 border-b border-border text-[10px] uppercase font-bold text-secondary-text tracking-wider">
                  Demo Role Switcher
                </div>
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors ${
                      r === user.role ? 'font-medium text-primary bg-primary/5' : 'text-primary-text'
                    }`}
                  >
                    {ROLE_LABELS[r]} {r === user.role ? '✓' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifMenuRef}>
            <button
              onClick={() => {
                setNotifMenuOpen((prev) => !prev);
                loadNotifications();
              }}
              className="text-white/80 hover:text-white relative p-1 rounded-md focus:outline-none"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notifications.filter((n) => n.status === 'unread').length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications.filter((n) => n.status === 'unread').length}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-lg shadow-xl border border-border py-2 z-50 text-left">
                <div className="px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-xs text-primary-text uppercase tracking-wider">
                    Notifications
                  </span>
                  {notifications.some((n) => n.status === 'unread') && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={14} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-secondary-text">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 text-xs hover:bg-background/80 transition-colors cursor-pointer ${
                          n.status === 'unread' ? 'bg-primary/5 font-medium' : 'text-secondary-text'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-primary-text">{n.title}</p>
                          {n.status === 'unread' && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-secondary-text text-[11px] mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-secondary-text/80 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User name (desktop) */}
          <span className="text-white text-sm font-medium hidden md:inline">{user.name}</span>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white hidden md:flex items-center gap-1 text-sm"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ───── Body: sidebar + content ───── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar items={sidebarItems} role={user.role} />

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeSidebar}
              aria-hidden="true"
            />
            <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-surface border-r border-border z-50 md:hidden overflow-y-auto">
              <nav className="flex flex-col py-4 space-y-1">
                {sidebarItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={closeSidebar}
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

              {/* Mobile-only: role switcher + logout */}
              <div className="border-t border-border mt-4 pt-4 px-4 space-y-2">
                <p className="text-xs text-secondary-text uppercase tracking-wider mb-2">Switch Role</p>
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { handleRoleSwitch(r); closeSidebar(); }}
                    className={`block w-full text-left px-3 py-1.5 text-sm rounded-md ${
                      r === user.role ? 'bg-primary text-white font-medium' : 'text-primary-text hover:bg-surface-container-low'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
                <button
                  onClick={() => { handleLogout(); closeSidebar(); }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-md mt-4"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </aside>
          </>
        )}

        {/* Main content area */}
        <main className="main-content flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
