import { Coins } from 'lucide-react';
import { useCurrency } from '../i18n/useCurrency.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function CurrencySwitcher({ mobile = false, tone = 'default' }) {
  const { currentCurrency, supportedCurrencies, changeCurrency } = useCurrency();
  const { t } = useTranslation();
  const isLight = tone === 'light' && !mobile;

  return (
    <label className={mobile ? 'block' : 'flex items-center gap-2'}>
      <span className={mobile ? 'label' : 'sr-only'}>{t('nav.currency')}</span>
      {!mobile ? (
        <Coins className={`h-4 w-4 ${isLight ? 'text-white/90' : 'text-lune-goldDark'}`} aria-hidden="true" />
      ) : null}
      <select
        className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold outline-none focus:border-lune-gold ${
          mobile ? 'w-full' : 'max-w-[112px]'
        } ${
          isLight
            ? 'border border-white/25 bg-white/10 text-white [color-scheme:dark]'
            : 'border border-stone-200 bg-white text-lune-ink'
        }`}
        value={currentCurrency}
        onChange={(event) => changeCurrency(event.target.value)}
        aria-label={t('nav.currency')}
      >
        {supportedCurrencies.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </label>
  );
}
