import { Router, Response } from 'express';
import { Role, ApplicationStatus, AllocationStatus, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/hostel - Hostel blocks overview and occupancy metrics
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const blocks = await prisma.hostelBlock.findMany({
      include: {
        warden: { select: { id: true, name: true, phone: true, email: true } },
        rooms: {
          select: { id: true, roomNumber: true, floor: true, roomType: true, capacity: true, occupied: true, feePerSemester: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalRoomsCount = 0;

    blocks.forEach((b) => {
      totalRoomsCount += b.rooms.length;
      b.rooms.forEach((r) => {
        totalBeds += r.capacity;
        occupiedBeds += r.occupied;
      });
    });

    return res.json({
      blocks,
      metrics: {
        totalBlocks: blocks.length,
        totalRooms: totalRoomsCount,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('Fetch hostel error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hostel overview' });
  }
});

// GET /api/hostel/blocks - List all hostel blocks with room inventory
router.get('/blocks', async (_req: AuthRequest, res: Response) => {
  try {
    const blocks = await prisma.hostelBlock.findMany({
      include: {
        warden: { select: { name: true, phone: true, email: true } },
        rooms: {
          orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        },
      },
    });

    return res.json({ blocks });
  } catch (error: any) {
    console.error('Fetch blocks error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hostel blocks' });
  }
});

// GET /api/hostel/applications - List hostel applications
router.get('/applications', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const applications = await prisma.hostelApplication.findMany({
      where: user.role === Role.STUDENT ? { studentId: user.id } : {},
      include: {
        student: { select: { id: true, name: true, identifierNo: true, email: true, phone: true, department: true } },
        preferredBlock: true,
      },
      orderBy: { appliedAt: 'desc' },
    });

    return res.json({ applications });
  } catch (error: any) {
    console.error('Fetch applications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve applications' });
  }
});

// POST /api/hostel/apply - Apply for hostel room (Student)
router.post('/apply', authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const { preferredBlockId, preferredRoomType, reason } = req.body;

    if (!preferredBlockId) {
      return res.status(400).json({ error: 'Please select a preferred hostel block' });
    }

    const application = await prisma.hostelApplication.create({
      data: {
        studentId: req.user!.id,
        preferredBlockId,
        preferredRoomType: preferredRoomType || 'DOUBLE',
        reason,
      },
      include: {
        preferredBlock: true,
      },
    });

    return res.status(201).json({
      message: 'Hostel application submitted successfully',
      application,
    });
  } catch (error: any) {
    console.error('Hostel apply error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// POST /api/hostel/applications/:id/review - Review application (Warden / Admin)
router.post('/applications/:id/review', authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const applicationId = req.params.id;
    const { status, wardenRemarks, assignRoomId } = req.body;

    if (!status || ![ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED or REJECTED) is required' });
    }

    const updatedApp = await prisma.hostelApplication.update({
      where: { id: applicationId },
      data: {
        status,
        wardenRemarks,
        reviewedAt: new Date(),
      },
      include: { student: { select: { id: true, name: true } } },
    });

    let allocation = null;
    if (status === ApplicationStatus.APPROVED && assignRoomId) {
      const room = await prisma.room.findUnique({ where: { id: assignRoomId } });
      if (room && room.occupied < room.capacity) {
        allocation = await prisma.hostelAllocation.create({
          data: {
            studentId: updatedApp.studentId,
            roomId: assignRoomId,
            status: AllocationStatus.ACTIVE,
          },
        });

        const newOccupancy = room.occupied + 1;
        await prisma.room.update({
          where: { id: assignRoomId },
          data: {
            occupied: newOccupancy,
            status: newOccupancy >= room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE,
          },
        });
      }
    }

    return res.json({
      message: `Application marked ${status}`,
      application: updatedApp,
      allocation,
    });
  } catch (error: any) {
    console.error('Review application error:', error);
    return res.status(500).json({ error: 'Failed to review application' });
  }
});

export default router;

