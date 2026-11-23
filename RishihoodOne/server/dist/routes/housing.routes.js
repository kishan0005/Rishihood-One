"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// ----------------------------------------------------
// 1. HOSTEL OVERVIEW & ROOM INVENTORY
// ----------------------------------------------------
router.get('/overview', auth_js_1.authenticate, async (req, res) => {
    try {
        const blocks = await prisma_js_1.default.hostelBlock.findMany({
            include: {
                warden: { select: { id: true, name: true, phone: true, email: true } },
                rooms: {
                    include: {
                        allocations: {
                            where: { status: client_1.AllocationStatus.ACTIVE },
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
    }
    catch (error) {
        console.error('Fetch housing overview error:', error);
        return res.status(500).json({ error: 'Failed to fetch housing details' });
    }
});
// Student's Current Room & Roommates
router.get('/my-room', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.STUDENT]), async (req, res) => {
    try {
        const allocation = await prisma_js_1.default.hostelAllocation.findFirst({
            where: {
                studentId: req.user.id,
                status: client_1.AllocationStatus.ACTIVE,
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
                            where: { status: client_1.AllocationStatus.ACTIVE },
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
            .filter((a) => a.studentId !== req.user.id)
            .map((a) => a.student);
        return res.json({
            allocation,
            roommates,
        });
    }
    catch (error) {
        console.error('Fetch my room error:', error);
        return res.status(500).json({ error: 'Failed to retrieve room allocation' });
    }
});
// ----------------------------------------------------
// 2. HOSTEL APPLICATIONS
// ----------------------------------------------------
router.get('/applications', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const applications = await prisma_js_1.default.hostelApplication.findMany({
            where: user.role === client_1.Role.STUDENT ? { studentId: user.id } : {},
            include: {
                student: { select: { id: true, name: true, identifierNo: true, email: true, phone: true, department: true } },
                preferredBlock: true,
            },
            orderBy: { appliedAt: 'desc' },
        });
        return res.json({ applications });
    }
    catch (error) {
        console.error('Fetch applications error:', error);
        return res.status(500).json({ error: 'Failed to retrieve applications' });
    }
});
router.post('/apply', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.STUDENT]), async (req, res) => {
    try {
        const { preferredBlockId, preferredRoomType, reason } = req.body;
        if (!preferredBlockId) {
            return res.status(400).json({ error: 'Please select a preferred hostel block' });
        }
        // Check if student already has a pending application
        const existing = await prisma_js_1.default.hostelApplication.findFirst({
            where: {
                studentId: req.user.id,
                status: client_1.ApplicationStatus.PENDING,
            },
        });
        if (existing) {
            return res.status(400).json({ error: 'You already have a pending hostel application.' });
        }
        const application = await prisma_js_1.default.hostelApplication.create({
            data: {
                studentId: req.user.id,
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
    }
    catch (error) {
        console.error('Hostel apply error:', error);
        return res.status(500).json({ error: 'Failed to submit hostel application' });
    }
});
// Warden/Admin Review Application & Optional Auto-Allocation
router.post('/applications/:id/review', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, wardenRemarks, assignRoomId } = req.body;
        if (!status || ![client_1.ApplicationStatus.APPROVED, client_1.ApplicationStatus.REJECTED].includes(status)) {
            return res.status(400).json({ error: 'Valid status (APPROVED or REJECTED) is required' });
        }
        const application = await prisma_js_1.default.hostelApplication.findUnique({
            where: { id: applicationId },
        });
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        const updatedApp = await prisma_js_1.default.hostelApplication.update({
            where: { id: applicationId },
            data: {
                status,
                wardenRemarks,
                reviewedAt: new Date(),
            },
        });
        let allocation = null;
        if (status === client_1.ApplicationStatus.APPROVED && assignRoomId) {
            const room = await prisma_js_1.default.room.findUnique({ where: { id: assignRoomId } });
            if (room && room.occupied < room.capacity) {
                allocation = await prisma_js_1.default.hostelAllocation.create({
                    data: {
                        studentId: application.studentId,
                        roomId: assignRoomId,
                        status: client_1.AllocationStatus.ACTIVE,
                    },
                });
                const newOccupancy = room.occupied + 1;
                await prisma_js_1.default.room.update({
                    where: { id: assignRoomId },
                    data: {
                        occupied: newOccupancy,
                        status: newOccupancy >= room.capacity ? client_1.RoomStatus.FULL : client_1.RoomStatus.AVAILABLE,
                    },
                });
            }
        }
        // Send notification to student
        await prisma_js_1.default.notification.create({
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
    }
    catch (error) {
        console.error('Review application error:', error);
        return res.status(500).json({ error: 'Failed to review application' });
    }
});
// ----------------------------------------------------
// 3. ROOM ALLOCATION & VACATING (Warden/Admin)
// ----------------------------------------------------
router.post('/allocate', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const { studentId, roomId, academicYear, semester } = req.body;
        if (!studentId || !roomId) {
            return res.status(400).json({ error: 'studentId and roomId are required' });
        }
        const room = await prisma_js_1.default.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.occupied >= room.capacity) {
            return res.status(400).json({ error: 'Selected room is already at full capacity' });
        }
        // Deactivate prior active allocations
        await prisma_js_1.default.hostelAllocation.updateMany({
            where: { studentId, status: client_1.AllocationStatus.ACTIVE },
            data: { status: client_1.AllocationStatus.VACATED, checkOutDate: new Date() },
        });
        const allocation = await prisma_js_1.default.hostelAllocation.create({
            data: {
                studentId,
                roomId,
                academicYear: academicYear || '2024-2025',
                semester: semester ? Number(semester) : 6,
                status: client_1.AllocationStatus.ACTIVE,
            },
            include: {
                room: { include: { hostelBlock: true } },
                student: { select: { name: true, identifierNo: true } },
            },
        });
        const newOccupancy = room.occupied + 1;
        await prisma_js_1.default.room.update({
            where: { id: roomId },
            data: {
                occupied: newOccupancy,
                status: newOccupancy >= room.capacity ? client_1.RoomStatus.FULL : client_1.RoomStatus.AVAILABLE,
            },
        });
        return res.status(201).json({
            message: 'Room allocated successfully',
            allocation,
        });
    }
    catch (error) {
        console.error('Allocate room error:', error);
        return res.status(500).json({ error: 'Failed to allocate room' });
    }
});
// Vacate Room
router.post('/vacate', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const { allocationId } = req.body;
        const allocation = await prisma_js_1.default.hostelAllocation.findUnique({
            where: { id: allocationId },
            include: { room: true },
        });
        if (!allocation) {
            return res.status(404).json({ error: 'Allocation record not found' });
        }
        await prisma_js_1.default.hostelAllocation.update({
            where: { id: allocationId },
            data: {
                status: client_1.AllocationStatus.VACATED,
                checkOutDate: new Date(),
            },
        });
        const newOccupancy = Math.max(0, allocation.room.occupied - 1);
        await prisma_js_1.default.room.update({
            where: { id: allocation.roomId },
            data: {
                occupied: newOccupancy,
                status: client_1.RoomStatus.AVAILABLE,
            },
        });
        return res.json({ message: 'Room vacated successfully' });
    }
    catch (error) {
        console.error('Vacate room error:', error);
        return res.status(500).json({ error: 'Failed to vacate room' });
    }
});
// ----------------------------------------------------
// 4. LEAVE REQUESTS & OUTING PASSES
// ----------------------------------------------------
router.get('/leaves', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const leaves = await prisma_js_1.default.leaveRequest.findMany({
            where: user.role === client_1.Role.STUDENT ? { studentId: user.id } : {},
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        identifierNo: true,
                        phone: true,
                        department: true,
                        hostelAllocations: {
                            where: { status: client_1.AllocationStatus.ACTIVE },
                            include: { room: { include: { hostelBlock: true } } },
                        },
                    },
                },
                warden: { select: { name: true } },
            },
            orderBy: { appliedAt: 'desc' },
        });
        return res.json({ leaves });
    }
    catch (error) {
        console.error('Fetch leaves error:', error);
        return res.status(500).json({ error: 'Failed to load leave requests' });
    }
});
// Submit Leave Pass (Student)
router.post('/leaves', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.STUDENT]), async (req, res) => {
    try {
        const { leaveType, departureDate, returnDate, destination, reason, parentContact, emergencyContact } = req.body;
        if (!departureDate || !returnDate || !destination || !reason || !parentContact) {
            return res.status(400).json({ error: 'Please provide all mandatory leave pass fields' });
        }
        const leave = await prisma_js_1.default.leaveRequest.create({
            data: {
                studentId: req.user.id,
                leaveType: leaveType || 'DAY_OUTING',
                departureDate: new Date(departureDate),
                returnDate: new Date(returnDate),
                destination,
                reason,
                parentContact,
                emergencyContact,
                status: client_1.LeaveStatus.PENDING,
            },
        });
        return res.status(201).json({
            message: 'Outing / Leave pass request submitted. Warden notified.',
            leave,
        });
    }
    catch (error) {
        console.error('Create leave error:', error);
        return res.status(500).json({ error: 'Failed to submit leave request' });
    }
});
// Warden Review Leave Pass
router.patch('/leaves/:id', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const leaveId = req.params.id;
        const { status, remarks } = req.body;
        if (!status || ![client_1.LeaveStatus.APPROVED, client_1.LeaveStatus.REJECTED].includes(status)) {
            return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' });
        }
        const leave = await prisma_js_1.default.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status,
                remarks,
                wardenId: req.user.id,
                reviewedAt: new Date(),
            },
            include: {
                student: { select: { id: true, name: true } },
            },
        });
        // Notify student
        await prisma_js_1.default.notification.create({
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
    }
    catch (error) {
        console.error('Update leave error:', error);
        return res.status(500).json({ error: 'Failed to update leave request' });
    }
});
exports.default = router;
