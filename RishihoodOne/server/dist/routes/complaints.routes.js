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
// Get complaints
router.get('/', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const { status, category, priority } = req.query;
        const where = {};
        if (user.role === client_1.Role.STUDENT) {
            where.studentId = user.id;
        }
        if (status && status !== 'ALL') {
            where.status = status;
        }
        if (category && category !== 'ALL') {
            where.category = category;
        }
        if (priority && priority !== 'ALL') {
            where.priority = priority;
        }
        const complaints = await prisma_js_1.default.complaint.findMany({
            where,
            include: {
                student: { select: { id: true, name: true, identifierNo: true, phone: true } },
                assignedTo: { select: { id: true, name: true } },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });
        const metrics = {
            total: complaints.length,
            open: complaints.filter((c) => c.status === client_1.ComplaintStatus.OPEN).length,
            inProgress: complaints.filter((c) => c.status === client_1.ComplaintStatus.IN_PROGRESS).length,
            resolved: complaints.filter((c) => c.status === client_1.ComplaintStatus.RESOLVED || c.status === client_1.ComplaintStatus.CLOSED).length,
        };
        return res.json({ complaints, metrics });
    }
    catch (error) {
        console.error('Fetch complaints error:', error);
        return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});
// File a complaint
router.post('/', auth_js_1.authenticate, async (req, res) => {
    try {
        const { category, title, description, location, priority } = req.body;
        if (!category || !title || !description || !location) {
            return res.status(400).json({ error: 'category, title, description, and location are required' });
        }
        const complaint = await prisma_js_1.default.complaint.create({
            data: {
                studentId: req.user.id,
                category: category,
                title,
                description,
                location,
                priority: priority || client_1.ComplaintPriority.MEDIUM,
                status: client_1.ComplaintStatus.OPEN,
            },
            include: {
                student: { select: { name: true, identifierNo: true } },
            },
        });
        return res.status(201).json({
            message: 'Complaint registered successfully. Ticket ID generated.',
            complaint,
        });
    }
    catch (error) {
        console.error('Create complaint error:', error);
        return res.status(500).json({ error: 'Failed to submit complaint' });
    }
});
// Update complaint status & resolution (Warden / Admin)
router.patch('/:id', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const complaintId = req.params.id;
        const { status, priority, resolutionNotes, assignedToId } = req.body;
        const data = {};
        if (status) {
            data.status = status;
            if (status === client_1.ComplaintStatus.RESOLVED || status === client_1.ComplaintStatus.CLOSED) {
                data.resolvedAt = new Date();
            }
        }
        if (priority)
            data.priority = priority;
        if (resolutionNotes !== undefined)
            data.resolutionNotes = resolutionNotes;
        if (assignedToId !== undefined)
            data.assignedToId = assignedToId;
        const updated = await prisma_js_1.default.complaint.update({
            where: { id: complaintId },
            data,
            include: {
                student: { select: { id: true, name: true } },
            },
        });
        if (status) {
            await prisma_js_1.default.notification.create({
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
    }
    catch (error) {
        console.error('Update complaint error:', error);
        return res.status(500).json({ error: 'Failed to update complaint' });
    }
});
exports.default = router;
