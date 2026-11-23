import { Router, Response } from 'express';
import { Role, InvoiceStatus, FeeType } from '@prisma/client';
import prisma from '../config/prisma.js';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.js';

const router = Router();

// Get Fee Invoices
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const invoices = await prisma.feeInvoice.findMany({
      where: user.role === Role.STUDENT ? { studentId: user.id } : {},
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
      if (inv.status !== InvoiceStatus.PAID) {
        totalOutstanding += inv.amount - inv.paidAmount;
      }
    });

    return res.json({
      invoices,
      summary: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        paidCount: invoices.filter((i) => i.status === InvoiceStatus.PAID).length,
        pendingCount: invoices.filter((i) => i.status === InvoiceStatus.PENDING).length,
      },
    });
  } catch (error: any) {
    console.error('Fetch fees error:', error);
    return res.status(500).json({ error: 'Failed to retrieve fee invoices' });
  }
});

// Pay Fee Invoice (Student)
router.post('/:id/pay', authenticate, authorize([Role.STUDENT]), async (req: AuthRequest, res: Response) => {
  try {
    const invoiceId = req.params.id;
    const { paymentMethod } = req.body;

    const invoice = await prisma.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        studentId: req.user!.id,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or unauthorized' });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return res.status(400).json({ error: 'This invoice has already been paid.' });
    }

    const txRef = `RU_TXN_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    const updated = await prisma.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: invoice.amount,
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'Instant UPI / Card Payment',
        transactionRef: txRef,
      },
    });

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Fee Payment Successful',
        message: `Your payment of ₹${invoice.amount.toLocaleString('en-IN')} for ${invoice.title} has been confirmed. Ref: ${txRef}`,
        category: 'FEES',
      },
    });

    return res.json({
      message: 'Payment processed successfully! Receipt generated.',
      invoice: updated,
    });
  } catch (error: any) {
    console.error('Pay invoice error:', error);
    return res.status(500).json({ error: 'Failed to complete fee payment' });
  }
});

// Issue New Fee Invoice (Admin)
router.post('/create', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, title, feeType, amount, dueDate } = req.body;

    if (!studentId || !title || !amount || !dueDate) {
      return res.status(400).json({ error: 'studentId, title, amount, and dueDate are required' });
    }

    const count = await prisma.feeInvoice.count();
    const invoiceNo = `RU-INV-2025-${String(count + 1).padStart(4, '0')}`;

    const invoice = await prisma.feeInvoice.create({
      data: {
        studentId,
        invoiceNo,
        title,
        feeType: feeType || FeeType.TUITION,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        status: InvoiceStatus.PENDING,
      },
      include: {
        student: { select: { name: true, identifierNo: true } },
      },
    });

    return res.status(201).json({
      message: 'Invoice generated successfully',
      invoice,
    });
  } catch (error: any) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ error: 'Failed to create fee invoice' });
  }
});

export default router;

