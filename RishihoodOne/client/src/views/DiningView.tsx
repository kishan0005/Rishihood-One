import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Edit2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DiningMenuItem } from '../types';
import { Modal } from '../components/common/Modal';
import api from '../services/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export const DiningView: React.FC = () => {
  const { user, role } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [weeklyMenu, setWeeklyMenu] = useState<Record<string, DiningMenuItem[]>>({});
  const [rawMenu, setRawMenu] = useState<DiningMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Menu Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editMealType, setEditMealType] = useState<string>('LUNCH');
  const [editItems, setEditItems] = useState<string>('');
  const [editTiming, setEditTiming] = useState<string>('12:30 PM - 02:30 PM');
  const [editDiet, setEditDiet] = useState<string>('Vegetarian & Jain Available');

  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadMenu = async () => {
    try {
      const data = await api.getDiningMenu();
      setWeeklyMenu(data.weeklyMenu || {});
      setRawMenu(data.rawMenu || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateDiningMenu({
        dayOfWeek: selectedDay,
        mealType: editMealType,
        items: editItems,
        timing: editTiming,
        specialDiet: editDiet,
      });

      showToast(`Menu for ${selectedDay} ${editMealType} updated!`);
      setIsEditModalOpen(false);
      loadMenu();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const currentDayMeals = weeklyMenu[selectedDay] || [];

  const getMealHeaderColor = (meal: string) => {
    switch (meal) {
      case 'BREAKFAST':
        return 'from-amber-500 to-orange-500 text-white';
      case 'LUNCH':
        return 'from-emerald-600 to-teal-700 text-white';
      case 'SNACKS':
        return 'from-indigo-600 to-purple-600 text-white';
      case 'DINNER':
        return 'from-navy-900 to-slate-900 text-white';
      default:
        return 'from-slate-700 to-slate-900 text-white';
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
                <UtensilsCrossed className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-navy-900 tracking-tight">
                Dining Hall & Mess Menu
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nutritious culinary schedules prepared fresh across Central Dining & Cafeterias.
            </p>
          </div>

          {(role === 'WARDEN' || role === 'ADMIN') && (
            <button
              onClick={() => {
                const target = currentDayMeals[1] || currentDayMeals[0];
                setEditMealType(target?.mealType || 'LUNCH');
                setEditItems(target?.items || '');
                setEditTiming(target?.timing || '12:30 PM - 02:30 PM');
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white font-bold text-xs hover:bg-navy-800 transition shadow-sm flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Update Today's Menu</span>
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

        {/* Day Selector Buttons */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Meal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'] as const).map((mealType) => {
          const item = currentDayMeals.find((m) => m.mealType === mealType);

          return (
            <div
              key={mealType}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className={`p-4 bg-gradient-to-r ${getMealHeaderColor(mealType)} flex items-center justify-between`}>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">
                      {selectedDay}
                    </span>
                    <h3 className="text-sm font-extrabold tracking-tight">{mealType}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold opacity-90">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item?.timing?.split(' - ')[0] || 'Schedule'}</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item?.timing || '08:00 AM - 10:00 AM'}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-navy-900 mb-1.5">Chef's Menu:</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item?.items || 'Seasonal healthy rotation prepared by Rishihood Dining Service.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 mt-2">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item?.specialDiet || 'Vegetarian / Jain Option Included'}</span>
                </div>

                {(role === 'WARDEN' || role === 'ADMIN') && (
                  <button
                    onClick={() => {
                      setEditMealType(mealType);
                      setEditItems(item?.items || '');
                      setEditTiming(item?.timing || '12:30 PM - 02:30 PM');
                      setIsEditModalOpen(true);
                    }}
                    className="w-full mt-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-navy-900 hover:bg-slate-50 text-[11px] font-bold text-center block"
                  >
                    Edit Meal Menu
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dining Advisory */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-navy-900">Food Safety & Quality Assurance:</h4>
          <p className="mt-0.5 text-slate-500">
            FSSAI Certified campus mess. Clean drinking RO water available 24x7 across all hostel atriums.
          </p>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl whitespace-nowrap">
          Head Chef: Chef Satish Rawat
        </span>
      </div>

      {/* MODAL: Edit Menu */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Update Dining Menu — ${selectedDay} (${editMealType})`}
      >
        <form onSubmit={handleUpdateMenu} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy-900 mb-1">Meal Service:</label>
            <select
              value={editMealType}
              onChange={(e) => setEditMealType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200"
            >
              <option value="BREAKFAST">BREAKFAST</option>
              <option value="LUNCH">LUNCH</option>
              <option value="SNACKS">SNACKS</option>
              <option value="DINNER">DINNER</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Meal Hours / Service Timing:</label>
            <input
              type="text"
              required
              value={editTiming}
              onChange={(e) => setEditTiming(e.target.value)}
              placeholder="e.g. 12:30 PM - 02:30 PM"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Dishes & Menu Items (Comma Separated):</label>
            <textarea
              rows={4}
              required
              value={editItems}
              onChange={(e) => setEditItems(e.target.value)}
              placeholder="e.g. Paneer Butter Masala, Dal Makhani, Steamed Rice, Tawa Roti, Gulab Jamun"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Special Diet / Allergen Tag:</label>
            <input
              type="text"
              value={editDiet}
              onChange={(e) => setEditDiet(e.target.value)}
              placeholder="e.g. Pure Vegetarian, Jain Available, Gluten-Free on request"
              className="w-full p-2.5 rounded-xl border border-slate-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-navy-900 text-white font-bold hover:bg-navy-800 transition"
            >
              Save Menu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

