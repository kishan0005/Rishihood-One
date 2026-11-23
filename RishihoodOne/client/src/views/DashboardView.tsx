import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  Building2,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  Bell,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { NavTab } from '../components/common/Sidebar';
import { StudentDashboard } from './dashboards/StudentDashboard';
import api from '../services/api';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();

  if (role === 'STUDENT') {
    return <StudentDashboard onNavigate={onNavigate} />;
  }
  const [stats, setStats] = useState<any>({
    attendancePercentage: 88,
    cgpa: 8.92,
    roomNumber: 'TAK-204',
    pendingAssignments: 2,
    openComplaints: 1,
    activeLeavePass: 'IIT Delhi Hackathon (Approved)',
  });
  const [adminStats, setAdminStats] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [timetableToday, setTimetableToday] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [eventsRes, notifsRes, timetableRes] = await Promise.all([
          api.getEvents().catch(() => ({ events: [] })),
          api.getNotifications().catch(() => ({ notifications: [] })),
          api.getTimetable().catch(() => ({ slots: [] })),
        ]);

        setUpcomingEvents((eventsRes.events || []).slice(0, 3));
        setRecentNotifications((notifsRes.notifications || []).slice(0, 4));
        setTimetableToday((timetableRes.slots || []).slice(0, 4));

        if (role === 'ADMIN' || role === 'WARDEN') {
          const adm = await api.getAdminStats().catch(() => null);
          setAdminStats(adm);
        }
      } catch (e) {
        console.error('Dashboard load error', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [role, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-950 p-6 sm:p-8 text-white shadow-md border border-navy-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Spring 2025 • Rishihood Campus Experience</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name || 'Rishihoodian'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {role === 'FACULTY' &&
                'Continuous evaluation window for Mid-Term assessments is active. 3 lectures scheduled today.'}
              {role === 'WARDEN' &&
                'Hostel occupancy is at 82% across Takshashila and Gargi halls. 2 student outing passes require your review.'}
              {role === 'ADMIN' &&
                'University infrastructure and ERP modules operating at 100% capacity. Review today’s collections and room allocation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role === 'FACULTY' && (
              <button
                onClick={() => onNavigate('academics')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Attendance</span>
              </button>
            )}
            {role === 'WARDEN' && (
              <button
                onClick={() => onNavigate('housing')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                <span>Manage Leaves</span>
              </button>
            )}
            {role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>University Console</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle Decorative Grid Pattern */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Role-Specific Metric Cards */}
      {role === 'FACULTY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Assigned Courses"
            value="3 Courses"
            subtitle="B.Tech CSE - 6th Semester"
            icon={GraduationCap}
            badge="Spring 2025"
            badgeColor="indigo"
          />
          <StatCard
            title="Students Enrolled"
            value="148 Students"
            subtitle="Across CSE 301, 302, 304"
            icon={Users}
            badge="100% Capacity"
            badgeColor="emerald"
          />
          <StatCard
            title="Today's Lectures"
            value="2 Sessions"
            subtitle="09:00 AM (LH-102) & 10:30 AM"
            icon={Calendar}
            badge="Upcoming"
            badgeColor="blue"
          />
          <StatCard
            title="Submissions to Grade"
            value="18 Pending"
            subtitle="Attention Mechanism Implementation"
            icon={Clock}
            badge="Review"
            badgeColor="amber"
          />
        </div>
      )}

      {role === 'WARDEN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Hostel Occupancy"
            value={`${adminStats?.housing?.occupancyRate || 82}%`}
            subtitle={`${adminStats?.housing?.occupiedBeds || 164} of ${adminStats?.housing?.totalBeds || 200} Beds Occupied`}
            icon={Building2}
            badge="High Demand"
            badgeColor="indigo"
          />
          <StatCard
            title="Pending Leave Passes"
            value={`${adminStats?.counts?.pendingLeaves || 2} Requests`}
            subtitle="Night Out & Home Visits"
            icon={Clock}
            badge="Action Needed"
            badgeColor="amber"
          />
          <StatCard
            title="Open Maintenance Tickets"
            value={`${adminStats?.counts?.openComplaints || 3} Tickets`}
            subtitle="Wi-Fi, Electrical & Plumbing"
            icon={AlertCircle}
            badge="In Progress"
            badgeColor="rose"
          />
          <StatCard
            title="Hostel Applications"
            value={`${adminStats?.counts?.pendingHostelApplications || 1} Pending`}
            subtitle="Room Selection Requests"
            icon={Users}
            badge="New"
            badgeColor="blue"
          />
        </div>
      )}

      {role === 'ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Students"
            value={adminStats?.counts?.students || 420}
            subtitle="All Schools & Programs"
            icon={GraduationCap}
            badge="Spring 2025"
            badgeColor="indigo"
          />
          <StatCard
            title="Faculty & Staff"
            value={`${adminStats?.counts?.faculty || 38} Faculty`}
            subtitle={`${adminStats?.counts?.wardens || 8} Wardens & Admins`}
            icon={Users}
            badge="Verified"
            badgeColor="emerald"
          />
          <StatCard
            title="Tuition & Housing Revenue"
            value={`₹${((adminStats?.finance?.totalCollected || 260000) / 100000).toFixed(1)}L`}
            subtitle={`Collection Rate: ${adminStats?.finance?.collectionRate || 94}%`}
            icon={CreditCard}
            badge="On Track"
            badgeColor="emerald"
          />
          <StatCard
            title="Campus Occupancy"
            value={`${adminStats?.housing?.occupancyRate || 82}%`}
            subtitle={`${adminStats?.housing?.availableBeds || 36} Beds Vacant`}
            icon={Building2}
            badge="Stable"
            badgeColor="blue"
          />
        </div>
      )}

      {/* Main Content Split: Timetable & Schedule + Campus News / Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule / Active Courses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Schedule Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-900">Academic Schedule</h3>
                  <p className="text-xs text-slate-500">Scheduled classroom lectures and lab slots</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('academics')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {timetableToday.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No lectures scheduled for today. Check full weekly timetable.
                </div>
              ) : (
                timetableToday.map((slot: any) => (
                  <div
                    key={slot.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 text-center py-1 px-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {slot.startTime}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-navy-900">
                            {slot.course.code}: {slot.course.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {slot.roomNo} • {slot.faculty?.name || 'Faculty Assigned'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {slot.dayOfWeek}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-navy-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs">
            <h4 className="text-sm font-bold text-white mb-2">Campus Service Shortcuts</h4>
            <p className="text-xs text-slate-300 mb-4">
              Access the most frequent Rishihood student and faculty workflows with one click.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate('complaints')}
                className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-left transition"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs font-semibold block text-white">Maintenance</span>
                <span className="text-[10px] text-slate-400">File ticket</span>
              </button>
              <button
                onClick={() => onNavigate('fees')}
                className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-left transition"
              >
                <CreditCard className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xs font-semibold block text-white">Fee Receipts</span>
                <span className="text-[10px] text-slate-400">Download slip</span>
              </button>
              <button
                onClick={() => onNavigate('dining')}
                className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-left transition"
              >
                <Clock className="w-4 h-4 text-sky-400 mb-1" />
                <span className="text-xs font-semibold block text-white">Mess Menu</span>
                <span className="text-[10px] text-slate-400">View 7-day food</span>
              </button>
              <button
                onClick={() => onNavigate('events')}
                className="p-3 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-left transition"
              >
                <Calendar className="w-4 h-4 text-indigo-400 mb-1" />
                <span className="text-xs font-semibold block text-white">Campus Events</span>
                <span className="text-[10px] text-slate-400">RSVP Hackathon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Events & University Notices */}
        <div className="space-y-6">
          {/* Upcoming Campus Events */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-900">Featured Campus Events</h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                View all
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {upcomingEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {evt.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(evt.startTime).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-navy-900 leading-snug line-clamp-1">{evt.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{evt.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>📍 {evt.venue}</span>
                    <span className="font-semibold text-slate-600">{evt.registeredCount} Attending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Notices */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-navy-900">Campus Notice Board</h3>
              <Bell className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {recentNotifications.map((notif: any) => (
                <div key={notif.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-900">{notif.title}</span>
                    <Badge status={notif.category} className="text-[9px] py-0 px-1.5" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

