import { Router, Response } from 'express';
import { Role, AllocationStatus, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/room-allocation - List all room allocations
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const where: any = {};
    if (user.role === Role.STUDENT) {
      where.studentId = user.id;
    }

    const allocations = await prisma.hostelAllocation.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, identifierNo: true, phone: true, department: true } },
        room: { include: { hostelBlock: true } },
      },
      orderBy: { checkInDate: 'desc' },
    });

    return res.json({ allocations });
  } catch (error: any) {
    console.error('Fetch allocations error:', error);
    return res.status(500).json({ error: 'Failed to retrieve allocations' });
  }
});

// GET /api/room-allocation/my-room - Student's active room & roommates
router.get('/my-room', authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const allocation = await prisma.hostelAllocation.findFirst({
      where: {
        studentId: req.user!.id,
        status: AllocationStatus.ACTIVE,
      },
      include: {
        room: {
          include: {
            hostelBlock: {
              include: {
                warden: { select: { name: true, phone: true, email: true } },
              },
            },
            allocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: {
                student: {
                  select: { id: true, name: true, identifierNo: true, department: true, email: true, phone: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });

    if (!allocation) {
      return res.json({ allocation: null, roommates: [] });
    }

    const roommates = allocation.room.allocations
      .filter((a) => a.studentId !== req.user!.id)
      .map((a) => a.student);

    return res.json({
      allocation,
      roommates,
    });
  } catch (error: any) {
    console.error('Fetch my room error:', error);
    return res.status(500).json({ error: 'Failed to retrieve allocated room' });
  }
});

// POST /api/room-allocation/allocate - Assign room to student (Warden / Admin)
router.post('/allocate', authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, roomId, academicYear, semester } = req.body;

    if (!studentId || !roomId) {
      return res.status(400).json({ error: 'studentId and roomId are required' });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.occupied >= room.capacity) {
      return res.status(400).json({ error: 'Selected room is at full capacity' });
    }

    // Vacate previous active allocations
    await prisma.hostelAllocation.updateMany({
      where: { studentId, status: AllocationStatus.ACTIVE },
      data: { status: AllocationStatus.VACATED, checkOutDate: new Date() },
    });

    const allocation = await prisma.hostelAllocation.create({
      data: {
        studentId,
        roomId,
        academicYear: academicYear || '2024-2025',
        semester: semester ? Number(semester) : 6,
        status: AllocationStatus.ACTIVE,
      },
      include: {
        room: { include: { hostelBlock: true } },
        student: { select: { name: true, identifierNo: true } },
      },
    });

    const newOccupancy = room.occupied + 1;
    await prisma.room.update({
      where: { id: roomId },
      data: {
        occupied: newOccupancy,
        status: newOccupancy >= room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE,
      },
    });

    return res.status(201).json({
      message: 'Room allocated successfully',
      allocation,
    });
  } catch (error: any) {
    console.error('Allocate room error:', error);
    return res.status(500).json({ error: 'Failed to allocate room' });
  }
});

// POST /api/room-allocation/vacate - Vacate room (Warden / Admin)
router.post('/vacate', authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { allocationId } = req.body;

    if (!allocationId) {
      return res.status(400).json({ error: 'allocationId is required' });
    }

    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: { room: true },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    await prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: {
        status: AllocationStatus.VACATED,
        checkOutDate: new Date(),
      },
    });

    const newOccupancy = Math.max(0, allocation.room.occupied - 1);
    await prisma.room.update({
      where: { id: allocation.roomId },
      data: {
        occupied: newOccupancy,
        status: RoomStatus.AVAILABLE,
      },
    });

    return res.json({ message: 'Room vacated successfully' });
  } catch (error: any) {
    console.error('Vacate room error:', error);
    return res.status(500).json({ error: 'Failed to vacate room' });
  }
});

export default router;

