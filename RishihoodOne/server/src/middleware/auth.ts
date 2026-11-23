import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
    identifierNo?: string | null;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'rishihood-one-super-secret-jwt-key-2026';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, identifierNo: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]` });
    }

    next();
  };
};

export const generateToken = (payload: { id: string; email: string; role: Role }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

