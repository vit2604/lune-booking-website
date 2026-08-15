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
import { verifyPaymentWithProvider } from '../../services/paymentApiService.js';

const guestLabel = (key) =>
  ({
    'common.adult': 'adult',
    'common.adults': 'adults',
    'common.child': 'child',
    'common.children': 'children',
  })[key] || key;

function normalizeBooking(booking) {
  const rooms = booking.rooms?.length
    ? booking.rooms
    : booking.roomItems?.map((item) => ({
        roomId: item.roomId,
        roomName: item.room?.name || '',
        quantity: Number(item.quantity || 1),
        guests: Number(item.guests || 1),
        adults: Number(item.adults || item.guests || 1),
        children: Number(item.children || 0),
        pricePerNight: Number(item.pricePerNight || 0),
        totalPrice: Number(item.totalPrice || 0),
      })) || [];
  const paidAmount = Math.round(
    (booking.payments || [])
      .filter((payment) => String(payment.status || '').toUpperCase() === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
  );
  const total = Number(booking.total || booking.totalPrice || 0);
  const remainingAmount = Math.max(0, total - paidAmount);
  return {
    ...booking,
    guestInfo: booking.guestInfo || {
      fullName: booking.guest?.fullName,
      email: booking.guest?.email,
      phone: `${booking.guest?.phoneCode || ''} ${booking.guest?.phoneNumber || ''}`.trim(),
      specialRequest: booking.specialRequest,
    },
    rooms,
    totalRooms: rooms.reduce((sum, item) => sum + Number(item.quantity || 1), 0) || 1,
    roomName: rooms.length
      ? rooms.map((item) => `${item.roomName} ×${item.quantity}`).join(', ')
      : booking.roomName || booking.room?.name,
    total,
    paidAmount,
    remainingAmount,
    bookingStatus: String(booking.bookingStatus || 'received').toLowerCase(),
    paymentStatus: String(booking.paymentStatus || 'pending').toLowerCase(),
  };
}

function isStaleIncompleteBooking(booking) {
  const createdAt = new Date(booking.createdAt).getTime();
  const olderThan24Hours = Number.isFinite(createdAt) && createdAt < Date.now() - 24 * 60 * 60 * 1000;
  return olderThan24Hours &&
    !booking.paymentMethod &&
    ['pending', 'failed'].includes(booking.paymentStatus) &&
    Number(booking.paidAmount || 0) === 0 &&
    !booking.bluejayBookingCode &&
    booking.bookingStatus === 'received';
}

function isOldSafeBooking(booking) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(booking.checkOut) < today &&
    Number(booking.paidAmount || 0) === 0 &&
    !(booking.bluejayBookingCode && booking.bookingStatus !== 'cancelled');
}

const toApiBookingStatus = (status) => String(status).toUpperCase();
const toApiPaymentStatus = (status) => String(status).toUpperCase();

