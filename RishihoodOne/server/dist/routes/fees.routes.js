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
// Get Fee Invoices
router.get('/', auth_js_1.authenticate, async (req, res) => {
    try {
        const user = req.user;
        const invoices = await prisma_js_1.default.feeInvoice.findMany({
            where: user.role === client_1.Role.STUDENT ? { studentId: user.id } : {},
            include: {
                student: { select: { id: true, name: true, identifierNo: true, department: true } },
            },
            orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        });
        let totalBilled = 0;
        let totalCollected = 0;
        let totalOutstanding = 0;
        invoices.forEach((inv) => {
            totalBilled += inv.amount;
            totalCollected += inv.paidAmount;
            if (inv.status !== client_1.InvoiceStatus.PAID) {
                totalOutstanding += inv.amount - inv.paidAmount;
            }
        });
        return res.json({
            invoices,
            summary: {
                totalBilled,
                totalCollected,
                totalOutstanding,
                paidCount: invoices.filter((i) => i.status === client_1.InvoiceStatus.PAID).length,
                pendingCount: invoices.filter((i) => i.status === client_1.InvoiceStatus.PENDING).length,
            },
        });
    }
    catch (error) {
        console.error('Fetch fees error:', error);
        return res.status(500).json({ error: 'Failed to retrieve fee invoices' });
    }
});
// Pay Fee Invoice (Student)
router.post('/:id/pay', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.STUDENT]), async (req, res) => {
    try {
        const invoiceId = req.params.id;
        const { paymentMethod } = req.body;
        const invoice = await prisma_js_1.default.feeInvoice.findFirst({
            where: {
                id: invoiceId,
                studentId: req.user.id,
            },
        });
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found or unauthorized' });
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            return res.status(400).json({ error: 'This invoice has already been paid.' });
        }
        const txRef = `RU_TXN_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
        const updated = await prisma_js_1.default.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: invoice.amount,
                status: client_1.InvoiceStatus.PAID,
                paidAt: new Date(),
                paymentMethod: paymentMethod || 'Instant UPI / Card Payment',
                transactionRef: txRef,
            },
        });
        // Create confirmation notification
        await prisma_js_1.default.notification.create({
            data: {
                userId: req.user.id,
                title: 'Fee Payment Successful',
                message: `Your payment of ₹${invoice.amount.toLocaleString('en-IN')} for ${invoice.title} has been confirmed. Ref: ${txRef}`,
                category: 'FEES',
            },
        });
        return res.json({
            message: 'Payment processed successfully! Receipt generated.',
            invoice: updated,
        });
    }
    catch (error) {
        console.error('Pay invoice error:', error);
        return res.status(500).json({ error: 'Failed to complete fee payment' });
    }
});
// Issue New Fee Invoice (Admin)
router.post('/create', auth_js_1.authenticate, (0, auth_js_1.authorize)([client_1.Role.ADMIN]), async (req, res) => {
    try {
        const { studentId, title, feeType, amount, dueDate } = req.body;
        if (!studentId || !title || !amount || !dueDate) {
            return res.status(400).json({ error: 'studentId, title, amount, and dueDate are required' });
        }
        const count = await prisma_js_1.default.feeInvoice.count();
        const invoiceNo = `RU-INV-2025-${String(count + 1).padStart(4, '0')}`;
        const invoice = await prisma_js_1.default.feeInvoice.create({
            data: {
                studentId,
                invoiceNo,
                title,
                feeType: feeType || client_1.FeeType.TUITION,
                amount: Number(amount),
                dueDate: new Date(dueDate),
                status: client_1.InvoiceStatus.PENDING,
            },
            include: {
                student: { select: { name: true, identifierNo: true } },
            },
        });
        return res.status(201).json({
            message: 'Invoice generated successfully',
            invoice,
        });
    }
    catch (error) {
        console.error('Create invoice error:', error);
        return res.status(500).json({ error: 'Failed to create fee invoice' });
    }
});
exports.default = router;
