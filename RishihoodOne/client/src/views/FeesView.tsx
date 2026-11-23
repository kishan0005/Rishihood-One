import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  Plus,
  Receipt,
  ExternalLink,
} from 'lucide-react';
import { FeeInvoice } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

export const FeesView: React.FC = () => {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Pay Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Instant UPI (GooglePay / PhonePe)');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Receipt Modal
  const [receiptInvoice, setReceiptInvoice] = useState<FeeInvoice | null>(null);

  // Admin Create Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newFeeType, setNewFeeType] = useState<string>('TUITION');
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newDueDate, setNewDueDate] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadFees = async () => {
    try {
      const data = await api.getFees();
      setInvoices(data.invoices || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFees();
  }, [user]);

  // Handle Pay Fee
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessingPayment(true);
    try {
      // Simulate real bank gateway roundtrip
      await new Promise((r) => setTimeout(r, 800));

      const res = await api.payFee(selectedInvoice.id, paymentMethod);
      showToast('Payment successful! Official university receipt generated.');
      setIsPayModalOpen(false);
      setReceiptInvoice(res.invoice);
      loadFees();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Admin Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFeeInvoice({
        studentId: newStudentId || user?.id,
        title: newTitle,
        feeType: newFeeType,
        amount: newAmount,
        dueDate: newDueDate,
      });

      showToast('Fee invoice issued successfully!');
      setIsCreateModalOpen(false);
      loadFees();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                Fees & Accounts Portal
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tuition, hostel fees, mess subscriptions, verified GST receipts, and transaction history.
            </p>
          </div>

          {role === 'ADMIN' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Invoice</span>
            </button>
          )}
        </div>

        {/* Toast */}
        {toastMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Financial KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Assessed Fees</span>
              <p className="text-2xl font-extrabold text-navy-900 mt-1">
                ₹{summary.totalBilled.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Across academic year 2024-25</p>
            </div>
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Paid & Cleared</span>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">
                ₹{summary.totalCollected.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">{summary.paidCount} Verified Receipts</p>
            </div>
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Pending Due Balance</span>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">
                ₹{summary.totalOutstanding.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">{summary.pendingCount} Invoices Awaiting Payment</p>
            </div>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">University Invoices & Receipts</h3>
          <span className="text-xs text-slate-400">Total: {invoices.length} invoices</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">Invoice No.</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Due Date</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-navy-900">{inv.invoiceNo}</td>
                  <td className="py-3.5 px-6 font-bold text-navy-900">{inv.title}</td>
                  <td className="py-3.5 px-6 font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">{inv.feeType}</span>
                  </td>
                  <td className="py-3.5 px-6 font-extrabold text-navy-900">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge status={inv.status} />
                  </td>
                  <td className="py-3.5 px-6">
                    {inv.status === 'PAID' ? (
                      <button
                        onClick={() => setReceiptInvoice(inv)}
                        className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] hover:bg-emerald-100 flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    ) : (
                      role === 'STUDENT' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsPayModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-500 flex items-center gap-1 shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now</span>
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Pay Invoice Dialog */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Complete Online Payment — ${selectedInvoice?.invoiceNo}`}
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Fee Title:</span>
              <span className="font-bold text-navy-900">{selectedInvoice?.title}</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-700 font-bold">Total Payable:</span>
              <span className="font-extrabold text-navy-900 text-lg">
                ₹{selectedInvoice?.amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-2">Select Payment Gateway Mode:</label>
            <div className="space-y-2">
              {[
                'Instant UPI (GooglePay / PhonePe / Paytm)',
                'HDFC / ICICI NetBanking Gateway',
                'Debit / Credit Card (Visa / Mastercard / RuPay)',
              ].map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    paymentMethod === mode
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="payMode"
                    value={mode}
                    checked={paymentMethod === mode}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>256-bit SSL encrypted secure payment channel to Rishihood University Accounts.</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingPayment}
              className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
            >
              {isProcessingPayment && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{isProcessingPayment ? 'Authorizing...' : `Pay ₹${selectedInvoice?.amount.toLocaleString('en-IN')}`}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Receipt View */}
      <Modal
        isOpen={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        title="Official University Payment Receipt"
        maxWidth="lg"
      >
        {receiptInvoice && (
          <div className="space-y-4 text-xs font-sans">
            <div className="p-4 bg-navy-950 text-white rounded-xl text-center space-y-1">
              <h3 className="text-base font-extrabold tracking-tight">Rishihood University, Sonipat</h3>
              <p className="text-[11px] text-slate-300">NH-44, Rajiv Gandhi Education City, Sonipat, Haryana 131021</p>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Autonomous University • Finance & Accounts Directorate
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-slate-700">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Receipt / Ref No:</span>
                <span className="font-mono font-bold text-navy-900">
                  {receiptInvoice.transactionRef || 'RU_TXN_VERIFIED'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Invoice Identifier:</span>
                <span className="font-mono font-bold">{receiptInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Student Name / Roll:</span>
                <span className="font-bold text-navy-900">{user?.name} ({user?.identifierNo})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Fee Component:</span>
                <span className="font-medium">{receiptInvoice.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Date of Payment:</span>
                <span>
                  {new Date(receiptInvoice.paidAt || Date.now()).toLocaleDateString('en-IN', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-extrabold text-navy-900">
                <span>Amount Paid:</span>
                <span className="text-emerald-700">₹{receiptInvoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Status: <strong className="text-emerald-600">PAID & SETTLED</strong></span>
              <span>Computer Generated Voucher</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Admin Create Invoice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue New University Fee Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Target Student ID / Roll:</label>
            <input
              type="text"
              required
              placeholder="e.g. Student ID or default current student"
              value={newStudentId}
              onChange={(e) => setNewStudentId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Invoice Title:</label>
            <input
              type="text"
              required
              placeholder="e.g. Autumn Semester 2025 Tuition Fee"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Category:</label>
              <select
                value={newFeeType}
                onChange={(e) => setNewFeeType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              >
                <option value="TUITION">Tuition & Academics</option>
                <option value="HOSTEL">Hostel Accommodation</option>
                <option value="MESS">Mess & Dining Charges</option>
                <option value="AMENITIES">Sports & Tech Amenities</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Amount (₹):</label>
              <input
                type="number"
                required
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Due Date:</label>
            <input
              type="date"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

