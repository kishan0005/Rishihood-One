import { Router, Response } from 'express';
import { Role, AttendanceStatus, SubmissionStatus, ExamType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// ----------------------------------------------------
// 1. COURSES
// ----------------------------------------------------
router.get('/courses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === Role.STUDENT) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        include: {
          course: {
            include: {
              faculty: { select: { id: true, name: true, email: true, department: true } },
              assignments: { select: { id: true, title: true, dueDate: true, maxMarks: true } },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      return res.json({
        courses: enrollments.map((e) => ({
          ...e.course,
          enrollmentId: e.id,
          enrolledSemester: e.semester,
        })),
      });
    } else if (user.role === Role.FACULTY) {
      const taughtCourses = await prisma.course.findMany({
        where: { facultyId: user.id },
        include: {
          enrollments: {
            include: {
              student: { select: { id: true, name: true, identifierNo: true, email: true } },
            },
          },
          assignments: true,
          timetable: true,
        },
      });

      return res.json({ courses: taughtCourses });
    } else {
      // Admin / Warden
      const allCourses = await prisma.course.findMany({
        include: {
          faculty: { select: { id: true, name: true, email: true } },
          _count: { select: { enrollments: true, assignments: true } },
        },
      });
      return res.json({ courses: allCourses });
    }
  } catch (error: any) {
    console.error('Fetch courses error:', error);
    return res.status(500).json({ error: 'Failed to load courses' });
  }
});

// Create Course (Admin or Faculty)
router.post('/courses', authenticate, authorize([Role.ADMIN, Role.FACULTY]), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, credits, department, semester, syllabus, facultyId } = req.body;

    if (!code || !name || !credits || !department || !semester) {
      return res.status(400).json({ error: 'Missing mandatory course fields' });
    }

    const course = await prisma.course.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description,
        credits: Number(credits),
        department,
        semester: Number(semester),
        syllabus,
        facultyId: facultyId || (req.user!.role === Role.FACULTY ? req.user!.id : null),
      },
      include: {
        faculty: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({ course });
  } catch (error: any) {
    console.error('Create course error:', error);
    return res.status(500).json({ error: 'Failed to create course. Code may already exist.' });
  }
});

// ----------------------------------------------------
// 2. ATTENDANCE
// ----------------------------------------------------
router.get('/attendance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { courseId, studentId } = req.query;

    if (user.role === Role.STUDENT) {
      // Get student's enrolled courses and attendance
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: user.id },
        include: {
          course: { select: { id: true, code: true, name: true } },
        },
        orderBy: { date: 'desc' },
      });

      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        include: { course: true },
      });

      // Calculate per-course statistics
      const courseStats = enrollments.map((enr) => {
        const courseRecords = records.filter((r) => r.courseId === enr.courseId);
        const total = courseRecords.length;
        const present = courseRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

        return {
          courseId: enr.course.id,
          courseCode: enr.course.code,
          courseName: enr.course.name,
          totalSessions: total,
          attendedSessions: present,
          percentage,
          status: percentage >= 75 ? 'GOOD' : 'CRITICAL',
        };
      });

      const totalClasses = records.length;
      const totalAttended = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
      const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 100;

      return res.json({
        overallPercentage,
        totalClasses,
        totalAttended,
        courseStats,
        history: records,
      });
    } else {
      // Faculty or Admin
      const whereClause: any = {};
      if (courseId && courseId !== 'undefined') whereClause.courseId = String(courseId);
      if (studentId && studentId !== 'undefined') whereClause.studentId = String(studentId);

      const records = await prisma.attendanceRecord.findMany({
        where: whereClause,
        include: {
          course: { select: { code: true, name: true } },
          student: { select: { id: true, name: true, identifierNo: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      });

      return res.json({ records });
    }
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return res.status(500).json({ error: 'Failed to retrieve attendance' });
  }
});

