import { ArrowRight, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoomById } from '../admin/services/adminRoomService.js';
import { getBookings } from '../admin/services/adminBookingService.js';
import BookingPolicy from '../components/BookingPolicy.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import DateSelector from '../components/DateSelector.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { createBookingWithFallback } from '../services/bookingApiService.js';
import {
  getPhoneVerificationConfig,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '../services/phoneVerificationApiService.js';
import { buildBookingDraft, hasPricedBookingDraft, validateStay } from '../utils/booking.js';
import { validateBookingDates } from '../utils/bookingAvailabilityUtils.js';
import { loadBookingDraft, saveBookingDraft } from '../utils/storage.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCodes = [
  '+84 Vietnam',
  '+82 South Korea',
  '+86 China',
  '+886 Taiwan',
  '+81 Japan',
  '+66 Thailand',
  '+7 Russia',
  '+33 France',
  '+49 Germany',
  '+34 Spain',
  '+39 Italy',
  '+62 Indonesia',
  '+60 Malaysia',
  '+65 Singapore',
  '+61 Australia',
  '+44 United Kingdom',
  '+1 United States/Canada',
  '+971 UAE',
  '+91 India',
  'Other',
];
const countries = [
  'Vietnam',
  'South Korea',
  'China',
  'Taiwan',
  'Japan',
  'Thailand',
  'Russia',
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Indonesia',
  'Malaysia',
  'Singapore',
  'Australia',
  'United Kingdom',
  'United States',
  'United Arab Emirates',
  'India',
  'Other',
];

function getPhoneKey({ phoneCode, phone }) {
  return `${phoneCode || ''}|${phone || ''}`;
}

