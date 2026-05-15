import { getPolicies } from '../admin/services/adminSettingsService.js';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function BookingPolicy({ title = 'Booking Policy', compact = false }) {
  const policies = getPolicies();
  const branding = getBrandingSettings();
  const { t } = useTranslation();
  const policyItems = [
    t('policy.checkIn', { time: policies.checkInTime }),
    t('policy.checkOut', { time: policies.checkOutTime }),
    t('policy.passport'),
    t('policy.payment'),
    t('policy.languageSupport'),
    t('policy.location', { address: branding.address }),
  ].filter(Boolean);

  return (
    <section className={compact ? 'rounded-lg border border-stone-200 bg-white p-5' : ''}>
      <h3 className="font-display text-3xl font-bold text-lune-ink">{title === 'Booking Policy' ? t('policy.title') : title}</h3>
      <ul className="mt-5 space-y-3 text-sm text-stone-600">
        {policyItems.map((policy) => (
          <li key={policy} className="rounded-lg border border-stone-200 bg-white p-4 leading-6">
            {policy}
          </li>
        ))}
      </ul>
    </section>
  );
}
