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
// Get notifications for current user
router.get('/', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const notifications = await prisma_js_1.default.notification.findMany({
            where: {
                OR: [
                    { userId: user.id },
                    { userId: null, targetRole: null },
                    { userId: null, targetRole: user.role },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 40,
        });
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        return res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error('Fetch notifications error:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// Mark notification as read
router.patch('/:id/read', auth_js_1.authenticate, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const updated = await prisma_js_1.default.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return res.json({ notification: updated });
    }
    catch (error) {
        console.error('Mark read error:', error);
        return res.status(500).json({ error: 'Failed to mark notification read' });
    }
});
// Broadcast University Announcement (Admin / Warden)
router.post('/broadcast', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.ADMIN, client_1.Role.WARDEN]), async (req, res) => {
    try {
        const { title, message, category, targetRole } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }
        const broadcast = await prisma_js_1.default.notification.create({
            data: {
                title,
                message,
                category: category || client_1.NotificationCategory.GENERAL,
                targetRole: targetRole ? targetRole : null,
                userId: null, // broadcast
            },
        });
        return res.status(201).json({
            message: 'Announcement broadcasted across portal',
            notification: broadcast,
        });
    }
    catch (error) {
        console.error('Broadcast notification error:', error);
        return res.status(500).json({ error: 'Failed to broadcast announcement' });
    }
});
exports.default = router;
