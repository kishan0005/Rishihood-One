import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Building2,
  BookOpen,
  CreditCard,
  UtensilsCrossed,
  CalendarDays,
  Shield,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Lock,
  Mail,
  User,
  Phone,
  Layers,
  Zap,
  Clock,
  Award,
  Users,
  Compass,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { NavTab } from '../components/common/Sidebar';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Role } from '../types';

interface LandingPageViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {
  const { user, role, login, register, quickLogin } = useAuth();

  // Auth Modals State
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [signupModalOpen, setSignupModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState<string>('student@rishihood.edu.in');
  const [loginPassword, setLoginPassword] = useState<string>('Rishihood@123');

  // Signup Form State
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupRole, setSignupRole] = useState<Role>('STUDENT');
  const [signupDepartment, setSignupDepartment] = useState<string>('Computer Science & Engineering');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupId, setSignupId] = useState<string>('');

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoadingAction(true);
    try {
      await login(loginEmail, loginPassword);
      setLoginModalOpen(false);
      onNavigate('dashboard');
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid email or password');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoadingAction(true);
    try {
      await register({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        role: signupRole,
        department: signupDepartment,
        phone: signupPhone,
        identifierNo: signupId,
      });
      setSignupModalOpen(false);
      onNavigate('dashboard');
    } catch (err: any) {
      setAuthError(err?.message || 'Registration failed');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle 1-Click Demo Login
  const handleQuickLogin = async (targetRole: Role) => {
    setAuthError(null);
    setLoadingAction(true);
    try {
      await quickLogin(targetRole);
      setLoginModalOpen(false);
      onNavigate('dashboard');
    } catch (err: any) {
      setAuthError(err?.message || 'Quick login failed');
    } finally {
      setLoadingAction(false);
    }
  };

  // Campus Packages definition
  const packages = [
    {
      id: 'academic',
      title: 'Academic Excellence Package',
      subtitle: 'Newton School of Technology & Core Faculties',
      badge: 'Core ERP',
      badgeVariant: 'indigo' as const,
      icon: GraduationCap,
      description: 'Unified academic ecosystem connecting syllabus tracking, attendance, continuous assessment, and examinations.',
      features: [
        'Biometric & session-wise attendance tracking (75% threshold alerts)',
        'Personalized daily timetable with room numbers & professors',
        'Continuous evaluation, assignment submission & marks grading',
        'Semester course registration & Dean’s list GPA analytics',
      ],
      targetRole: 'Students & Faculty',
      accentColor: 'border-[#5267D8]',
      action: () => onNavigate('academics'),
    },
    {
      id: 'housing',
      title: 'Smart Residential & Housing Package',
      subtitle: 'Takshashila (Boys) & Gargi (Girls) Hostels',
      badge: 'Residential Life',
      badgeVariant: 'emerald' as const,
      icon: Building2,
      description: 'End-to-end hostel room allocation, room availability tracking, outing gate passes, and roommate matchmaking.',
      features: [
        'Real-time room inventory (Single, Double AC, Triple occupancy)',
        'Digital Outing & Night Leave passes with instant Warden approvals',
        'Roommate directory with course & contact discovery',
        'Direct communication with resident hostel block wardens',
      ],
      targetRole: 'Students & Wardens',
      accentColor: 'border-emerald-500',
      action: () => onNavigate('housing'),
    },
    {
      id: 'living',
      title: 'Campus Life & Dining Package',
      subtitle: 'Food Court, Dining Hall & Campus Recreation',
      badge: 'Campus Living',
      badgeVariant: 'amber' as const,
      icon: UtensilsCrossed,
      description: 'Nutritious 4-meal daily mess menus, maintenance ticketing with SLAs, and university cultural/tech events.',
      features: [
        '7-Day weekly dining menus (Breakfast, Lunch, Snacks, Dinner)',
        'Maintenance helpdesk (Wi-Fi, Electrical, Plumbing) with SLA tracking',
        'University Hackathons, Cultural fests, and Guest Lectures RSVPs',
        '24x7 Campus SOS & emergency medical response line',
      ],
      targetRole: 'All Campus Residents',
      accentColor: 'border-amber-500',
      action: () => onNavigate('dining'),
    },
    {
      id: 'enterprise',
      title: 'Enterprise & Financial Governance',
      subtitle: 'Dean’s Office, Accounts & University Administration',
      badge: 'Administration',
      badgeVariant: 'sky' as const,
      icon: Shield,
      description: 'Centralized fee invoicing, automated payment receipts, student/faculty directories, and institutional analytics.',
      features: [
        'Automated semester tuition, hostel & mess invoice generation',
        'Instant fee payment via UPI, Razorpay & Netbanking receipts',
        'University user directory with role-based access control (RBAC)',
        'Real-time campus occupancy & academic progress analytics',
      ],
      targetRole: 'Admins & Accounts',
      accentColor: 'border-purple-500',
      action: () => onNavigate('admin'),
    },
  ];

  return (
    <div className="space-y-12 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Showcase Section with Campus Image */}
      <section className="relative overflow-hidden rounded-3xl bg-[#172D45] text-white p-6 sm:p-10 lg:p-14 shadow-premium border border-[#172D45]">
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Rishihood University • NH-44, Sonipat, Delhi NCR</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Rishihood One — The Academic & Residential Campus Operating System
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            A unified, high-performance portal powering academic rigor, residential hostel life, dining menus, and student welfare across our 25-acre green university campus.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Button
              variant="accent"
              size="lg"
              onClick={() => onNavigate('dashboard')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Open Portal Dashboard
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => setLoginModalOpen(true)}
              icon={<LogIn className="w-4 h-4 text-[#5267D8]" />}
            >
              Sign In to Account
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setSignupModalOpen(true)}
              className="text-white hover:bg-white/10 hover:text-white border border-white/20"
              icon={<UserPlus className="w-4 h-4 text-emerald-400" />}
            >
              New Student Signup
            </Button>
          </div>

          {/* Active Session Pill if logged in */}
          {user && (
            <div className="pt-4 flex items-center gap-3 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Currently logged in as: <strong className="text-white">{user.name}</strong> ({role})</span>
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-amber-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Continue to {role} View</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#5267D8]/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. Campus Architecture Showcase (Featuring the User-Uploaded Photo) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5267D8] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Showcase</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172D45] mt-1">
              Rishihood University Main Academic Complex
            </h2>
            <p className="text-xs sm:text-sm text-[#778195] mt-1">
              Iconic brick architecture blending Indian latticework (jali) with modern smart classrooms and sprawling lawns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EEF0FB] text-[#5267D8] border border-indigo-100">
              NH-44 Sonipat • Delhi NCR
            </span>
          </div>
        </div>

        {/* Campus Photo Container */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md group">
          <img
            src="/rishihood-campus.jpg"
            alt="Rishihood University Main Academic & Residential Complex"
            className="w-full h-72 sm:h-96 lg:h-[450px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
          />

          {/* Glassmorphism Campus Overlay Card */}
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md p-4 sm:p-5 rounded-2xl bg-[#172D45]/90 backdrop-blur-md border border-white/20 text-white shadow-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                25-Acre Smart Sustainable Campus
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold leading-snug">
              Takshashila Academic & Residential Blocks
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              Featuring smart auditoriums, makerspaces, sports arena, and 100% on-campus hostel housing for students and faculty.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
              <span>Classrooms: <strong>48+</strong></span>
              <span>Hostel Beds: <strong>800+</strong></span>
              <span>Wi-Fi: <strong>Campus-Wide 1 Gbps</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. University Stats Counter */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#172D45]">2,500+</p>
          <p className="text-xs font-semibold text-[#778195] uppercase tracking-wider">Students Enrolled</p>
          <p className="text-[11px] text-slate-400">Tech, Design & Business</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-[#5267D8]">100%</p>
          <p className="text-xs font-semibold text-[#778195] uppercase tracking-wider">Residential Campus</p>
          <p className="text-[11px] text-slate-400">Air-Conditioned Hostels</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">99.4%</p>
          <p className="text-xs font-semibold text-[#778195] uppercase tracking-wider">Portal Uptime</p>
          <p className="text-[11px] text-slate-400">Zero-Lag PostgreSQL ERP</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center space-y-1">
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600">4 Schools</p>
          <p className="text-xs font-semibold text-[#778195] uppercase tracking-wider">Academic Disciplines</p>
          <p className="text-[11px] text-slate-400">NST, SOB, SOD, SOE</p>
        </div>
      </section>

      {/* 4. Landing Packages & Modules Section */}
      <section className="space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5267D8] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Integrated Platform Modules</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172D45] mt-1">
            Rishihood One Modular Packages
          </h2>
          <p className="text-xs sm:text-sm text-[#778195] mt-1">
            Choose any package to inspect its live workflows, manage records, or log in with targeted role permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.id}
                className={`p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between space-y-5`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-[#F7F8FA] text-[#172D45] border border-slate-200/60">
                      <Icon className="w-6 h-6 text-[#5267D8]" />
                    </div>
                    <Badge status={pkg.badge} variant={pkg.badgeVariant} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#172D45] tracking-tight">{pkg.title}</h3>
                    <p className="text-xs font-semibold text-[#5267D8] mt-0.5">{pkg.subtitle}</p>
                    <p className="text-xs text-[#778195] mt-2 leading-relaxed">{pkg.description}</p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#202938]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-[#778195]">
                    Audience: <strong className="text-[#172D45]">{pkg.targetRole}</strong>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={pkg.action}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    Open Module
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. 1-Click Persona Access Section */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#F7F8FA] border border-slate-200/80 space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge status="INSTANT ACCESS" variant="indigo" size="sm" />
          <h3 className="text-xl font-bold text-[#172D45]">
            One-Click University Role Demos
          </h3>
          <p className="text-xs text-[#778195]">
            Experience Rishihood One from any institutional role instantly without typing passwords.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          <button
            onClick={() => handleQuickLogin('STUDENT')}
            className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-[#5267D8] hover:shadow-subtle transition-all text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-[#EEF0FB] text-[#5267D8]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <Badge status="STUDENT" size="sm" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#172D45]">Aarav Sharma</p>
              <p className="text-[11px] text-[#778195]">B.Tech CSE, Sem 6</p>
              <span className="text-[10px] text-[#5267D8] font-semibold flex items-center gap-1 mt-1 group-hover:underline">
                <span>Enter Student Portal</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          <button
            onClick={() => handleQuickLogin('FACULTY')}
            className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-subtle transition-all text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
              <Badge status="FACULTY" size="sm" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#172D45]">Dr. Ananya Roy</p>
              <p className="text-[11px] text-[#778195]">CSE Department Faculty</p>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">
                <span>Enter Faculty Console</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          <button
            onClick={() => handleQuickLogin('WARDEN')}
            className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-amber-500 hover:shadow-subtle transition-all text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Building2 className="w-4 h-4" />
              </div>
              <Badge status="WARDEN" size="sm" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#172D45]">Col. Rajesh Verma</p>
              <p className="text-[11px] text-[#778195]">Chief Hostel Warden</p>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">
                <span>Enter Warden Hub</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>

          <button
            onClick={() => handleQuickLogin('ADMIN')}
            className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-purple-500 hover:shadow-subtle transition-all text-left space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              <Badge status="ADMIN" size="sm" />
            </div>
            <div>
              <p className="font-bold text-xs text-[#172D45]">Dean Vikram Malhotra</p>
              <p className="text-[11px] text-[#778195]">Academic Affairs Dean</p>
              <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">
                <span>Enter Admin Console</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Login Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="Sign In to Rishihood One"
        maxWidth="md"
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#172D45] mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@rishihood.edu.in"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172D45] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>
              <span className="text-[10px] text-[#778195] mt-1 block">
                Demo password: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[#172D45]">Rishihood@123</code>
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loadingAction}
              className="w-full"
              icon={<LogIn className="w-4 h-4" />}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Quick Demo Buttons inside Modal */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-[#778195] block mb-2 font-medium">Or log in with 1-click demo persona:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('STUDENT')}
                disabled={loadingAction}
              >
                Student Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('FACULTY')}
                disabled={loadingAction}
              >
                Faculty Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('WARDEN')}
                disabled={loadingAction}
              >
                Warden Demo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loadingAction}
              >
                Admin Demo
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Signup / Registration Modal */}
      <Modal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        title="Create Rishihood One Account"
        maxWidth="md"
      >
        <div className="space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#172D45] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Yash Vardhan"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="yash@rishihood.edu.in"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30 bg-white"
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="WARDEN">Hostel Warden</option>
                  <option value="ADMIN">University Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Department / School
                </label>
                <input
                  type="text"
                  value={signupDepartment}
                  onChange={(e) => setSignupDepartment(e.target.value)}
                  placeholder="e.g. Newton School of Technology"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Student / Employee ID
                </label>
                <input
                  type="text"
                  value={signupId}
                  onChange={(e) => setSignupId(e.target.value)}
                  placeholder="e.g. RU2025CS101"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172D45] mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              size="md"
              loading={loadingAction}
              className="w-full mt-2"
              icon={<UserPlus className="w-4 h-4" />}
            >
              Complete Registration & Enter
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