// Mark Attendance (Faculty or Admin)
router.post('/attendance/mark', authenticate, authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, date, sessionTopic, attendees } = req.body;
    // attendees: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>

    if (!courseId || !date || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'courseId, date, and attendees list are required' });
    }

    const sessionDate = new Date(date);

    const createdRecords = [];
    for (const item of attendees) {
      const rec = await prisma.attendanceRecord.create({
        data: {
          courseId,
          studentId: item.studentId,
          date: sessionDate,
          status: item.status || AttendanceStatus.PRESENT,
          sessionTopic: sessionTopic || 'Class Session',
          remarks: item.remarks || null,
        },
      });
      createdRecords.push(rec);
    }

    return res.json({
      message: `Successfully logged attendance for ${createdRecords.length} students.`,
      records: createdRecords,
    });
  } catch (error: any) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ----------------------------------------------------
// 3. TIMETABLE
// ----------------------------------------------------
router.get('/timetable', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === Role.STUDENT) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);

      const slots = await prisma.timetableSlot.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: { select: { id: true, code: true, name: true } },
          faculty: { select: { name: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });

      return res.json({ slots });
    } else if (user.role === Role.FACULTY) {
      const slots = await prisma.timetableSlot.findMany({
        where: { facultyId: user.id },
        include: {
          course: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });

      return res.json({ slots });
    } else {
      const slots = await prisma.timetableSlot.findMany({
        include: {
          course: { select: { code: true, name: true } },
          faculty: { select: { name: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });

      return res.json({ slots });
    }
  } catch (error: any) {
    console.error('Fetch timetable error:', error);
    return res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

router.post('/timetable', authenticate, authorize([Role.ADMIN, Role.FACULTY]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, facultyId, dayOfWeek, startTime, endTime, roomNo, batch } = req.body;

    const slot = await prisma.timetableSlot.create({
      data: {
        courseId,
        facultyId: facultyId || req.user!.id,
        dayOfWeek,
        startTime,
        endTime,
        roomNo,
        batch,
      },
      include: {
        course: { select: { code: true, name: true } },
        faculty: { select: { name: true } },
      },
    });

    return res.status(201).json({ slot });
  } catch (error: any) {
    console.error('Create timetable slot error:', error);
    return res.status(500).json({ error: 'Failed to add timetable slot' });
  }
});

// ----------------------------------------------------
// 4. ASSIGNMENTS & SUBMISSIONS
// ----------------------------------------------------
router.get('/assignments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === Role.STUDENT) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.id },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);

      const assignments = await prisma.assignment.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          course: { select: { code: true, name: true } },
          submissions: {
            where: { studentId: user.id },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return res.json({
        assignments: assignments.map((a) => ({
          ...a,
          mySubmission: a.submissions[0] || null,
        })),
      });
    } else {
      // Faculty & Admin
      const assignments = await prisma.assignment.findMany({
        where: user.role === Role.FACULTY ? { course: { facultyId: user.id } } : {},
        include: {
          course: { select: { code: true, name: true } },
          submissions: {
            include: {
              student: { select: { id: true, name: true, identifierNo: true } },
            },
          },
        },
        orderBy: { dueDate: 'desc' },
      });

      return res.json({ assignments });
    }
  } catch (error: any) {
    console.error('Fetch assignments error:', error);
    return res.status(500).json({ error: 'Failed to load assignments' });
  }
});

// Create Assignment (Faculty)
router.post('/assignments', authenticate, authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, title, description, dueDate, maxMarks, attachmentUrl } = req.body;

    if (!courseId || !title || !description || !dueDate) {
      return res.status(400).json({ error: 'Missing required assignment fields' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title,
        description,
        dueDate: new Date(dueDate),
        maxMarks: maxMarks ? Number(maxMarks) : 100,
        attachmentUrl,
      },
      include: {
        course: { select: { code: true, name: true } },
      },
    });

    return res.status(201).json({ assignment });
  } catch (error: any) {
    console.error('Create assignment error:', error);
    return res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Student Submit Assignment
router.post('/assignments/:id/submit', authenticate, authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const assignmentId = req.params.id;
    const { submissionText, fileUrl } = req.body;

    if (!submissionText && !fileUrl) {
      return res.status(400).json({ error: 'Please provide either text or file URL for your submission' });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: req.user!.id,
        },
      },
      update: {
        submissionText,
        fileUrl,
        submittedAt: new Date(),
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      },
      create: {
        assignmentId,
        studentId: req.user!.id,
        submissionText,
        fileUrl,
        submittedAt: new Date(),
        status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      },
    });

    return res.json({
      message: isLate ? 'Submitted (Marked Late)' : 'Submitted successfully!',
      submission,
    });
  } catch (error: any) {
    console.error('Submit assignment error:', error);
    return res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Faculty Grade Assignment Submission
router.post('/assignments/:id/grade', authenticate, authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId, marksObtained, feedback } = req.body;

    if (!submissionId || marksObtained === undefined) {
      return res.status(400).json({ error: 'submissionId and marksObtained are required' });
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained: Number(marksObtained),
        feedback,
        status: SubmissionStatus.GRADED,
      },
      include: {
        student: { select: { name: true, identifierNo: true } },
      },
    });

    return res.json({
      message: 'Submission graded successfully',
      submission,
    });
  } catch (error: any) {
    console.error('Grade submission error:', error);
    return res.status(500).json({ error: 'Failed to save grade' });
  }
});

