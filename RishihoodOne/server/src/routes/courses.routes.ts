import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/courses - List courses
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        faculty: { select: { id: true, name: true, email: true, department: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
    });

    return res.json({ courses });
  } catch (error: any) {
    console.error('Fetch courses error:', error);
    return res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// GET /api/courses/:id - Course details with syllabus & enrollments
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        faculty: { select: { id: true, name: true, email: true, department: true } },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, identifierNo: true, email: true } },
          },
        },
        assignments: {
          orderBy: { dueDate: 'asc' },
        },
        timetable: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    return res.json({ course });
  } catch (error: any) {
    console.error('Fetch course details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve course details' });
  }
});

// POST /api/courses - Create Course (Faculty / Admin)
router.post('/', authorize([Role.ADMIN, Role.FACULTY]), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, credits, department, semester, syllabus, facultyId } = req.body;

    if (!code || !name || !credits || !department || !semester) {
      return res.status(400).json({ error: 'Missing mandatory fields: code, name, credits, department, semester' });
    }

    const course = await prisma.course.create({
      data: {
        code: String(code).toUpperCase().trim(),
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

export default router;

