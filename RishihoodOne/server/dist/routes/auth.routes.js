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
// Standard Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await prisma_js_1.default.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = (0, auth_js_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const { passwordHash, ...userProfile } = user;
        return res.json({
            token,
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Failed to process login' });
    }
});
// Quick Login (Instant Persona Switcher for Evaluation & Demos)
router.post('/quick-login', async (req, res) => {
    try {
        const { role } = req.body;
        let targetEmail = 'student@rishihood.edu.in';
        if (role === client_1.Role.FACULTY) {
            targetEmail = 'faculty@rishihood.edu.in';
        }
        else if (role === client_1.Role.WARDEN) {
            targetEmail = 'warden@rishihood.edu.in';
        }
        else if (role === client_1.Role.ADMIN) {
            targetEmail = 'admin@rishihood.edu.in';
        }
        else {
            targetEmail = 'student@rishihood.edu.in';
        }
        const user = await prisma_js_1.default.user.findUnique({
            where: { email: targetEmail },
        });
        if (!user) {
            return res.status(404).json({ error: `Demo user for role ${role} not found. Please run seed.` });
        }
        const token = (0, auth_js_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        const { passwordHash, ...userProfile } = user;
        return res.json({
            token,
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Quick login error:', error);
        return res.status(500).json({ error: 'Failed to process quick login' });
    }
});
// Get Current User Profile
router.get('/me', auth_js_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: req.user.id },
            include: {
                hostelAllocations: {
                    where: { status: 'ACTIVE' },
                    include: {
                        room: {
                            include: {
                                hostelBlock: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        const { passwordHash, ...userProfile } = user;
        return res.json({ user: userProfile });
    }
    catch (error) {
        console.error('Fetch me error:', error);
        return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
});
exports.default = router;
