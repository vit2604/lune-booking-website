import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/components/AdminLayout.jsx';
import AdminBookings from './admin/pages/AdminBookings.jsx';
import AdminBranding from './admin/pages/AdminBranding.jsx';
import AdminDashboard from './admin/pages/AdminDashboard.jsx';
import AdminLogin from './admin/pages/AdminLogin.jsx';
import AdminMedia from './admin/pages/AdminMedia.jsx';
import AdminMessages from './admin/pages/AdminMessages.jsx';
import AdminLanguages from './admin/pages/AdminLanguages.jsx';
import AdminPaymentSettings from './admin/pages/AdminPaymentSettings.jsx';
import AdminPolicies from './admin/pages/AdminPolicies.jsx';
import AdminRoomForm from './admin/pages/AdminRoomForm.jsx';
import AdminRooms from './admin/pages/AdminRooms.jsx';
import AdminSettings from './admin/pages/AdminSettings.jsx';
import GuestLayout from './components/GuestLayout.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import BookingPage from './pages/BookingPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import HomePage from './pages/HomePage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import RoomDetailPage from './pages/RoomDetailPage.jsx';
import RoomsPage from './pages/RoomsPage.jsx';
import SuccessPage from './pages/SuccessPage.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
