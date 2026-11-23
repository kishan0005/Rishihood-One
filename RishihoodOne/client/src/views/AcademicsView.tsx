import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  CalendarCheck,
  Calendar,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  ExternalLink,
  ChevronRight,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { Course, TimetableSlot, Assignment, ResultsData, AttendanceSummary } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

type TabType = 'courses' | 'attendance' | 'timetable' | 'assignments' | 'results';

export const AcademicsView: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('courses');

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState<Course | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');

  // Faculty Grade Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(90);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Faculty Mark Attendance Modal
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState<boolean>(false);
  const [attCourseId, setAttCourseId] = useState<string>('');
  const [attTopic, setAttTopic] = useState<string>('');
  const [attAttendees, setAttAttendees] = useState<Array<{ studentId: string; name: string; roll: string; status: string }>>([]);

  // Faculty Create Assignment Modal
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState<boolean>(false);
  const [newAsgnCourseId, setNewAsgnCourseId] = useState<string>('');
  const [newAsgnTitle, setNewAsgnTitle] = useState<string>('');
  const [newAsgnDesc, setNewAsgnDesc] = useState<string>('');
  const [newAsgnDue, setNewAsgnDue] = useState<string>('');
  const [newAsgnMarks, setNewAsgnMarks] = useState<number>(100);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, attRes, timeRes, asgnRes, resRes] = await Promise.all([
        api.getCourses().catch(() => ({ courses: [] })),
        api.getAttendance().catch(() => null),
        api.getTimetable().catch(() => ({ slots: [] })),
        api.getAssignments().catch(() => ({ assignments: [] })),
        api.getResults().catch(() => null),
      ]);

      setCourses(coursesRes.courses || []);
      setAttendance(attRes);
      setTimetable(timeRes.slots || []);
      setAssignments(asgnRes.assignments || []);
      setResults(resRes);

      if (coursesRes.courses?.length > 0) {
        setAttCourseId(coursesRes.courses[0].id);
        setNewAsgnCourseId(coursesRes.courses[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user]);

  // Handle student assignment submit
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      await api.submitAssignment(selectedAssignment.id, {
        submissionText,
        fileUrl,
      });
      showMsg('Assignment submitted successfully!');
      setIsSubmitModalOpen(false);
      setSubmissionText('');
      setFileUrl('');
      loadData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // Handle faculty grading
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !selectedAssignment) return;

    try {
      await api.gradeAssignment(selectedAssignment.id, {
        submissionId: selectedSubmission.id,
        marksObtained: gradeMarks,
        feedback: gradeFeedback,
      });
      showMsg('Grade and feedback saved successfully!');
      setIsGradeModalOpen(false);
      loadData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // Open Mark Attendance Modal
  const openMarkAttendance = () => {
    // Populate demo attendees from enrollment list or defaults
    const currentCourse = courses.find((c) => c.id === attCourseId) || courses[0];
    const studentList =
      currentCourse?.enrollments && currentCourse.enrollments.length > 0
        ? currentCourse.enrollments.map((e: any) => ({
            studentId: e.student.id,
            name: e.student.name,
            roll: e.student.identifierNo || 'RU-CS',
            status: 'PRESENT',
          }))
        : [];

    setAttAttendees(studentList);
    setAttTopic('Advanced Neural Network Optimization & Quantization');
    setIsMarkAttendanceOpen(true);
  };

  useEffect(() => {
    if (attCourseId && courses.length > 0) {
      const selected = courses.find((c) => c.id === attCourseId);
      if (selected?.enrollments && selected.enrollments.length > 0) {
        setAttAttendees(
          selected.enrollments.map((e: any) => ({
            studentId: e.student.id,
            name: e.student.name,
            roll: e.student.identifierNo || 'RU-CS',
            status: 'PRESENT',
          }))
        );
      }
    }
  }, [attCourseId, courses]);

  // Save Attendance to DB
  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attCourseId) return;

    try {
      await api.markAttendance({
        courseId: attCourseId,
        date: new Date().toISOString(),
        sessionTopic: attTopic,
        attendees: attAttendees.map((a) => ({
          studentId: a.studentId,
          status: a.status,
        })),
      });

      showMsg(`Attendance for ${attAttendees.length} students logged to database!`);
      setIsMarkAttendanceOpen(false);
      loadData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  // Handle Faculty Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssignment({
        courseId: newAsgnCourseId,
        title: newAsgnTitle,
        description: newAsgnDesc,
        dueDate: newAsgnDue,
        maxMarks: newAsgnMarks,
      });

      showMsg('New course assignment published!');
      setIsCreateAssignmentOpen(false);
      setNewAsgnTitle('');
      setNewAsgnDesc('');
      loadData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header with Sub-tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">Academic Management</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Course curricula, lecture logs, timetable matrix, assignments, and certified transcripts.
            </p>
          </div>

          {/* Role-Specific Primary Action */}
          <div className="flex items-center gap-2">
            {role === 'FACULTY' && (
              <>
                <button
                  onClick={openMarkAttendance}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Mark Attendance</span>
                </button>
                <button
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Assignment</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Notification Toast Banner */}
        {statusMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          {[
            { id: 'courses', label: 'Enrolled Courses', icon: BookOpen },
            { id: 'attendance', label: 'Attendance Records', icon: CalendarCheck },
            { id: 'timetable', label: 'Weekly Timetable', icon: Calendar },
            { id: 'assignments', label: 'Assignments & Labs', icon: FileText },
            { id: 'results', label: 'Results & Transcripts', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: COURSES */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                    {course.code}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{course.credits} Credits</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900 leading-snug">{course.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{course.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                  <p>
                    <strong className="text-slate-700">Department:</strong> {course.department}
                  </p>
                  <p>
                    <strong className="text-slate-700">Faculty:</strong>{' '}
                    {course.faculty?.name || 'Dr. Ananya Roy'}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCourseForSyllabus(course)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>View Syllabus</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-slate-400 font-semibold">Semester {course.semester}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Overview Metric Banner */}
          {attendance && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mandatory Attendance Audit
                </span>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-3xl font-extrabold text-navy-900">
                    {attendance.overallPercentage}%
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      attendance.overallPercentage >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {attendance.overallPercentage >= 75 ? 'ELIGIBLE FOR EXAMS' : 'SHORTAGE ALERT (<75%)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {attendance.totalAttended} attended out of {attendance.totalClasses} total lecture slots conducted.
                </p>
              </div>

              {/* Course-by-course small bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-1/2">
                {attendance.courseStats?.map((cs) => (
                  <div key={cs.courseId} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{cs.courseCode}</span>
                      <span>{cs.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cs.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${cs.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-900">Verified Session Attendance Log</h3>
              <span className="text-xs text-slate-400">Synced in real-time</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Date</th>
                    <th className="py-3 px-6">Course</th>
                    <th className="py-3 px-6">Session Topic Covered</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(attendance?.history || []).map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-medium">
                        {new Date(rec.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-navy-900">{rec.course?.code}</td>
                      <td className="py-3.5 px-6 font-medium text-slate-600">{rec.sessionTopic || 'Lecture'}</td>
                      <td className="py-3.5 px-6">
                        <Badge status={rec.status} />
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">{rec.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TIMETABLE */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-900">Weekly Master Timetable</h3>
              <p className="text-xs text-slate-500">School of Technology & Design — Spring 2025</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              B.Tech CSE - Semester 6
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
              const daySlots = timetable.filter((s) => s.dayOfWeek === day);

              return (
                <div key={day} className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-3">
                  <div className="text-center pb-2 border-b border-slate-200">
                    <span className="text-xs font-extrabold text-navy-900">{day}</span>
                  </div>
                  <div className="space-y-2.5">
                    {daySlots.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-slate-400">Self-Study & Labs</div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1.5 hover:border-indigo-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-navy-900 leading-snug">
                            {slot.course.code}: {slot.course.name}
                          </h4>
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                            <span>🏛️ {slot.roomNo}</span>
                            <span className="font-semibold text-slate-600">{slot.faculty?.name?.split(' ')[1] || 'Staff'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignments.map((asgn) => {
              const mySub = asgn.mySubmission;
              const isOverdue = new Date() > new Date(asgn.dueDate);

              return (
                <div
                  key={asgn.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                        {asgn.course.code}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Due {new Date(asgn.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-navy-900 leading-snug">{asgn.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{asgn.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-semibold">
                      <span>Max Marks: {asgn.maxMarks}</span>
                      {role === 'STUDENT' && (
                        <span>
                          Status:{' '}
                          {mySub ? (
                            <Badge status={mySub.status} />
                          ) : isOverdue ? (
                            <Badge status="OVERDUE" />
                          ) : (
                            <Badge status="PENDING" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Show Submission Details if already graded */}
                    {mySub && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-navy-900">
                          <span>Your Submission:</span>
                          {mySub.marksObtained !== null && (
                            <span className="text-emerald-700">
                              Score: {mySub.marksObtained}/{asgn.maxMarks}
                            </span>
                          )}
                        </div>
                        {mySub.feedback && (
                          <p className="text-slate-600 text-[11px] italic">“{mySub.feedback}”</p>
                        )}
                        {mySub.fileUrl && (
                          <a
                            href={mySub.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 text-[11px] flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Attached Solution Artifact</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Faculty: Show student submissions to grade */}
                    {role === 'FACULTY' && asgn.submissions && asgn.submissions.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-700">Student Submissions ({asgn.submissions.length}):</p>
                        <div className="divide-y divide-slate-100">
                          {asgn.submissions.map((sub: any) => (
                            <div key={sub.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-navy-900">{sub.student?.name}</span>
                                <span className="text-[11px] text-slate-500 ml-1.5 font-medium">({sub.student?.identifierNo})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge status={sub.status} />
                                <button
                                  onClick={() => {
                                    setSelectedAssignment(asgn);
                                    setSelectedSubmission(sub);
                                    setGradeMarks(sub.marksObtained || 90);
                                    setGradeFeedback(sub.feedback || 'Good work on the implementation.');
                                    setIsGradeModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-navy-900 text-white font-semibold text-[11px] hover:bg-navy-800"
                                >
                                  Grade
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Student submit button */}
                  {role === 'STUDENT' && (
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setSelectedAssignment(asgn);
                          setSubmissionText(mySub?.submissionText || '');
                          setFileUrl(mySub?.fileUrl || '');
                          setIsSubmitModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold hover:bg-navy-800 transition shadow-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{mySub ? 'Update Submission' : 'Submit Solution'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: RESULTS & TRANSCRIPTS */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {results && (
            <div className="bg-gradient-to-r from-navy-950 to-indigo-950 rounded-2xl p-6 text-white shadow-sm border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Academic Performance Index
                </span>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-4xl font-extrabold text-white">{results.cgpa}</h3>
                  <span className="text-xs font-bold bg-amber-400 text-navy-950 px-2 py-0.5 rounded-full">
                    FIRST CLASS WITH DISTINCTION
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Total Credits Earned: <strong>{results.totalCreditsEarned} Credits</strong> • Evaluation Authority: Rishihood Examination Directorate
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl text-center">
                  <span className="text-xs text-slate-300 block">Semester 5 SGPA</span>
                  <span className="text-xl font-bold text-white">9.15</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl text-center">
                  <span className="text-xs text-slate-300 block">Dean’s Honor List</span>
                  <span className="text-xl font-bold text-amber-400">Rank #2</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy-900">Certified Grade Sheet & Course Evaluation</h3>
              <span className="text-xs text-slate-400">Autonomous Grading System (10-Point Scale)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-6">Sem</th>
                    <th className="py-3 px-6">Course Code & Title</th>
                    <th className="py-3 px-6">Credits</th>
                    <th className="py-3 px-6">Evaluation Mode</th>
                    <th className="py-3 px-6">Score</th>
                    <th className="py-3 px-6">Grade Point</th>
                    <th className="py-3 px-6">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(results?.rawResults || []).map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-navy-900">Sem {res.semester}</td>
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-navy-900">{res.course.code}</span> — {res.course.name}
                      </td>
                      <td className="py-3.5 px-6 font-medium">{res.course.credits}</td>
                      <td className="py-3.5 px-6 text-slate-500">{res.examType.replace('_', ' ')}</td>
                      <td className="py-3.5 px-6 font-bold">{res.marksObtained}/100</td>
                      <td className="py-3.5 px-6 font-extrabold text-indigo-700">{res.gradePoint.toFixed(1)}</td>
                      <td className="py-3.5 px-6">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-extrabold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {res.letterGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Course Syllabus */}
      <Modal
        isOpen={!!selectedCourseForSyllabus}
        onClose={() => setSelectedCourseForSyllabus(null)}
        title={`${selectedCourseForSyllabus?.code}: ${selectedCourseForSyllabus?.name}`}
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-navy-900">Department of {selectedCourseForSyllabus?.department}</p>
              <p className="text-slate-500">Credits: {selectedCourseForSyllabus?.credits} • Semester {selectedCourseForSyllabus?.semester}</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
              Core Course
            </span>
          </div>
          <div>
            <h4 className="font-bold text-navy-900 mb-1">Course Description:</h4>
            <p className="leading-relaxed text-slate-600">{selectedCourseForSyllabus?.description}</p>
          </div>
          <div>
            <h4 className="font-bold text-navy-900 mb-1">Detailed Syllabus:</h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 whitespace-pre-line font-mono text-[11px] text-slate-700 leading-relaxed">
              {selectedCourseForSyllabus?.syllabus || 'Full syllabus document available on University LMS portal.'}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Student Submit Assignment */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Submit Solution — ${selectedAssignment?.title}`}
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Submission Notes / Written Solution:</label>
            <textarea
              required
              rows={4}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Explain your approach, assumptions, algorithm complexity, or inline code..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Artifact / Repository / Document URL:</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://github.com/... or https://drive.google.com/..."
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Ensure permissions allow viewing by university faculty.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Confirm Submission
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Faculty Grade Submission */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`Grade Submission — ${selectedSubmission?.student?.name}`}
      >
        <form onSubmit={handleGradeSubmission} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-navy-900">Student Solution:</p>
            <p className="text-slate-600 mt-1">{selectedSubmission?.submissionText || 'No text submitted.'}</p>
            {selectedSubmission?.fileUrl && (
              <a
                href={selectedSubmission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-indigo-600 font-bold inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Submitted File / Artifact</span>
              </a>
            )}
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Marks Awarded (out of 100):</label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={gradeMarks}
              onChange={(e) => setGradeMarks(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Faculty Feedback & Comments:</label>
            <textarea
              rows={3}
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              placeholder="Constructive feedback for the student..."
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGradeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
            >
              Save Grade
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Faculty Mark Attendance */}
      <Modal
        isOpen={isMarkAttendanceOpen}
        onClose={() => setIsMarkAttendanceOpen(false)}
        title="Mark Class Attendance"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Course:</label>
              <select
                value={attCourseId}
                onChange={(e) => setAttCourseId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Session Topic Covered:</label>
              <input
                type="text"
                required
                value={attTopic}
                onChange={(e) => setAttTopic(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-2">Student Roster Attendance Check:</label>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {attAttendees.map((student, idx) => (
                <div key={student.studentId} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-navy-900">{student.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">({student.roll})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => {
                          const updated = [...attAttendees];
                          updated[idx].status = st;
                          setAttAttendees(updated);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition ${
                          student.status === st
                            ? st === 'PRESENT'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : st === 'ABSENT'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMarkAttendanceOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
            >
              Commit Attendance to DB
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Faculty Create Assignment */}
      <Modal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        title="Publish New Course Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Target Course:</label>
            <select
              value={newAsgnCourseId}
              onChange={(e) => setNewAsgnCourseId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Assignment Title:</label>
            <input
              type="text"
              required
              value={newAsgnTitle}
              onChange={(e) => setNewAsgnTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Engine Implementation"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Instructions & Problem Statement:</label>
            <textarea
              required
              rows={3}
              value={newAsgnDesc}
              onChange={(e) => setNewAsgnDesc(e.target.value)}
              placeholder="Detailed guidelines for students..."
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Due Date:</label>
              <input
                type="datetime-local"
                required
                value={newAsgnDue}
                onChange={(e) => setNewAsgnDue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Max Marks:</label>
              <input
                type="number"
                required
                value={newAsgnMarks}
                onChange={(e) => setNewAsgnMarks(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateAssignmentOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

