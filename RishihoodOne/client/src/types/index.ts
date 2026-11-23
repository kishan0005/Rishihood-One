export type Role = 'STUDENT' | 'FACULTY' | 'WARDEN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  department?: string | null;
  identifierNo?: string | null;
  semester?: number | null;
  batch?: string | null;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  department: string;
  semester: number;
  facultyId?: string;
  faculty?: { id: string; name: string; email: string; department?: string };
  syllabus?: string;
  enrollmentId?: string;
  enrolledSemester?: number;
  assignments?: Assignment[];
  enrollments?: Array<{
    id: string;
    student: { id: string; name: string; identifierNo?: string; email: string };
  }>;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  sessionTopic?: string;
  remarks?: string;
  course?: { id: string; code: string; name: string };
  student?: { id: string; name: string; identifierNo?: string };
}

export interface AttendanceSummary {
  overallPercentage: number;
  totalClasses: number;
  totalAttended: number;
  courseStats: Array<{
    courseId: string;
    courseCode: string;
    courseName: string;
    totalSessions: number;
    attendedSessions: number;
    percentage: number;
    status: 'GOOD' | 'CRITICAL';
  }>;
  history: AttendanceRecord[];
}

export interface TimetableSlot {
  id: string;
  courseId: string;
  facultyId?: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  roomNo: string;
  batch?: string;
  course: { id: string; code: string; name: string };
  faculty?: { name: string };
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  attachmentUrl?: string;
  course: { code: string; name: string };
  mySubmission?: AssignmentSubmission | null;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  fileUrl?: string;
  submittedAt: string;
  marksObtained?: number | null;
  feedback?: string | null;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  student?: { id: string; name: string; identifierNo?: string };
}

export interface AcademicResult {
  id: string;
  studentId: string;
  courseId: string;
  semester: number;
  examType: 'MID_TERM' | 'END_TERM' | 'INTERNAL' | 'PRACTICAL';
  marksObtained: number;
  totalMarks: number;
  gradePoint: number;
  letterGrade: string;
  academicYear: string;
  course: { code: string; name: string; credits: number };
  student?: { id: string; name: string; identifierNo?: string };
}

export interface ResultsData {
  cgpa: number;
  totalCreditsEarned: number;
  semesters: Array<{
    semester: number;
    sgpa: number;
    credits: number;
    courses: AcademicResult[];
  }>;
  rawResults: AcademicResult[];
}

export interface HostelBlock {
  id: string;
  name: string;
  code: string;
  genderType: 'COED' | 'BOYS' | 'GIRLS';
  totalRooms: number;
  wardenId?: string;
  warden?: { id: string; name: string; phone?: string; email: string };
  description?: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  hostelBlockId: string;
  roomNumber: string;
  floor: number;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  capacity: number;
  occupied: number;
  feePerSemester: number;
  amenities: string;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  hostelBlock?: HostelBlock;
  allocations?: Array<{
    id: string;
    student: { id: string; name: string; identifierNo?: string; phone?: string; department?: string; email?: string; avatarUrl?: string };
  }>;
}

export interface HostelAllocation {
  id: string;
  studentId: string;
  roomId: string;
  academicYear: string;
  semester: number;
  checkInDate: string;
  status: 'ACTIVE' | 'VACATED' | 'PENDING';
  room: Room;
}

export interface HostelApplication {
  id: string;
  studentId: string;
  preferredBlockId: string;
  preferredRoomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE';
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  wardenRemarks?: string;
  appliedAt: string;
  reviewedAt?: string;
  student: { id: string; name: string; identifierNo?: string; email: string; phone?: string; department?: string };
  preferredBlock: HostelBlock;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  leaveType: 'DAY_OUTING' | 'NIGHT_OUT' | 'HOME_VISIT' | 'EMERGENCY';
  departureDate: string;
  returnDate: string;
  destination: string;
  reason: string;
  parentContact: string;
  emergencyContact?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  appliedAt: string;
  reviewedAt?: string;
  student: {
    id: string;
    name: string;
    identifierNo?: string;
    phone?: string;
    department?: string;
    hostelAllocations?: Array<{
      room: { roomNumber: string; hostelBlock: { name: string } };
    }>;
  };
  warden?: { name: string };
}

export interface Complaint {
  id: string;
  studentId: string;
  category: 'ELECTRICAL' | 'PLUMBING' | 'WIFI' | 'CARPENTRY' | 'HOUSEKEEPING' | 'ACADEMIC' | 'OTHER';
  title: string;
  description: string;
  location: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  student: { id: string; name: string; identifierNo?: string; phone?: string };
  assignedTo?: { id: string; name: string };
}

export interface FeeInvoice {
  id: string;
  studentId: string;
  invoiceNo: string;
  title: string;
  feeType: 'TUITION' | 'HOSTEL' | 'MESS' | 'AMENITIES' | 'OTHER';
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paymentMethod?: string;
  transactionRef?: string;
  paidAt?: string;
  createdAt: string;
  student: { id: string; name: string; identifierNo?: string; department?: string };
}

export interface DiningMenuItem {
  id: string;
  dayOfWeek: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';
  items: string;
  specialDiet?: string;
  timing: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: 'ACADEMIC' | 'CULTURAL' | 'SPORTS' | 'WORKSHOP' | 'PLACEMENT';
  venue: string;
  startTime: string;
  endTime: string;
  organizer: string;
  bannerUrl?: string;
  capacity: number;
  registeredCount: number;
  isRegistered?: boolean;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  category: 'ACADEMIC' | 'HOUSING' | 'FEES' | 'GENERAL';
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  counts: {
    students: number;
    faculty: number;
    wardens: number;
    courses: number;
    enrollments: number;
    openComplaints: number;
    pendingLeaves: number;
    pendingHostelApplications: number;
  };
  housing: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
  };
  finance: {
    totalBilled: number;
    totalCollected: number;
    outstanding: number;
    collectionRate: number;
  };
  recentActivity: {
    complaints: Complaint[];
    leaves: LeaveRequest[];
  };
}

