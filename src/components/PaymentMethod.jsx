import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  QrCode,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

const iconMap = {
  banknote: Banknote,
  building: Building2,
  'credit-card': CreditCard,
  landmark: Landmark,
  qr: QrCode,
  wallet: WalletCards,
};

export const paymentMethods = [
  {
    id: 'payAtProperty',
    labelKey: 'payment.payAtProperty',
    descriptionKey: 'payment.payAtPropertyDesc',
    iconName: 'wallet',
  },
  {
    id: 'bankTransfer',
    labelKey: 'payment.bankTransfer',
    descriptionKey: 'payment.bankTransferDesc',
    iconName: 'building',
  },
  {
    id: 'vietQr',
    labelKey: 'payment.vietQr',
    descriptionKey: 'payment.vietQrDesc',
    iconName: 'qr',
  },
];

const methodTranslationMap = {
  payAtProperty: ['payment.payAtProperty', 'payment.payAtPropertyDesc'],
  cashAtProperty: ['payment.cashAtProperty', 'payment.cashAtPropertyDesc'],
  bankTransfer: ['payment.bankTransfer', 'payment.bankTransferDesc'],
  vietQr: ['payment.vietQr', 'payment.vietQrDesc'],
  creditCard: ['payment.creditCard', 'payment.creditCardDesc'],
  stripe: ['payment.internationalCardGateway', 'payment.internationalCardGatewayDesc'],
  paypal: ['payment.internationalCardGateway', 'payment.internationalCardGatewayDesc'],
  vnpay: ['payment.eWallet', 'payment.eWalletDesc'],
  momo: ['payment.eWallet', 'payment.eWalletDesc'],
  zaloPay: ['payment.eWallet', 'payment.eWalletDesc'],
  internationalTransfer: ['payment.internationalTransfer', 'payment.internationalTransferDesc'],
};

function normalizeMethods(availableMethods = []) {
  if (!availableMethods.length) return paymentMethods;
  if (typeof availableMethods[0] === 'string') {
    return paymentMethods.filter((method) => availableMethods.includes(method.id));
  }
  return availableMethods;
}

export default function PaymentMethod({ value, onChange, availableMethods }) {
  const { t } = useTranslation();
  const methods = normalizeMethods(availableMethods);

  if (!methods.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
        {t('payment.noPaymentMethods')}
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="label">{t('common.payment')}</legend>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => {
          const Icon = iconMap[method.iconName] || Sparkles;
          const checked = value === method.id;
          const [labelKey, descriptionKey] = methodTranslationMap[method.id] || [];
          const usesProviderName = ['stripe', 'paypal', 'vnpay', 'momo', 'zaloPay'].includes(method.id);
          return (
            <label
              key={method.id}
              className={`min-h-[132px] cursor-pointer rounded-lg border p-4 transition ${
                checked
                  ? 'border-lune-gold bg-lune-cream'
                  : 'border-stone-200 bg-white hover:border-lune-gold/60'
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={checked}
                onChange={() => onChange(method.id)}
              />
              <span className="flex h-full items-start gap-3">
                <span className="rounded-md bg-white p-2 text-lune-goldDark shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="block text-sm font-semibold leading-5 text-lune-ink">
                      {usesProviderName ? method.displayName : labelKey ? t(labelKey) : method.displayName}
                    </span>
                    {method.recommended ? (
                      <span className="rounded-full bg-lune-gold/15 px-2 py-0.5 text-[11px] font-semibold uppercase text-lune-goldDark">
                        {t('common.recommended')}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-stone-500">
                    {descriptionKey ? t(descriptionKey) : method.description}
                  </span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
