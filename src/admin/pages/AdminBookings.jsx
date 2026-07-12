import { Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import AdminTable from '../components/AdminTable.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { canUseMockFallback } from '../../config/apiConfig.js';
import {
  adminDeleteBooking,
  adminListBookings,
  adminUpdateBookingStatus,
  adminUpdateInternalNote,
  adminUpdatePaymentStatus,
} from '../../services/adminApiService.js';
import {
  addInternalNote,
  deleteBooking,
  getBookings,
  updateBookingStatus,
  updatePaymentStatus,
} from '../services/adminBookingService.js';
import { formatCurrency, formatGuestBreakdown, getPaymentMethodLabel } from '../../utils/booking.js';

const guestLabel = (key) =>
  ({
    'common.adult': 'adult',
    'common.adults': 'adults',
    'common.child': 'child',
    'common.children': 'children',
  })[key] || key;

function normalizeBooking(booking) {
  return {
    ...booking,
    guestInfo: booking.guestInfo || {
      fullName: booking.guest?.fullName,
      email: booking.guest?.email,
      phone: `${booking.guest?.phoneCode || ''} ${booking.guest?.phoneNumber || ''}`.trim(),
      specialRequest: booking.specialRequest,
    },
    roomName: booking.roomName || booking.room?.name,
    total: booking.total || booking.totalPrice,
    bookingStatus: String(booking.bookingStatus || 'received').toLowerCase(),
    paymentStatus: String(booking.paymentStatus || 'pending').toLowerCase(),
  };
}

const toApiBookingStatus = (status) => String(status).toUpperCase();
const toApiPaymentStatus = (status) => String(status).toUpperCase();

export default function AdminBookings() {
  const [bookings, setBookings] = useState(getBookings());
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [source, setSource] = useState(canUseMockFallback() ? 'local' : 'api');
  const [loading, setLoading] = useState(false);

  const loadBookings = async (message = '') => {
    setLoading(true);
    try {
      const data = await adminListBookings();
      const items = Array.isArray(data) ? data : data.items || [];
      setBookings(items.map(normalizeBooking));
      setSource('api');
      if (message) setToast(message);
    } catch (error) {
      if (!canUseMockFallback()) {
        setToast(error.message || 'Could not load bookings from backend.');
      } else {
        setBookings(getBookings().map(normalizeBooking));
        setSource('local');
        if (message) setToast(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const refresh = async (message) => {
    await loadBookings(message);
    setToast(message);
  };

  const openDetail = (booking) => {
    setSelected(booking);
    setNote(booking.internalNote || '');
  };

  const updateStatus = async (code, status) => {
    if (source === 'api') await adminUpdateBookingStatus(code, toApiBookingStatus(status));
    else updateBookingStatus(code, status);
    await refresh('Booking status updated.');
    setSelected((current) => (current?.bookingCode === code ? { ...current, bookingStatus: status } : current));
  };

  const updatePayment = async (code, status) => {
    if (source === 'api') await adminUpdatePaymentStatus(code, toApiPaymentStatus(status));
    else updatePaymentStatus(code, status);
    await refresh('Payment status updated.');
    setSelected((current) => (current?.bookingCode === code ? { ...current, paymentStatus: status } : current));
  };

  const saveNote = async () => {
    if (source === 'api') await adminUpdateInternalNote(selected.bookingCode, note);
    else addInternalNote(selected.bookingCode, note);
    await refresh('Internal note saved.');
    setSelected((current) => (current ? { ...current, internalNote: note } : current));
  };

  const confirmDelete = async () => {
    if (source === 'api') await adminDeleteBooking(deleteTarget.bookingCode);
    else deleteBooking(deleteTarget.bookingCode);
    setDeleteTarget(null);
    setSelected(null);
    await refresh(source === 'api' ? 'Booking cancelled.' : 'Booking deleted.');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Reservations</p>
        <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Booking management</h2>
        <p className="mt-2 text-sm text-stone-600">Review guest reservations, statuses, payments, and internal notes.</p>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}
      {loading ? <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-600">Loading bookings...</div> : null}

      <AdminTable empty="No bookings yet. Guest bookings will appear here.">
        {bookings.length ? (
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-lune-cream text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Booking code</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Stay</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {bookings.map((booking) => (
                <tr key={booking.bookingCode}>
                  <td className="px-4 py-4 font-semibold text-lune-ink">{booking.bookingCode}</td>
                  <td className="px-4 py-4">
                    <p className="font-medium">{booking.guestInfo?.fullName || 'Guest'}</p>
                    <p className="text-xs text-stone-500">{booking.guestInfo?.email}</p>
                  </td>
                  <td className="px-4 py-4">{booking.guestInfo?.phone}</td>
                  <td className="px-4 py-4">{booking.roomName}</td>
                  <td className="px-4 py-4">{booking.checkIn} → {booking.checkOut}<br />{booking.nights} nights</td>
                  <td className="px-4 py-4 font-semibold">{formatCurrency(booking.total)}</td>
                  <td className="px-4 py-4">
                    <p>{getPaymentMethodLabel(booking.paymentMethod)}</p>
                    <span className="rounded-md bg-lune-mist px-2 py-1 text-xs uppercase text-stone-600">{booking.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-lune-mist px-2 py-1 text-xs uppercase text-stone-600">{booking.bookingStatus}</span>
                  </td>
                  <td className="px-4 py-4">{booking.createdAt?.slice(0, 10)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => openDetail(booking)}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </button>
                      <button className="btn-secondary min-h-10 px-3 py-2 text-red-700" type="button" onClick={() => setDeleteTarget(booking)}>
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

      {selected ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/35 p-4">
          <div className="mx-auto my-8 max-w-3xl rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="eyebrow">Booking detail</p>
                <h3 className="mt-2 font-display text-4xl font-bold text-lune-ink">{selected.bookingCode}</h3>
              </div>
              <button className="btn-secondary" type="button" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Guest', selected.guestInfo?.fullName],
                ['Phone', selected.guestInfo?.phone],
                ['Email', selected.guestInfo?.email],
                ['Room', selected.roomName],
                ['Check-in', selected.checkIn],
                ['Check-out', selected.checkOut],
                ['Guests', formatGuestBreakdown(selected, guestLabel)],
                ['Total', formatCurrency(selected.total)],
                ['Payment method', getPaymentMethodLabel(selected.paymentMethod)],
                ['Payment status', selected.paymentStatus],
                ['Booking status', selected.bookingStatus],
                ['Special request', selected.guestInfo?.specialRequest || 'None'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-stone-200 p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-lune-ink">{value || '-'}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button className="btn-secondary" type="button" onClick={() => updateStatus(selected.bookingCode, 'confirmed')}>Mark confirmed</button>
              <button className="btn-secondary" type="button" onClick={() => updateStatus(selected.bookingCode, 'cancelled')}>Mark cancelled</button>
              <button className="btn-secondary" type="button" onClick={() => updatePayment(selected.bookingCode, 'paid')}>Payment paid</button>
              <button className="btn-secondary" type="button" onClick={() => updatePayment(selected.bookingCode, 'pending')}>Payment pending</button>
            </div>

            <div className="mt-6">
              <label>
                <span className="label">Internal note</span>
                <textarea className="input-field min-h-28" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <button className="btn-gold mt-3" type="button" onClick={saveNote}>Save internal note</button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete booking?"
        message={`This will remove ${deleteTarget?.bookingCode || 'this booking'} from mock booking records.`}
        confirmText="Delete booking"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
