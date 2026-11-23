import { Router, Response } from 'express';
import { Role, ApplicationStatus, AllocationStatus, LeaveStatus, RoomStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// ----------------------------------------------------
// 1. HOSTEL OVERVIEW & ROOM INVENTORY
// ----------------------------------------------------
router.get('/overview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const blocks = await prisma.hostelBlock.findMany({
      include: {
        warden: { select: { id: true, name: true, phone: true, email: true } },
        rooms: {
          include: {
            allocations: {
              where: { status: AllocationStatus.ACTIVE },
              include: {
                student: { select: { id: true, name: true, identifierNo: true, phone: true } },
              },
            },
          },
          orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute metrics
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

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return res.json({
      blocks,
      metrics: {
        totalBlocks: blocks.length,
        totalRooms: totalRoomsCount,
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate,
      },
    });
  } catch (error: any) {
    console.error('Fetch housing overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch housing details' });
  }
});

// Student's Current Room & Roommates
router.get('/my-room', authenticate, authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
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
      return res.json({ allocation: null, message: 'No active room allocation found' });
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
    return res.status(500).json({ error: 'Failed to retrieve room allocation' });
  }
});

// ----------------------------------------------------
// 2. HOSTEL APPLICATIONS
// ----------------------------------------------------
router.get('/applications', authenticate, async (req: AuthRequest, res: Response) => {
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

router.post('/apply', authenticate, authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const { preferredBlockId, preferredRoomType, reason } = req.body;

    if (!preferredBlockId) {
      return res.status(400).json({ error: 'Please select a preferred hostel block' });
    }

    // Check if student already has a pending application
    const existing = await prisma.hostelApplication.findFirst({
      where: {
        studentId: req.user!.id,
        status: ApplicationStatus.PENDING,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'You already have a pending hostel application.' });
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
      message: 'Hostel application submitted successfully. Warden will review your request.',
      application,
    });
  } catch (error: any) {
    console.error('Hostel apply error:', error);
    return res.status(500).json({ error: 'Failed to submit hostel application' });
  }
});

// Warden/Admin Review Application & Optional Auto-Allocation
router.post('/applications/:id/review', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const applicationId = req.params.id;
    const { status, wardenRemarks, assignRoomId } = req.body;

    if (!status || ![ApplicationStatus.APPROVED, ApplicationStatus.REJECTED].includes(status)) {
      return res.status(400).json({ error: 'Valid status (APPROVED or REJECTED) is required' });
    }

    const application = await prisma.hostelApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const updatedApp = await prisma.hostelApplication.update({
      where: { id: applicationId },
      data: {
        status,
        wardenRemarks,
        reviewedAt: new Date(),
      },
    });

    let allocation = null;
    if (status === ApplicationStatus.APPROVED && assignRoomId) {
      const room = await prisma.room.findUnique({ where: { id: assignRoomId } });
      if (room && room.occupied < room.capacity) {
        allocation = await prisma.hostelAllocation.create({
          data: {
            studentId: application.studentId,
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

    // Send notification to student
    await prisma.notification.create({
      data: {
        userId: application.studentId,
        title: `Hostel Application ${status}`,
        message: wardenRemarks || `Your hostel application has been marked ${status} by the housing office.`,
        category: 'HOUSING',
      },
    });

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

// ----------------------------------------------------
// 3. ROOM ALLOCATION & VACATING (Warden/Admin)
// ----------------------------------------------------
router.post('/allocate', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Selected room is already at full capacity' });
    }

    // Deactivate prior active allocations
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

// Vacate Room
router.post('/vacate', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { allocationId } = req.body;

    const allocation = await prisma.hostelAllocation.findUnique({
      where: { id: allocationId },
      include: { room: true },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation record not found' });
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

// ----------------------------------------------------
// 4. LEAVE REQUESTS & OUTING PASSES
// ----------------------------------------------------
router.get('/leaves', authenticate, async (req: AuthRequest, res: Response) => {
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
    return res.status(500).json({ error: 'Failed to load leave requests' });
  }
});

// Submit Leave Pass (Student)
router.post('/leaves', authenticate, authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, departureDate, returnDate, destination, reason, parentContact, emergencyContact } = req.body;

    if (!departureDate || !returnDate || !destination || !reason || !parentContact) {
      return res.status(400).json({ error: 'Please provide all mandatory leave pass fields' });
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
    });

    return res.status(201).json({
      message: 'Outing / Leave pass request submitted. Warden notified.',
      leave,
    });
  } catch (error: any) {
    console.error('Create leave error:', error);
    return res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// Warden Review Leave Pass
router.patch('/leaves/:id', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
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

    // Notify student
    await prisma.notification.create({
      data: {
        userId: leave.studentId,
        title: `Outing Pass Request ${status}`,
        message: remarks || `Your ${leave.leaveType} pass request has been marked ${status} by Warden.`,
        category: 'HOUSING',
      },
    });

    return res.json({
      message: `Leave pass has been ${status}`,
      leave,
    });
  } catch (error: any) {
    console.error('Update leave error:', error);
    return res.status(500).json({ error: 'Failed to update leave request' });
  }
});

export default router;

