import { Router, Response } from 'express';
import { Role, NotificationCategory } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Get notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    const notifications = await prisma.notification.findMany({
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
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params.id;

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.json({ notification: updated });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// Broadcast University Announcement (Admin / Warden)
router.post('/broadcast', authenticate, authorize([Role.ADMIN, Role.WARDEN]), async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, category, targetRole } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const broadcast = await prisma.notification.create({
      data: {
        title,
        message,
        category: category || NotificationCategory.GENERAL,
        targetRole: targetRole ? (targetRole as Role) : null,
        userId: null, // broadcast
      },
    });

    return res.status(201).json({
      message: 'Announcement broadcasted across portal',
      notification: broadcast,
    });
  } catch (error: any) {
    console.error('Broadcast notification error:', error);
    return res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
});

export default router;

