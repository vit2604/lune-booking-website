import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import CurrencySwitcher from './CurrencySwitcher.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useTranslation } from '../i18n/useTranslation.js';

const navItems = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/rooms', labelKey: 'nav.rooms' },
  { to: '/contact', labelKey: 'nav.contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [branding, setBranding] = useState(getBrandingSettings());
  const location = useLocation();
  const { t } = useTranslation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const refresh = () => setBranding(getBrandingSettings());
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);

  const linkClass = ({ isActive }) => {
    if (isHome && !open) {
      return `text-sm font-semibold uppercase tracking-wide transition ${
        isActive ? 'text-lune-gold' : 'text-white/90 hover:text-white'
      }`;
    }
    return `text-sm font-semibold transition ${
      isActive ? 'text-lune-goldDark' : 'text-lune-ink hover:text-lune-goldDark'
    }`;
  };

  return (
    <header
      className={
        isHome
          ? 'absolute inset-x-0 top-0 z-50 border-b border-white/10 bg-transparent text-white'
          : 'sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur'
      }
    >
      <nav className="page-shell flex h-28 items-center justify-between gap-5 md:h-36">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.shortName}
              className="h-28 w-36 shrink-0 object-contain brightness-150 contrast-125 drop-shadow-[0_4px_14px_rgba(0,0,0,0.42)] sm:h-40 sm:w-56 lg:h-52 lg:w-72"
            />
          ) : (
            <span
              className={`grid h-10 w-10 place-items-center rounded-md font-display text-xl font-bold ${
                isHome ? 'border border-white/70 bg-white/10 text-white' : 'bg-lune-ink text-white'
              }`}
            >
              L
            </span>
          )}
          <span
            className={`max-w-[105px] text-xs font-bold uppercase leading-5 tracking-[0.12em] sm:max-w-[290px] sm:text-base sm:tracking-[0.14em] ${
              isHome ? 'text-white' : 'text-lune-ink'
            }`}
          >
            {branding.shortName}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <div className="flex items-center gap-2">
            <LanguageSwitcher tone={isHome ? 'light' : 'default'} />
            <CurrencySwitcher tone={isHome ? 'light' : 'default'} />
          </div>
          <Link
            to="/rooms"
            className={
              isHome
                ? 'inline-flex min-h-14 items-center justify-center rounded-lg bg-lune-gold px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-lune-goldDark'
                : 'btn-gold'
            }
          >
            {t('nav.bookNow')}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link to="/rooms" className="btn-gold px-3 text-xs" onClick={() => setOpen(false)}>
            {t('nav.bookNow')}
          </Link>
          <button
            className={`grid min-h-11 w-11 place-items-center rounded-md border ${
              isHome ? 'border-white/35 bg-white/10 text-white' : 'border-stone-200 text-lune-ink'
            }`}
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-stone-200 bg-white md:hidden">
          <div className="page-shell flex flex-col gap-4 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            <div className="grid gap-3 rounded-lg bg-lune-cream p-3">
              <LanguageSwitcher mobile />
              <CurrencySwitcher mobile />
            </div>
            <Link to="/rooms" className="btn-gold w-full" onClick={() => setOpen(false)}>
              {t('nav.bookNow')}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
