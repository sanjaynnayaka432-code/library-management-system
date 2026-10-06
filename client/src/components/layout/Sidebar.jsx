import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  ArrowLeftRight,
  CalendarClock,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Search,
  BookMarked,
  UserCircle,
  X,
  Sparkles,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../common/Logo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Books Catalog', path: '/admin/books', icon: BookOpen },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Students Roster', path: '/admin/students', icon: Users },
    { name: 'Circulation Desk', path: '/admin/circulation', icon: ArrowLeftRight },
    { name: 'Reservations', path: '/admin/reservations', icon: CalendarClock },
    { name: 'Fines & Dues', path: '/admin/fines', icon: Receipt },
    { name: 'Reports & Audits', path: '/admin/reports', icon: BarChart3 },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Browse Catalog', path: '/catalog', icon: Search },
    { name: 'My Borrowed Books', path: '/student/my-books', icon: BookMarked },
    { name: 'My Reservations', path: '/student/my-reservations', icon: CalendarClock },
    { name: 'My Fines & Dues', path: '/student/my-fines', icon: Receipt },
    { name: 'Profile & Security', path: '/student/profile', icon: UserCircle },
  ];

  const navLinks = isAdmin ? adminLinks : studentLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/75 dark:bg-dark-900/75 backdrop-blur-2xl border-r border-slate-200/60 dark:border-white/5 transition-colors duration-300">
      {/* Sidebar Header */}
      <div className="h-18 px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
        <Logo size="normal" showSubtitle={false} />
        {/* Close button on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-5 pt-4 pb-2">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/5 to-transparent border border-brand-500/20 backdrop-blur-md flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.9)] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand-600 dark:text-brand-400">
              Active Portal
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 font-display">
              {isAdmin ? 'Staff / Librarian' : 'Student Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Management
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/15 via-indigo-500/10 to-transparent text-brand-600 dark:text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-brand-500 to-accent-cyan shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  )}
                  <Icon
                    className={`w-4 h-4 transition-all duration-200 ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400 scale-110 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                        : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span>{link.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <div className="pt-2 px-2 text-[11px] text-slate-400 flex items-center justify-between font-medium">
          <span className="text-[10px] tracking-wider uppercase font-semibold">LibraX v1.2</span>
          <span className="text-emerald-500 font-semibold flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            MySQL Pool
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Slide-out */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
