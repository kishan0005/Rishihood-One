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
// Get weekly dining menu
router.get('/menu', auth_js_1.authenticate, async (_req, res) => {
    try {
        const menuItems = await prisma_js_1.default.diningMenu.findMany({
            orderBy: [{ dayOfWeek: 'asc' }, { mealType: 'asc' }],
        });
        // Group by Day of Week
        const days = [
            client_1.DayOfWeek.MONDAY,
            client_1.DayOfWeek.TUESDAY,
            client_1.DayOfWeek.WEDNESDAY,
            client_1.DayOfWeek.THURSDAY,
            client_1.DayOfWeek.FRIDAY,
            client_1.DayOfWeek.SATURDAY,
            client_1.DayOfWeek.SUNDAY,
        ];
        const weeklyMenu = {};
        days.forEach((day) => {
            weeklyMenu[day] = menuItems.filter((m) => m.dayOfWeek === day);
        });
        return res.json({
            rawMenu: menuItems,
            weeklyMenu,
        });
    }
    catch (error) {
        console.error('Fetch dining menu error:', error);
        return res.status(500).json({ error: 'Failed to fetch dining menu' });
    }
});
// Update Menu Item (Warden / Admin)
router.put('/menu', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.WARDEN, client_1.Role.ADMIN]), async (req, res) => {
    try {
        const { dayOfWeek, mealType, items, specialDiet, timing } = req.body;
        if (!dayOfWeek || !mealType || !items) {
            return res.status(400).json({ error: 'dayOfWeek, mealType, and items are required' });
        }
        const updated = await prisma_js_1.default.diningMenu.upsert({
            where: {
                dayOfWeek_mealType: {
                    dayOfWeek: dayOfWeek,
                    mealType: mealType,
                },
            },
            update: {
                items,
                specialDiet,
                timing: timing || 'Standard Meal Hours',
            },
            create: {
                dayOfWeek: dayOfWeek,
                mealType: mealType,
                items,
                specialDiet,
                timing: timing || 'Standard Meal Hours',
            },
        });
        return res.json({
            message: 'Dining menu item updated successfully',
            item: updated,
        });
    }
    catch (error) {
        console.error('Update dining menu error:', error);
        return res.status(500).json({ error: 'Failed to update dining menu' });
    }
});
exports.default = router;
