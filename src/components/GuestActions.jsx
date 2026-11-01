import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function GuestActions() {
  const [branding, setBranding] = useState(getBrandingSettings);
  const { pathname } = useLocation();
  const { t } = useTranslation();
  useEffect(() => {
    const refresh = () => setBranding(getBrandingSettings());
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);
  const digits = (value) => String(value || '').replace(/\D/g, '');
  const contacts = [
    { name: 'Zalo', href: digits(branding.zalo) ? `https://zalo.me/${digits(branding.zalo)}` : '/contact', color: '#0068ff' },
    { name: 'WhatsApp', href: digits(branding.whatsapp) ? `https://wa.me/${digits(branding.whatsapp)}` : '/contact', color: '#147d48' },
    { name: 'KakaoTalk', href: /^https:\/\/pf\.kakao\.com\//.test(branding.kakaoTalkUrl || '') ? branding.kakaoTalkUrl : '/contact', color: '#fee500' },
  ];
  const roomDetail = pathname.startsWith('/rooms/');
  return <>
    <div className="lune-contact-fabs" aria-label="Contact Lune">
      {contacts.map(({ name, href, color }) => <a key={name} href={href} target={href.startsWith('https:') ? '_blank' : undefined} rel="noopener noreferrer" aria-label={href === '/contact' ? `${name}: contact Lune for details` : `Chat with Lune on ${name}`} style={{ backgroundColor: color, color: name === 'KakaoTalk' ? '#191919' : '#fff' }} className="flex min-h-12 items-center justify-center rounded-full px-3 text-xs font-bold shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{name}</a>)}
    </div>
    {!roomDetail && <div className="lune-mobile-booking-bar"><Link to="/rooms" className="btn-gold w-full">{t('nav.bookNow')}</Link></div>}
  </>;
}
