import { Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getAdminUser } from '../services/adminAuthService.js';

export default function AdminHeader({ onMenu }) {
  const user = getAdminUser();
  const location = useLocation();
  const titleMap = {
    '/admin/dashboard': 'Dashboard',
    '/admin/rooms': 'Rooms',
    '/admin/rates': 'Rate Calendar',
    '/admin/bookings': 'Bookings',
    '/admin/messages': 'Messages',
    '/admin/media': 'Media',
    '/admin/branding': 'Branding',
    '/admin/payment-settings': 'Payment Settings',
    '/admin/policies': 'Policies',
    '/admin/languages': 'Languages',
    '/admin/settings': 'Settings',
  };
  const title =
    location.pathname.includes('/admin/rooms/edit') || location.pathname.includes('/admin/rooms/new')
      ? 'Room Editor'
      : titleMap[location.pathname] || 'Admin';

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="grid min-h-11 w-11 place-items-center rounded-md border border-stone-200 text-lune-ink lg:hidden"
            type="button"
            aria-label="Open admin menu"
            onClick={onMenu}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <p className="text-sm font-semibold text-stone-500">Lune Boutique Hotel & Apartment</p>
            <h1 className="font-display text-3xl font-bold text-lune-ink">{title}</h1>
          </div>
        </div>

        <div className="hidden min-w-72 items-center gap-2 rounded-md border border-stone-200 bg-lune-cream px-3 py-2 text-sm text-stone-500 md:flex">
          <Search className="h-4 w-4" aria-hidden="true" />
          Manage rooms, bookings, media
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-lune-ink">{user?.username || 'admin'}</p>
          <p className="text-xs text-stone-500">Secure admin session</p>
        </div>
      </div>
    </header>
  );
}
