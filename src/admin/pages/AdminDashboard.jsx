import { BedDouble, CalendarCheck, CreditCard, Hotel, MessageCircle, Plus, ReceiptText, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminStatCard from '../components/AdminStatCard.jsx';
import AdminTable from '../components/AdminTable.jsx';
import { getBookings } from '../services/adminBookingService.js';
import { getRooms } from '../services/adminRoomService.js';
import { canUseMockFallback } from '../../config/apiConfig.js';
import { adminListBookings, adminListRooms } from '../../services/adminApiService.js';
import { formatCurrency } from '../../utils/booking.js';
import { readJsonStorage, storageKeys } from '../../constants/storageKeys.js';

function normalizeBooking(booking) {
  return {
    ...booking,
    guestInfo: booking.guestInfo || {
      fullName: booking.guest?.fullName,
      email: booking.guest?.email,
      phone: `${booking.guest?.phoneCode || ''} ${booking.guest?.phoneNumber || ''}`.trim(),
    },
    roomName: booking.roomName || booking.room?.name,
    total: booking.total || booking.totalPrice,
    bookingStatus: String(booking.bookingStatus || 'received').toLowerCase(),
    paymentStatus: String(booking.paymentStatus || 'pending').toLowerCase(),
  };
}

function normalizeRoom(room) {
  return {
    ...room,
    status: room.status === 'ACTIVE' ? 'active' : String(room.status || 'active').toLowerCase(),
  };
}

export default function AdminDashboard() {
  const [rooms, setRooms] = useState(getRooms());
  const [bookings, setBookings] = useState(getBookings());

  useEffect(() => {
    let ignore = false;
    async function loadDashboardData() {
      try {
        const [apiRooms, apiBookings] = await Promise.all([adminListRooms(), adminListBookings({ limit: 6 })]);
        if (ignore) return;
        setRooms((Array.isArray(apiRooms) ? apiRooms : []).map(normalizeRoom));
        const bookingItems = Array.isArray(apiBookings) ? apiBookings : apiBookings.items || [];
        setBookings(bookingItems.map(normalizeBooking));
      } catch (_error) {
        if (!canUseMockFallback() || ignore) return;
        setRooms(getRooms());
        setBookings(getBookings());
      }
    }
    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, []);

  const activeBookings = bookings.filter((booking) => booking.bookingStatus !== 'cancelled');
  const pendingPayments = bookings.filter((booking) => booking.paymentStatus === 'pending');
  const estimatedRevenue = activeBookings.reduce((sum, booking) => sum + Number(booking.total || 0), 0);
  const availableRooms = rooms.filter((room) => room.status !== 'hidden').length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckIns = bookings.filter((booking) => booking.checkIn === today).length;
  const chatSessions = readJsonStorage(storageKeys.chatSessions, []);
  const unreadMessages = chatSessions.reduce((sum, session) => sum + Number(session.unreadByAdmin || 0), 0);
  const openConversations = chatSessions.filter((session) => session.status !== 'CLOSED' && session.status !== 'closed').length;

  const quickActions = [
    { label: 'Add new room', to: '/admin/rooms/new', icon: Plus },
    { label: 'Edit room prices', to: '/admin/rooms', icon: ReceiptText },
    { label: 'Update logo', to: '/admin/branding', icon: Hotel },
    { label: 'Payment settings', to: '/admin/payment-settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Hotel operations</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Today at Lune</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            A clean command center for rooms, prices, bookings, content, and payment setup.
          </p>
        </div>
        <Link to="/admin/rooms/new" className="btn-gold">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add new room
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard label="Total rooms" value={rooms.length} helper="Rooms in admin inventory" icon={BedDouble} />
        <AdminStatCard label="Active bookings" value={activeBookings.length} helper="Received or confirmed" icon={CalendarCheck} />
        <AdminStatCard label="Pending payments" value={pendingPayments.length} helper="Bank/QR waiting confirmation" icon={CreditCard} />
        <AdminStatCard label="Estimated revenue" value={formatCurrency(estimatedRevenue)} helper="Mock booking total" icon={ReceiptText} />
        <AdminStatCard label="Available rooms mock" value={availableRooms} helper="Visible on guest website" icon={Hotel} />
        <AdminStatCard label="Today check-ins mock" value={todayCheckIns} helper={today} icon={CalendarCheck} />
        <AdminStatCard label="Unread messages" value={unreadMessages} helper="Guest chat unread" icon={MessageCircle} />
        <AdminStatCard label="Open conversations" value={openConversations} helper="Website chat sessions" icon={MessageCircle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="font-display text-3xl font-bold text-lune-ink">Recent bookings</h3>
            <Link to="/admin/bookings" className="text-sm font-semibold text-lune-goldDark">
              View all
            </Link>
          </div>
          <AdminTable empty="No bookings yet.">
            {bookings.length ? (
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-lune-cream text-xs uppercase text-stone-500">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Stay</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.slice(0, 6).map((booking) => (
                    <tr key={booking.bookingCode}>
                      <td className="px-4 py-4 font-semibold text-lune-ink">{booking.bookingCode}</td>
                      <td className="px-4 py-4">{booking.guestInfo?.fullName || 'Guest'}</td>
                      <td className="px-4 py-4">{booking.roomName}</td>
                      <td className="px-4 py-4">{booking.checkIn} → {booking.checkOut}</td>
                      <td className="px-4 py-4 font-semibold">{formatCurrency(booking.total)}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-lune-mist px-2 py-1 text-xs uppercase text-stone-600">
                          {booking.bookingStatus || 'received'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </AdminTable>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="font-display text-3xl font-bold text-lune-ink">Quick actions</h3>
          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex min-h-12 items-center gap-3 rounded-md border border-stone-200 px-4 py-3 text-sm font-semibold text-lune-ink transition hover:border-lune-gold hover:bg-lune-cream"
                >
                  <Icon className="h-4 w-4 text-lune-goldDark" aria-hidden="true" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