// ----------------------------------------------------
// 5. RESULTS & CGPA
// ----------------------------------------------------
router.get('/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const rawTarget = user.role === Role.STUDENT ? user.id : req.query.studentId;
    const targetStudentId = rawTarget && rawTarget !== 'undefined' ? String(rawTarget) : undefined;

    const results = await prisma.academicResult.findMany({
      where: targetStudentId ? { studentId: targetStudentId } : {},
      include: {
        course: { select: { code: true, name: true, credits: true } },
        student: { select: { id: true, name: true, identifierNo: true, semester: true } },
      },
      orderBy: [{ semester: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate Semester-wise GPAs and cumulative CGPA
    let totalCredits = 0;
    let totalQualityPoints = 0;
    const semesterMap: Record<number, { credits: number; qualityPoints: number; courses: any[] }> = {};

    results.forEach((r) => {
      const sem = r.semester;
      if (!semesterMap[sem]) {
        semesterMap[sem] = { credits: 0, qualityPoints: 0, courses: [] };
      }
      const cred = r.course.credits || 4;
      semesterMap[sem].credits += cred;
      semesterMap[sem].qualityPoints += r.gradePoint * cred;
      semesterMap[sem].courses.push(r);

      totalCredits += cred;
      totalQualityPoints += r.gradePoint * cred;
    });

    const semesterSummary = Object.keys(semesterMap).map((semKey) => {
      const s = semesterMap[Number(semKey)];
      const sgpa = s.credits > 0 ? Number((s.qualityPoints / s.credits).toFixed(2)) : 0;
      return {
        semester: Number(semKey),
        sgpa,
        credits: s.credits,
        courses: s.courses,
      };
    });

    const cgpa = totalCredits > 0 ? Number((totalQualityPoints / totalCredits).toFixed(2)) : 0;

    return res.json({
      cgpa,
      totalCreditsEarned: totalCredits,
      semesters: semesterSummary,
      rawResults: results,
    });
  } catch (error: any) {
    console.error('Fetch results error:', error);
    return res.status(500).json({ error: 'Failed to load results' });
  }
});

// Post/Publish Grade Result (Faculty / Admin)
router.post('/results', authenticate, authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, courseId, semester, examType, marksObtained, totalMarks, gradePoint, letterGrade } = req.body;

    if (!studentId || !courseId || !semester || marksObtained === undefined || !gradePoint || !letterGrade) {
      return res.status(400).json({ error: 'Missing required result fields' });
    }

    const result = await prisma.academicResult.create({
      data: {
        studentId,
        courseId,
        semester: Number(semester),
        examType: examType || ExamType.END_TERM,
        marksObtained: Number(marksObtained),
        totalMarks: totalMarks ? Number(totalMarks) : 100,
        gradePoint: Number(gradePoint),
        letterGrade,
      },
      include: {
        course: { select: { code: true, name: true } },
        student: { select: { name: true, identifierNo: true } },
      },
    });

    return res.status(201).json({ result });
  } catch (error: any) {
    console.error('Create result error:', error);
    return res.status(500).json({ error: 'Failed to record academic result' });
  }
});

export default router;

