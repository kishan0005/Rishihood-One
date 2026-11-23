import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/faculty - List faculty members
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { department, search } = req.query;

    const where: any = { role: Role.FACULTY };
    if (department && department !== 'ALL' && department !== 'undefined') {
      where.department = String(department);
    }
    if (search && search !== 'undefined' && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { identifierNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const faculty = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        identifierNo: true,
        department: true,
        phone: true,
        avatarUrl: true,
        taughtCourses: {
          select: { id: true, code: true, name: true, credits: true, semester: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ faculty });
  } catch (error: any) {
    console.error('Fetch faculty error:', error);
    return res.status(500).json({ error: 'Failed to retrieve faculty directory' });
  }
});

// GET /api/faculty/:id - Faculty details & taught courses
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const facultyId = req.params.id;

    const member = await prisma.user.findFirst({
      where: { id: facultyId, role: Role.FACULTY },
      select: {
        id: true,
        name: true,
        email: true,
        identifierNo: true,
        department: true,
        phone: true,
        avatarUrl: true,
        taughtCourses: {
          include: {
            _count: { select: { enrollments: true, assignments: true } },
          },
        },
        timetableSlots: {
          include: { course: { select: { code: true, name: true } } },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Faculty member not found' });
    }

    return res.json({ faculty: member });
  } catch (error: any) {
    console.error('Fetch faculty details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve faculty profile' });
  }
});

export default router;

