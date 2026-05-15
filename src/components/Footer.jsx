import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function Footer() {
  const [branding, setBranding] = useState(getBrandingSettings());
  const { t } = useTranslation();

  useEffect(() => {
    const refresh = () => setBranding(getBrandingSettings());
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);

  return (
    <footer className="border-t border-stone-200 bg-lune-ink text-white">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link to="/" className="font-display text-3xl font-bold">
            {branding.hotelName}
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/65">
            {branding.footerDescription}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase text-white/80">{t('nav.contact')}</h3>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lune-gold" aria-hidden="true" />
              <span>{t('contact.address')}: {branding.address}</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-lune-gold" aria-hidden="true" />
              <span>{t('contact.phone')}: {branding.phone}</span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-lune-gold" aria-hidden="true" />
              <span>{t('contact.email')}: {branding.email}</span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase text-white/80">{t('footer.social')}</h3>
          <div className="mt-4 flex gap-3">
            <a
              className="rounded-md border border-white/20 p-3 text-white/75 transition hover:border-lune-gold hover:text-lune-gold"
              href={branding.instagram || '#'}
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              className="rounded-md border border-white/20 p-3 text-white/75 transition hover:border-lune-gold hover:text-lune-gold"
              href={branding.facebook || '#'}
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <div className="page-shell text-xs text-white/50">
          &copy; {new Date().getFullYear()} {branding.hotelName}. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
