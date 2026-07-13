import { Banknote, Building2, CheckCircle2, Copy, CreditCard, Mail, Phone, QrCode } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import { getRoomById } from '../admin/services/adminRoomService.js';
import BookingSummary from '../components/BookingSummary.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { useTranslation } from '../i18n/useTranslation.js';
import { persistBooking } from '../services/bookingService.js';
import { createPaymentWithFallback, getPaymentMethodsWithFallback } from '../services/paymentApiService.js';
import { getPaymentSettings } from '../services/paymentService.js';
import { formatCurrency, getPaymentStatus } from '../utils/booking.js';
import {
  clampDepositPercent,
  computePaymentBreakdown,
  filterPaymentChoicesForGuest,
  isVietnameseGuest,
  MIN_DEPOSIT_PERCENT,
  paymentChoices,
} from '../utils/paymentOptions.js';
import { loadBookingDraft, saveBookingDraft, saveConfirmedBooking } from '../utils/storage.js';

const choiceIcons = { cash: Banknote, card: CreditCard, deposit: Building2, payos: QrCode };

function paymentPayloadFromResult(result) {
  return result?.payment?.payment || result?.payment || null;
}

function payosCheckoutUrlFromResult(result) {
  const payload = paymentPayloadFromResult(result);
  return payload?.checkoutUrl || payload?.payos?.checkoutUrl || '';
}

function payosQrImageFromResult(result) {
  const payload = paymentPayloadFromResult(result);
  return payload?.payos?.qrImage || '';
}

