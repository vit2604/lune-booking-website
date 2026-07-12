import { CalendarDays, CreditCard, Hash, ReceiptText, Users } from 'lucide-react';
import { useCurrency } from '../i18n/useCurrency.js';
import { useTranslation } from '../i18n/useTranslation.js';
import { formatCurrency, formatGuestBreakdown } from '../utils/booking.js';
import { getApproxPriceText } from '../utils/currencyUtils.js';
import { formatDisplayDate } from '../utils/dateFormatUtils.js';

export default function BookingSummary({ booking, room, className = '' }) {
  if (!booking) return null;

  const roomName = booking.roomName || room?.name;
  const roomImage = booking.roomImage || room?.image;
  const pricePerNight = booking.pricePerNight || room?.price || 0;
  const nights = Number(booking.nights ?? 0);
  const roomSubtotal = Number(booking.roomSubtotal ?? booking.subtotal ?? nights * pricePerNight);
  const serviceFee = booking.serviceFee ?? 0;
  const total = Number(booking.total ?? booking.totalPrice ?? roomSubtotal + serviceFee);
  const cardSurcharge = Number(booking.cardSurcharge || 0);
  const depositAmount = Number(booking.depositAmount || 0);
  const balanceAtProperty = Number(booking.balanceAtProperty ?? 0);
  const grandTotal = Number(booking.grandTotal ?? total + cardSurcharge);
  const { t, currentLanguage } = useTranslation();
  const { currentCurrency } = useCurrency();
  const approxTotal = getApproxPriceText(grandTotal, currentCurrency, currentLanguage);
  const approxNight = getApproxPriceText(pricePerNight, currentCurrency, currentLanguage);
  const statusLabel = (type, value) => {
    if (!value) return '';
    const key = `status.${type}.${String(value).toLowerCase()}`;
    const label = t(key);
    return label === key ? String(value).replaceAll('_', ' ') : label;
  };
  const paymentLabelKey = {
    'pay-at-property': 'payment.payAtProperty',
    payAtProperty: 'payment.payAtProperty',
    cashAtProperty: 'payment.cashAtProperty',
    'bank-transfer': 'payment.bankTransfer',
    bankTransfer: 'payment.bankTransfer',
    'qr-payment': 'payment.qrPayment',
    qrPayment: 'payment.qrPayment',
    vietQr: 'payment.vietQr',
    creditCard: 'payment.creditCard',
    stripe: 'payment.internationalCardGateway',
    paypal: 'payment.internationalCardGateway',
    vnpay: 'payment.eWallet',
    momo: 'payment.eWallet',
    zaloPay: 'payment.eWallet',
    internationalTransfer: 'payment.internationalTransfer',
  }[booking.paymentMethod] || 'payment.payAtProperty';

  return (
    <aside className={`card overflow-hidden ${className}`}>
      {roomImage ? (
        <img src={roomImage} alt={roomName} className="h-44 w-full object-cover" />
      ) : null}
      <div className="space-y-5 p-5">
        <div>
          <p className="eyebrow">{t('common.bookingSummary')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-lune-ink">{roomName}</h2>
          <p className="mt-1 text-base text-stone-600">
            {formatCurrency(pricePerNight)} <span className="text-stone-500">{t('common.perNight')}</span>
          </p>
          {approxNight ? <p className="mt-1 text-xs text-stone-500">{approxNight}</p> : null}
        </div>

        {booking.bookingCode ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-lune-mist p-3 text-sm">
            <span className="flex items-center gap-2 text-stone-600">
              <Hash className="h-4 w-4 text-lune-sage" aria-hidden="true" />
              {t('common.bookingCode')}
            </span>
            <strong className="text-right text-lune-ink">{booking.bookingCode}</strong>
          </div>
        ) : null}

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="flex items-center gap-2 text-stone-500">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t('common.checkIn')}
            </span>
            <strong className="text-right font-semibold text-lune-ink">{formatDisplayDate(booking.checkIn, currentLanguage)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="flex items-center gap-2 text-stone-500">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t('common.checkOut')}
            </span>
            <strong className="text-right font-semibold text-lune-ink">{formatDisplayDate(booking.checkOut, currentLanguage)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="flex items-center gap-2 text-stone-500">
              <Users className="h-4 w-4" aria-hidden="true" />
              {t('common.guests')}
            </span>
            <strong className="text-right font-semibold text-lune-ink">{formatGuestBreakdown(booking, t)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="text-stone-500">{t('common.nights')}</span>
            <strong className="font-semibold text-lune-ink">{nights}</strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="text-stone-500">{t('common.pricePerNight')}</span>
            <strong className="text-right font-semibold text-lune-ink">
              {formatCurrency(pricePerNight)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="flex items-center gap-2 text-stone-500">
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              {t('common.roomSubtotal')}
            </span>
            <strong className="text-right font-semibold text-lune-ink">
              {formatCurrency(roomSubtotal)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
            <span className="text-stone-500">{t('common.serviceFee')}</span>
            <strong className="font-semibold text-lune-ink">{formatCurrency(serviceFee)}</strong>
          </div>
          {cardSurcharge > 0 ? (
            <div className="flex items-center justify-between gap-4 border-t border-stone-100 pt-3">
              <span className="text-stone-500">{t('payment.cardSurcharge')}</span>
              <strong className="font-semibold text-lune-ink">{formatCurrency(cardSurcharge)}</strong>
            </div>
          ) : null}
        </div>

        {booking.paymentMethod ? (
          <div className="grid gap-2 rounded-md bg-lune-mist p-3 text-xs font-medium text-lune-charcoal">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-lune-sage" aria-hidden="true" />
              {t(paymentLabelKey)}
            </span>
            {booking.paymentStatus ? (
              <span className="rounded-md bg-white px-2 py-1 uppercase tracking-wide text-stone-500">
                {t('common.payment')}: {statusLabel('payment', booking.paymentStatus)}
              </span>
            ) : null}
            {booking.bookingStatus ? (
              <span className="rounded-md bg-white px-2 py-1 uppercase tracking-wide text-stone-500">
                {t('common.booking')}: {statusLabel('booking', booking.bookingStatus)}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-lg bg-lune-ink p-4 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/70">{t('common.total')}</span>
            <strong className="text-xl">{formatCurrency(grandTotal)}</strong>
          </div>
          {depositAmount > 0 ? (
            <div className="mt-3 grid gap-1 border-t border-white/15 pt-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/70">{t('payment.depositAmount')}</span>
                <strong>{formatCurrency(depositAmount)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-white/70">{t('payment.balanceAtProperty')}</span>
                <strong>{formatCurrency(balanceAtProperty)}</strong>
              </div>
            </div>
          ) : null}
          {approxTotal ? <p className="mt-2 text-right text-xs text-white/70">{approxTotal}</p> : null}
        </div>
      </div>
    </aside>
  );
}
