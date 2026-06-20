import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';

const AdminLayout = lazy(() => import('./admin/components/AdminLayout.jsx'));
const AdminBookings = lazy(() => import('./admin/pages/AdminBookings.jsx'));
const AdminBranding = lazy(() => import('./admin/pages/AdminBranding.jsx'));
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard.jsx'));
const AdminLogin = lazy(() => import('./admin/pages/AdminLogin.jsx'));
const AdminMedia = lazy(() => import('./admin/pages/AdminMedia.jsx'));
const AdminMessages = lazy(() => import('./admin/pages/AdminMessages.jsx'));
const AdminLanguages = lazy(() => import('./admin/pages/AdminLanguages.jsx'));
const AdminPaymentSettings = lazy(() => import('./admin/pages/AdminPaymentSettings.jsx'));
const AdminPolicies = lazy(() => import('./admin/pages/AdminPolicies.jsx'));
const AdminRoomForm = lazy(() => import('./admin/pages/AdminRoomForm.jsx'));
const AdminRooms = lazy(() => import('./admin/pages/AdminRooms.jsx'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings.jsx'));
const GuestLayout = lazy(() => import('./components/GuestLayout.jsx'));
const BookingPage = lazy(() => import('./pages/BookingPage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const PaymentPage = lazy(() => import('./pages/PaymentPage.jsx'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage.jsx'));
const RoomDetailPage = lazy(() => import('./pages/RoomDetailPage.jsx'));
const RoomsPage = lazy(() => import('./pages/RoomsPage.jsx'));
const SuccessPage = lazy(() => import('./pages/SuccessPage.jsx'));

function RouteLoader() {
  return (
    <div className="grid min-h-[55vh] place-items-center bg-lune-cream px-4">
      <div className="rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm font-semibold text-lune-ink shadow-soft">
        Loading Lune...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="rooms/new" element={<AdminRoomForm />} />
            <Route path="rooms/edit/:id" element={<AdminRoomForm />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="branding" element={<AdminBranding />} />
            <Route path="payment-settings" element={<AdminPaymentSettings />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="languages" element={<AdminLanguages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route element={<GuestLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:slug" element={<RoomDetailPage />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/booking-success" element={<SuccessPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
