import React from 'react';
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Building2,
  AlertCircle,
  CreditCard,
  UtensilsCrossed,
  CalendarDays,
  Shield,
  HelpCircle,
  X,
  ExternalLink,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { Role } from '../../types';

export type NavTab =
  | 'home'
  | 'dashboard'
  | 'academics'
  | 'housing'
  | 'complaints'
  | 'fees'
  | 'dining'
  | 'events'
  | 'admin';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  role: Role;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  role,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: any;
    roles: Role[];
    badge?: string;
  }> = [
    {
      id: 'home',
      label: 'Home & Campus',
      icon: Home,
      roles: ['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'],
      badge: 'Showcase',
    },
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'],
    },
    {
      id: 'academics',
      label: 'Academics',
      icon: BookOpen,
      roles: ['STUDENT', 'FACULTY', 'ADMIN'],
      badge: role === 'STUDENT' ? 'Sem 6' : undefined,
    },
    {
      id: 'housing',
      label: 'Housing & Hostels',
      icon: Building2,
      roles: ['STUDENT', 'WARDEN', 'ADMIN'],
      badge: role === 'WARDEN' ? 'Warden Hub' : undefined,
    },
    {
      id: 'complaints',
      label: 'Helpdesk & Complaints',
      icon: AlertCircle,
      roles: ['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'],
    },
    {
      id: 'fees',
      label: 'Fees & Invoices',
      icon: CreditCard,
      roles: ['STUDENT', 'ADMIN'],
    },
    {
      id: 'dining',
      label: 'Dining & Mess',
      icon: UtensilsCrossed,
      roles: ['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'],
    },
    {
      id: 'events',
      label: 'Campus Events',
      icon: CalendarDays,
      roles: ['STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'],
    },
    {
      id: 'admin',
      label: 'University Console',
      icon: Shield,
      roles: ['ADMIN'],
      badge: 'Admin Only',
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  const handleSelectTab = (id: NavTab) => {
    onTabChange(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4 space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu
          </p>
          <div className="mt-2 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#172D45] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-[#172D45]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#778195]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-[#5267D8]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Academic & Campus Status Widget */}
        <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-slate-200/80 text-xs space-y-2.5">
          <div className="flex items-center justify-between text-[#778195] text-[11px]">
            <span>Academic Term</span>
            <span className="text-[#172D45] font-semibold">Spring 2025</span>
          </div>
          <div className="flex items-center justify-between text-[#778195] text-[11px]">
            <span>Campus</span>
            <span className="text-[#202938] font-medium">NH-44, Sonipat</span>
          </div>
          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-[#778195]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="font-medium text-emerald-700">ERP & DB Operational</span>
          </div>
        </div>
      </div>

      {/* University Footer SOS */}
      <div className="p-4 border-t border-slate-200/80 text-[11px] text-[#778195] space-y-1 bg-white">
        <p className="font-bold text-[#172D45]">Rishihood University</p>
        <p className="text-[10px] text-[#778195] leading-tight">Learners for Life, Leaders for Society</p>
        <div className="pt-2 flex items-center gap-1.5 text-[10px] text-[#5267D8] font-medium">
          <PhoneCall className="w-3 h-3" />
          <span>Campus SOS: +91 130 305 5000</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 min-h-[calc(100vh-61px)]">
        {navContent}
      </aside>

      {/* Mobile Drawer (visible when toggled on smaller screens) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#172D45] flex items-center justify-center text-white font-bold text-sm">
                  <span className="text-amber-400">R</span>
                  <span className="text-[#5267D8] text-xs ml-0.5">1</span>
                </div>
                <span className="font-bold text-sm text-[#172D45]">Rishihood One</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation inside drawer */}
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
