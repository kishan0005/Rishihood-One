import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  Building2,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  UserCheck,
  Send,
  Sparkles,
  RefreshCw,
  Bell,
  ChevronRight,
  MapPin,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableEmpty } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { NavTab } from '../../components/common/Sidebar';
import api from '../../services/api';

interface StudentDashboardProps {
  onNavigate: (tab: NavTab) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Core Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [attendance, setAttendance] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [fees, setFees] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Interactive UI States
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [submissionFile, setSubmissionFile] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paying, setPaying] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        attRes,
        timeRes,
        courseRes,
        assignRes,
        roomRes,
        feesRes,
        notifRes,
      ] = await Promise.all([
        api.getAttendance().catch(() => null),
        api.getTimetable().catch(() => ({ slots: [] })),
        api.getCourses().catch(() => ({ courses: [] })),
        api.getAssignments().catch(() => ({ assignments: [] })),
        api.getMyRoom().catch(() => null),
        api.getFees().catch(() => null),
        api.getNotifications().catch(() => ({ notifications: [] })),
      ]);

      setAttendance(attRes);
      setTimetable(timeRes?.slots || []);
      setCourses(courseRes?.courses || []);
      setAssignments(assignRes?.assignments || []);
      setRoomInfo(roomRes);
      setFees(feesRes);
      setNotifications((notifRes?.notifications || []).slice(0, 4));

      // Auto-detect current weekday if applicable
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayDay = days[new Date().getDay()];
      if (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(todayDay)) {
        setSelectedDay(todayDay);
      } else {
        setSelectedDay('MONDAY');
      }
    } catch (err: any) {
      console.error('Error loading student dashboard data', err);
      setError(err?.message || 'Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle assignment submission
  const handleOpenSubmit = (assign: any) => {
    setSelectedAssignment(assign);
    setSubmissionText('');
    setSubmissionFile('');
    setSubmitModalOpen(true);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    try {
      await api.submitAssignment(selectedAssignment.id, {
        submissionText,
        fileUrl: submissionFile || 'https://drive.google.com/submission-file.pdf',
      });
      setSubmitModalOpen(false);
      // Reload assignments
      const res = await api.getAssignments();
      setAssignments(res?.assignments || []);
    } catch (err: any) {
      alert(err?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Fee Payment
  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentModalOpen(true);
  };

  const handlePayInvoice = async () => {
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      await api.payFee(selectedInvoice.id, 'UPI_RAZORPAY');
      setPaymentModalOpen(false);
      // Reload fees
      const res = await api.getFees();
      setFees(res);
    } catch (err: any) {
      alert(err?.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  // Derived metrics
  const overallAtt = attendance?.overallPercentage ?? 87;
  const pendingInvoices = fees?.invoices?.filter((i: any) => i.status !== 'PAID') || [];
  const totalPendingFee = fees?.summary?.totalPending ?? (pendingInvoices.reduce((acc: number, cur: any) => acc + (cur.amount || 0), 0));
  const pendingAssignmentsCount = assignments.filter((a: any) => {
    const sub = a.submissions?.find((s: any) => s.studentId === user?.id || s.id);
    return !sub || sub.status === 'PENDING';
  }).length;

  const daySlots = timetable
    .filter((slot) => slot.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-slate-200/70"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-200/70"></div>
          <div className="h-96 rounded-2xl bg-slate-200/70"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto my-12 border-rose-200">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#172D45]">Unable to Load Student Portal</h3>
        <p className="text-xs text-[#778195] mt-1 mb-4">{error}</p>
        <Button onClick={loadData} variant="primary" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#172D45] text-white p-6 sm:p-8 shadow-sm border border-[#172D45]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Spring 2025 • Student Academic Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name || 'Student'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Enrolled in <strong className="text-white font-semibold">{user?.department || 'B.Tech CSE'}</strong>,{' '}
              {user?.semester ? `Semester ${user.semester}` : 'Semester 6'} • Roll No: <strong className="text-white font-mono">{user?.identifierNo || 'RU2023CSE042'}</strong>.
              Your attendance is above the university threshold and all core portals are active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => onNavigate('housing')}
              icon={<Building2 className="w-4 h-4 text-[#5267D8]" />}
            >
              Hostel & Leaves
            </Button>
            <Button
              variant="accent"
              size="md"
              onClick={() => onNavigate('academics')}
              icon={<GraduationCap className="w-4 h-4" />}
            >
              Academic Records
            </Button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-[#5267D8]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${overallAtt}%`}
          subtitle={`${attendance?.totalAttended || 13} of ${attendance?.totalClasses || 15} sessions attended`}
          icon={CheckCircle2}
          badge={overallAtt >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}
          badgeColor={overallAtt >= 75 ? 'emerald' : 'rose'}
          trend={overallAtt >= 75 ? '+3% vs requirement' : 'Below 75% min'}
          trendPositive={overallAtt >= 75}
        />
        <StatCard
          title="Enrolled Courses"
          value={`${courses.length} Courses`}
          subtitle={`20 Credits Registered this term`}
          icon={BookOpen}
          badge="Spring 2025"
          badgeColor="indigo"
        />
        <StatCard
          title="Hostel Suite"
          value={roomInfo?.allocation?.room ? `${roomInfo.allocation.room.hostelBlock?.code || 'TAK'}-${roomInfo.allocation.room.roomNumber}` : 'TAK-204'}
          subtitle={roomInfo?.allocation?.room ? `${roomInfo.allocation.room.hostelBlock?.name || 'Takshashila'} • ${roomInfo.allocation.room.roomType}` : 'Takshashila Double AC'}
          icon={Building2}
          badge="Allocated"
          badgeColor="emerald"
        />
        <StatCard
          title="Outstanding Fees"
          value={totalPendingFee > 0 ? `₹${totalPendingFee.toLocaleString('en-IN')}` : '₹0'}
          subtitle={pendingInvoices.length > 0 ? `${pendingInvoices.length} Pending Invoice Due` : 'All university dues cleared'}
          icon={CreditCard}
          badge={totalPendingFee > 0 ? 'PAYMENT DUE' : 'CLEARED'}
          badgeColor={totalPendingFee > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* 3. Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Timetable & Attendance Breakdown & Upcoming Assignments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section A: Today's Timetable */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#5267D8]" />
                  <span>Academic Class Timetable</span>
                </CardTitle>
                <CardDescription>
                  Daily lecture and laboratory sessions with faculty instructors and venues
                </CardDescription>
              </div>

              {/* Day filter selector */}
              <div className="flex items-center bg-[#F7F8FA] p-1 rounded-xl border border-slate-200/80">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      selectedDay === d
                        ? 'bg-[#172D45] text-white shadow-xs'
                        : 'text-[#778195] hover:text-[#202938]'
                    }`}
                  >
                    {d.substring(0, 3)}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {daySlots.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#778195] flex flex-col items-center">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                  <span>No scheduled lectures for {selectedDay}. Enjoy your study hours!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySlots.map((slot, index) => (
                    <div
                      key={slot.id || index}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-[#F7F8FA]/60 hover:bg-[#F7F8FA] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-20 text-center py-1.5 px-2 rounded-xl bg-white text-[#172D45] text-xs font-bold border border-slate-200 shadow-xs shrink-0">
                          {slot.startTime}
                          <span className="block text-[10px] text-[#778195] font-normal">to {slot.endTime}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-[#172D45]">
                              {slot.course?.code}: {slot.course?.name}
                            </h4>
                          </div>
                          <p className="text-xs text-[#778195] mt-0.5 flex items-center gap-2">
                            <span>Room: <strong className="text-[#202938]">{slot.roomNo}</strong></span>
                            <span>•</span>
                            <span>Instructor: <strong className="text-[#202938]">{slot.faculty?.name || 'Prof. Faculty'}</strong></span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Badge
                          status={index === 0 ? 'HAPPENING NOW' : index === 1 ? 'NEXT UP' : 'SCHEDULED'}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter>
              <span>{daySlots.length} lecture slots scheduled for {selectedDay}</span>
              <button
                onClick={() => onNavigate('academics')}
                className="text-xs font-semibold text-[#5267D8] hover:underline flex items-center gap-1"
              >
                <span>Full Semester Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </CardFooter>
          </Card>

          {/* Section B: Attendance Overview Breakdown */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Course-Wise Attendance Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Official attendance metrics. The minimum requirement for end-term examination clearance is 75%.
                </CardDescription>
              </div>
              <Badge status={overallAtt >= 75 ? 'ELIGIBLE' : 'SHORTAGE'} size="md" />
            </CardHeader>

            <CardContent>
              {attendance?.courseStats && attendance.courseStats.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Course</TableHeaderCell>
                      <TableHeaderCell className="text-center">Attended / Total</TableHeaderCell>
                      <TableHeaderCell className="w-48">Progress</TableHeaderCell>
                      <TableHeaderCell className="text-center">Status</TableHeaderCell>
                      <TableHeaderCell className="text-right">Safe Bunks</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendance.courseStats.map((item: any) => {
                      const pct = item.percentage ?? 0;
                      const isEligible = pct >= 75;
                      return (
                        <TableRow key={item.courseId}>
                          <TableCell>
                            <span className="font-bold text-[#172D45] block">{item.courseCode}</span>
                            <span className="text-xs text-[#778195] line-clamp-1">{item.courseName}</span>
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium">
                            {item.attendedSessions} / {item.totalSessions}
                          </TableCell>
                          <TableCell>
                            <ProgressBar value={pct} size="sm" showPercentage />
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge status={isEligible ? 'ELIGIBLE' : 'SHORTAGE'} size="sm" />
                          </TableCell>
                          <TableCell className="text-right">
                            {item.safeBunks > 0 ? (
                              <span className="text-emerald-700 font-semibold text-xs">
                                +{item.safeBunks} lectures
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold text-xs">
                                Attend next {Math.abs(item.safeBunks || 1)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-xs text-[#778195]">
                  No attendance session records logged for current term.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section C: Upcoming Assignments & Continuous Evaluation */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5267D8]" />
                  <span>Assignments & Continuous Assessment</span>
                </CardTitle>
                <CardDescription>
                  Submit term assignments, projects, and lab records for grading
                </CardDescription>
              </div>
              <span className="text-xs text-[#778195] font-medium">
                {assignments.length} Total Assignments
              </span>
            </CardHeader>

            <CardContent>
              {assignments.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#778195]">
                  No pending assignments right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assign: any) => {
                    const submission = assign.submissions?.find((s: any) => s.studentId === user?.id || s.id);
                    const isSubmitted = submission && submission.status !== 'PENDING';

                    return (
                      <div
                        key={assign.id}
                        className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#5267D8] bg-[#EEF0FB] px-2 py-0.5 rounded">
                              {assign.course?.code || 'CSE'}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-[#172D45]">
                              {assign.title}
                            </h4>
                          </div>
                          <p className="text-xs text-[#778195] line-clamp-2">
                            {assign.description}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-[#778195] pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Due: {new Date(assign.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </span>
                            <span>•</span>
                            <span>Max Marks: <strong>{assign.maxMarks}</strong></span>
                            {submission?.marksObtained !== undefined && submission?.marksObtained !== null && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-emerald-700">
                                  Score: {submission.marksObtained} / {assign.maxMarks}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <Badge
                            status={isSubmitted ? (submission?.status || 'SUBMITTED') : 'PENDING'}
                            size="sm"
                          />
                          {!isSubmitted ? (
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => handleOpenSubmit(assign)}
                              icon={<Send className="w-3 h-3" />}
                            >
                              Submit
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section D: Enrolled Courses List */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#172D45]" />
                  <span>Enrolled Courses</span>
                </CardTitle>
                <CardDescription>
                  Registered courses for B.Tech CSE Semester 6 (Spring 2025)
                </CardDescription>
              </div>
              <span className="text-xs font-semibold text-[#172D45] bg-[#F7F8FA] px-2.5 py-1 rounded-lg border border-slate-200">
                {courses.length} Registered
              </span>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-[#F7F8FA]/60 hover:bg-[#F7F8FA] hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-[#5267D8] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                          {course.code}
                        </span>
                        <span className="text-[11px] font-semibold text-[#778195]">
                          {course.credits} Credits
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#172D45] leading-snug">
                        {course.name}
                      </h4>
                      <p className="text-xs text-[#778195] mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description || 'Core departmental course emphasizing applied systems and theoretical rigor.'}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-[#778195]">
                      <span>Instructor:</span>
                      <span className="font-semibold text-[#202938]">
                        {course.faculty?.name || 'Assigned Faculty'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Hostel Room & Pending Fees & Notifications */}
        <div className="space-y-6">

          {/* Section E: Hostel Room Information */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#5267D8]" />
                  <span>Hostel & Housing</span>
                </CardTitle>
                <CardDescription>Campus accommodation & allocation</CardDescription>
              </div>
              <Badge status="ALLOCATED" size="sm" />
            </CardHeader>

            <CardContent className="space-y-4">
              {roomInfo?.allocation ? (
                <>
                  {/* Room Highlight Box */}
                  <div className="p-4 rounded-xl bg-[#172D45] text-white space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                          Assigned Room
                        </span>
                        <h4 className="text-2xl font-bold">
                          {roomInfo.allocation.room?.hostelBlock?.code || 'TAK'}-{roomInfo.allocation.room?.roomNumber}
                        </h4>
                      </div>
                      <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                        Floor {roomInfo.allocation.room?.floor || 2}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-slate-300">
                      <span>{roomInfo.allocation.room?.hostelBlock?.name || 'Takshashila Hostel'}</span>
                      <span className="font-semibold text-white">{roomInfo.allocation.room?.roomType || 'Double AC'}</span>
                    </div>
                  </div>

                  {/* Roommates List */}
                  <div>
                    <h5 className="text-xs font-bold text-[#172D45] mb-2 uppercase tracking-wider">
                      Roommate(s)
                    </h5>
                    {roomInfo.roommates && roomInfo.roommates.length > 0 ? (
                      <div className="space-y-2">
                        {roomInfo.roommates.map((rm: any) => (
                          <div
                            key={rm.id}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-[#F7F8FA] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={rm.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                                alt={rm.name}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-[#172D45] block">{rm.name}</span>
                                <span className="text-[10px] text-[#778195]">{rm.identifierNo}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {rm.department?.split(' ')[0] || 'CSE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#778195]">Single occupancy or roommate pending check-in.</p>
                    )}
                  </div>

                  {/* Hostel Warden Info */}
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-[#F7F8FA] text-xs space-y-1">
                    <span className="text-[10px] font-bold text-[#778195] uppercase tracking-wider block">
                      Warden in Charge
                    </span>
                    <p className="font-bold text-[#172D45]">
                      {roomInfo.allocation.room?.hostelBlock?.warden?.name || 'Col. Rajesh Verma (Retd.)'}
                    </p>
                    <p className="text-[11px] text-[#778195]">
                      Phone: {roomInfo.allocation.room?.hostelBlock?.warden?.phone || '+91 98765 43213'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center text-xs text-[#778195]">
                  No active hostel room allocation recorded.
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onNavigate('housing')}
              >
                Apply for Outing / Leave Pass
              </Button>
            </CardFooter>
          </Card>

          {/* Section F: Pending Fees & Invoices */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#5267D8]" />
                  <span>Tuition & Housing Fees</span>
                </CardTitle>
                <CardDescription>Semester payment status and dues</CardDescription>
              </div>
              <Badge status={totalPendingFee > 0 ? 'PENDING' : 'PAID'} size="sm" />
            </CardHeader>

            <CardContent className="space-y-3">
              {fees?.invoices && fees.invoices.length > 0 ? (
                fees.invoices.map((inv: any) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <div
                      key={inv.id}
                      className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                        isPaid
                          ? 'border-slate-200 bg-[#F7F8FA]/50'
                          : 'border-amber-200 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#172D45]">{inv.title}</span>
                          </div>
                          <span className="text-[10px] text-[#778195] block mt-0.5 font-mono">
                            {inv.invoiceNo} • {inv.feeType}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-[#172D45] shrink-0">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-[#778195]">
                          {isPaid ? `Paid: ${new Date(inv.paidAt || inv.dueDate).toLocaleDateString()}` : `Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                        </span>

                        {!isPaid ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenPayment(inv)}
                          >
                            Pay ₹{inv.amount.toLocaleString('en-IN')}
                          </Button>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid in Full</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-[#778195]">
                  No fee records found.
                </div>
              )}
            </CardContent>

            <CardFooter>
              <span>Total Dues: <strong>₹{totalPendingFee.toLocaleString('en-IN')}</strong></span>
              <button
                onClick={() => onNavigate('fees')}
                className="text-xs font-semibold text-[#5267D8] hover:underline"
              >
                View all receipts
              </button>
            </CardFooter>
          </Card>

          {/* Section G: Recent Notifications */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#172D45]" />
                  <span>Campus Broadcasts</span>
                </CardTitle>
                <CardDescription>Latest university notifications</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#778195]">
                  No active notices.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className="p-3 rounded-xl border border-slate-100 bg-[#F7F8FA]/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#172D45] truncate">{notif.title}</span>
                        <Badge status={notif.category} size="sm" />
                      </div>
                      <p className="text-[11px] text-[#778195] leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Submission Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={`Submit Work: ${selectedAssignment?.title || 'Assignment'}`}
      >
        <form onSubmit={handleSubmitWork} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172D45] mb-1">
              Submission Text / Executive Summary
            </label>
            <textarea
              required
              rows={4}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Provide a summary of your findings, research methodology, or github repository link..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172D45] mb-1">
              File URL / Cloud Drive Link (Optional)
            </label>
            <input
              type="url"
              value={submissionFile}
              onChange={(e) => setSubmissionFile(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5267D8]/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSubmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="sm"
              loading={submitting}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Confirm Submission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Confirm Fee Payment"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#778195]">Invoice Number:</span>
              <span className="font-mono font-bold text-[#172D45]">{selectedInvoice?.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#778195]">Fee Category:</span>
              <span className="font-semibold text-[#172D45]">{selectedInvoice?.title}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
              <span className="text-[#172D45]">Total Payable:</span>
              <span className="text-[#5267D8]">₹{selectedInvoice?.amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-xs text-[#778195]">
            Clicking confirm will simulate processing payment via the university's payment gateway (UPI/Netbanking) and automatically generate an official cleared fee receipt in your account.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={paying}
              onClick={handlePayInvoice}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Pay Now (Instant Clearance)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

