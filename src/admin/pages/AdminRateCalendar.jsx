import { CalendarDays, Edit, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AdminTable from '../components/AdminTable.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import {
  adminCreateRatePeriod,
  adminDeleteRatePeriod,
  adminListRatePeriods,
  adminListRooms,
  adminUpdateRatePeriod,
} from '../../services/adminApiService.js';
import { formatCurrency, toDateInputValue, addDays } from '../../utils/booking.js';

const initialDates = () => {
  const today = new Date();
  return {
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(addDays(today, 1)),
  };
};

function normalizeRoom(room) {
  return {
    ...room,
    price: Number(room.price || room.basePrice || 0),
    status: room.status || 'ACTIVE',
  };
}

function nextDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return toDateInputValue(addDays(new Date(year, month - 1, day, 12), 1));
}

function buildPreviewDates(days = 14) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => toDateInputValue(addDays(today, index)));
}

function findRateForDate(periods, date) {
  return periods.find((period) => date >= period.startDate && date < period.endDate);
}

export default function AdminRateCalendar() {
  const dateDefaults = initialDates();
  const [rooms, setRooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [form, setForm] = useState({
    roomId: '',
    startDate: dateDefaults.startDate,
    endDate: dateDefaults.endDate,
    price: '',
    note: '',
  });
  const [editingId, setEditingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || rooms[0] || null,
    [rooms, selectedRoomId],
  );

  const selectedRoomPeriods = useMemo(
    () => periods.filter((period) => period.roomId === selectedRoomId),
    [periods, selectedRoomId],
  );

  const previewDates = useMemo(() => buildPreviewDates(14), []);

  const loadData = async (message = '') => {
    setLoading(true);
    setError('');
    try {
      const [roomData, rateData] = await Promise.all([adminListRooms(), adminListRatePeriods()]);
      const normalizedRooms = (Array.isArray(roomData) ? roomData : []).map(normalizeRoom);
      setRooms(normalizedRooms);
      setPeriods(Array.isArray(rateData) ? rateData : []);

      const nextSelectedRoomId = selectedRoomId || normalizedRooms[0]?.id || '';
      setSelectedRoomId(nextSelectedRoomId);
      setForm((current) => ({
        ...current,
        roomId: current.roomId || nextSelectedRoomId,
        price: current.price || (normalizedRooms[0]?.basePrice || normalizedRooms[0]?.price || ''),
      }));

      if (message) setToast(message);
    } catch (loadError) {
      setError(loadError.message || 'Could not load room rates from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;
    setForm((current) => ({
      ...current,
      roomId: selectedRoomId,
      price: current.price || selectedRoom?.basePrice || selectedRoom?.price || '',
    }));
  }, [selectedRoomId, selectedRoom?.basePrice, selectedRoom?.price]);

  const resetForm = () => {
    const nextDefaults = initialDates();
    setEditingId('');
    setForm({
      roomId: selectedRoomId,
      startDate: nextDefaults.startDate,
      endDate: nextDefaults.endDate,
      price: selectedRoom?.basePrice || selectedRoom?.price || '',
      note: '',
    });
    setError('');
  };

  const selectPreviewDate = (date, rate) => {
    setEditingId(rate?.id || '');
    setForm({
      roomId: selectedRoomId,
      startDate: rate?.startDate || date,
      endDate: rate?.endDate || nextDate(date),
      price: rate?.price || selectedRoom?.basePrice || selectedRoom?.price || '',
      note: rate?.note || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editPeriod = (period) => {
    setEditingId(period.id);
    setSelectedRoomId(period.roomId);
    setForm({
      roomId: period.roomId,
      startDate: period.startDate,
      endDate: period.endDate,
      price: period.price,
      note: period.note || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setToast('');

    try {
      if (!form.roomId) throw new Error('Please select a room.');
      if (!form.startDate || !form.endDate) throw new Error('Please select start and end dates.');
      if (form.endDate <= form.startDate) throw new Error('End date must be after start date.');
      if (Number(form.price) <= 0) throw new Error('Price must be greater than 0.');

      const payload = {
        ...form,
        price: Number(form.price),
      };

      if (editingId) {
        await adminUpdateRatePeriod(editingId, payload);
        await loadData('Rate period updated.');
      } else {
        await adminCreateRatePeriod(payload);
        await loadData('Rate period created.');
      }
      resetForm();
      window.dispatchEvent(new Event('lune:rooms-updated'));
    } catch (submitError) {
      setError(submitError.message || 'Could not save rate period.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError('');
    try {
      await adminDeleteRatePeriod(deleteTarget.id);
      setDeleteTarget(null);
      await loadData('Rate period deleted.');
      resetForm();
      window.dispatchEvent(new Event('lune:rooms-updated'));
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete rate period.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Pricing calendar</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Rate Calendar</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Set special prices by date range. Guest bookings will use these prices automatically for each night in the stay.
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={() => loadData('Rates refreshed.')} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lune-goldDark">
                {editingId ? 'Edit period' : 'New period'}
              </p>
              <h3 className="mt-1 font-display text-3xl font-bold text-lune-ink">Set room price</h3>
            </div>
            {editingId ? (
              <button className="btn-secondary min-h-10 px-3 py-2 text-xs" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-lune-ink">
              Room
              <select
                className="input-field"
                value={form.roomId}
                onChange={(event) => {
                  const roomId = event.target.value;
                  const nextRoom = rooms.find((room) => room.id === roomId);
                  setSelectedRoomId(roomId);
                  setForm((current) => ({
                    ...current,
                    roomId,
                    price: editingId ? current.price : nextRoom?.basePrice || nextRoom?.price || '',
                  }));
                }}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-lune-ink">
                Start date
                <input
                  className="input-field"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-lune-ink">
                End date
                <input
                  className="input-field"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-lune-ink">
              Price per night
              <input
                className="input-field"
                type="number"
                min="1"
                step="10000"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                placeholder="990000"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-lune-ink">
              Note
              <textarea
                className="input-field min-h-24 resize-y"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Weekend, holiday, peak season..."
              />
            </label>

            <button className="btn-gold w-full" type="submit" disabled={saving || loading}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  {editingId ? <Save className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                  {editingId ? 'Save changes' : 'Add rate period'}
                </>
              )}
            </button>
          </div>

          <div className="mt-5 rounded-md bg-lune-cream p-4 text-sm leading-6 text-stone-600">
            <p className="font-semibold text-lune-ink">How it works</p>
            <p className="mt-1">
              Checkout date is exclusive. Example: 20/06 to 22/06 applies to the nights of 20/06 and 21/06.
            </p>
          </div>
        </form>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lune-goldDark">14-day preview</p>
              <h3 className="mt-1 font-display text-3xl font-bold text-lune-ink">{selectedRoom?.name || 'Select room'}</h3>
              <p className="mt-1 text-sm text-stone-500">Base price: {formatCurrency(selectedRoom?.basePrice || selectedRoom?.price || 0)}</p>
            </div>
            <select className="input-field max-w-xs" value={selectedRoomId} onChange={(event) => setSelectedRoomId(event.target.value)}>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
            {previewDates.map((date) => {
              const rate = findRateForDate(selectedRoomPeriods, date);
              const price = rate?.price || selectedRoom?.basePrice || selectedRoom?.price || 0;
              return (
                <button
                  key={date}
                  type="button"
                  className={`min-h-28 rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    rate ? 'border-lune-gold bg-lune-gold/10' : 'border-stone-200 bg-stone-50'
                  }`}
                  onClick={() => selectPreviewDate(date, rate)}
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">{date.slice(5)}</span>
                  <span className="mt-3 block text-lg font-bold text-lune-ink">{formatCurrency(price).replace(' VND', '')}</span>
                  <span className="mt-1 block text-xs font-semibold text-stone-500">{rate ? 'Custom rate' : 'Base rate'}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <AdminTable empty="No custom rate periods yet.">
        {periods.length ? (
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-lune-cream text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Price/night</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-lune-ink">{period.room?.name || 'Room'}</p>
                    <p className="text-xs text-stone-500">Base {formatCurrency(period.room?.basePrice || 0)}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold">{period.startDate}</td>
                  <td className="px-4 py-4 font-semibold">{period.endDate}</td>
                  <td className="px-4 py-4 font-bold text-lune-goldDark">{formatCurrency(period.price)}</td>
                  <td className="px-4 py-4 text-stone-600">{period.note || '-'}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => editPeriod(period)}>
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        className="btn-secondary min-h-10 px-3 py-2 text-red-700"
                        type="button"
                        onClick={() => setDeleteTarget(period)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminTable>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete rate period?"
        message={`Remove custom price for ${deleteTarget?.room?.name || 'this room'} from ${deleteTarget?.startDate || ''} to ${deleteTarget?.endDate || ''}?`}
        confirmText="Delete rate"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
