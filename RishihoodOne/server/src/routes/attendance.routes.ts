import { Router, Response } from 'express';
import { Role, AttendanceStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/attendance - Attendance summary and history
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { courseId, studentId } = req.query;

    if (user.role === Role.STUDENT) {
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

// POST /api/attendance/mark - Mark class attendance (Faculty / Admin)
router.post('/mark', authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, date, sessionTopic, attendees } = req.body;

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

export default router;

