import { CheckCircle2, Copy, CreditCard, QrCode, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoomById } from '../admin/services/adminRoomService.js';
import BookingSummary from '../components/BookingSummary.jsx';
import PaymentMethod from '../components/PaymentMethod.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import { persistBooking } from '../services/bookingService.js';
import { createPaymentWithFallback, getPaymentMethodsWithFallback } from '../services/paymentApiService.js';
import {
  createPaymentRequest,
  generateTransferContent,
  getEnabledPaymentMethods,
  getPaymentSettings,
  normalizePaymentMethodId,
} from '../services/paymentService.js';
import { buildBookingDraft } from '../utils/booking.js';
import { loadBookingDraft, saveBookingDraft, saveConfirmedBooking } from '../utils/storage.js';

const gatewayMethods = ['creditCard', 'stripe', 'paypal'];
const walletMethods = ['vnpay', 'momo', 'zaloPay'];

export default function PaymentPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('payAtProperty');
  const [settings, setSettings] = useState(getPaymentSettings());
  const [enabledMethods, setEnabledMethods] = useState(getEnabledPaymentMethods());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const draft = loadBookingDraft();
    const methods = getEnabledPaymentMethods();
    const storedMethod = normalizePaymentMethodId(draft?.paymentMethod);
    const firstMethod = methods[0]?.id || 'payAtProperty';

    setBooking(draft);
    setPaymentMethod(methods.some((method) => method.id === storedMethod) ? storedMethod : firstMethod);

    getPaymentMethodsWithFallback().then(({ methods: apiMethods }) => {
      setEnabledMethods(apiMethods);
      setPaymentMethod((current) =>
        apiMethods.some((method) => method.id === current) ? current : apiMethods[0]?.id || 'payAtProperty',
      );
    });

    const refresh = () => {
      const nextSettings = getPaymentSettings();
      const nextMethods = getEnabledPaymentMethods();
      setSettings(nextSettings);
      setEnabledMethods(nextMethods);
      setPaymentMethod((current) =>
        nextMethods.some((method) => method.id === current) ? current : nextMethods[0]?.id || 'payAtProperty',
      );
    };
    window.addEventListener('lune:settings-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('lune:settings-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const room = useMemo(() => getRoomById(booking?.roomId), [booking?.roomId]);
  const normalizedPaymentMethod = normalizePaymentMethodId(paymentMethod);
  const selectedMethod = enabledMethods.find((method) => method.id === normalizedPaymentMethod);
  const bankMethod = enabledMethods.find((method) => method.id === 'bankTransfer') || settings.paymentMethods?.bankTransfer || {};
  const vietQrMethod = enabledMethods.find((method) => method.id === 'vietQr') || settings.paymentMethods?.vietQr || {};

  if (!booking || !room) {
    return (
      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
            <h1 className="font-display text-4xl font-bold text-lune-ink">{t('booking.chooseRoomFirst')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{t('booking.chooseRoomFirst')}</p>
            <Link to="/rooms" className="btn-gold mt-6">
              {t('booking.browseRooms')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const transferContent = generateTransferContent(booking, bankMethod.transferContentTemplate);
  const currentBooking = {
    ...booking,
    paymentMethod: normalizedPaymentMethod,
    paymentStatus: selectedMethod?.statusAfterConfirm || 'pending',
  };

  const handleMethodChange = (method) => {
    setPaymentMethod(method);
    setError('');
    const normalizedMethod = normalizePaymentMethodId(method);
    const nextMethod = enabledMethods.find((item) => item.id === normalizedMethod);
    const updated = {
      ...booking,
      paymentMethod: normalizedMethod,
      paymentStatus: nextMethod?.statusAfterConfirm || 'pending',
    };
    setBooking(updated);
    saveBookingDraft(updated);
  };

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(`${label} ${t('payment.copied') || t('common.copied')}`);
    } catch {
      setCopied(t('common.copied'));
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) {
      setError(t('payment.noPaymentMethods'));
      return;
    }

    setConfirming(true);
    setError('');
    const updated = buildBookingDraft({
      room,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      guestInfo: booking.guestInfo,
      paymentMethod: normalizedPaymentMethod,
      bookingCode: booking.bookingCode,
      bookingStatus: 'received',
    });

    const apiPayment = await createPaymentWithFallback(updated.bookingCode, normalizedPaymentMethod);
    const paymentRequest =
      apiPayment.source === 'api' ? apiPayment.payment : await createPaymentRequest(updated, normalizedPaymentMethod);
    const confirmed = {
      ...updated,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: paymentRequest.paymentStatus || selectedMethod.statusAfterConfirm || 'pending',
      createdAt: booking.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveConfirmedBooking(confirmed);
    persistBooking(confirmed);
    navigate('/success');
  };

  const renderPaymentDetails = () => {
    if (!selectedMethod) {
      return (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
          {t('payment.noPaymentMethods')}
        </div>
      );
    }

    if (normalizedPaymentMethod === 'bankTransfer') {
      const accountNumber = bankMethod.accountNumber || settings.bankAccountNumber || 'PLACEHOLDER_ACCOUNT_NUMBER';
      return (
        <div className="mt-6 rounded-lg border border-lune-gold/30 bg-lune-cream p-5">
          <h2 className="text-lg font-semibold text-lune-ink">{t('payment.bankInfo')}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-700">{t('payment.officialBankWarning')}</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md bg-white p-3">
              <dt className="text-stone-500">{t('payment.bankName')}</dt>
              <dd className="mt-1 font-semibold text-lune-ink">
                {bankMethod.bankName || settings.bankName || 'PLACEHOLDER_BANK_NAME'}
              </dd>
            </div>
            <div className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <dt className="text-stone-500">{t('payment.accountNumber')}</dt>
                <dd className="mt-1 break-all font-semibold text-lune-ink">{accountNumber}</dd>
              </div>
              <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => copyText(t('payment.accountNumber'), accountNumber)}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {t('payment.copy')}
              </button>
            </div>
            <div className="rounded-md bg-white p-3">
              <dt className="text-stone-500">{t('payment.accountHolder')}</dt>
              <dd className="mt-1 font-semibold text-lune-ink">{bankMethod.accountHolder || 'LUNE BOUTIQUE HOTEL'}</dd>
            </div>
            <div className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <dt className="text-stone-500">{t('payment.transferContent')}</dt>
                <dd className="mt-1 break-words font-semibold text-lune-ink">{transferContent}</dd>
              </div>
              <button className="btn-secondary min-h-10 px-3 py-2" type="button" onClick={() => copyText(t('payment.transferContent'), transferContent)}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                {t('payment.copy')}
              </button>
            </div>
          </dl>
          <div className="mt-4 grid place-items-center rounded-lg bg-white p-5">
            {bankMethod.qrImageUrl || settings.qrImageUrl ? (
              <img
                src={bankMethod.qrImageUrl || settings.qrImageUrl}
                alt={t('payment.qrPlaceholder')}
                className="h-56 w-56 rounded-md object-contain"
              />
            ) : (
              <div className="grid h-56 w-56 max-w-full place-items-center rounded-md border border-dashed border-stone-300 bg-lune-cream">
                <QrCode className="h-20 w-20 text-lune-goldDark" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (normalizedPaymentMethod === 'vietQr') {
      return (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-lune-ink">{t('payment.vietQr')}</h2>
          <div className="mt-4 grid place-items-center rounded-lg bg-lune-cream p-5">
            {vietQrMethod.qrImageUrl || settings.qrImageUrl ? (
              <img
                src={vietQrMethod.qrImageUrl || settings.qrImageUrl}
                alt={t('payment.qrPlaceholder')}
                className="h-56 w-56 rounded-md object-contain"
              />
            ) : (
              <div className="grid h-56 w-56 max-w-full place-items-center rounded-md border border-dashed border-stone-300 bg-white">
                <QrCode className="h-20 w-20 text-lune-goldDark" aria-hidden="true" />
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-sm text-stone-600">{t('payment.qrSoon')}</p>
        </div>
      );
    }

    if (gatewayMethods.includes(normalizedPaymentMethod)) {
      return (
        <div className="mt-6 flex gap-3 rounded-lg border border-stone-200 bg-white p-5">
          <CreditCard className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
          <p className="text-sm leading-7 text-stone-600">
            {normalizedPaymentMethod === 'creditCard' ? t('payment.cardPlaceholderNote') : t('payment.gatewayPlaceholderNote')}
          </p>
        </div>
      );
    }

    if (walletMethods.includes(normalizedPaymentMethod)) {
      return (
        <div className="mt-6 flex gap-3 rounded-lg border border-stone-200 bg-white p-5">
          <WalletCards className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
          <p className="text-sm leading-7 text-stone-600">{t('payment.walletPlaceholderNote')}</p>
        </div>
      );
    }

    if (normalizedPaymentMethod === 'internationalTransfer') {
      return (
        <div className="mt-6 flex gap-3 rounded-lg border border-stone-200 bg-white p-5">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-lune-sage" aria-hidden="true" />
          <p className="text-sm leading-7 text-stone-600">{t('payment.internationalTransferNote')}</p>
        </div>
      );
    }

    return (
      <div className="mt-6 flex gap-3 rounded-lg border border-stone-200 bg-white p-5">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-lune-sage" aria-hidden="true" />
        <p className="text-sm leading-7 text-stone-600">
          {normalizedPaymentMethod === 'cashAtProperty' ? t('payment.cashAtPropertyDesc') : t('payment.payAtPropertyDesc')}
        </p>
      </div>
    );
  };

  return (
    <section className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8">
            <p className="eyebrow">{t('common.payment')}</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-lune-ink">{t('payment.reviewConfirm')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{t('payment.mockNotice')}</p>
            <p className="mt-3 rounded-lg bg-lune-cream p-4 text-sm leading-7 text-stone-700">
              {t('payment.safetyNote')}
            </p>

            <div className="mt-6">
              <TrustBadges compact />
            </div>

            <div className="mt-8">
              <PaymentMethod value={normalizedPaymentMethod} onChange={handleMethodChange} availableMethods={enabledMethods} />
            </div>

            {renderPaymentDetails()}

            {copied ? <p className="mt-4 text-sm font-medium text-green-700">{copied}</p> : null}
            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

            <button className="btn-gold mt-8 w-full sm:w-auto" type="button" disabled={confirming || !selectedMethod} onClick={handleConfirm}>
              {confirming ? t('common.confirming') : t('payment.confirmBooking')}
            </button>
          </div>

          <BookingSummary booking={currentBooking} className="h-fit lg:sticky lg:top-28" />
        </div>
      </div>
    </section>
  );
}
