import { Router, Response } from 'express';
import { Role, DayOfWeek, MealType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Get weekly dining menu
router.get('/menu', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const menuItems = await prisma.diningMenu.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
    });

    // Group by Day of Week
    const days = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];

    const weeklyMenu: Record<string, any[]> = {};
    days.forEach((day) => {
      weeklyMenu[day] = menuItems.filter((m) => m.dayOfWeek === day);
    });

    return res.json({
      rawMenu: menuItems,
      weeklyMenu,
    });
  } catch (error: any) {
    console.error('Fetch dining menu error:', error);
    return res.status(500).json({ error: 'Failed to fetch dining menu' });
  }
});

// Update Menu Item (Warden / Admin)
router.put('/menu', authenticate, authorize([Role.WARDEN, Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { dayOfWeek, mealType, items, specialDiet, timing } = req.body;

    if (!dayOfWeek || !mealType || !items) {
      return res.status(400).json({ error: 'dayOfWeek, mealType, and items are required' });
    }

    const updated = await prisma.diningMenu.upsert({
      where: {
        dayOfWeek_mealType: {
          dayOfWeek: dayOfWeek as DayOfWeek,
          mealType: mealType as MealType,
        },
      },
      update: {
        items,
        specialDiet,
        timing: timing || 'Standard Meal Hours',
      },
      create: {
        dayOfWeek: dayOfWeek as DayOfWeek,
        mealType: mealType as MealType,
        items,
        specialDiet,
        timing: timing || 'Standard Meal Hours',
      },
    });

    return res.json({
      message: 'Dining menu item updated successfully',
      item: updated,
    });
  } catch (error: any) {
    console.error('Update dining menu error:', error);
    return res.status(500).json({ error: 'Failed to update dining menu' });
  }
});

export default router;

