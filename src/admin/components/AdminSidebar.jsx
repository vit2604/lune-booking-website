import {
  BedDouble,
  CalendarDays,
  CreditCard,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Palette,
  ScrollText,
  Settings,
  Languages,
  MessageCircle,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/admin/messages', label: 'Messages', icon: MessageCircle },
  { to: '/admin/media', label: 'Media', icon: Image },
  { to: '/admin/branding', label: 'Branding', icon: Palette },
  { to: '/admin/payment-settings', label: 'Payment Settings', icon: CreditCard },
  { to: '/admin/policies', label: 'Policies', icon: ScrollText },
  { to: '/admin/languages', label: 'Languages', icon: Languages },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ open, onClose, onLogout }) {
  const linkClass = ({ isActive }) =>
    `flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-lune-ink text-white' : 'text-lune-charcoal hover:bg-lune-cream'
    }`;

  return (
    <>
      {open ? <button className="fixed inset-0 z-50 bg-black/30 lg:hidden" type="button" onClick={onClose} aria-label="Close menu" /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] w-72 border-r border-stone-200 bg-white p-4 transition lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-lune-ink font-display text-xl font-bold text-white">
              L
            </span>
            <div>
              <p className="font-display text-xl font-bold leading-5 text-lune-ink">Lune Admin</p>
              <p className="mt-1 text-xs text-stone-500">Hotel management</p>
            </div>
          </div>

          <nav className="mt-8 grid gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-2 border-t border-stone-200 pt-4">
            <NavLink to="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-lune-cream">
              <Home className="h-4 w-4" aria-hidden="true" />
              View website
            </NavLink>
            <button
              className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              type="button"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
