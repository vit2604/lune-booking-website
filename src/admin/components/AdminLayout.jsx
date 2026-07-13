import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import { isAdminLoggedIn, logout } from '../services/adminAuthService.js';

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAdminLoggedIn());
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpiredSession = () => setAuthenticated(false);
    window.addEventListener('lune:admin-session-expired', handleExpiredSession);
    return () => window.removeEventListener('lune:admin-session-expired', handleExpiredSession);
  }, []);

  if (!authenticated) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-lune-ink">
      <div className="lg:grid lg:grid-cols-[288px_1fr]">
        <AdminSidebar open={open} onClose={() => setOpen(false)} onLogout={handleLogout} />
        <div className="min-w-0">
          <AdminHeader onMenu={() => setOpen(true)} />
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
