import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.js';

const router = Router();

// Standard Login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash, ...userProfile } = user;

    return res.json({
      token,
      user: userProfile,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to process login' });
  }
});

// User Registration / Signup
router.post('/register', async (req, res: Response) => {
  try {
    const { name, email, password, role, department, phone, identifierNo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const validRoles = Object.values(Role);
    const assignedRole = role && validRoles.includes(role as Role) ? (role as Role) : Role.STUDENT;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        department: department || (assignedRole === Role.STUDENT ? 'Computer Science & Engineering' : 'School of Technology'),
        phone: phone || null,
        identifierNo: identifierNo || (assignedRole === Role.STUDENT ? `RU2025CS${Math.floor(100 + Math.random() * 900)}` : `FAC-RU-${Math.floor(100 + Math.random() * 900)}`),
        semester: assignedRole === Role.STUDENT ? 1 : null,
        batch: assignedRole === Role.STUDENT ? '2025-2029' : null,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}&backgroundColor=172d45`,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const { passwordHash: _, ...userProfile } = newUser;

    return res.status(201).json({
      token,
      user: userProfile,
      message: 'Account created successfully',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register account' });
  }
});

// Quick Login (Instant Persona Switcher for Evaluation & Demos)
router.post('/quick-login', async (req, res: Response) => {
  try {
    const { role } = req.body;
    let targetEmail = 'student@rishihood.edu.in';

    if (role === Role.FACULTY) {
      targetEmail = 'faculty@rishihood.edu.in';
    } else if (role === Role.WARDEN) {
      targetEmail = 'warden@rishihood.edu.in';
    } else if (role === Role.ADMIN) {
      targetEmail = 'admin@rishihood.edu.in';
    } else {
      targetEmail = 'student@rishihood.edu.in';
    }

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      return res.status(404).json({ error: `Demo user for role ${role} not found. Please run seed.` });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const { passwordHash, ...userProfile } = user;

    return res.json({
      token,
      user: userProfile,
    });
  } catch (error: any) {
    console.error('Quick login error:', error);
    return res.status(500).json({ error: 'Failed to process quick login' });
  }
});

// Get Current User Profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error('Fetch me error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

export default router;

