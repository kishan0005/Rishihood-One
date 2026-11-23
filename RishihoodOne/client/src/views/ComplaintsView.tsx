import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  Wifi,
  Zap,
  Home,
  MessageSquare,
  Shield,
  Filter,
} from 'lucide-react';
import { Complaint } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

export const ComplaintsView: React.FC = () => {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // New Complaint Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('WIFI');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('Takshashila Hall, Room 204');
  const [priority, setPriority] = useState<string>('MEDIUM');

  // Update Status Modal (Warden / Admin)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string>('IN_PROGRESS');
  const [ticketPriority, setTicketPriority] = useState<string>('HIGH');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadComplaints = async () => {
    try {
      const data = await api.getComplaints({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      });
      setComplaints(data.complaints || []);
      setMetrics(data.metrics || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, categoryFilter, user]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createComplaint({
        category,
        title,
        description,
        location,
        priority,
      });

      showToast('Maintenance ticket registered successfully! Campus staff notified.');
      setIsNewModalOpen(false);
      setTitle('');
      setDescription('');
      loadComplaints();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      await api.updateComplaint(selectedTicket.id, {
        status: ticketStatus,
        priority: ticketPriority,
        resolutionNotes,
      });

      showToast('Ticket updated successfully!');
      setIsUpdateModalOpen(false);
      loadComplaints();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'WIFI':
        return <Wifi className="w-4 h-4 text-sky-500" />;
      case 'ELECTRICAL':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'PLUMBING':
        return <Wrench className="w-4 h-4 text-indigo-500" />;
      case 'HOUSEKEEPING':
        return <Home className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
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
                <Wrench className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                Maintenance & Campus Helpdesk
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hostel maintenance, network troubleshooting, electrical repairs, and housekeeping ticketing.
            </p>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>File New Ticket</span>
          </button>
        </div>

        {/* Status Toast Banner */}
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

        {/* KPI Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tickets</span>
              <p className="text-xl font-extrabold text-navy-900 mt-0.5">{metrics.total}</p>
            </div>
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Open Issues</span>
              <p className="text-xl font-extrabold text-amber-800 mt-0.5">{metrics.open}</p>
            </div>
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Under Repair</span>
              <p className="text-xl font-extrabold text-indigo-800 mt-0.5">{metrics.inProgress}</p>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Resolved</span>
              <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{metrics.resolved}</p>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  statusFilter === st
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="WIFI">Wi-Fi & Network</option>
              <option value="ELECTRICAL">Electrical & AC</option>
              <option value="PLUMBING">Plumbing & Water</option>
              <option value="CARPENTRY">Carpentry</option>
              <option value="HOUSEKEEPING">Housekeeping</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {complaints.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No maintenance tickets found for the selected filter.
          </div>
        ) : (
          complaints.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(ticket.category)}
                    <span className="text-xs font-bold text-navy-900">{ticket.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge status={ticket.priority} className="text-[10px]" />
                    <Badge status={ticket.status} className="text-[10px]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy-900 leading-snug">{ticket.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ticket.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p className="text-slate-500">
                    📍 <strong>Location:</strong> {ticket.location}
                  </p>
                  <p className="text-slate-500">
                    👤 <strong>Reported By:</strong> {ticket.student.name} ({ticket.student.identifierNo})
                  </p>
                  {ticket.resolutionNotes && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-700">
                      <strong>Resolution Notes:</strong>
                      <p className="text-[11px] text-slate-600 italic mt-0.5">{ticket.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Logged on {new Date(ticket.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                {(role === 'WARDEN' || role === 'ADMIN') && (
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setTicketStatus(ticket.status);
                      setTicketPriority(ticket.priority);
                      setResolutionNotes(ticket.resolutionNotes || '');
                      setIsUpdateModalOpen(true);
                    }}
                    className="px-3 py-1 rounded-lg bg-navy-900 text-white font-bold text-[11px] hover:bg-navy-800"
                  >
                    Manage Ticket
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: Create Complaint */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="File Campus Maintenance / Helpdesk Ticket"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Issue Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="WIFI">Wi-Fi & Network Connectivity</option>
              <option value="ELECTRICAL">Electrical & Air Conditioning</option>
              <option value="PLUMBING">Plumbing & Water Supply</option>
              <option value="CARPENTRY">Furniture & Carpentry</option>
              <option value="HOUSEKEEPING">Housekeeping & Waste Management</option>
              <option value="ACADEMIC">Classroom / Lab Infrastructure</option>
              <option value="OTHER">Other Campus Grievance</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Short Issue Headline:</label>
            <input
              type="text"
              required
              placeholder="e.g. Wi-Fi router packet loss during study hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Exact Campus Location:</label>
            <input
              type="text"
              required
              placeholder="e.g. Takshashila Block A - Room 204 or Lab 301"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Detailed Description:</label>
            <textarea
              rows={3}
              required
              placeholder="Describe symptoms, frequency, and whether emergency attention is required..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Urgency Level:</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="LOW">Low (Routine maintenance)</option>
              <option value="MEDIUM">Medium (Within 24-48 hours)</option>
              <option value="HIGH">High (Impacts daily study / living)</option>
              <option value="URGENT">Urgent (Immediate safety / service disruption)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Warden Update Ticket */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Update Ticket — ${selectedTicket?.title}`}
      >
        <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Status Lifecycle:</label>
            <select
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="OPEN">OPEN (Under Triage)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Technician Dispatched)</option>
              <option value="RESOLVED">RESOLVED (Repaired & Tested)</option>
              <option value="CLOSED">CLOSED (Verified by Student/Warden)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Priority Override:</label>
            <select
              value={ticketPriority}
              onChange={(e) => setTicketPriority(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Staff / Technician Resolution Notes:</label>
            <textarea
              rows={3}
              placeholder="e.g. Replaced cable junction, tested Wi-Fi throughput at 180 Mbps..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
            >
              Save Ticket Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

