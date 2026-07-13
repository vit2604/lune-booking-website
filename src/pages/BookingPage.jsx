import { ArrowRight, Minus, Plus, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRoomById } from '../admin/services/adminRoomService.js';
import BookingPolicy from '../components/BookingPolicy.jsx';
import BookingSummary from '../components/BookingSummary.jsx';
import DateSelector from '../components/DateSelector.jsx';
import TrustBadges from '../components/TrustBadges.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { createBookingWithFallback } from '../services/bookingApiService.js';
import { fetchRoomsWithFallback, fetchRoomWithFallback } from '../services/roomApiService.js';
import {
  getPhoneVerificationConfig,
  requestPhoneOtp,
  verifyPhoneOtp,
} from '../services/phoneVerificationApiService.js';
import {
  buildBookingDraft,
  formatCurrency,
  hasPricedBookingDraft,
  MAX_ROOMS_PER_BOOKING,
  validateStay,
} from '../utils/booking.js';
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
  const primary = booking.rooms?.[0] || booking;
  const priceSummary =
    primary.priceSummary ||
    (hasPricedBookingDraft(booking)
      ? {
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: Number(primary.guests || 1),
          adults: Number(primary.adults || primary.guests || 1),
          children: Number(primary.children || 0),
          nights: Number(booking.nights || 0),
          pricePerNight: Number(primary.pricePerNight || 0),
          subtotal: Number(primary.unitSubtotal ?? primary.subtotal ?? 0),
          serviceFee: Number(primary.unitServiceFee ?? primary.serviceFee ?? 0),
          taxAmount: Number(primary.unitTaxAmount ?? primary.taxAmount ?? 0),
          totalPrice: Number(primary.unitTotalPrice ?? primary.totalPrice ?? 0),
          nightlyRates: primary.nightlyRates || [],
          source: booking.source || 'booking-draft',
        }
      : null);
  return {
    id: primary.roomId || booking.roomId,
    slug: primary.roomId || booking.roomId,
    name: primary.roomName || booking.roomName,
    price: Number(primary.pricePerNight || booking.pricePerNight || 0),
    basePrice: Number(primary.pricePerNight || booking.pricePerNight || 0),
    maxGuests: Number(primary.maxGuests || booking.maxGuests || primary.guests || 1),
    availableQuantity: Number(primary.availableQuantity || 1),
    image: primary.roomImage || booking.roomImage || '',
    gallery: primary.roomImage ? [primary.roomImage] : [],
    type: primary.roomType || booking.roomType || 'Apartment',
    size: primary.size || booking.size || '',
    bed: primary.bed || booking.bed || '',
    amenities: [],
    availabilityRules: { minNights: 1, maxNights: 30 },
    priceSummary,
  };
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomToAdd, setRoomToAdd] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
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
  const { t, currentLanguage } = useTranslation();
  useDocumentMeta({ title: `${t('booking.completeBooking')} | ${BRAND}`, path: '/booking', noindex: true });

  useEffect(() => {
    const draft = loadBookingDraft();
    if (!draft) return;

    const draftRoom = getRoomById(draft.roomId) || roomFromBookingDraft(draft);
    const upgradedDraft = draftRoom && (!draft.rooms?.length || !hasPricedBookingDraft(draft))
      ? buildBookingDraft({
          room: draftRoom,
          quantity: draft.quantity || 1,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          guests: draft.guests,
          adults: draft.adults,
          children: draft.children,
          guestInfo: draft.guestInfo,
          paymentMethod: draft.paymentMethod,
          bookingCode: draft.bookingCode,
          bookingStatus: draft.bookingStatus,
        })
      : draft;

    setBooking(upgradedDraft);
    if (upgradedDraft?.guestInfo) setForm(upgradedDraft.guestInfo);
  }, []);

  const roomOccupancyKey = (booking?.rooms || [])
    .map((item) => `${item.roomId}:${item.adults}:${item.children}`)
    .join('|');

  useEffect(() => {
    if (!booking?.checkIn || !booking?.checkOut || !booking?.rooms?.length) return undefined;
    let ignore = false;
    const refreshRooms = async () => {
      setIsLoadingRooms(true);
      try {
        const listPromise = fetchRoomsWithFallback({
          lang: currentLanguage,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: 1,
          adults: 1,
          children: 0,
        });
        const detailPromises = booking.rooms.map((item) =>
          fetchRoomWithFallback(item.roomId, {
            lang: currentLanguage,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: item.guests,
            adults: item.adults,
            children: item.children,
          }),
        );
        const [listResult, ...detailResults] = await Promise.all([listPromise, ...detailPromises]);
        if (ignore) return;
        setAvailableRooms(listResult.rooms || []);
        setBooking((current) => {
          if (!current || current.checkIn !== booking.checkIn || current.checkOut !== booking.checkOut) return current;
          const refreshedItems = current.rooms.map((item, index) => {
            const refreshedRoom = detailResults[index]?.room;
            return refreshedRoom
              ? {
                  room: refreshedRoom,
                  quantity: item.quantity,
                  adults: item.adults,
                  children: item.children,
                  guests: item.guests,
                }
              : item;
          });
          return buildBookingDraft({
            roomItems: refreshedItems,
            checkIn: current.checkIn,
            checkOut: current.checkOut,
            guestInfo: current.guestInfo,
            paymentMethod: current.paymentMethod,
            bookingCode: current.bookingCode,
            bookingStatus: current.bookingStatus,
          });
        });
      } catch (error) {
        if (!ignore) setErrors((current) => ({ ...current, rooms: error.message || 'Could not refresh room availability.' }));
      } finally {
        if (!ignore) setIsLoadingRooms(false);
      }
    };
    refreshRooms();
    return () => {
      ignore = true;
    };
  }, [booking?.checkIn, booking?.checkOut, currentLanguage, roomOccupancyKey]);

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

  const rebuildBooking = (current, roomItems, changes = {}) => buildBookingDraft({
    roomItems,
    checkIn: changes.checkIn ?? current.checkIn,
    checkOut: changes.checkOut ?? current.checkOut,
    guestInfo: current.guestInfo,
    paymentMethod: current.paymentMethod,
    bookingCode: current.bookingCode,
    bookingStatus: current.bookingStatus,
  });

  const updateStay = (changes) => {
    setBooking((current) => rebuildBooking(current, current.rooms, changes));
    setErrors((current) => ({
      ...current,
      checkIn: undefined,
      checkOut: undefined,
      guests: undefined,
    }));
  };

  const updateRoomItem = (index, changes) => {
    setBooking((current) => {
      const nextItems = current.rooms.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item));
      return rebuildBooking(current, nextItems);
    });
    setErrors((current) => ({ ...current, rooms: undefined, submit: undefined }));
  };

  const removeRoomItem = (index) => {
    setBooking((current) => {
      if (current.rooms.length <= 1) return current;
      return rebuildBooking(current, current.rooms.filter((_, itemIndex) => itemIndex !== index));
    });
  };

  const addRoomItem = () => {
    const selectedRoom = availableRooms.find((item) => item.id === roomToAdd);
    if (!selectedRoom || booking.totalRooms >= MAX_ROOMS_PER_BOOKING) return;
    setBooking((current) => rebuildBooking(current, [
      ...current.rooms,
      {
        room: selectedRoom,
        quantity: 1,
        adults: Math.min(2, Number(selectedRoom.maxGuests || 1)),
        children: 0,
      },
    ]));
    setRoomToAdd('');
    setErrors((current) => ({ ...current, rooms: undefined }));
  };

  const validate = () => {
    const nextErrors = validateStay({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: 1,
      maxGuests: 999,
      messages: {
        checkInRequired: t('errors.checkInRequired'),
        checkOutRequired: t('errors.checkOutRequired'),
        checkoutAfterCheckin: t('errors.checkoutAfterCheckin'),
        guestsRequired: t('errors.guestsRequired'),
        guestsMax: t('errors.guestsMax', { max: 999 }),
        checkInPast: t('errors.checkInPast'),
      },
    });

    if (!booking.rooms?.length || booking.totalRooms > MAX_ROOMS_PER_BOOKING) {
      nextErrors.rooms = `A booking can contain at most ${MAX_ROOMS_PER_BOOKING} rooms.`;
    }
    (booking.rooms || []).forEach((item) => {
      const itemRoom = availableRooms.find((candidate) => candidate.id === item.roomId) || {
        id: item.roomId,
        maxGuests: item.maxGuests,
        status: 'active',
        availabilityRules: { minNights: 1, maxNights: 30 },
        blockedDates: [],
      };
      const guestErrors = validateStay({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: item.guests,
        maxGuests: item.maxGuests,
        messages: {
          guestsRequired: t('errors.guestsRequired'),
          guestsMax: t('errors.guestsMax', { max: item.maxGuests }),
        },
      });
      const availability = validateBookingDates({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        room: itemRoom,
        existingBookings: [],
        messages: {
          checkInRequired: t('errors.checkInRequired'),
          checkOutRequired: t('errors.checkOutRequired'),
          checkInPast: t('errors.checkInPast'),
          checkoutAfterCheckin: t('errors.checkoutAfterCheckin'),
          minNights: t('errors.minNights', { n: itemRoom.availabilityRules?.minNights || 1 }),
          maxNights: t('errors.maxNights', { n: itemRoom.availabilityRules?.maxNights || 30 }),
          notAvailable: t('errors.roomUnavailable'),
        },
      });
      if (guestErrors.guests || Object.keys(availability.errors).length) {
        nextErrors.rooms = guestErrors.guests || Object.values(availability.errors)[0];
      }
      if (item.quantity > Number(item.availableQuantity ?? MAX_ROOMS_PER_BOOKING)) {
        nextErrors.rooms = t('errors.notEnoughRooms', { count: item.availableQuantity ?? 0 });
      }
    });

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
      roomItems: booking.rooms,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
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
    roomItems: booking.rooms,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guestInfo: form,
    paymentMethod: booking.paymentMethod || 'payAtProperty',
    bookingCode: booking.bookingCode,
    bookingStatus: booking.bookingStatus,
  });
  const selectedRoomIds = new Set(booking.rooms.map((item) => item.roomId));
  const availableRoomChoices = availableRooms.filter((item) => !selectedRoomIds.has(item.id));

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
                adults={booking.adults}
                children={booking.children}
                maxGuests={room.maxGuests}
                onChange={updateStay}
                showGuests={false}
              />
            {errors.checkIn || errors.checkOut || errors.guests || errors.rooms ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {[errors.checkIn, errors.checkOut, errors.guests, errors.rooms].filter(Boolean).map((message) => (
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

            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">{t('common.roomsLabel')}</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-lune-ink">
                    {booking.totalRooms} / {MAX_ROOMS_PER_BOOKING}
                  </h2>
                </div>
                {isLoadingRooms ? <span className="text-xs font-medium text-stone-500">{t('common.processing')}</span> : null}
              </div>

              <div className="mt-4 border-y border-stone-200">
                {booking.rooms.map((item, index) => {
                  const otherRooms = booking.totalRooms - item.quantity;
                  const maxQuantity = Math.max(
                    1,
                    Math.min(Number(item.availableQuantity ?? MAX_ROOMS_PER_BOOKING), MAX_ROOMS_PER_BOOKING - otherRooms),
                  );
                  const maxChildren = Math.max(0, Number(item.maxGuests || 1) - Number(item.adults || 1));
                  return (
                    <div key={item.roomId} className="grid gap-4 border-t border-stone-200 py-4 first:border-t-0 sm:grid-cols-[72px_1fr]">
                      {item.roomImage ? (
                        <img className="h-[72px] w-[72px] rounded-md object-cover" src={item.roomImage} alt={item.roomName} />
                      ) : <div className="h-[72px] w-[72px] rounded-md bg-lune-mist" />}
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-lune-ink">{item.roomName}</h3>
                            <p className="mt-1 text-sm text-stone-500">{formatCurrency(item.pricePerNight)} {t('common.perNight')}</p>
                          </div>
                          <button
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40"
                            type="button"
                            title={t('common.removeRoom')}
                            disabled={booking.rooms.length === 1}
                            onClick={() => removeRoomItem(index)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-[132px_1fr_1fr]">
                          <div>
                            <span className="label">{t('common.roomsLabel')}</span>
                            <div className="grid grid-cols-[40px_42px_40px] items-center">
                              <button
                                className="grid h-10 w-10 place-items-center rounded-md border border-stone-300 disabled:opacity-40"
                                type="button"
                                title={t('common.decreaseRooms')}
                                disabled={item.quantity <= 1}
                                onClick={() => updateRoomItem(index, { quantity: item.quantity - 1 })}
                              >
                                <Minus className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <strong className="text-center">{item.quantity}</strong>
                              <button
                                className="grid h-10 w-10 place-items-center rounded-md border border-stone-300 disabled:opacity-40"
                                type="button"
                                title={t('common.increaseRooms')}
                                disabled={item.quantity >= maxQuantity}
                                onClick={() => updateRoomItem(index, { quantity: item.quantity + 1 })}
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                          <label>
                            <span className="label">{t('common.adults')}</span>
                            <select
                              className="input-field py-2.5"
                              value={item.adults}
                              onChange={(event) => {
                                const nextAdults = Number(event.target.value);
                                updateRoomItem(index, {
                                  adults: nextAdults,
                                  children: Math.min(item.children, Math.max(0, item.maxGuests - nextAdults)),
                                });
                              }}
                            >
                              {Array.from({ length: Math.max(1, Number(item.maxGuests || 1)) }, (_, option) => option + 1).map((count) => (
                                <option key={count} value={count}>{count}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span className="label">{t('common.children')}</span>
                            <select
                              className="input-field py-2.5"
                              value={item.children}
                              onChange={(event) => updateRoomItem(index, { children: Number(event.target.value) })}
                            >
                              {Array.from({ length: maxChildren + 1 }, (_, count) => (
                                <option key={count} value={count}>{count}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {booking.totalRooms < MAX_ROOMS_PER_BOOKING && availableRoomChoices.length ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <select className="input-field flex-1" value={roomToAdd} onChange={(event) => setRoomToAdd(event.target.value)}>
                    <option value="">{t('common.addRoomType')}</option>
                    {availableRoomChoices.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} · {formatCurrency(item.price)}</option>
                    ))}
                  </select>
                  <button className="btn-secondary shrink-0" type="button" disabled={!roomToAdd} onClick={addRoomItem}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('common.addRoomType')}
                  </button>
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
