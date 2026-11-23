import { Router, Response } from 'express';
import { Role, EventCategory } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Get campus events
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const events = await prisma.campusEvent.findMany({
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
  } catch (error: any) {
    console.error('Fetch events error:', error);
    return res.status(500).json({ error: 'Failed to retrieve events' });
  }
});

// Create campus event (Admin / Faculty)
router.post('/', authenticate, authorize([Role.ADMIN, Role.FACULTY]), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, venue, startTime, endTime, organizer, bannerUrl, capacity } = req.body;

    if (!title || !description || !venue || !startTime || !endTime) {
      return res.status(400).json({ error: 'title, description, venue, startTime, and endTime are required' });
    }

    const event = await prisma.campusEvent.create({
      data: {
        title,
        description,
        category: category || EventCategory.ACADEMIC,
        venue,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        organizer: organizer || req.user!.name,
        bannerUrl,
        capacity: capacity ? Number(capacity) : 200,
      },
    });

    return res.status(201).json({
      message: 'Event published successfully',
      event,
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Failed to create campus event' });
  }
});

// RSVP / Un-RSVP
router.post('/:id/rsvp', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user!.id;

    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing) {
      // Cancel RSVP
      await prisma.eventRegistration.delete({
        where: { id: existing.id },
      });
      return res.json({ registered: false, message: 'RSVP cancelled' });
    } else {
      // Register
      const event = await prisma.campusEvent.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ error: 'Event not found' });

      await prisma.eventRegistration.create({
        data: { eventId, userId },
      });

      return res.json({ registered: true, message: 'Successfully RSVP’d for event' });
    }
  } catch (error: any) {
    console.error('RSVP error:', error);
    return res.status(500).json({ error: 'Failed to process event registration' });
  }
});

export default router;