export default function AdminBookings() {
  const [bookings, setBookings] = useState(getBookings());
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedCodes, setSelectedCodes] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [oldDeleteOpen, setOldDeleteOpen] = useState(false);
  const [oldDeletePreview, setOldDeletePreview] = useState([]);
  const [oldDeleteProtectedCount, setOldDeleteProtectedCount] = useState(0);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');
  const [source, setSource] = useState(canUseMockFallback() ? 'local' : 'api');
  const [loading, setLoading] = useState(false);

  const loadBookings = async (message = '', { skipAutomaticCleanup = false } = {}) => {
    setLoading(true);
    try {
      let data = await adminListBookings({ limit: 100 });
      let items = Array.isArray(data) ? data : data.items || [];
      const pendingPayosBookings = items.filter(
        (booking) =>
          booking.paymentMethod === 'vietQr' &&
          booking.paymentStatus === 'PENDING' &&
          booking.bookingStatus === 'RECEIVED',
      );
      if (pendingPayosBookings.length) {
        await Promise.allSettled(
          pendingPayosBookings.map((booking) => verifyPaymentWithProvider(booking.bookingCode)),
        );
        data = await adminListBookings({ limit: 100 });
        items = Array.isArray(data) ? data : data.items || [];
      }
      let normalizedItems = items.map(normalizeBooking);
      if (!skipAutomaticCleanup) {
        const staleBookings = normalizedItems.filter(isStaleIncompleteBooking);
        if (staleBookings.length) {
          await Promise.allSettled(staleBookings.map((booking) => adminDeleteBooking(booking.bookingCode)));
          data = await adminListBookings({ limit: 100 });
          items = Array.isArray(data) ? data : data.items || [];
          normalizedItems = items.map(normalizeBooking);
        }
      }
      setBookings(normalizedItems);
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
    const bookingCode = deleteTarget.bookingCode;
    try {
      if (source === 'api') {
        await adminDeleteBooking(bookingCode, {
          bluejayCancellationConfirmed: Boolean(deleteTarget.bluejayBookingCode),
        });
      }
      else deleteBooking(bookingCode);
      setBookings((current) => current.filter((booking) => booking.bookingCode !== bookingCode));
      setDeleteTarget(null);
      setSelected(null);
      await refresh('Booking deleted.');
    } catch (error) {
      setToast(error.message || 'Could not delete booking.');
    }
  };

  const canBulkDelete = (booking) => (
    Number(booking.paidAmount || 0) === 0 &&
    !(booking.bluejayBookingCode && booking.bookingStatus !== 'cancelled')
  );

  const bulkDeletableBookings = bookings.filter(canBulkDelete);
  const allBulkDeletableSelected = bulkDeletableBookings.length > 0 &&
    bulkDeletableBookings.every((booking) => selectedCodes.has(booking.bookingCode));

  const toggleBookingSelection = (bookingCode) => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(bookingCode)) next.delete(bookingCode);
      else next.add(bookingCode);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (allBulkDeletableSelected) {
        bulkDeletableBookings.forEach((booking) => next.delete(booking.bookingCode));
      } else {
        bulkDeletableBookings.forEach((booking) => next.add(booking.bookingCode));
      }
      return next;
    });
  };

  const confirmBulkDelete = async () => {
    const targets = bookings.filter((booking) => selectedCodes.has(booking.bookingCode) && canBulkDelete(booking));
    if (!targets.length) {
      setBulkDeleteOpen(false);
      setToast('No safe bookings selected for deletion.');
      return;
    }

    setLoading(true);
    const results = await Promise.allSettled(targets.map(async (booking) => {
      if (source === 'api') return adminDeleteBooking(booking.bookingCode);
      deleteBooking(booking.bookingCode);
      return { bookingCode: booking.bookingCode };
    }));
    const deletedCodes = new Set(
      results.flatMap((result, index) => result.status === 'fulfilled' ? [targets[index].bookingCode] : []),
    );
    const failedCount = targets.length - deletedCodes.size;
    setSelectedCodes((current) => new Set([...current].filter((code) => !deletedCodes.has(code))));
    setBookings((current) => current.filter((booking) => !deletedCodes.has(booking.bookingCode)));
    setBulkDeleteOpen(false);
    setLoading(false);
    await refresh(
      failedCount
        ? `Deleted ${deletedCodes.size} bookings. ${failedCount} could not be deleted.`
        : `Deleted ${deletedCodes.size} bookings.`,
    );
  };

  const confirmOldDelete = async () => {
    setLoading(true);
    try {
      const deletionResults = await Promise.allSettled(oldDeletePreview.map(async (booking) => {
        if (source === 'api') return adminDeleteBooking(booking.bookingCode);
        deleteBooking(booking.bookingCode);
        return { bookingCode: booking.bookingCode };
      }));
      const deleted = deletionResults.filter((item) => item.status === 'fulfilled').length;
      const failed = oldDeletePreview.length - deleted;
      setOldDeleteOpen(false);
      setOldDeletePreview([]);
      setSelectedCodes(new Set());
      await refresh(
        `Deleted ${deleted} old bookings.${failed ? ` ${failed} could not be deleted.` : ''}${oldDeleteProtectedCount ? ` Kept ${oldDeleteProtectedCount} protected paid or Bluejay bookings.` : ''}`,
      );
    } catch (error) {
      setToast(error.message || 'Could not delete old bookings.');
    } finally {
      setLoading(false);
    }
  };

  const prepareOldDelete = async () => {
    setLoading(true);
    setToast('');
    try {
      let items;
      if (source === 'api') {
        const first = await adminListBookings({ limit: 100, page: 1 });
        const firstItems = Array.isArray(first) ? first : first.items || [];
        const total = Array.isArray(first) ? firstItems.length : Number(first.total || firstItems.length);
        const pages = Math.max(1, Math.ceil(total / 100));
        const rest = pages > 1
          ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) => adminListBookings({ limit: 100, page: index + 2 })))
          : [];
        items = [
          ...firstItems,
          ...rest.flatMap((page) => Array.isArray(page) ? page : page.items || []),
        ].map(normalizeBooking);
      } else {
        items = getBookings().map(normalizeBooking);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const oldBookings = items.filter((booking) => new Date(booking.checkOut) < today);
      setOldDeletePreview(oldBookings.filter(isOldSafeBooking));
      setOldDeleteProtectedCount(oldBookings.filter((booking) => !isOldSafeBooking(booking)).length);
      setOldDeleteOpen(true);
    } catch (error) {
      setToast(error.message || 'Could not prepare the old booking list.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Reservations</p>
        <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Booking management</h2>
        <p className="mt-2 text-sm text-stone-600">Review guest reservations, statuses, payments, and internal notes. Incomplete bookings with no payment method are removed automatically after 24 hours.</p>
      </div>

      {toast ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{toast}</div> : null}
      {loading ? <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-600">Loading bookings...</div> : null}

      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-soft">
        <p className="text-sm text-stone-600">
          {selectedCodes.size ? <><strong className="text-lune-ink">{selectedCodes.size}</strong> bookings selected</> : 'Select unpaid bookings to manage them together.'}
        </p>
        <div className="flex gap-2">
          <button
            className="btn-secondary min-h-10 text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            disabled={loading}
            onClick={prepareOldDelete}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete old bookings
          </button>
          {selectedCodes.size ? (
            <button className="btn-secondary min-h-10" type="button" onClick={() => setSelectedCodes(new Set())}>
              Clear selection
            </button>
          ) : null}
          <button
            className="btn-secondary min-h-10 text-red-700 disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            disabled={!selectedCodes.size || loading}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete selected
          </button>
        </div>
      </div>

      <AdminTable draggable empty="No bookings yet. Guest bookings will appear here.">
        {bookings.length ? (
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-lune-cream text-xs uppercase text-stone-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    className="h-4 w-4 accent-lune-goldDark"
                    type="checkbox"
                    checked={allBulkDeletableSelected}
                    disabled={!bulkDeletableBookings.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all deletable bookings"
                  />
                </th>
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
                <tr key={booking.bookingCode} className={selectedCodes.has(booking.bookingCode) ? 'bg-amber-50/70' : ''}>
                  <td className="px-4 py-4">
                    <input
                      className="h-4 w-4 accent-lune-goldDark disabled:cursor-not-allowed disabled:opacity-35"
                      type="checkbox"
                      checked={selectedCodes.has(booking.bookingCode)}
                      disabled={!canBulkDelete(booking)}
                      onChange={() => toggleBookingSelection(booking.bookingCode)}
                      aria-label={`Select booking ${booking.bookingCode}`}
                      title={canBulkDelete(booking) ? 'Select booking' : 'Paid or active Bluejay bookings must be reviewed individually'}
                    />
                  </td>
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
                    {booking.paidAmount > 0 ? (
                      <p className="mt-1 text-xs text-stone-500">
                        Paid {formatCurrency(booking.paidAmount)}
                        {booking.remainingAmount > 0 ? ` · Remaining ${formatCurrency(booking.remainingAmount)}` : ''}
                      </p>
                    ) : null}
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
                ['Rooms', selected.roomName],
                ['Check-in', selected.checkIn],
                ['Check-out', selected.checkOut],
                ['Guests', formatGuestBreakdown(selected, guestLabel)],
                ['Total', formatCurrency(selected.total)],
                ['Paid / deposit', selected.paidAmount > 0 ? formatCurrency(selected.paidAmount) : '-'],
                ['Remaining', selected.paidAmount > 0 ? formatCurrency(selected.remainingAmount) : '-'],
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
        message={
          deleteTarget?.bluejayBookingCode
            ? `This will permanently remove ${deleteTarget.bookingCode} and its payment records from this website. Only continue if Bluejay booking ${deleteTarget.bluejayBookingCode} has already been cancelled in Bluejay PMS.`
            : `This will permanently remove ${deleteTarget?.bookingCode || 'this booking'} and its payment records.`
        }
        confirmText={deleteTarget?.bluejayBookingCode ? 'I cancelled it in Bluejay - delete' : 'Delete booking'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmModal
        open={bulkDeleteOpen}
        title={`Delete ${selectedCodes.size} bookings?`}
        message={`This permanently removes the selected unpaid bookings and their related records. Paid bookings and active Bluejay bookings cannot be selected for bulk deletion.`}
        confirmText={`Delete ${selectedCodes.size} bookings`}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
      />
      {oldDeleteOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4">
          <div className="flex max-h-[min(760px,calc(100svh-32px))] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <div className="border-b border-stone-200 p-5 sm:p-6">
              <h2 className="font-display text-3xl font-bold text-lune-ink">Review old bookings before deletion</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Only the {oldDeletePreview.length} bookings listed below will be deleted.
                {oldDeleteProtectedCount ? ` ${oldDeleteProtectedCount} paid or active Bluejay bookings are protected and are not shown in this deletion list.` : ''}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {oldDeletePreview.length ? (
                <div className="overflow-x-auto rounded-lg border border-stone-200">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-lune-cream text-xs uppercase text-stone-500">
                      <tr>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Guest</th>
                        <th className="px-4 py-3">Check-out</th>
                        <th className="px-4 py-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {oldDeletePreview.map((booking) => (
                        <tr key={booking.bookingCode}>
                          <td className="px-4 py-3 font-semibold text-lune-ink">{booking.bookingCode}</td>
                          <td className="px-4 py-3">{booking.guestInfo?.fullName || 'Guest'}</td>
                          <td className="px-4 py-3">{String(booking.checkOut).slice(0, 10)}</td>
                          <td className="px-4 py-3 uppercase">{booking.paymentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                  There are no old unpaid bookings that are safe to delete.
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-stone-200 p-4 sm:flex-row sm:justify-end sm:p-6">
              <button className="btn-secondary" type="button" onClick={() => setOldDeleteOpen(false)}>Cancel</button>
              <button
                className="btn-gold bg-red-700 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-45"
                type="button"
                disabled={!oldDeletePreview.length || loading}
                onClick={confirmOldDelete}
              >
                Delete these {oldDeletePreview.length} bookings
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
