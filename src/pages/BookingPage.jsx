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
import { createBookingWithFallback } from '../services/bookingApiService.js';
import { buildBookingDraft, validateStay } from '../utils/booking.js';
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
    availabilityRules: { minNights: 1, maxNights: 30 },
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
    nationality: '',
    arrivalTime: '',
    specialRequest: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const draft = loadBookingDraft();
    if (!draft) return;

    const draftRoom = getRoomById(draft.roomId);
    const upgradedDraft = draftRoom
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

  const room = useMemo(() => getRoomById(booking?.roomId) || roomFromBookingDraft(booking), [booking]);

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
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
              </label>
              <label>
                <span className="label">{t('booking.country')}</span>
                <select className="input-field" value={form.country} onChange={(event) => updateForm('country', event.target.value)}>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label>
                <span className="label">{t('booking.nationality')}</span>
                <input className="input-field" value={form.nationality} onChange={(event) => updateForm('nationality', event.target.value)} />
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

            <button className="btn-gold mt-8 w-full sm:w-auto" type="submit" disabled={isSubmitting}>
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
