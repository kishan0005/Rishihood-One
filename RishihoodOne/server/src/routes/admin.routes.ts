import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role, ComplaintStatus, LeaveStatus, InvoiceStatus, AllocationStatus } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes
router.use(authenticate);

// ----------------------------------------------------
// 1. UNIVERSITY STATS & ANALYTICS
// ----------------------------------------------------
router.get('/stats', authorize([Role.ADMIN, Role.WARDEN]), async (_req: AuthRequest, res: Response) => {
  try {
    const [
      studentCount,
      facultyCount,
      wardenCount,
      courseCount,
      enrollmentCount,
      openComplaintsCount,
      pendingLeavesCount,
      pendingHostelAppsCount,
      rooms,
      feeInvoices,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.FACULTY } }),
      prisma.user.count({ where: { role: Role.WARDEN } }),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.complaint.count({ where: { status: ComplaintStatus.OPEN } }),
      prisma.leaveRequest.count({ where: { status: LeaveStatus.PENDING } }),
      prisma.hostelApplication.count({ where: { status: 'PENDING' } }),
      prisma.room.findMany({ select: { capacity: true, occupied: true } }),
      prisma.feeInvoice.findMany({ select: { amount: true, paidAmount: true, status: true } }),
    ]);

    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((r) => {
      totalBeds += r.capacity;
      occupiedBeds += r.occupied;
    });

    let totalBilled = 0;
    let totalCollected = 0;
    feeInvoices.forEach((inv) => {
      totalBilled += inv.amount;
      totalCollected += inv.paidAmount;
    });

    const recentComplaints = await prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { name: true } } },
    });

    const recentLeaves = await prisma.leaveRequest.findMany({
      take: 5,
      orderBy: { appliedAt: 'desc' },
      include: { student: { select: { name: true } } },
    });

    return res.json({
      counts: {
        students: studentCount,
        faculty: facultyCount,
        wardens: wardenCount,
        courses: courseCount,
        enrollments: enrollmentCount,
        openComplaints: openComplaintsCount,
        pendingLeaves: pendingLeavesCount,
        pendingHostelApplications: pendingHostelAppsCount,
      },
      housing: {
        totalBeds,
        occupiedBeds,
        availableBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
      finance: {
        totalBilled,
        totalCollected,
        outstanding: totalBilled - totalCollected,
        collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0,
      },
      recentActivity: {
        complaints: recentComplaints,
        leaves: recentLeaves,
      },
    });
  } catch (error: any) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve administrative analytics' });
  }
});

// ----------------------------------------------------
// 2. USER MANAGEMENT (Admin Only)
// ----------------------------------------------------
router.use(authorize([Role.ADMIN]));

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, search } = req.query;

    const where: any = {};
    if (role && typeof role === 'string' && role !== 'undefined' && role.toUpperCase() !== 'ALL') {
      const upperRole = role.toUpperCase() as Role;
      if (Object.values(Role).includes(upperRole)) {
        where.role = upperRole;
      }
    }
    if (search && typeof search === 'string' && search !== 'undefined' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { identifierNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        department: true,
        identifierNo: true,
        semester: true,
        batch: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            taughtCourses: true,
            complaints: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Create User
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role, phone, department, identifierNo, semester, batch } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'email, name, and role are required' });
    }

    const passwordHash = await bcrypt.hash(password || 'Rishihood@123', 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name,
        role: role as Role,
        phone,
        department,
        identifierNo,
        semester: semester ? Number(semester) : null,
        batch,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        identifierNo: true,
      },
    });

    return res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user. Email or Roll Number may already exist.' });
  }
});

// Update User
router.patch('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { name, phone, department, semester, batch, role } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone,
        department,
        semester: semester !== undefined ? Number(semester) : undefined,
        batch,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        identifierNo: true,
      },
    });

    return res.json({ message: 'User updated successfully', user: updated });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete User
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own administrative account' });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;

