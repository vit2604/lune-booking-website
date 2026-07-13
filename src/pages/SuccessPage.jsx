import { Check, Copy, Home, Mail, ReceiptText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BookingSummary from '../components/BookingSummary.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { formatGuestBreakdown } from '../utils/booking.js';
import { formatDisplayDate } from '../utils/dateFormatUtils.js';
import { loadConfirmedBooking, saveConfirmedBooking } from '../utils/storage.js';
import { verifyPaymentWithProvider } from '../services/paymentApiService.js';

export default function SuccessPage() {
  const [booking, setBooking] = useState(null);
  const [showSummary, setShowSummary] = useState(true);
  const [copied, setCopied] = useState(false);
  const { t, currentLanguage } = useTranslation();
  useDocumentMeta({ title: `${t('success.bookingReceived')} | ${BRAND}`, path: '/success', noindex: true });

  useEffect(() => {
    const confirmed = loadConfirmedBooking();
    if (confirmed) {
      setBooking(confirmed);
      if (confirmed.paymentMethod === 'vietQr' && confirmed.bookingCode) {
        let cancelled = false;
        const verify = async (attempt = 0) => {
          try {
            const result = await verifyPaymentWithProvider(confirmed.bookingCode);
            if (cancelled) return;
            const updated = {
              ...confirmed,
              paymentStatus: result.paymentStatus || confirmed.paymentStatus,
              depositPaidAmount: result.amountPaid || 0,
              balanceAtProperty: result.balanceAmount ?? confirmed.balanceAtProperty,
            };
            setBooking(updated);
            saveConfirmedBooking(updated);
            if (result.paymentStatus !== 'PAID' && attempt < 3) window.setTimeout(() => verify(attempt + 1), 2500);
          } catch {
            if (!cancelled && attempt < 3) window.setTimeout(() => verify(attempt + 1), 2500);
          }
        };
        verify();
        return () => { cancelled = true; };
      }
    }
    return undefined;
  }, []);

  const copyCode = async () => {
    const code = booking?.bookingCode || '';
    if (!code) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const paymentMethodLabel = {
    payAtProperty: t('payment.payAtProperty'),
    'pay-at-property': t('payment.payAtProperty'),
    cashAtProperty: t('payment.cashAtProperty'),
    bankTransfer: t('payment.bankTransfer'),
    'bank-transfer': t('payment.bankTransfer'),
    vietQr: t('payment.vietQr'),
    'qr-payment': t('payment.qrPayment'),
    creditCard: t('payment.creditCard'),
    stripe: 'Stripe',
    paypal: 'PayPal',
    vnpay: 'VNPay',
    momo: 'MoMo',
    zaloPay: 'ZaloPay',
    internationalTransfer: t('payment.internationalTransfer'),
  }[booking?.paymentMethod] || booking?.paymentMethod;

  const guestName = booking?.guestInfo?.fullName || booking?.guest?.fullName;
  const statusLabel = (type, value) => {
    if (!value) return '';
    const normalized = String(value).toLowerCase();
    const key = `status.${type}.${normalized}`;
    const label = t(key);
    return label === key ? String(value).replaceAll('_', ' ') : label;
  };

  const detailRows = [
    [t('common.guestName'), guestName],
    [t('common.room'), booking?.roomName],
    [t('common.checkIn'), formatDisplayDate(booking?.checkIn, currentLanguage)],
    [t('common.checkOut'), formatDisplayDate(booking?.checkOut, currentLanguage)],
    [t('common.nights'), booking?.nights],
    [t('common.guests'), booking ? formatGuestBreakdown(booking, t) : ''],
    [t('common.selectedPaymentMethod'), paymentMethodLabel],
    [t('common.paymentStatus'), statusLabel('payment', booking?.paymentStatus)],
    [t('common.bookingStatus'), statusLabel('booking', booking?.bookingStatus)],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (!booking?.bookingCode) {
    return (
      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
            <h1 className="font-display text-4xl font-bold text-lune-ink">{t('success.noBookingTitle')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">{t('success.noBookingBody')}</p>
            <Link to="/rooms" className="btn-gold mt-6">
              {t('booking.browseRooms')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <RevealOnScroll variant="float" className="mx-auto max-w-4xl rounded-lg border border-stone-200 bg-white p-6 text-center shadow-soft sm:p-10">
          <div className="mx-auto grid h-20 w-20 animate-scaleIn place-items-center rounded-full bg-lune-sage text-white">
            <Check className="h-10 w-10" aria-hidden="true" />
          </div>
          <p className="eyebrow mt-8">{t('success.bookingReceived')}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-lune-ink sm:text-5xl">
            {t('success.received')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            {t('success.thankYou')} {t('success.contactSoon')} {t('success.contactNote')}
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-lg bg-lune-ink p-5 text-white">
            <p className="text-xs uppercase text-white/60">{t('common.bookingCode')}</p>
            <strong className="mt-2 block break-words text-2xl">{booking?.bookingCode}</strong>
            <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white" type="button" onClick={copyCode}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copied ? t('common.copied') : t('common.copyBookingCode')}
            </button>
          </div>

          {detailRows.length ? (
            <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
              {detailRows.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-lune-cream p-4">
                  <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-lune-ink">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className="btn-secondary">
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('common.backToHome')}
            </Link>
            <Link to="/contact" className="btn-secondary">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t('common.contactLune')}
            </Link>
            <button className="btn-gold" type="button" onClick={() => setShowSummary((value) => !value)}>
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              {t('common.viewSummary')}
            </button>
          </div>
        </RevealOnScroll>

        {showSummary && booking?.roomName ? (
          <RevealOnScroll variant="curve-left" className="mx-auto mt-8 max-w-md">
            <BookingSummary booking={booking} />
          </RevealOnScroll>
        ) : null}
      </div>
    </RevealOnScroll>
  );
}
