import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/timetable - Get timetable schedule
router.get('/', async (req: AuthRequest, res: Response) => {
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
    return res.status(500).json({ error: 'Failed to retrieve timetable' });
  }
});

// POST /api/timetable - Add Timetable Slot (Faculty / Admin)
router.post('/', authorize([Role.ADMIN, Role.FACULTY]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, facultyId, dayOfWeek, startTime, endTime, roomNo, batch } = req.body;

    if (!courseId || !dayOfWeek || !startTime || !endTime || !roomNo) {
      return res.status(400).json({ error: 'courseId, dayOfWeek, startTime, endTime, and roomNo are required' });
    }

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

export default router;

