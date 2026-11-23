import { Router, Response } from 'express';
import { Role, ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Get complaints
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, category, priority } = req.query;

    const where: any = {};
    if (user.role === Role.STUDENT) {
      where.studentId = user.id;
    }
    if (status && typeof status === 'string' && status !== 'undefined' && status.toUpperCase() !== 'ALL') {
      const upperStatus = status.toUpperCase() as ComplaintStatus;
      if (Object.values(ComplaintStatus).includes(upperStatus)) {
        where.status = upperStatus;
      }
    }
    if (category && typeof category === 'string' && category !== 'undefined' && category.toUpperCase() !== 'ALL') {
      const upperCategory = category.toUpperCase() as ComplaintCategory;
      if (Object.values(ComplaintCategory).includes(upperCategory)) {
        where.category = upperCategory;
      }
    }
    if (priority && typeof priority === 'string' && priority !== 'undefined' && priority.toUpperCase() !== 'ALL') {
      const upperPriority = priority.toUpperCase() as ComplaintPriority;
      if (Object.values(ComplaintPriority).includes(upperPriority)) {
        where.priority = upperPriority;
      }
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, identifierNo: true, phone: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const metrics = {
      total: complaints.length,
      open: complaints.filter((c) => c.status === ComplaintStatus.OPEN).length,
      inProgress: complaints.filter((c) => c.status === ComplaintStatus.IN_PROGRESS).length,
      resolved: complaints.filter((c) => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED).length,
    };

    return res.json({ complaints, metrics });
  } catch (error: any) {
    console.error('Fetch complaints error:', error);
    return res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// File a complaint
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category, title, description, location, priority } = req.body;

    if (!category || !title || !description || !location) {
      return res.status(400).json({ error: 'category, title, description, and location are required' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        studentId: req.user!.id,
        category: category as ComplaintCategory,
        title,
        description,
        location,
        priority: priority || ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
      },
      include: {
        student: { select: { name: true, identifierNo: true } },
      },
    });

    return res.status(201).json({
      message: 'Complaint registered successfully. Ticket ID generated.',
      complaint,
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    return res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Update complaint status & resolution (Warden / Admin)
router.patch('/:id', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;
    const { status, priority, resolutionNotes, assignedToId } = req.body;

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === ComplaintStatus.RESOLVED || status === ComplaintStatus.CLOSED) {
        data.resolvedAt = new Date();
      }
    }
    if (priority) data.priority = priority;
    if (resolutionNotes !== undefined) data.resolutionNotes = resolutionNotes;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data,
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    if (status) {
      await prisma.notification.create({
        data: {
          userId: updated.studentId,
          title: `Complaint Updated: ${updated.title.substring(0, 30)}...`,
          message: resolutionNotes || `Your ticket status is now ${status}.`,
          category: 'HOUSING',
        },
      });
    }

    return res.json({
      message: 'Complaint updated successfully',
      complaint: updated,
    });
  } catch (error: any) {
    console.error('Update complaint error:', error);
    return res.status(500).json({ error: 'Failed to update complaint' });
  }
});

export default router;

