import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Settings,
  Check,
  LogOut,
  ChevronDown,
  Menu,
  X,
  CheckCheck,
  Building,
  User as UserIcon,
  Sparkles,
  Home,
} from 'lucide-react';
import { Role, NotificationItem } from '../../types';
import api from '../../services/api';
import { Badge } from './Badge';
import { NavTab } from './Sidebar';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
  onNavigate?: (tab: NavTab) => void;
  activeTab?: NavTab;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  mobileMenuOpen,
  onNavigate,
  activeTab,
}) => {
  const { user, role, quickLogin, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifs, setShowNotifs] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [notifTab, setNotifTab] = useState<'all' | 'unread'>('all');
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (targetRole: Role) => {
    if (role === targetRole) return;
    setLoadingRole(targetRole);
    try {
      await quickLogin(targetRole);
      setShowProfile(false);
      await fetchNotifs();
    } finally {
      setLoadingRole(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => api.markNotificationRead(n.id).catch(() => {})));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const roleConfigs: Record<Role, { label: string; icon: any; color: string }> = {
    STUDENT: { label: 'Student', icon: GraduationCap, color: 'text-[#5267D8]' },
    FACULTY: { label: 'Faculty', icon: UserCheck, color: 'text-emerald-600' },
    WARDEN: { label: 'Warden', icon: ShieldCheck, color: 'text-amber-600' },
    ADMIN: { label: 'Admin', icon: Settings, color: 'text-purple-600' },
  };

  const filteredNotifs = notifTab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95">
      <div className="px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & University Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#172D45] hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => onNavigate?.('home')}
            className="flex items-center gap-2.5 text-left group"
            title="Go to Rishihood One Home / Landing Page"
          >
            <div className="w-9 h-9 rounded-xl bg-[#172D45] group-hover:bg-[#1E3550] flex items-center justify-center text-white font-bold text-base shadow-xs border border-[#172D45] transition-colors">
              <span className="text-amber-400 font-extrabold">R</span>
              <span className="text-[#5267D8] text-xs font-semibold ml-0.5">1</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#172D45] tracking-tight group-hover:text-[#5267D8] transition-colors">
                  Rishihood One
                </h1>
                <span className="hidden sm:inline-flex bg-slate-100 text-[#172D45] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                  RU • Sonipat
                </span>
              </div>
              <p className="text-[11px] text-[#778195] hidden md:block">
                Academic & Housing Portal
              </p>
            </div>
          </button>

          {/* Quick Home / Dashboard Switcher Button */}
          {onNavigate && (
            <button
              onClick={() => onNavigate(activeTab === 'home' ? 'dashboard' : 'home')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === 'home'
                  ? 'bg-[#5267D8] text-white border-[#5267D8] shadow-xs'
                  : 'bg-[#F7F8FA] text-[#172D45] border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title={activeTab === 'home' ? 'Go to Role Dashboard' : 'Open Landing Page'}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{activeTab === 'home' ? 'Portal Dashboard' : 'Home'}</span>
            </button>
          )}
        </div>

        {/* Center: Desktop Persona Switcher */}
        <div className="hidden lg:flex items-center bg-[#F7F8FA] p-1 rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-semibold text-[#778195] px-2.5 uppercase tracking-wider">
            Role:
          </span>
          {(['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'] as Role[]).map((r) => {
            const config = roleConfigs[r];
            const Icon = config.icon;
            const isActive = role === r;
            const isLoading = loadingRole === r;

            return (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#172D45] text-white shadow-xs font-semibold'
                    : 'text-[#778195] hover:text-[#202938] hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : config.color}`} />
                <span>{config.label}</span>
                {isLoading && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>}
              </button>
            );
          })}
        </div>

        {/* Right: Notifications & Profile Dropdown */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications Panel */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-[#778195] hover:text-[#172D45] hover:bg-[#F7F8FA] transition-colors border border-slate-200/80"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#5267D8] text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-premium border border-slate-200/80 py-3 z-50 animate-in fade-in zoom-in-95">
                {/* Header & Tabs */}
                <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172D45] uppercase tracking-wider">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#EEF0FB] text-[#5267D8] text-[10px] font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-[#5267D8] hover:underline font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="px-4 pt-2 pb-1 flex items-center gap-2">
                  <button
                    onClick={() => setNotifTab('all')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      notifTab === 'all'
                        ? 'bg-[#172D45] text-white'
                        : 'text-[#778195] hover:bg-slate-100'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setNotifTab('unread')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      notifTab === 'unread'
                        ? 'bg-[#172D45] text-white'
                        : 'text-[#778195] hover:bg-slate-100'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notification Items List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 mt-1">
                  {filteredNotifs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#778195] flex flex-col items-center">
                      <Bell className="w-6 h-6 text-slate-300 mb-2 stroke-1" />
                      <span>No notifications found</span>
                    </div>
                  ) : (
                    filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 text-xs transition-colors hover:bg-slate-50/80 flex items-start justify-between gap-3 ${
                          !n.isRead ? 'bg-[#EEF0FB]/40' : ''
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#172D45]">{n.title}</span>
                            <Badge status={n.category} size="sm" />
                          </div>
                          <p className="text-[#202938] text-[11px] leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-[#778195] block">
                            {new Date(n.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="p-1.5 text-slate-400 hover:text-[#5267D8] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-[#F7F8FA] border border-slate-200/80 transition-colors"
            >
              <img
                src={
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                }
                alt={user?.name || 'User'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-200 ring-2 ring-slate-100"
              />
              <div className="hidden sm:block text-left">
                <span className="text-xs font-semibold text-[#172D45] leading-none block truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] text-[#778195] block mt-0.5">
                  {role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-premium border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <img
                    src={
                      user?.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                    }
                    alt={user?.name || 'User'}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#172D45] truncate">{user?.name}</p>
                    <p className="text-[11px] text-[#778195] truncate">{user?.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge status={role} size="sm" />
                      {user?.identifierNo && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {user.identifierNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academic / Department Meta */}
                <div className="px-4 py-2 text-[11px] space-y-1 text-[#778195] bg-[#F7F8FA]">
                  {user?.department && (
                    <div className="flex justify-between">
                      <span>Dept:</span>
                      <span className="font-medium text-[#202938] text-right truncate max-w-[160px]">
                        {user.department}
                      </span>
                    </div>
                  )}
                  {user?.semester && (
                    <div className="flex justify-between">
                      <span>Semester:</span>
                      <span className="font-medium text-[#202938]">Semester {user.semester}</span>
                    </div>
                  )}
                  {user?.batch && (
                    <div className="flex justify-between">
                      <span>Batch:</span>
                      <span className="font-medium text-[#202938]">{user.batch}</span>
                    </div>
                  )}
                </div>

                {/* Role Switcher in Profile */}
                <div className="p-2 border-t border-slate-100">
                  <p className="px-2 py-1 text-[10px] font-semibold text-[#778195] uppercase tracking-wider">
                    Switch Role (Demo)
                  </p>
                  {(['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'] as Role[]).map((r) => {
                    const isCurrent = role === r;
                    const config = roleConfigs[r];
                    const Icon = config.icon;
                    return (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isCurrent
                            ? 'bg-[#EEF0FB] text-[#5267D8] font-semibold'
                            : 'text-[#202938] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </div>
                        {isCurrent && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>

                {/* Logout Button */}
                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out of session</span>
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
