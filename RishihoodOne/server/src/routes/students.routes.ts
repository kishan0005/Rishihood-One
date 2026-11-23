import { Router, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/students - List students with search and department filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { department, semester, search } = req.query;

    const where: any = { role: Role.STUDENT };
    if (department && department !== 'ALL' && department !== 'undefined') {
      where.department = String(department);
    }
    if (semester && semester !== 'undefined') {
      where.semester = Number(semester);
    }
    if (search && search !== 'undefined' && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { identifierNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        identifierNo: true,
        department: true,
        semester: true,
        batch: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            assignmentSubmits: true,
            academicResults: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ students });
  } catch (error: any) {
    console.error('Fetch students error:', error);
    return res.status(500).json({ error: 'Failed to retrieve students roster' });
  }
});

// GET /api/students/:id - Detailed student academic & housing profile
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.params.id;

    const student = await prisma.user.findFirst({
      where: { id: studentId, role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        identifierNo: true,
        department: true,
        semester: true,
        batch: true,
        phone: true,
        avatarUrl: true,
        enrollments: {
          include: {
            course: {
              select: { id: true, code: true, name: true, credits: true },
            },
          },
        },
        hostelAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            room: {
              include: { hostelBlock: true },
            },
          },
        },
        academicResults: {
          include: { course: { select: { code: true, name: true } } },
          orderBy: { semester: 'desc' },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    return res.json({ student });
  } catch (error: any) {
    console.error('Fetch student details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve student details' });
  }
});

export default router;

