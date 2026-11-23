"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Protect all admin routes
router.use(auth_js_1.authenticate);
router.use((0, auth_js_1.authorize)([client_1.Role.ADMIN]));
// ----------------------------------------------------
// 1. UNIVERSITY STATS & ANALYTICS
// ----------------------------------------------------
router.get('/stats', async (_req, res) => {
    try {
        const [studentCount, facultyCount, wardenCount, courseCount, enrollmentCount, openComplaintsCount, pendingLeavesCount, pendingHostelAppsCount, rooms, feeInvoices,] = await Promise.all([
            prisma_js_1.default.user.count({ where: { role: client_1.Role.STUDENT } }),
            prisma_js_1.default.user.count({ where: { role: client_1.Role.FACULTY } }),
            prisma_js_1.default.user.count({ where: { role: client_1.Role.WARDEN } }),
            prisma_js_1.default.course.count(),
            prisma_js_1.default.enrollment.count(),
            prisma_js_1.default.complaint.count({ where: { status: client_1.ComplaintStatus.OPEN } }),
            prisma_js_1.default.leaveRequest.count({ where: { status: client_1.LeaveStatus.PENDING } }),
            prisma_js_1.default.hostelApplication.count({ where: { status: 'PENDING' } }),
            prisma_js_1.default.room.findMany({ select: { capacity: true, occupied: true } }),
            prisma_js_1.default.feeInvoice.findMany({ select: { amount: true, paidAmount: true, status: true } }),
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
        const recentComplaints = await prisma_js_1.default.complaint.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { student: { select: { name: true } } },
        });
        const recentLeaves = await prisma_js_1.default.leaveRequest.findMany({
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
    }
    catch (error) {
        console.error('Fetch admin stats error:', error);
        return res.status(500).json({ error: 'Failed to retrieve administrative analytics' });
    }
});
// ----------------------------------------------------
// 2. USER MANAGEMENT
// ----------------------------------------------------
router.get('/users', async (req, res) => {
    try {
        const { role, search } = req.query;
        const where = {};
        if (role && role !== 'ALL') {
            where.role = role;
        }
        if (search) {
            const q = String(search).trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { identifierNo: { contains: q, mode: 'insensitive' } },
            ];
        }
        const users = await prisma_js_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Fetch users error:', error);
        return res.status(500).json({ error: 'Failed to retrieve users' });
    }
});
// Create User
router.post('/users', async (req, res) => {
    try {
        const { email, password, name, role, phone, department, identifierNo, semester, batch } = req.body;
        if (!email || !name || !role) {
            return res.status(400).json({ error: 'email, name, and role are required' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password || 'Rishihood@123', 10);
        const user = await prisma_js_1.default.user.create({
            data: {
                email: email.toLowerCase().trim(),
                passwordHash,
                name,
                role: role,
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
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({ error: 'Failed to create user. Email or Roll Number may already exist.' });
    }
});
// Update User
router.patch('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, phone, department, semester, batch, role } = req.body;
        const updated = await prisma_js_1.default.user.update({
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
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ error: 'Failed to update user' });
    }
});
// Delete User
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own administrative account' });
        }
        await prisma_js_1.default.user.delete({
            where: { id: userId },
        });
        return res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.default = router;
