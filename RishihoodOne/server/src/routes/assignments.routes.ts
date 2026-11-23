import { Router, Response } from 'express';
import { Role, SubmissionStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/assignments - Get assignments
router.get('/', async (req: AuthRequest, res: Response) => {
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

// POST /api/assignments - Create Assignment (Faculty / Admin)
router.post('/', authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, title, description, dueDate, maxMarks, attachmentUrl } = req.body;

    if (!courseId || !title || !description || !dueDate) {
      return res.status(400).json({ error: 'Missing mandatory fields: courseId, title, description, dueDate' });
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

// POST /api/assignments/:id/submit - Submit assignment solution (Student)
router.post('/:id/submit', authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
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

// POST /api/assignments/:id/grade - Grade submission (Faculty / Admin)
router.post('/:id/grade', authorize([Role.FACULTY, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
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

export default router;

