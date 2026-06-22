import { CheckCircle2, Copy, CreditCard, QrCode, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoomById } from '../admin/services/adminRoomService.js';
import BookingSummary from '../components/BookingSummary.jsx';
import PaymentMethod from '../components/PaymentMethod.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
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

function safePaymentImageSrc(src) {
  const value = String(src || '').trim();
  if (!value) return '';
  if (value.startsWith('/images/') || value.startsWith('data:image/')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function roomFromBookingDraft(booking) {
  if (!booking?.roomId) return null;
  return {
    id: booking.roomId,
    slug: booking.roomId,
    name: booking.roomName,
    price: Number(booking.pricePerNight || 0),
    basePrice: Number(booking.pricePerNight || 0),
    maxGuests: Number(booking.maxGuests || booking.guests || 1),
    image: booking.roomImage || '',
    gallery: booking.roomImage ? [booking.roomImage] : [],
    type: booking.roomType || 'Apartment',
    size: booking.size || '',
    bed: booking.bed || '',
    amenities: [],
  };
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('payAtProperty');
  const [settings, setSettings] = useState(getPaymentSettings());
  const [enabledMethods, setEnabledMethods] = useState(getEnabledPaymentMethods());
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [creatingPaymentRequest, setCreatingPaymentRequest] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const draft = loadBookingDraft();
    const methods = getEnabledPaymentMethods();
    const storedMethod = normalizePaymentMethodId(draft?.paymentMethod);
    const firstMethod = methods[0]?.id || 'payAtProperty';

    setBooking(draft);
    setPaymentMethod(methods.some((method) => method.id === storedMethod) ? storedMethod : firstMethod);

    getPaymentMethodsWithFallback()
      .then(({ methods: apiMethods }) => {
        setEnabledMethods(apiMethods);
        setPaymentMethod((current) =>
          apiMethods.some((method) => method.id === current) ? current : apiMethods[0]?.id || 'payAtProperty',
        );
      })
      .catch((loadError) => setError(loadError.message || 'Could not load payment methods from backend.'));

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

  const room = useMemo(() => getRoomById(booking?.roomId) || roomFromBookingDraft(booking), [booking]);
  const normalizedPaymentMethod = normalizePaymentMethodId(paymentMethod);
  const selectedMethod = enabledMethods.find((method) => method.id === normalizedPaymentMethod);
  const bankMethod = enabledMethods.find((method) => method.id === 'bankTransfer') || settings.paymentMethods?.bankTransfer || {};
  const vietQrMethod = enabledMethods.find((method) => method.id === 'vietQr') || settings.paymentMethods?.vietQr || {};
  const bankQrSrc = safePaymentImageSrc(bankMethod.qrImageUrl || settings.qrImageUrl);
  const vietQrSrc = safePaymentImageSrc(vietQrMethod.qrImageUrl || settings.qrImageUrl);

  const createProviderPaymentRequest = async (method = normalizedPaymentMethod) => {
    if (!booking?.bookingCode) return null;
    const normalizedMethod = normalizePaymentMethodId(method);
    setCreatingPaymentRequest(true);
    setError('');
    try {
      const apiPayment = await createPaymentWithFallback(booking.bookingCode, normalizedMethod);
      const request =
        apiPayment.source === 'api' ? apiPayment.payment : await createPaymentRequest(booking, normalizedMethod);
      setPaymentRequest({ method: normalizedMethod, ...request });
      return request;
    } catch (paymentError) {
      setError(paymentError.message || 'Could not create payment request. Please contact Lune support.');
      return null;
    } finally {
      setCreatingPaymentRequest(false);
    }
  };

  // Keep this effect above the early return below so the hook order stays stable
  // across renders (booking starts null, then becomes populated). Moving it after
  // the early return violates the Rules of Hooks and crashes the page.
  useEffect(() => {
    if (!booking?.bookingCode || normalizedPaymentMethod !== 'vietQr') return;
    if (paymentRequest?.method === 'vietQr' && paymentRequest?.bookingCode === booking.bookingCode) return;
    createProviderPaymentRequest('vietQr');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.bookingCode, normalizedPaymentMethod, paymentRequest?.bookingCode, paymentRequest?.method]);

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
    setPaymentRequest(null);
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
    const updated = {
      ...booking,
      roomId: booking.roomId || room.id,
      roomName: booking.roomName || room.name,
      roomImage: booking.roomImage || room.image,
      maxGuests: booking.maxGuests || room.maxGuests,
      roomType: booking.roomType || room.type,
      size: booking.size || room.size,
      bed: booking.bed || room.bed || room.bedType || room.beds,
      pricePerNight: Number(booking.pricePerNight || room.price || room.basePrice || 0),
      subtotal: Number(booking.subtotal ?? booking.roomSubtotal ?? 0),
      roomSubtotal: Number(booking.roomSubtotal ?? booking.subtotal ?? 0),
      total: Number(booking.total ?? booking.totalPrice ?? 0),
      totalPrice: Number(booking.totalPrice ?? booking.total ?? 0),
      guests: Number(booking.guests || 1),
      paymentMethod: normalizedPaymentMethod,
      bookingStatus: booking.bookingStatus || 'received',
    };

    try {
      const nextPaymentRequest =
        paymentRequest?.method === normalizedPaymentMethod
          ? paymentRequest
          : await createProviderPaymentRequest(normalizedPaymentMethod);
      if (!nextPaymentRequest) {
        setConfirming(false);
        return;
      }
      const confirmed = {
        ...updated,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: nextPaymentRequest.paymentStatus || selectedMethod.statusAfterConfirm || 'pending',
        createdAt: booking.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConfirmedBooking(confirmed);
      persistBooking(confirmed);
      navigate('/success');
    } catch (paymentError) {
      setError(paymentError.message || 'Could not create payment request. Please contact Lune support.');
      setConfirming(false);
    }
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
            {bankQrSrc ? (
              <img
                src={bankQrSrc}
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
      const providerPayment = paymentRequest?.payment || paymentRequest;
      const payosQr = safePaymentImageSrc(providerPayment?.qrImage || providerPayment?.payos?.qrImage || providerPayment?.qrCode || providerPayment?.payos?.qrCode);
      const payosCheckoutUrl = providerPayment?.checkoutUrl || providerPayment?.payos?.checkoutUrl;
      const payosConfigured = providerPayment?.payos?.configured !== false;

      return (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-lune-ink">{t('payment.vietQr')}</h2>
          <div className="mt-4 grid place-items-center rounded-lg bg-lune-cream p-5">
            {payosQr ? (
              <img
                src={payosQr}
                alt={t('payment.qrPlaceholder')}
                className="h-64 w-64 max-w-full rounded-md bg-white object-contain p-2 shadow-soft"
              />
            ) : vietQrSrc ? (
              <img
                src={vietQrSrc}
                alt={t('payment.qrPlaceholder')}
                className="h-56 w-56 rounded-md object-contain"
              />
            ) : (
              <div className="grid h-56 w-56 max-w-full place-items-center rounded-md border border-dashed border-stone-300 bg-white">
                <QrCode className="h-20 w-20 text-lune-goldDark" aria-hidden="true" />
              </div>
            )}
          </div>
          {creatingPaymentRequest ? (
            <p className="mt-3 text-center text-sm font-medium text-lune-goldDark">{t('common.processing')}</p>
          ) : payosQr ? (
            <div className="mt-4 grid gap-3 text-center">
              <p className="text-sm font-medium text-stone-700">
                {t('payment.payosScanNote')}
              </p>
              {payosCheckoutUrl ? (
                <a className="btn-secondary mx-auto min-h-11" href={payosCheckoutUrl} target="_blank" rel="noreferrer">
                  {t('payment.openPayosCheckout')}
                </a>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 grid gap-3 text-center">
              <p className="text-sm text-stone-600">
                {payosConfigured ? t('payment.qrSoon') : t('payment.payosNotConfigured')}
              </p>
              <button className="btn-secondary mx-auto min-h-11" type="button" onClick={() => createProviderPaymentRequest('vietQr')}>
                {t('payment.createPayosQr')}
              </button>
            </div>
          )}
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
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <RevealOnScroll variant="curve-right" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8">
            <p className="eyebrow">{t('common.payment')}</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-lune-ink">{t('payment.reviewConfirm')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{t('payment.mockNotice')}</p>
            <p className="mt-3 rounded-lg bg-lune-cream p-4 text-sm leading-7 text-stone-700">
              {t('payment.safetyNote')}
            </p>
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              {t('payment.securityNotice')}
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
          </RevealOnScroll>

          <RevealOnScroll variant="curve-left" delay={100}>
            <BookingSummary booking={currentBooking} className="h-fit lg:sticky lg:top-28" />
          </RevealOnScroll>
        </div>
      </div>
    </RevealOnScroll>
  );
}
