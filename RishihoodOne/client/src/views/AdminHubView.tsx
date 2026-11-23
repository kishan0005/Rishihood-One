import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  Building2,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Radio,
  Search,
  Filter,
} from 'lucide-react';
import { Role, User } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

export const AdminHubView: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<Role>('STUDENT');
  const [newDepartment, setNewDepartment] = useState<string>('Computer Science & Engineering');
  const [newIdentifierNo, setNewIdentifierNo] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newSemester, setNewSemester] = useState<number>(6);

  // Broadcast Modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastCategory, setBroadcastCategory] = useState<string>('GENERAL');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getUsers({
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          search: searchQuery || undefined,
        }),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [roleFilter, searchQuery]);

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        email: newEmail,
        name: newName,
        role: newRole,
        department: newDepartment,
        identifierNo: newIdentifierNo,
        phone: newPhone,
        semester: newRole === 'STUDENT' ? newSemester : undefined,
      });

      showToast(`User ${newName} registered successfully!`);
      setIsAddUserOpen(false);
      setNewEmail('');
      setNewName('');
      setNewIdentifierNo('');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;

    try {
      await api.deleteUser(id);
      showToast(`User ${name} deleted.`);
      loadAdminData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Broadcast Announcement
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        category: broadcastCategory,
        targetRole: broadcastTargetRole || undefined,
      });

      showToast('Announcement broadcasted across portal notifications!');
      setIsBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
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
                <Shield className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                University Administrative Console
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              User identity management, role provisioning, system analytics, and campus-wide broadcast bulletins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-navy-950 font-bold text-xs hover:bg-amber-400 transition shadow-sm flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Broadcast Alert</span>
            </button>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
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

        {/* System KPIs */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Enrolled Students</span>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">{stats.counts?.students || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Faculty Members</span>
              <p className="text-2xl font-extrabold text-indigo-700 mt-0.5">{stats.counts?.faculty || 0}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hostel Occupancy</span>
              <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{stats.housing?.occupancyRate || 0}%</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Fee Collection Rate</span>
              <p className="text-2xl font-extrabold text-navy-900 mt-0.5">{stats.finance?.collectionRate || 0}%</p>
            </div>
          </div>
        )}

        {/* Search & Role Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, roll, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            <span className="text-slate-400 font-semibold mr-1">Role:</span>
            {['ALL', 'STUDENT', 'FACULTY', 'WARDEN', 'ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  roleFilter === r
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900">University Directory Roster</h3>
          <span className="text-xs text-slate-400">Total Users: {users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-6">User Name & ID</th>
                <th className="py-3 px-6">Email Address</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6">Department</th>
                <th className="py-3 px-6">Contact</th>
                <th className="py-3 px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-navy-900">
                    {u.name}
                    <span className="text-[11px] text-slate-400 block font-mono font-normal">
                      {u.identifierNo || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-6">
                    <Badge status={u.role} />
                  </td>
                  <td className="py-3.5 px-6 font-medium">{u.department || 'General Administration'}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-500">{u.phone || '—'}</td>
                  <td className="py-3.5 px-6">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add User */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Register New University Member"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Full Name:</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rohini Sen"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Assigned Role:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              >
                <option value="STUDENT">STUDENT</option>
                <option value="FACULTY">FACULTY</option>
                <option value="WARDEN">WARDEN</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">University Email:</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@rishihood.edu.in"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Roll / Staff Identifier:</label>
              <input
                type="text"
                required
                value={newIdentifierNo}
                onChange={(e) => setNewIdentifierNo(e.target.value)}
                placeholder="RU2024CSE088"
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Department / School:</label>
            <input
              type="text"
              required
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Phone Number:</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98765..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            {newRole === 'STUDENT' && (
              <div>
                <label className="block font-bold text-navy-900 mb-1">Current Semester:</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={newSemester}
                  onChange={(e) => setNewSemester(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Initial default password is <code>Rishihood@123</code> (member can update upon first login).
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Broadcast Announcement */}
      <Modal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        title="Broadcast University Announcement"
      >
        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Announcement Headline:</label>
            <input
              type="text"
              required
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              placeholder="e.g. End-Term Practical Examination Schedule Released"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Target Audience:</label>
              <select
                value={broadcastTargetRole}
                onChange={(e) => setBroadcastTargetRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
              >
                <option value="">All University Members (Global)</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="WARDEN">Hostel Wardens Only</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Notice Category:</label>
              <select
                value={broadcastCategory}
                onChange={(e) => setBroadcastCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              >
                <option value="GENERAL">General Notice</option>
                <option value="ACADEMIC">Academic Advisory</option>
                <option value="HOUSING">Hostel Bulletin</option>
                <option value="FEES">Fee Circular</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Detailed Circular Text:</label>
            <textarea
              rows={4}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Full announcement body..."
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 text-navy-950 font-bold hover:bg-amber-400 transition"
            >
              Send Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

