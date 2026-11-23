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
// Get campus events
router.get('/', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const events = await prisma_js_1.default.campusEvent.findMany({
            where: { isPublished: true },
            include: {
                registrations: {
                    where: { userId: user.id },
                },
                _count: {
                    select: { registrations: true },
                },
            },
            orderBy: { startTime: 'asc' },
        });
        const formatted = events.map((evt) => ({
            ...evt,
            isRegistered: evt.registrations.length > 0,
            registeredCount: evt._count.registrations,
        }));
        return res.json({ events: formatted });
    }
    catch (error) {
        console.error('Fetch events error:', error);
        return res.status(500).json({ error: 'Failed to retrieve events' });
    }
});
// Create campus event (Admin / Faculty)
router.post('/', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.ADMIN, client_1.Role.FACULTY]), async (req, res) => {
    try {
        const { title, description, category, venue, startTime, endTime, organizer, bannerUrl, capacity } = req.body;
        if (!title || !description || !venue || !startTime || !endTime) {
            return res.status(400).json({ error: 'title, description, venue, startTime, and endTime are required' });
        }
        const event = await prisma_js_1.default.campusEvent.create({
            data: {
                title,
                description,
                category: category || client_1.EventCategory.ACADEMIC,
                venue,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                organizer: organizer || req.user.name,
                bannerUrl,
                capacity: capacity ? Number(capacity) : 200,
            },
        });
        return res.status(201).json({
            message: 'Event published successfully',
            event,
        });
    }
    catch (error) {
        console.error('Create event error:', error);
        return res.status(500).json({ error: 'Failed to create campus event' });
    }
});
// RSVP / Un-RSVP
router.post('/:id/rsvp', auth_js_1.authenticate, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        const existing = await prisma_js_1.default.eventRegistration.findUnique({
            where: {
                eventId_userId: { eventId, userId },
            },
        });
        if (existing) {
            // Cancel RSVP
            await prisma_js_1.default.eventRegistration.delete({
                where: { id: existing.id },
            });
            return res.json({ registered: false, message: 'RSVP cancelled' });
        }
        else {
            // Register
            const event = await prisma_js_1.default.campusEvent.findUnique({ where: { id: eventId } });
            if (!event)
                return res.status(404).json({ error: 'Event not found' });
            await prisma_js_1.default.eventRegistration.create({
                data: { eventId, userId },
            });
            return res.json({ registered: true, message: 'Successfully RSVP’d for event' });
        }
    }
    catch (error) {
        console.error('RSVP error:', error);
        return res.status(500).json({ error: 'Failed to process event registration' });
    }
});
exports.default = router;
