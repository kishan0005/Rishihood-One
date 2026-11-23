"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const JWT_SECRET = process.env.JWT_SECRET || 'rishihood-one-super-secret-jwt-key-2026';
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_js_1.default.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, name: true, identifierNo: true },
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found or session expired' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
};
exports.authenticate = authenticate;
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]` });
        }
        next();
    };
};
exports.authorize = authorize;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
