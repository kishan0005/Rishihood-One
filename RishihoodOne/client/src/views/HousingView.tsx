import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Bed,
  CalendarCheck,
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Shield,
  Plus,
  Compass,
} from 'lucide-react';
import { HostelBlock, Room, HostelApplication, LeaveRequest } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

type HousingTab = 'myRoom' | 'explorer' | 'applications' | 'leaves';

export const HousingView: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<HousingTab>('myRoom');

  // Data states
  const [blocks, setBlocks] = useState<HostelBlock[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [myAllocation, setMyAllocation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [applications, setApplications] = useState<HostelApplication[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('ALL');

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [applyBlockId, setApplyBlockId] = useState<string>('');
  const [applyRoomType, setApplyRoomType] = useState<string>('DOUBLE');
  const [applyReason, setApplyReason] = useState<string>('');

  // Review Application Modal (Warden)
  const [isReviewAppModalOpen, setIsReviewAppModalOpen] = useState<boolean>(false);
  const [selectedApp, setSelectedApp] = useState<HostelApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');

  // Submit Leave Pass Modal (Student)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>('DAY_OUTING');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [parentContact, setParentContact] = useState<string>('+91 94123 45678');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  // Review Leave Modal (Warden)
  const [isReviewLeaveModalOpen, setIsReviewLeaveModalOpen] = useState<boolean>(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [leaveReviewStatus, setLeaveReviewStatus] = useState<string>('APPROVED');
  const [leaveReviewRemarks, setLeaveReviewRemarks] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadHousingData = async () => {
    try {
      const [overviewRes, appsRes, leavesRes] = await Promise.all([
        api.getHousingOverview().catch(() => ({ blocks: [], metrics: null })),
        api.getHostelApplications().catch(() => ({ applications: [] })),
        api.getLeaves().catch(() => ({ leaves: [] })),
      ]);

      setBlocks(overviewRes.blocks || []);
      setMetrics(overviewRes.metrics || null);
      setApplications(appsRes.applications || []);
      setLeaves(leavesRes.leaves || []);

      if (overviewRes.blocks?.length > 0) {
        setApplyBlockId(overviewRes.blocks[0].id);
      }

      if (role === 'STUDENT') {
        const myRoomRes = await api.getMyRoom().catch(() => null);
        if (myRoomRes) {
          setMyAllocation(myRoomRes.allocation);
          setRoommates(myRoomRes.roommates || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHousingData();
  }, [role, user]);

  // Handle Hostel Application Submit
  const handleApplyHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.applyHostel({
        preferredBlockId: applyBlockId,
        preferredRoomType: applyRoomType,
        reason: applyReason,
      });

      showToast('Hostel room application submitted to the warden!');
      setIsApplyModalOpen(false);
      setApplyReason('');
      loadHousingData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Warden Review Application
  const handleReviewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      await api.reviewHostelApplication(selectedApp.id, {
        status: reviewStatus,
        wardenRemarks: reviewRemarks,
        assignRoomId: assignRoomId || undefined,
      });

      showToast(`Application marked as ${reviewStatus}!`);
      setIsReviewAppModalOpen(false);
      loadHousingData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Student Submit Leave
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.submitLeave({
        leaveType,
        departureDate,
        returnDate,
        destination,
        reason,
        parentContact,
        emergencyContact,
      });

      showToast('Outing pass request submitted. Warden has been notified.');
      setIsLeaveModalOpen(false);
      setDestination('');
      setReason('');
      loadHousingData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Warden Review Leave
  const handleReviewLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      await api.updateLeaveStatus(selectedLeave.id, {
        status: leaveReviewStatus,
        remarks: leaveReviewRemarks,
      });

      showToast(`Outing pass request has been ${leaveReviewStatus}!`);
      setIsReviewLeaveModalOpen(false);
      loadHousingData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredBlocks =
    selectedBlockId === 'ALL' ? blocks : blocks.filter((b) => b.id === selectedBlockId);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                Housing & Residential Life
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hostel wings, room inventories, room allocations, curfew rules, and verified digital leave passes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {role === 'STUDENT' && (
              <>
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Request Outing Pass</span>
                </button>
                <button
                  onClick={() => setIsApplyModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Apply for Room</span>
                </button>
              </>
            )}
          </div>
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

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          {[
            { id: 'myRoom', label: 'My Allocated Room', icon: Bed, hideForWarden: true },
            { id: 'explorer', label: 'Hostel Inventory Explorer', icon: Compass },
            { id: 'applications', label: 'Hostel Applications', icon: Users },
            { id: 'leaves', label: 'Outing & Night Passes', icon: CalendarCheck },
          ]
            .filter((t) => !(role === 'WARDEN' && t.hideForWarden))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as HousingTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-navy-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* TAB 1: MY ROOM (STUDENT) */}
      {activeTab === 'myRoom' && (
        <div className="space-y-6">
          {myAllocation ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Room Details Card */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl font-extrabold text-lg">
                      {myAllocation.room.roomNumber}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy-900">
                        {myAllocation.room.hostelBlock.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Floor {myAllocation.room.floor} • {myAllocation.room.roomType} AC Suite
                      </p>
                    </div>
                  </div>
                  <Badge status={myAllocation.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Check-in Date</span>
                    <span className="text-xs font-bold text-navy-900">
                      {new Date(myAllocation.checkInDate).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Fee / Semester</span>
                    <span className="text-xs font-bold text-navy-900">
                      ₹{myAllocation.room.feePerSemester.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">Occupancy</span>
                    <span className="text-xs font-bold text-navy-900">
                      {myAllocation.room.occupied} / {myAllocation.room.capacity} Beds
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-navy-900 mb-2">Installed Suite Amenities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {myAllocation.room.amenities.split(',').map((amenity: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                      >
                        ✓ {amenity.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-navy-950 text-white rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block">Residential Warden:</span>
                    <span className="text-slate-300">
                      {myAllocation.room.hostelBlock.warden?.name || 'Col. Rajesh Verma (Retd.)'}
                    </span>
                  </div>
                  <span className="text-amber-400 font-bold">Desk Ext: #204</span>
                </div>
              </div>

              {/* Roommates Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-navy-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Suite Mates & Room Cohort</span>
                </h3>

                {roommates.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No other roommates assigned yet.</p>
                ) : (
                  <div className="space-y-3">
                    {roommates.map((mate: any) => (
                      <div
                        key={mate.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3"
                      >
                        <img
                          src={mate.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={mate.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-navy-900">{mate.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{mate.identifierNo}</p>
                          <p className="text-indigo-600 font-medium text-[10px]">{mate.department}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Hostel Quiet Hours:</strong> 11:00 PM – 06:00 AM daily. Visitors are permitted in the ground floor atrium only.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Building2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-navy-900">No Active Hostel Room Allocation</h3>
                <p className="text-xs text-slate-500">
                  You are currently marked as day-scholar or have an unallocated room request. Submit an application below.
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition shadow-sm"
              >
                Apply for Hostel Suite
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORER (ROOM INVENTORY) */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Hostel Summary Banner */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Residential Capacity</span>
                <p className="text-2xl font-extrabold text-navy-900 mt-1">{metrics.totalBeds} Beds</p>
                <p className="text-xs text-slate-500 mt-0.5">Across {metrics.totalBlocks} Hostel Wings</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Current Campus Occupancy</span>
                <p className="text-2xl font-extrabold text-indigo-700 mt-1">{metrics.occupancyRate}%</p>
                <p className="text-xs text-slate-500 mt-0.5">{metrics.occupiedBeds} Beds Filled</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Available Vacancies</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.availableBeds} Vacant Beds</p>
                <p className="text-xs text-slate-500 mt-0.5">Ready for immediate allocation</p>
              </div>
            </div>
          )}

          {/* Block Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedBlockId('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedBlockId === 'ALL'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Blocks ({blocks.length})
            </button>
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedBlockId === b.id
                    ? 'bg-navy-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>

          {/* Blocks & Rooms List */}
          <div className="space-y-6">
            {filteredBlocks.map((block) => (
              <div key={block.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-navy-900">{block.name}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {block.genderType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{block.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Warden: <strong className="text-slate-800">{block.warden?.name || 'Chief Warden'}</strong>
                  </span>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.rooms.map((room) => {
                    const isVacant = room.occupied < room.capacity;
                    return (
                      <div
                        key={room.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isVacant
                            ? 'bg-white border-slate-200 hover:border-indigo-300'
                            : 'bg-slate-50/70 border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-navy-900">
                            Room {room.roomNumber}
                          </span>
                          <Badge status={room.status} />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                          <p>
                            Type: <strong>{room.roomType} AC</strong> (Floor {room.floor})
                          </p>
                          <p>
                            Occupancy:{' '}
                            <strong className={isVacant ? 'text-emerald-600' : 'text-slate-700'}>
                              {room.occupied} of {room.capacity} Beds
                            </strong>
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{room.amenities}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-navy-900">
                            ₹{room.feePerSemester.toLocaleString('en-IN')}/sem
                          </span>
                          {role === 'STUDENT' && isVacant && (
                            <button
                              onClick={() => {
                                setApplyBlockId(block.id);
                                setApplyRoomType(room.roomType);
                                setIsApplyModalOpen(true);
                              }}
                              className="text-[11px] font-bold text-indigo-600 hover:underline"
                            >
                              Apply for Room
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Hostel Allocation Applications</h3>
            <span className="text-xs text-slate-400">Total: {applications.length} applications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Applicant</th>
                  <th className="py-3 px-6">Preferred Wing</th>
                  <th className="py-3 px-6">Room Type</th>
                  <th className="py-3 px-6">Applied Date</th>
                  <th className="py-3 px-6">Reason / Notes</th>
                  <th className="py-3 px-6">Status</th>
                  {(role === 'WARDEN' || role === 'ADMIN') && <th className="py-3 px-6">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No hostel room applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-navy-900">
                        {app.student.name}
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {app.student.identifierNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-medium">{app.preferredBlock.name}</td>
                      <td className="py-3.5 px-6 font-medium">{app.preferredRoomType}</td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-slate-600">
                        {app.reason || 'General allocation request'}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge status={app.status} />
                      </td>
                      {(role === 'WARDEN' || role === 'ADMIN') && (
                        <td className="py-3.5 px-6">
                          {app.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewStatus('APPROVED');
                                setReviewRemarks('Allocation verified and approved.');
                                setIsReviewAppModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-navy-900 text-white font-bold text-[11px] hover:bg-navy-800"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Reviewed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Campus Outing & Night Pass Directory</h3>
            <span className="text-xs text-slate-400">Strict Biometric Gate Reconciliation</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Student</th>
                  <th className="py-3 px-6">Pass Type</th>
                  <th className="py-3 px-6">Departure</th>
                  <th className="py-3 px-6">Return Time</th>
                  <th className="py-3 px-6">Destination & Reason</th>
                  <th className="py-3 px-6">Parent Phone</th>
                  <th className="py-3 px-6">Status</th>
                  {(role === 'WARDEN' || role === 'ADMIN') && <th className="py-3 px-6">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No leave requests filed.
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-navy-900">
                        {leave.student.name}
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {leave.student.identifierNo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {leave.leaveType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">
                        {new Date(leave.departureDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">
                        {new Date(leave.returnDate).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-6 max-w-xs">
                        <span className="font-bold text-slate-900 block">{leave.destination}</span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">{leave.reason}</span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-600">{leave.parentContact}</td>
                      <td className="py-3.5 px-6">
                        <Badge status={leave.status} />
                      </td>
                      {(role === 'WARDEN' || role === 'ADMIN') && (
                        <td className="py-3.5 px-6">
                          {leave.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setLeaveReviewStatus('APPROVED');
                                setLeaveReviewRemarks('Parent contacted. Gate pass authorized.');
                                setIsReviewLeaveModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-500"
                            >
                              Authorize
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              {leave.warden?.name?.split(' ')[0] || 'Logged'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Apply for Hostel Room */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Hostel Room Accommodation"
      >
        <form onSubmit={handleApplyHostel} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Preferred Hostel Wing:</label>
            <select
              value={applyBlockId}
              onChange={(e) => setApplyBlockId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.genderType})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Room Configuration:</label>
            <select
              value={applyRoomType}
              onChange={(e) => setApplyRoomType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="SINGLE">Single AC Executive Suite</option>
              <option value="DOUBLE">Double Sharing AC Suite</option>
              <option value="TRIPLE">Triple Sharing Non-AC Room</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-navy-900 mb-1">Reason / Dietary or Medical Notes:</label>
            <textarea
              rows={3}
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              placeholder="State any specific preferences, senior project needs or special accommodations..."
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Warden Review Application */}
      <Modal
        isOpen={isReviewAppModalOpen}
        onClose={() => setIsReviewAppModalOpen(false)}
        title={`Review Application — ${selectedApp?.student.name}`}
      >
        <form onSubmit={handleReviewApplication} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-navy-900">
              Preference: {selectedApp?.preferredBlock.name} ({selectedApp?.preferredRoomType})
            </p>
            <p className="text-slate-600">{selectedApp?.reason || 'No specific notes provided.'}</p>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Decision:</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 font-bold text-emerald-700">
                <input
                  type="radio"
                  name="reviewStatus"
                  value="APPROVED"
                  checked={reviewStatus === 'APPROVED'}
                  onChange={(e) => setReviewStatus(e.target.value)}
                />
                <span>APPROVE</span>
              </label>
              <label className="flex items-center gap-1.5 font-bold text-rose-700">
                <input
                  type="radio"
                  name="reviewStatus"
                  value="REJECTED"
                  checked={reviewStatus === 'REJECTED'}
                  onChange={(e) => setReviewStatus(e.target.value)}
                />
                <span>REJECT</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Warden Remarks:</label>
            <textarea
              rows={2}
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          {reviewStatus === 'APPROVED' && (
            <div>
              <label className="block font-bold text-navy-900 mb-1">Assign Vacant Room (Optional):</label>
              <select
                value={assignRoomId}
                onChange={(e) => setAssignRoomId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              >
                <option value="">-- No immediate room assignment --</option>
                {blocks.flatMap((b) =>
                  b.rooms
                    .filter((r) => r.occupied < r.capacity)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {b.name} — Room {r.roomNumber} ({r.roomType}, {r.capacity - r.occupied} bed available)
                      </option>
                    ))
                )}
              </select>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewAppModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Save Decision
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Submit Outing Pass */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="Request Campus Outing / Leave Pass"
      >
        <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Pass Category:</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="DAY_OUTING">Day Outing (Curfew 08:30 PM)</option>
              <option value="NIGHT_OUT">Night Out (Academic / Competition)</option>
              <option value="HOME_VISIT">Home Visit (Weekend / Holiday)</option>
              <option value="EMERGENCY">Medical / Emergency Outing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Departure Date/Time:</label>
              <input
                type="datetime-local"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Expected Return Time:</label>
              <input
                type="datetime-local"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Destination Address:</label>
            <input
              type="text"
              required
              placeholder="e.g. IIT Delhi Campus, Hauz Khas"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Detailed Reason:</label>
            <textarea
              rows={2}
              required
              placeholder="Specify academic competition, hackathon team, or family visit details..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Parent Contact Number:</label>
              <input
                type="tel"
                required
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Emergency Alternate:</label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98111..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Submit Gate Pass
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Warden Review Leave */}
      <Modal
        isOpen={isReviewLeaveModalOpen}
        onClose={() => setIsReviewLeaveModalOpen(false)}
        title={`Authorize Gate Pass — ${selectedLeave?.student.name}`}
      >
        <form onSubmit={handleReviewLeave} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p className="font-bold text-navy-900">
              {selectedLeave?.leaveType.replace('_', ' ')}: {selectedLeave?.destination}
            </p>
            <p className="text-slate-600">{selectedLeave?.reason}</p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Parent Contact: <strong>{selectedLeave?.parentContact}</strong>
            </p>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Gate Pass Authorization:</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 font-bold text-emerald-700">
                <input
                  type="radio"
                  name="leaveReviewStatus"
                  value="APPROVED"
                  checked={leaveReviewStatus === 'APPROVED'}
                  onChange={(e) => setLeaveReviewStatus(e.target.value)}
                />
                <span>GRANT GATE PASS</span>
              </label>
              <label className="flex items-center gap-1.5 font-bold text-rose-700">
                <input
                  type="radio"
                  name="leaveReviewStatus"
                  value="REJECTED"
                  checked={leaveReviewStatus === 'REJECTED'}
                  onChange={(e) => setLeaveReviewStatus(e.target.value)}
                />
                <span>DENY REQUEST</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Warden Authorization Remarks:</label>
            <textarea
              rows={2}
              value={leaveReviewRemarks}
              onChange={(e) => setLeaveReviewRemarks(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReviewLeaveModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition"
            >
              Commit Gate Pass Decision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