function paymentMessageFromResult(result) {
  return result?.payment?.message || '';
}

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
  const [choice, setChoice] = useState('cash');
  const [depositPercent, setDepositPercent] = useState(String(MIN_DEPOSIT_PERCENT));
  const [settings, setSettings] = useState(getPaymentSettings());
  const [branding, setBranding] = useState(getBrandingSettings());
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { t } = useTranslation();
  useDocumentMeta({ title: `${t('payment.reviewConfirm')} | ${BRAND}`, path: '/payment', noindex: true });

  useEffect(() => {
    setBooking(loadBookingDraft());
    let active = true;
    const loadPaymentMethods = async () => {
      try {
        const result = await getPaymentMethodsWithFallback();
        if (active) setAvailablePaymentMethods(result.methods || []);
      } catch {
        if (active) setAvailablePaymentMethods([]);
      }
    };
    const refresh = () => {
      setSettings(getPaymentSettings());
      setBranding(getBrandingSettings());
      loadPaymentMethods();
    };
    loadPaymentMethods();
    window.addEventListener('lune:settings-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      active = false;
      window.removeEventListener('lune:settings-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const room = useMemo(() => getRoomById(booking?.roomId) || roomFromBookingDraft(booking), [booking]);
  const baseTotal = Number(booking?.total ?? booking?.totalPrice ?? 0);
  const breakdown = computePaymentBreakdown({ total: baseTotal, choice, depositPercent });
  const paymentMethodMap = useMemo(
    () => new Map(availablePaymentMethods.map((method) => [method.key || method.id, method])),
    [availablePaymentMethods],
  );
  const paymentGuestInfo = useMemo(
    () => ({
      ...(booking?.guest || {}),
      ...(booking?.guestInfo || {}),
      country: booking?.guestInfo?.country || booking?.guest?.country || booking?.country || '',
      phoneCode: booking?.guestInfo?.phoneCode || booking?.guest?.phoneCode || booking?.phoneCode || '',
    }),
    [booking],
  );
  const guestIsVietnamese = useMemo(() => isVietnameseGuest(paymentGuestInfo), [paymentGuestInfo]);
  const payosMethod = paymentMethodMap.get('vietQr');
  const depositUsesPayos =
    choice === 'deposit' &&
    guestIsVietnamese &&
    Boolean(payosMethod && payosMethod.enabled !== false && payosMethod.visibleForGuests !== false);
  const effectivePaymentMethod = depositUsesPayos ? 'vietQr' : breakdown.method;
  const isPayosFlow = effectivePaymentMethod === 'vietQr';
  const visiblePaymentChoices = useMemo(() => {
    let choices;
    if (!availablePaymentMethods.length) {
      choices = paymentChoices.filter((option) => option.method !== 'vietQr');
    } else {
      choices = paymentChoices.filter((option) => {
        const method = paymentMethodMap.get(option.method);
        return Boolean(method && method.enabled !== false && method.visibleForGuests !== false);
      });
    }
    return filterPaymentChoicesForGuest(choices, paymentGuestInfo);
  }, [availablePaymentMethods.length, paymentGuestInfo, paymentMethodMap]);

  useEffect(() => {
    if (!visiblePaymentChoices.length) return;
    if (!visiblePaymentChoices.some((option) => option.id === choice)) {
      setChoice(visiblePaymentChoices[0].id);
      setPaymentRequest(null);
    }
  }, [choice, visiblePaymentChoices]);

  if (!booking || !room) {
    return (
      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
            <h1 className="font-display text-4xl font-bold text-lune-ink">{t('booking.chooseRoomFirst')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{t('common.noRooms')}</p>
            <Link to="/rooms" className="btn-gold mt-6">
              {t('booking.browseRooms')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const bankMethod = settings.paymentMethods?.bankTransfer || {};
  const bankQrSrc = safePaymentImageSrc(bankMethod.qrImageUrl || settings.qrImageUrl);
  const contacts = [
    { icon: Phone, value: branding.phone, href: branding.phone ? `tel:${branding.phone}` : null },
    { icon: Mail, value: branding.email, href: branding.email ? `mailto:${branding.email}` : null },
    { icon: null, value: branding.zalo ? `Zalo: ${branding.zalo}` : '', href: branding.zalo ? `https://zalo.me/${branding.zalo}` : null },
  ].filter((item) => item.value);

  const currentBooking = {
    ...booking,
    paymentChoice: choice,
    paymentMethod: effectivePaymentMethod,
    paymentStatus: getPaymentStatus(effectivePaymentMethod),
    cardSurcharge: breakdown.surcharge,
    depositPercent: breakdown.depositPercent,
    depositAmount: breakdown.depositAmount,
    balanceAtProperty: breakdown.balanceAtProperty,
    grandTotal: breakdown.grandTotal,
  };

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(`${label} ${t('common.copied')}`);
    } catch {
      setCopied(t('common.copied'));
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    setPaymentRequest(null);
    const confirmed = {
      ...booking,
      roomId: booking.roomId || room.id,
      roomName: booking.roomName || room.name,
      roomImage: booking.roomImage || room.image,
      pricePerNight: Number(booking.pricePerNight || room.price || room.basePrice || 0),
      total: baseTotal,
      totalPrice: baseTotal,
      guests: Number(booking.guests || 1),
      adults: Number(booking.adults || booking.guests || 1),
      children: Number(booking.children || 0),
      paymentChoice: choice,
      paymentMethod: effectivePaymentMethod,
      paymentStatus: getPaymentStatus(effectivePaymentMethod),
      cardSurcharge: breakdown.surcharge,
      depositPercent: breakdown.depositPercent,
      depositAmount: breakdown.depositAmount,
      balanceAtProperty: breakdown.balanceAtProperty,
      grandTotal: breakdown.grandTotal,
      bookingStatus: booking.bookingStatus || 'received',
      createdAt: booking.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      let paymentResult = null;
      if (booking.bookingCode) {
        paymentResult = await createPaymentWithFallback(booking.bookingCode, effectivePaymentMethod, {
          amount: choice === 'deposit' ? breakdown.depositAmount : breakdown.dueNow || breakdown.grandTotal,
          paymentPurpose: choice === 'deposit' ? 'deposit' : 'full',
          depositPercent: choice === 'deposit' ? breakdown.depositPercent : undefined,
          balanceAmount: choice === 'deposit' ? breakdown.balanceAtProperty : undefined,
          grandTotal: breakdown.grandTotal,
        });
      } else if (isPayosFlow) {
        throw new Error(t('payment.payosNotConfigured'));
      }

      if (isPayosFlow) {
        setPaymentRequest(paymentResult);
        const checkoutUrl = payosCheckoutUrlFromResult(paymentResult);
        if (!checkoutUrl) {
          throw new Error(paymentMessageFromResult(paymentResult) || t('payment.payosNotConfigured'));
        }
        const confirmedWithPayos = {
          ...confirmed,
          paymentStatus: paymentResult?.payment?.paymentStatus || confirmed.paymentStatus,
          bookingStatus: paymentResult?.payment?.bookingStatus || confirmed.bookingStatus,
          payosCheckoutUrl: checkoutUrl,
          payosQrImage: payosQrImageFromResult(paymentResult),
        };
        saveConfirmedBooking(confirmedWithPayos);
        saveBookingDraft(confirmedWithPayos);
        persistBooking(confirmedWithPayos);
        window.location.assign(checkoutUrl);
        return;
      }

      const confirmedBooking = {
        ...confirmed,
        paymentStatus: paymentResult?.payment?.paymentStatus || confirmed.paymentStatus,
        bookingStatus: paymentResult?.payment?.bookingStatus || confirmed.bookingStatus,
      };
      saveConfirmedBooking(confirmedBooking);
      saveBookingDraft(confirmedBooking);
      persistBooking(confirmedBooking);
      navigate('/success');
    } catch (paymentError) {
      setError(paymentError?.message || t('payment.payosNotConfigured'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <RevealOnScroll variant="curve-right" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8">
            <p className="eyebrow">{t('common.payment')}</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-lune-ink">{t('payment.reviewConfirm')}</h1>
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              {t('payment.securityNotice')}
            </p>

            <div className="mt-6">
              <TrustBadges compact />
            </div>

            <fieldset className="mt-8">
              <legend className="label">{t('payment.choosePayment')}</legend>
              <div className="mt-2 grid gap-3">
                {visiblePaymentChoices.map((option) => {
                  const Icon = choiceIcons[option.id];
                  const active = choice === option.id;
                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition ${
                        active ? 'border-lune-gold bg-lune-cream' : 'border-stone-200 bg-white hover:border-lune-gold/60'
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="paymentChoice"
                        value={option.id}
                        checked={active}
                        onChange={() => {
                          setChoice(option.id);
                          setPaymentRequest(null);
                          setError('');
                        }}
                      />
                      <span className="mt-0.5 rounded-md bg-white p-2 text-lune-goldDark shadow-sm">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-lune-ink">{t(option.labelKey)}</span>
                        <span className="mt-1 block text-xs leading-5 text-stone-500">{t(option.descKey)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {choice === 'card' ? (
              <div className="mt-6 flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-5 text-sm leading-7 text-stone-600">
                <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <div>
                  <p>{t('payment.cardNote')}</p>
                  <dl className="mt-3 grid gap-1">
                    <div className="flex justify-between gap-4">
                      <dt className="text-stone-500">{t('payment.cardSurcharge')}</dt>
                      <dd className="font-semibold text-lune-ink">{formatCurrency(breakdown.surcharge)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="font-semibold text-lune-ink">{t('payment.grandTotal')}</dt>
                      <dd className="font-bold text-lune-ink">{formatCurrency(breakdown.grandTotal)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : null}

            {choice === 'deposit' ? (
              <div className="mt-6 rounded-lg border border-lune-gold/30 bg-lune-cream p-5">
                <label className="block">
                  <span className="label">{t('payment.depositPercentLabel')}</span>
                  <div className="flex items-center gap-2">
                    <input
                      className="input-field max-w-[120px]"
                      type="number"
                      min={MIN_DEPOSIT_PERCENT}
                      max={100}
                      step={5}
                      value={depositPercent}
                      onChange={(event) => setDepositPercent(event.target.value)}
                      onBlur={() => setDepositPercent(String(clampDepositPercent(depositPercent)))}
                    />
                    <span className="text-sm font-semibold text-stone-600">%</span>
                  </div>
                </label>

                <dl className="mt-4 grid gap-2 rounded-md bg-white p-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">{t('payment.depositAmount')}</dt>
                    <dd className="font-bold text-lune-ink">{formatCurrency(breakdown.depositAmount)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t border-stone-100 pt-2">
                    <dt className="text-stone-500">{t('payment.balanceAtProperty')}</dt>
                    <dd className="font-semibold text-lune-ink">{formatCurrency(breakdown.balanceAtProperty)}</dd>
                  </div>
                </dl>

                {!guestIsVietnamese ? (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                    {t('payment.foreignBankingNote')}
                  </p>
                ) : null}
                {depositUsesPayos ? (
                  <div className="mt-4 rounded-md border border-stone-200 bg-white p-4 text-sm leading-6 text-stone-700">
                    <div className="flex items-start gap-3">
                      <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                      <p>{t('payment.depositPayosInstruction')}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-4 text-sm leading-6 text-stone-700">{t('payment.transferInstruction')}</p>
                    <dl className="mt-3 grid gap-3 text-sm">
                      <div className="rounded-md bg-white p-3">
                        <dt className="text-stone-500">{t('payment.bankName')}</dt>
                        <dd className="mt-1 font-semibold text-lune-ink">{bankMethod.bankName || 'PLACEHOLDER_BANK_NAME'}</dd>
                      </div>
                      <div className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <dt className="text-stone-500">{t('payment.accountNumber')}</dt>
                          <dd className="mt-1 break-all font-semibold text-lune-ink">
                            {bankMethod.accountNumber || 'PLACEHOLDER_ACCOUNT_NUMBER'}
                          </dd>
                        </div>
                        <button
                          className="btn-secondary min-h-10 px-3 py-2"
                          type="button"
                          onClick={() => copyText(t('payment.accountNumber'), bankMethod.accountNumber || '')}
                        >
                          <Copy className="h-4 w-4" aria-hidden="true" />
                          {t('payment.copy')}
                        </button>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <dt className="text-stone-500">{t('payment.accountHolder')}</dt>
                        <dd className="mt-1 font-semibold text-lune-ink">{bankMethod.accountHolder || 'LUNE BOUTIQUE HOTEL'}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 grid place-items-center rounded-lg bg-white p-5">
                      {bankQrSrc ? (
                        <img src={bankQrSrc} alt={t('payment.qrPlaceholder')} className="h-56 w-56 rounded-md object-contain" />
                      ) : (
                        <div className="grid h-56 w-56 max-w-full place-items-center rounded-md border border-dashed border-stone-300 bg-lune-cream">
                          <QrCode className="h-20 w-20 text-lune-goldDark" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {choice === 'payos' ? (
              <div className="mt-6 rounded-lg border border-lune-gold/30 bg-lune-cream p-5">
                <div className="flex items-start gap-3 text-sm leading-7 text-stone-700">
                  <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                  <div>
                    <p>{t('payment.payosScanNote')}</p>
                    <p className="mt-2 font-semibold text-lune-ink">{formatCurrency(breakdown.dueNow)}</p>
                  </div>
                </div>
                {payosQrImageFromResult(paymentRequest) ? (
                  <div className="mt-4 grid place-items-center rounded-lg bg-white p-5">
                    <img
                      src={payosQrImageFromResult(paymentRequest)}
                      alt={t('payment.vietQr')}
                      className="h-56 w-56 rounded-md object-contain"
                    />
                  </div>
                ) : null}
                {payosCheckoutUrlFromResult(paymentRequest) ? (
                  <a
                    className="btn-secondary mt-4 w-full justify-center sm:w-auto"
                    href={payosCheckoutUrlFromResult(paymentRequest)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('payment.openPayosCheckout')}
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-lune-ink">
                <CheckCircle2 className="h-5 w-5 text-lune-sage" aria-hidden="true" />
                {t('payment.cancelTitle')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{t('payment.cancelNote')}</p>
              <ul className="mt-3 grid gap-2 text-sm">
                {contacts.map((item) => (
                  <li key={item.value} className="flex items-center gap-2 text-lune-ink">
                    {item.icon ? <item.icon className="h-4 w-4 text-lune-goldDark" aria-hidden="true" /> : null}
                    {item.href ? (
                      <a className="font-semibold hover:text-lune-goldDark" href={item.href} target="_blank" rel="noreferrer">
                        {item.value}
                      </a>
                    ) : (
                      <span className="font-semibold">{item.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {copied ? <p className="mt-4 text-sm font-medium text-green-700">{copied}</p> : null}
            {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

            <button className="btn-gold mt-8 w-full sm:w-auto" type="button" disabled={confirming} onClick={handleConfirm}>
              {confirming
                ? t('common.confirming')
                : isPayosFlow
                  ? t(choice === 'deposit' ? 'payment.confirmDeposit' : 'payment.confirmPayment')
                  : t('payment.confirmBooking')}
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