function roomFromBookingDraft(booking) {
  if (!booking?.roomId) return null;
  const priceSummary =
    booking.priceSummary ||
    (hasPricedBookingDraft(booking)
      ? {
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: Number(booking.guests || 1),
          nights: Number(booking.nights || 0),
          pricePerNight: Number(booking.pricePerNight || 0),
          subtotal: Number(booking.roomSubtotal ?? booking.subtotal ?? 0),
          serviceFee: Number(booking.serviceFee || 0),
          totalPrice: Number(booking.totalPrice ?? booking.total ?? 0),
          nightlyRates: booking.nightlyRates || [],
          source: booking.source || 'booking-draft',
        }
      : null);
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
    availabilityRules: { minNights: 1, maxNights: 30 },
    priceSummary,
  };
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneCode: '+84 Vietnam',
    phone: '',
    country: 'Vietnam',
    arrivalTime: '',
    specialRequest: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneVerificationConfig, setPhoneVerificationConfig] = useState({
    enabled: false,
    required: false,
    codeLength: 6,
    resendSeconds: 60,
  });
  const [phoneVerification, setPhoneVerification] = useState({
    challengeId: '',
    code: '',
    token: '',
    phoneKey: '',
    status: 'idle',
    message: '',
    error: '',
  });
  const { t } = useTranslation();
  useDocumentMeta({ title: `${t('booking.completeBooking')} | ${BRAND}`, path: '/booking', noindex: true });

  useEffect(() => {
    const draft = loadBookingDraft();
    if (!draft) return;

    const draftRoom = getRoomById(draft.roomId);
    const upgradedDraft = draftRoom && !hasPricedBookingDraft(draft)
      ? buildBookingDraft({
          room: draftRoom,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          guests: draft.guests,
          guestInfo: draft.guestInfo,
          paymentMethod: draft.paymentMethod,
          bookingCode: draft.bookingCode,
          bookingStatus: draft.bookingStatus,
        })
      : draft;

    setBooking(upgradedDraft);
    if (upgradedDraft?.guestInfo) setForm(upgradedDraft.guestInfo);
  }, []);

  useEffect(() => {
    getPhoneVerificationConfig()
      .then((config) => setPhoneVerificationConfig((current) => ({ ...current, ...config })))
      .catch(() => {});
  }, []);

  const room = useMemo(() => {
    const draftRoom = roomFromBookingDraft(booking);
    if (draftRoom && hasPricedBookingDraft(booking)) return draftRoom;
    return getRoomById(booking?.roomId) || draftRoom;
  }, [booking]);

  if (!booking || !room) {
    return (
      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-soft">
            <h1 className="font-display text-4xl font-bold text-lune-ink">{t('booking.chooseRoomFirst')}</h1>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              {t('common.noRooms')}
            </p>
            <Link to="/rooms" className="btn-gold mt-6">
              {t('booking.browseRooms')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'phone' || field === 'phoneCode') {
      setPhoneVerification((current) => ({
        ...current,
        challengeId: '',
        code: '',
        token: '',
        phoneKey: '',
        status: 'idle',
        message: '',
        error: '',
      }));
      setErrors((current) => ({ ...current, phoneVerification: undefined }));
    }
  };

  const updateStay = (changes) => {
    setBooking((current) => ({ ...current, ...changes }));
    setErrors((current) => ({
      ...current,
      checkIn: undefined,
      checkOut: undefined,
      guests: undefined,
    }));
  };

  const validate = () => {
    const nextErrors = validateStay({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      maxGuests: room.maxGuests,
      messages: {
        checkInRequired: t('errors.checkInRequired'),
        checkOutRequired: t('errors.checkOutRequired'),
        checkoutAfterCheckin: t('errors.checkoutAfterCheckin'),
        guestsRequired: t('errors.guestsRequired'),
        guestsMax: t('errors.guestsMax', { max: room.maxGuests }),
        checkInPast: t('errors.checkInPast'),
      },
    });

    const availability = validateBookingDates({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      room,
      existingBookings: getBookings().filter((item) => item.bookingCode !== booking.bookingCode),
      messages: {
        checkInRequired: t('errors.checkInRequired'),
        checkOutRequired: t('errors.checkOutRequired'),
        checkInPast: t('errors.checkInPast'),
        checkoutAfterCheckin: t('errors.checkoutAfterCheckin'),
        minNights: t('errors.minNights', { n: room.availabilityRules?.minNights || 1 }),
        maxNights: t('errors.maxNights', { n: room.availabilityRules?.maxNights || 30 }),
        notAvailable: t('errors.roomUnavailable'),
      },
    });
    Object.assign(nextErrors, availability.errors);

    if (!form.fullName.trim()) nextErrors.fullName = t('errors.fullNameRequired');
    if (!emailPattern.test(form.email)) nextErrors.email = t('errors.emailInvalid');
    if (!form.phoneCode) nextErrors.phone = t('errors.phoneCodeRequired');
    if (!form.phone.trim()) nextErrors.phone = t('errors.phoneRequired');
    if (form.phone.trim() && /^[\p{L}\s]+$/u.test(form.phone.trim())) {
      nextErrors.phone = t('errors.phoneInvalid');
    }
    if (
      phoneVerificationConfig.required &&
      (!phoneVerification.token || phoneVerification.phoneKey !== getPhoneKey(form))
    ) {
      nextErrors.phoneVerification = 'Please verify your phone number before continuing.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const requestOtp = async () => {
    if (!form.phoneCode || !form.phone.trim()) {
      setErrors((current) => ({ ...current, phone: t('errors.phoneRequired') }));
      return;
    }
    setPhoneVerification((current) => ({ ...current, status: 'sending', error: '', message: '' }));
    try {
      const result = await requestPhoneOtp({
        phoneCode: form.phoneCode,
        phoneNumber: form.phone,
      });
      setPhoneVerification((current) => ({
        ...current,
        challengeId: result.challengeId || '',
        code: result.debugCode || '',
        token: '',
        phoneKey: getPhoneKey(form),
        status: 'sent',
        message: result.debugCode
          ? `Development OTP: ${result.debugCode}`
          : 'OTP sent. Please check your phone.',
        error: '',
      }));
    } catch (error) {
      setPhoneVerification((current) => ({
        ...current,
        status: 'error',
        error: error.message || 'Could not send OTP. Please try again.',
        message: '',
      }));
    }
  };

  const verifyOtp = async () => {
    const code = phoneVerification.code.trim();
    if (!code) {
      setPhoneVerification((current) => ({ ...current, error: 'Please enter the OTP code.' }));
      return;
    }
    setPhoneVerification((current) => ({ ...current, status: 'verifying', error: '', message: '' }));
    try {
      const result = await verifyPhoneOtp({
        phoneCode: form.phoneCode,
        phoneNumber: form.phone,
        challengeId: phoneVerification.challengeId,
        code,
      });
      setPhoneVerification((current) => ({
        ...current,
        token: result.verificationToken || '',
        phoneKey: getPhoneKey(form),
        status: 'verified',
        message: 'Phone number verified.',
        error: '',
      }));
      setErrors((current) => ({ ...current, phoneVerification: undefined }));
    } catch (error) {
      setPhoneVerification((current) => ({
        ...current,
        status: 'error',
        token: '',
        error: error.message || 'Could not verify OTP. Please try again.',
        message: '',
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    const updatedBooking = buildBookingDraft({
      room,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      guestInfo: form,
      paymentMethod: booking.paymentMethod || 'payAtProperty',
      bookingCode: booking.bookingCode,
      bookingStatus: booking.bookingStatus,
    });
    updatedBooking.phoneVerificationToken = phoneVerification.token || undefined;
    try {
      const { booking: savedBooking } = await createBookingWithFallback(updatedBooking);
      saveBookingDraft(savedBooking);
      navigate('/payment');
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit: error.message || t('errors.roomUnavailable'),
      }));
      setIsSubmitting(false);
    }
  };

  const previewBooking = buildBookingDraft({
    room,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    guestInfo: form,
    paymentMethod: booking.paymentMethod || 'payAtProperty',
    bookingCode: booking.bookingCode,
    bookingStatus: booking.bookingStatus,
  });

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <RevealOnScroll as="form" variant="curve-right" className="rounded-lg border border-stone-200 bg-white p-5 shadow-soft sm:p-8" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-lune-ink text-white">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">{t('booking.guestDetails')}</p>
                <h1 className="font-display text-4xl font-bold text-lune-ink">{t('booking.completeBooking')}</h1>
              </div>
            </div>

            <div className="mt-6">
              <TrustBadges compact />
            </div>

            <div className="mt-8 rounded-lg border border-stone-200 bg-lune-cream p-4">
              <DateSelector
                checkIn={booking.checkIn}
                checkOut={booking.checkOut}
                guests={booking.guests}
                maxGuests={room.maxGuests}
                onChange={updateStay}
              />
            {errors.checkIn || errors.checkOut || errors.guests ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {[errors.checkIn, errors.checkOut, errors.guests].filter(Boolean).map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}
              {errors.submit ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errors.submit}
                </div>
              ) : null}
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="label">{t('booking.fullName')}</span>
                <input
                  className="input-field"
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateForm('fullName', event.target.value)}
                  placeholder="Nguyen Van A"
                />
                {errors.fullName ? <p className="mt-2 text-xs text-red-600">{errors.fullName}</p> : null}
              </label>
              <label>
                <span className="label">{t('booking.email')}</span>
                <input
                  className="input-field"
                  type="text"
                  inputMode="email"
                  value={form.email}
                  onChange={(event) => updateForm('email', event.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email ? <p className="mt-2 text-xs text-red-600">{errors.email}</p> : null}
              </label>
              <label>
                <span className="label">{t('booking.phone')}</span>
                <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                  <select className="input-field" value={form.phoneCode} onChange={(event) => updateForm('phoneCode', event.target.value)}>
                    {phoneCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <input
                    className="input-field"
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateForm('phone', event.target.value)}
                    placeholder="901234567"
                  />
                </div>
                {errors.phone ? <p className="mt-2 text-xs text-red-600">{errors.phone}</p> : null}
                {phoneVerificationConfig.enabled || phoneVerificationConfig.required ? (
                  <div className="mt-3 rounded-lg border border-stone-200 bg-lune-cream p-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        className="btn-secondary min-h-11 shrink-0 px-4"
                        type="button"
                        disabled={!phoneVerificationConfig.enabled || phoneVerification.status === 'sending'}
                        onClick={requestOtp}
                      >
                        {phoneVerification.status === 'sending' ? t('common.processing') : 'Send OTP'}
                      </button>
                      <input
                        className="input-field min-h-11 flex-1"
                        inputMode="numeric"
                        maxLength={phoneVerificationConfig.codeLength || 6}
                        value={phoneVerification.code}
                        onChange={(event) =>
                          setPhoneVerification((current) => ({
                            ...current,
                            code: event.target.value.replace(/\D/g, '').slice(0, phoneVerificationConfig.codeLength || 6),
                            error: '',
                          }))
                        }
                        placeholder="OTP code"
                      />
                      <button
                        className="btn-gold min-h-11 shrink-0 px-4"
                        type="button"
                        disabled={
                          phoneVerification.status === 'verifying' ||
                          !phoneVerification.challengeId ||
                          phoneVerification.status === 'verified'
                        }
                        onClick={verifyOtp}
                      >
                        {phoneVerification.status === 'verified' ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                    {!phoneVerificationConfig.enabled ? (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Phone OTP is required but SMS is not configured yet.
                      </p>
                    ) : null}
                    {phoneVerification.message ? (
                      <p className="mt-2 text-xs font-medium text-green-700">{phoneVerification.message}</p>
                    ) : null}
                    {phoneVerification.error || errors.phoneVerification ? (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {phoneVerification.error || errors.phoneVerification}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </label>
              <label>
                <span className="label">{t('booking.country')}</span>
                <select className="input-field" value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label>
                <span className="label">{t('booking.arrivalTime')}</span>
                <input className="input-field" type="time" value={form.arrivalTime} onChange={(event) => updateForm('arrivalTime', event.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{t('booking.specialRequest')}</span>
                <textarea
                  className="input-field min-h-32 resize-y"
                  value={form.specialRequest}
                  onChange={(event) => updateForm('specialRequest', event.target.value)}
                  placeholder={t('booking.specialPlaceholder')}
                />
              </label>
            </div>

            <div className="mt-8">
              <BookingPolicy compact />
            </div>

            <button
              className="btn-gold mt-8 w-full sm:w-auto"
              type="submit"
              disabled={isSubmitting || (phoneVerificationConfig.required && !phoneVerification.token)}
            >
              {isSubmitting ? t('common.processing') : t('booking.continueToPayment')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </RevealOnScroll>

          <RevealOnScroll variant="curve-left" delay={100}>
            <BookingSummary booking={previewBooking} className="h-fit lg:sticky lg:top-28" />
          </RevealOnScroll>
        </div>
      </div>
    </RevealOnScroll>
  );
}
