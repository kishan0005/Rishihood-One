import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Plus,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { CampusEvent } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

export const EventsView: React.FC = () => {
  const { user, role } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  // Create Event Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('ACADEMIC');
  const [venue, setVenue] = useState<string>('Newton Auditorium');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [organizer, setOrganizer] = useState<string>('School of Technology');
  const [capacity, setCapacity] = useState<number>(200);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  // Handle RSVP toggle
  const handleToggleRsvp = async (id: string) => {
    try {
      const res = await api.rsvpEvent(id);
      showToast(res.message);
      loadEvents();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvent({
        title,
        description,
        category,
        venue,
        startTime,
        endTime,
        organizer,
        capacity,
      });

      showToast('Campus event published to university calendar!');
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      loadEvents();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredEvents =
    filter === 'ALL' ? events : events.filter((e) => e.category === filter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                Campus Events & Symposiums
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Innovation conclaves, national hackathons, cultural festivals, guest lectures, and student RSVPs.
            </p>
          </div>

          {(role === 'ADMIN' || role === 'FACULTY') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
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

        {/* Category Filters */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'ACADEMIC', 'WORKSHOP', 'CULTURAL', 'SPORTS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition ${
                filter === cat
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {event.bannerUrl ? (
                <img
                  src={event.bannerUrl}
                  alt={event.title}
                  className="w-full h-44 object-cover border-b border-slate-100"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-r from-navy-900 to-indigo-900 flex items-center justify-center text-white">
                  <Sparkles className="w-10 h-10 text-amber-400 opacity-80" />
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge status={event.category} />
                  <span className="text-[11px] font-bold text-slate-500">
                    {new Date(event.startTime).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-navy-900 leading-snug">{event.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{event.description}</p>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {event.registeredCount} of {event.capacity} Registered
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 mt-2">
              <button
                onClick={() => handleToggleRsvp(event.id)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs ${
                  event.isRegistered
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-navy-900 text-white hover:bg-navy-800'
                }`}
              >
                {event.isRegistered ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>You're Attending (Cancel RSVP)</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4" />
                    <span>Register / RSVP Pass</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Create Event */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish Campus Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Event Title:</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Autonomous Robotics Challenge 2025"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="ACADEMIC">ACADEMIC</option>
              <option value="WORKSHOP">WORKSHOP / CONCLAVE</option>
              <option value="CULTURAL">CULTURAL FEST</option>
              <option value="SPORTS">SPORTS TOURNAMENT</option>
              <option value="PLACEMENT">CAREER & PLACEMENT</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Description:</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed schedule, speaker lineup, eligibility..."
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Campus Venue:</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Max Capacity:</label>
              <input
                type="number"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Start Date & Time:</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">End Date & Time:</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
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
              Publish Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

