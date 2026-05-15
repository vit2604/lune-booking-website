import { Headphones, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

const badges = [
  { labelKey: 'trust.official', icon: ShieldCheck },
  { labelKey: 'trust.secure', icon: LockKeyhole },
  { labelKey: 'trust.noAccount', icon: UserRoundCheck },
  { labelKey: 'trust.support', icon: Headphones },
];

export default function TrustBadges({ compact = false }) {
  const { t } = useTranslation();

  return (
    <div className={compact ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'}>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.labelKey}
            className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm font-medium text-lune-charcoal"
          >
            <Icon className="h-4 w-4 shrink-0 text-lune-goldDark" aria-hidden="true" />
            <span>{t(badge.labelKey)}</span>
          </div>
        );
      })}
    </div>
  );
}
