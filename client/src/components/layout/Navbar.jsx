import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
  ShieldCheck,
  CheckCheck,
  ChevronDown,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { notificationsApi } from '../../services/api';
import Logo from '../common/Logo';
import Badge from '../common/Badge';

export const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // background poll catch
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out safely');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full h-18 bg-white/70 dark:bg-dark-900/70 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/5 transition-colors duration-300">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Sidebar Trigger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-2xl glass-panel text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white lg:hidden transition-all duration-200"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <Logo size="small" showSubtitle={false} />
          </div>
        </div>

        {/* Center: Live System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span>Circulation Engine Live</span>
        </div>

        {/* Right: Theme, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl glass-panel text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2.5 rounded-2xl glass-panel text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:scale-105 active:scale-95 transition-all duration-200"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-black text-white shadow-sm shadow-rose-500/50 ring-2 ring-white dark:ring-dark-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/90 dark:bg-dark-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 py-3 z-50 animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white">
                      Notifications
                    </h4>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 text-xs transition-colors hover:bg-white/50 dark:hover:bg-white/[0.03] flex items-start gap-3 ${
                          !n.is_read ? 'bg-brand-500/[0.04] dark:bg-brand-500/[0.08]' : ''
                        }`}
                      >
                        <div
                          className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                            !n.is_read
                              ? 'bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]'
                              : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white leading-tight">
                            {n.title}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1.5 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!n.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-slate-400 hover:text-brand-500 p-1"
                            title="Mark as read"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200/80 dark:bg-white/10 mx-1" />

          {/* User Profile Capsule */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-full sm:rounded-2xl glass-panel hover:border-brand-500/40 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-accent-cyan text-white font-bold text-xs flex items-center justify-center shadow-md shadow-brand-500/25 border border-white/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[120px]">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {user?.role?.toLowerCase() || 'member'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-dark-900/90 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/80 dark:border-white/10 py-2.5 z-50 animate-fade-in overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user?.email}
                  </p>
                  <div className="mt-2">
                    <Badge
                      status={user?.role}
                      size="xs"
                      text={isAdmin ? 'Librarian / Admin' : 'Student Member'}
                    />
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(isAdmin ? '/admin/settings' : '/student/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-brand-500" />
                    Account Profile
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/admin/dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 flex items-center gap-2.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      Admin Console
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(isAdmin ? '/admin/books' : '/catalog');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-500/10 dark:hover:bg-brand-500/15 flex items-center gap-2.5 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-accent-cyan" />
                    Catalog Discovery
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-1.5 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 font-bold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
