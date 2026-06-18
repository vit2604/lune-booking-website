import { Copy, ExternalLink, Mail, MapPin, Navigation, Phone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';

const luneAddress = '92-94 Thạch Lam, Sơn Trà, Đà Nẵng, Việt Nam';
const legacyDefaultAddresses = new Set([
  '92-94 Thach Lam, Son Tra, Da Nang, Viet Nam',
  '92-94 Thach Lam, Son Tra, Da Nang',
]);

function getDisplayAddress(value) {
  const normalized = value?.trim();
  if (!normalized || legacyDefaultAddresses.has(normalized)) return luneAddress;
  return normalized;
}

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [branding, setBranding] = useState(getBrandingSettings());
  const { t } = useTranslation();
  const address = getDisplayAddress(branding.address);
  const encodedAddress = encodeURIComponent(address);
  const openMapsUrl =
    branding.googleMapsLink?.trim() && branding.googleMapsLink !== '#'
      ? branding.googleMapsLink.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  const embedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

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
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = address;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <RevealOnScroll variant="curve-right">
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
              <a className="btn-secondary" href={openMapsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t('contact.openMaps')}
              </a>
              <a className="btn-secondary sm:col-span-2 lg:col-span-1" href={directionsUrl} target="_blank" rel="noreferrer">
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {t('contact.getDirections')}
              </a>
              <button className="btn-secondary sm:col-span-2 lg:col-span-1" type="button" onClick={copyAddress}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copied ? t('common.copied') : t('contact.copyAddress')}
              </button>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-lg border border-stone-200 bg-white p-5">
                <MapPin className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
                <h2 className="mt-3 text-sm font-semibold uppercase text-stone-500">{t('contact.address')}</h2>
                <p className="mt-1 text-lune-ink">{address}</p>
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
          </RevealOnScroll>

          <div className="grid gap-6">
            <RevealOnScroll variant="curve-left" className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft">
              <div className="relative min-h-[360px] bg-lune-cream">
                {!mapFailed ? (
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={embedUrl}
                    title="Lune Boutique Hotel & Apartment Da Nang map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    onError={() => setMapFailed(true)}
                  />
                ) : null}
                {mapFailed ? (
                  <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#eef2f0_0%,#f7f3ec_55%,#e6d4b8_100%)] p-8 text-center">
                    <div>
                      <MapPin className="mx-auto h-9 w-9 text-lune-goldDark" aria-hidden="true" />
                      <p className="mt-3 text-sm font-semibold text-lune-ink">{t('contact.mapFallback')}</p>
                      <p className="mt-1 text-sm text-stone-600">{address}</p>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 border-t border-stone-200 p-4 sm:grid-cols-3">
                <a className="btn-gold w-full" href={openMapsUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t('contact.openMaps')}
                </a>
                <a className="btn-secondary w-full" href={directionsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  {t('contact.getDirections')}
                </a>
                <button className="btn-secondary w-full" type="button" onClick={copyAddress}>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  {copied ? t('common.copied') : t('contact.copyAddress')}
                </button>
              </div>
              <div className="border-t border-stone-100 px-4 pb-4 text-sm leading-6 text-stone-600">
                <strong className="text-lune-ink">{t('contact.address')}:</strong> {address}
              </div>
              <noscript>
                <div className="p-4 text-sm text-stone-600">
                  {t('contact.mapFallback')} {address}
                </div>
              </noscript>
            </RevealOnScroll>

            <RevealOnScroll as="form" variant="float" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8" onSubmit={handleSubmit}>
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
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
