import { Router, Response } from 'express';
import { Role, LeaveStatus, AllocationStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/leave-applications - List leave and outing applications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const leaves = await prisma.leaveRequest.findMany({
      where: user.role === Role.STUDENT ? { studentId: user.id } : {},
      include: {
        student: {
          select: {
            id: true,
            name: true,
            identifierNo: true,
            phone: true,
            department: true,
            hostelAllocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: { room: { include: { hostelBlock: true } } },
            },
          },
        },
        warden: { select: { name: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json({ leaves });
  } catch (error: any) {
    console.error('Fetch leaves error:', error);
    return res.status(500).json({ error: 'Failed to retrieve leave applications' });
  }
});

// POST /api/leave-applications - Submit leave/outing pass (Student)
router.post('/', authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, departureDate, returnDate, destination, reason, parentContact, emergencyContact } = req.body;

    if (!departureDate || !returnDate || !destination || !reason || !parentContact) {
      return res.status(400).json({
        error: 'Missing required fields: departureDate, returnDate, destination, reason, parentContact',
      });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId: req.user!.id,
        leaveType: leaveType || 'DAY_OUTING',
        departureDate: new Date(departureDate),
        returnDate: new Date(returnDate),
        destination,
        reason,
        parentContact,
        emergencyContact,
        status: LeaveStatus.PENDING,
      },
      include: {
        student: { select: { name: true, identifierNo: true } },
      },
    });

    return res.status(201).json({
      message: 'Outing / Leave pass request submitted successfully',
      leave,
    });
  } catch (error: any) {
    console.error('Submit leave error:', error);
    return res.status(500).json({ error: 'Failed to submit leave application' });
  }
});

// PATCH /api/leave-applications/:id - Authorize or reject pass (Warden / Admin)
router.patch('/:id', authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const leaveId = req.params.id;
    const { status, remarks } = req.body;

    if (!status || ![LeaveStatus.APPROVED, LeaveStatus.REJECTED].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
    }

    const leave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        remarks,
        wardenId: req.user!.id,
        reviewedAt: new Date(),
      },
      include: {
        student: { select: { id: true, name: true } },
      },
    });

    return res.json({
      message: `Leave pass has been ${status}`,
      leave,
    });
  } catch (error: any) {
    console.error('Review leave error:', error);
    return res.status(500).json({ error: 'Failed to update leave application' });
  }
});

export default router;

