import { Copy, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [branding, setBranding] = useState(getBrandingSettings());
  const { t } = useTranslation();

  useEffect(() => {
    const refresh = () => setBranding(getBrandingSettings());
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(branding.address || '');
  };

  return (
    <section className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 className="section-title mt-3">{t('contact.title')}</h1>
            <p className="muted-text mt-5">
              {t('contact.body')}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a className="btn-gold" href={`tel:${branding.phone}`}>{t('contact.call')}</a>
              <a className="btn-secondary" href={`mailto:${branding.email}`}>{t('contact.email')}</a>
              <a className="btn-secondary" href={branding.zalo ? `https://zalo.me/${branding.zalo}` : '#'}>{t('contact.zalo')}</a>
              <a className="btn-secondary" href={branding.whatsapp ? `https://wa.me/${branding.whatsapp}` : '#'}>{t('contact.whatsapp')}</a>
              <a className="btn-secondary" href={branding.facebook || '#'}>{t('contact.messenger')}</a>
              <a className="btn-secondary" href={branding.googleMapsLink || '#'}>{t('contact.openMaps')}</a>
              <button className="btn-secondary sm:col-span-2" type="button" onClick={copyAddress}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {t('contact.copyAddress')}
              </button>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <MapPin className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold uppercase text-stone-500">{t('contact.address')}</h2>
                <p className="mt-1 text-lune-ink">{branding.address}</p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <Phone className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold uppercase text-stone-500">{t('contact.phone')}</h2>
                <p className="mt-1 text-lune-ink">{branding.phone}</p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <Mail className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold uppercase text-stone-500">{t('contact.email')}</h2>
                <p className="mt-1 text-lune-ink">{branding.email}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="min-h-72 overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
              <div className="grid h-full min-h-72 place-items-center bg-[linear-gradient(135deg,#eef2f0_0%,#f7f3ec_55%,#e6d4b8_100%)] p-8 text-center">
                <div>
                  <MapPin className="mx-auto h-9 w-9 text-lune-goldDark" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-lune-ink">{t('contact.mapPlaceholder')}</p>
                  <p className="mt-1 text-sm text-stone-600">{branding.address}</p>
                </div>
              </div>
            </div>

            <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8" onSubmit={handleSubmit}>
              <h2 className="font-display text-3xl font-bold text-lune-ink">{t('contact.sendMessage')}</h2>
              <div className="mt-6 grid gap-5">
                <label>
                  <span className="label">{t('contact.name')}</span>
                  <input className="input-field" name="name" type="text" required />
                </label>
                <label>
                  <span className="label">{t('contact.email')}</span>
                  <input className="input-field" name="email" type="text" inputMode="email" required />
                </label>
                <label>
                  <span className="label">{t('contact.message')}</span>
                  <textarea className="input-field min-h-32 resize-y" name="message" required />
                </label>
              </div>
              {sent ? (
                <p className="mt-4 rounded-md bg-lune-mist p-3 text-sm font-medium text-lune-charcoal">
                  {t('contact.received')}
                </p>
              ) : null}
              <button className="btn-gold mt-6" type="submit">
                <Send className="h-4 w-4" aria-hidden="true" />
                {t('contact.send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
