import { Link } from 'react-router-dom';
import { getBrandingSettings, getPolicies } from '../admin/services/adminSettingsService.js';
import BookingPolicy from '../components/BookingPolicy.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';

export default function PoliciesPage() {
  const branding = getBrandingSettings();
  const policies = getPolicies();
  const { t } = useTranslation();
  useDocumentMeta({
    title: `${t('policiesPage.title')} | ${BRAND}`,
    description: t('policiesPage.intro', { hotelName: branding.hotelName, address: branding.address }),
    path: '/policies',
  });

  const policyCards = [
    {
      title: t('policiesPage.cancellationTitle'),
      body: policies.cancellationPolicy || t('policiesPage.cancellationBody'),
    },
    {
      title: t('policiesPage.paymentTitle'),
      body: policies.paymentConfirmationPolicy || t('policiesPage.paymentBody'),
    },
    {
      title: t('policiesPage.privacyTitle'),
      body: t('policiesPage.privacyBody'),
    },
    {
      title: t('policiesPage.supportTitle'),
      body: t('policiesPage.supportBody', {
        hotelName: branding.hotelName,
        phone: branding.phone,
        email: branding.email,
      }),
    },
  ];

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="mx-auto max-w-4xl">
          <p className="eyebrow">{t('policiesPage.eyebrow')}</p>
          <h1 className="section-title mt-3">{t('policiesPage.title')}</h1>
          <p className="mt-5 text-sm leading-7 text-stone-600">
            {t('policiesPage.intro', { hotelName: branding.hotelName, address: branding.address })}
          </p>

          <div className="mt-8">
            <BookingPolicy />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {policyCards.map((policy) => (
              <article key={policy.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
                <h2 className="text-lg font-bold text-lune-ink">{policy.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">{policy.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/rooms" className="btn-gold">
              {t('nav.bookNow')}
            </Link>
            <Link to="/contact" className="btn-secondary">
              {t('common.contactLune')}
            </Link>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
