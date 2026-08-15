import { CalendarDays, Menu, X } from 'lucide-react';
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

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

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
          ? 'absolute inset-x-0 top-0 z-50 bg-transparent text-white lg:border-b lg:border-white/10'
          : 'sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur'
      }
    >
      <nav className="page-shell grid h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:h-24 sm:gap-3 lg:flex lg:h-36 lg:justify-between lg:gap-5">
        <Link
          to="/"
          className={`flex min-w-0 max-w-[220px] items-center gap-1.5 sm:max-w-none sm:gap-3 lg:flex-none ${
            isHome
              ? 'rounded-2xl border border-white/25 bg-black/25 px-2 py-1 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-0'
              : ''
          }`}
          onClick={() => setOpen(false)}
        >
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.shortName}
              className={`h-12 w-14 shrink-0 object-contain min-[390px]:h-14 min-[390px]:w-16 sm:h-24 sm:w-32 md:h-28 md:w-40 lg:h-52 lg:w-72 ${
                isHome
                  ? 'brightness-150 contrast-125 drop-shadow-[0_4px_14px_rgba(0,0,0,0.42)]'
                  : ''
              }`}
            />
          ) : (
            <span
              className={`grid h-10 w-10 place-items-center rounded-md font-display text-xl font-bold ${
                isHome
                  ? 'border border-white/70 bg-white/10 text-white'
                  : 'bg-lune-ink text-white'
              }`}
            >
              L
            </span>
          )}
          <span
            className={`block min-w-0 max-w-[104px] whitespace-normal text-[10px] font-bold uppercase leading-[1.15] tracking-[0.055em] min-[420px]:max-w-[138px] min-[420px]:text-[11px] min-[420px]:tracking-[0.08em] sm:max-w-[290px] sm:text-base sm:leading-5 sm:tracking-[0.14em] ${
              isHome ? 'text-white' : 'text-lune-ink'
            }`}
          >
            {String(branding.shortName || 'Lune Boutique Apartment')
              .replace(/Lune Boutique\s+Apartment/i, 'Lune Boutique\nApartment')
              .split('\n')
              .map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
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
                ? 'inline-flex min-h-14 items-center justify-center rounded-lg bg-lune-goldDark px-8 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-lune-goldDeep'
                : 'btn-gold'
            }
          >
            {t('nav.bookNow')}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link
            to="/rooms"
            className="btn-gold min-h-10 w-10 shrink-0 rounded-lg px-0"
            aria-label={t('nav.bookNow')}
            onClick={() => setOpen(false)}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            className={`lune-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
              isHome
                ? 'border-white/35 bg-black/25 text-white shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-xl'
                : 'border-stone-200 text-lune-ink'
            }`}
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            <span key={open ? 'close' : 'menu'} className="lune-menu-icon">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-x-0 bottom-0 top-20 z-40 bg-black/30 backdrop-blur-[1px] transition-[opacity,visibility] duration-300 ease-out sm:top-24 lg:hidden ${
          open ? 'visible opacity-100' : 'invisible pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
          <div
            className={`ml-auto h-[calc(100svh-5rem)] w-full max-w-sm overflow-y-auto border-t border-stone-200 bg-white shadow-[0_18px_50px_rgba(23,20,18,0.16)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] sm:h-[calc(100svh-6rem)] ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-4 p-5">
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
      </div>
    </header>
  );
}
