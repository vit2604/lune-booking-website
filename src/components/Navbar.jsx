import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
  const { t } = useTranslation();

  useEffect(() => {
    const refresh = () => setBranding(getBrandingSettings());
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold transition ${
      isActive ? 'text-lune-goldDark' : 'text-lune-ink hover:text-lune-goldDark'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="page-shell flex h-20 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.shortName} className="h-10 w-10 rounded-md object-contain" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-md bg-lune-ink font-display text-xl font-bold text-white">
              L
            </span>
          )}
          <span className="max-w-[180px] font-display text-xl font-bold leading-5 text-lune-ink sm:max-w-none">
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
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
          <Link to="/rooms" className="btn-gold">
            {t('nav.bookNow')}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link to="/rooms" className="btn-gold px-3 text-xs" onClick={() => setOpen(false)}>
            {t('nav.bookNow')}
          </Link>
          <button
            className="grid min-h-11 w-11 place-items-center rounded-md border border-stone-200 text-lune-ink"
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
