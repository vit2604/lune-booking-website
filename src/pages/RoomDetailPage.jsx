import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  Maximize2,
  Minus,
  Plus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import AmenityList from '../components/AmenityList.jsx';
import BookingPolicy from '../components/BookingPolicy.jsx';
import DateSelector from '../components/DateSelector.jsx';
import LuneImage from '../components/LuneImage.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useCurrency } from '../i18n/useCurrency.js';
import { getLocalizedRoom } from '../i18n/roomTranslations.js';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND, SITE_ORIGIN } from '../hooks/useDocumentMeta.js';
import {
  buildBookingDraft,
  calculateGrandTotal,
  calculateNights,
  calculateRoomSubtotal,
  formatCurrency,
  getDefaultDates,
  validateStay,
} from '../utils/booking.js';
import { getApproxPriceText } from '../utils/currencyUtils.js';
import { validateBookingDates } from '../utils/bookingAvailabilityUtils.js';
import { saveBookingDraft } from '../utils/storage.js';
import { fetchRoomWithFallback } from '../services/roomApiService.js';

export default function RoomDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const bookingBoxRef = useRef(null);
  const [rooms, setRooms] = useState(getVisibleRooms());
  const room = rooms.find((item) => item.slug === slug || item.id === slug);
  const defaults = getDefaultDates();
  const [booking, setBooking] = useState({
    checkIn: defaults.checkIn,
    checkOut: defaults.checkOut,
    guests: room ? Math.min(2, room.maxGuests) : 1,
    adults: room ? Math.min(2, room.maxGuests) : 1,
    children: 0,
    quantity: 1,
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const { t, currentLanguage } = useTranslation();
  const { currentCurrency } = useCurrency();

  useEffect(() => {
    let ignore = false;
    const refresh = async () => {
      setIsLoadingRoom(true);
      try {
        const { room: apiRoom } = await fetchRoomWithFallback(slug, {
          lang: currentLanguage,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          adults: booking.adults,
          children: booking.children,
          quantity: booking.quantity,
        });
        if (ignore || !apiRoom) return;
        setRooms((current) => {
          const exists = current.some((item) => item.id === apiRoom.id || item.slug === apiRoom.slug);
          return exists
            ? current.map((item) => (item.id === apiRoom.id || item.slug === apiRoom.slug ? apiRoom : item))
            : [apiRoom, ...current];
        });
      } catch {
        if (!ignore) setRooms(getVisibleRooms());
      } finally {
        if (!ignore) {
          setIsLoadingRoom(false);
        }
      }
    };

    refresh();
    window.addEventListener('lune:rooms-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      ignore = true;
      window.removeEventListener('lune:rooms-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [slug, currentLanguage, booking.checkIn, booking.checkOut, booking.guests, booking.adults, booking.children, booking.quantity]);

  const totals = useMemo(() => {
    if (!room) return { nights: 0, roomSubtotal: 0, total: 0 };
    const calculatedNights = calculateNights(booking.checkIn, booking.checkOut);
    if (
      room.priceSummary &&
      Number(room.priceSummary.nights) === calculatedNights &&
      (!room.priceSummary.checkIn || room.priceSummary.checkIn === booking.checkIn) &&
      (!room.priceSummary.checkOut || room.priceSummary.checkOut === booking.checkOut) &&
      Number(room.priceSummary.guests || booking.guests || 1) === Number(booking.guests || 1)
    ) {
      return {
        nights: calculatedNights,
        roomSubtotal: Number(room.priceSummary.subtotal || 0) * booking.quantity,
        total: Number(room.priceSummary.totalPrice || room.priceSummary.subtotal || 0) * booking.quantity,
      };
    }
    return {
      nights: calculatedNights,
      roomSubtotal: calculateRoomSubtotal(room.price, booking.checkIn, booking.checkOut) * booking.quantity,
      total: calculateGrandTotal(room.price, booking.checkIn, booking.checkOut) * booking.quantity,
    };
  }, [booking.checkIn, booking.checkOut, booking.guests, booking.quantity, room]);

  const metaRoom = room ? getLocalizedRoom(room, currentLanguage) : null;
  useDocumentMeta({
    title: metaRoom ? `${metaRoom.name} | ${BRAND}` : `${t('nav.rooms')} | ${BRAND}`,
    description: metaRoom?.description,
    path: `/rooms/${slug}`,
    image: metaRoom?.image
      ? metaRoom.image.startsWith('http')
        ? metaRoom.image
        : `${SITE_ORIGIN}${metaRoom.image.startsWith('/') ? '' : '/'}${metaRoom.image}`
      : undefined,
    noindex: !metaRoom,
  });

  if (!room && isLoadingRoom) {
    return (
      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm font-medium text-stone-600 shadow-soft">
            Loading room...
          </div>
        </div>
      </section>
    );
  }

  if (!room) return <Navigate to="/rooms" replace />;
  const localizedRoom = getLocalizedRoom(room, currentLanguage);
  const approxNight = getApproxPriceText(room.price, currentCurrency, currentLanguage);
  const approxTotal = getApproxPriceText(totals.total, currentCurrency, currentLanguage);
  const availableRoomQuantity = Math.max(0, Number(room.availableQuantity ?? room.bluejay?.inventory ?? 1));

  const handleBookingChange = (changes) => {
    setBooking((current) => ({
      ...current,
      ...changes,
    }));
    setErrors({});
  };

  const scrollToBookingBox = () => {
    bookingBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReserve = () => {
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
      },
    });

    const availability = validateBookingDates({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      room,
      existingBookings: [],
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

    const mergedErrors = { ...nextErrors, ...availability.errors };
    const availableQuantity = availableRoomQuantity;
    if (booking.quantity > availableQuantity) {
      mergedErrors.quantity = t('errors.notEnoughRooms', { count: availableQuantity });
    }

    if (Object.keys(mergedErrors).length) {
      setErrors(mergedErrors);
      scrollToBookingBox();
      return;
    }

    setIsProcessing(true);
    const draft = buildBookingDraft({ room, ...booking });
    saveBookingDraft(draft);
    navigate('/booking');
  };

  const errorMessages = Object.values(errors);

  return (
    <section className="bg-white pb-24 lg:pb-0">
      <div className="page-shell py-6 sm:py-8">
        <Link
          to="/rooms"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-lune-goldDark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('roomDetail.backToRooms')}
        </Link>
      </div>

      <div className="page-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <div className="space-y-10">
          <RevealOnScroll variant="zoom" className="flex snap-x gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
            {room.gallery.map((image, index) => (
              <LuneImage
                key={image}
                src={image}
                alt={`${localizedRoom.name} gallery ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`h-72 min-w-[86%] snap-center rounded-lg object-cover sm:h-96 sm:min-w-[70%] lg:min-w-0 ${
                  index === 0 ? 'lg:col-span-2 lg:h-[520px]' : 'lg:h-64'
                }`}
              />
            ))}
          </RevealOnScroll>

          <RevealOnScroll variant="float">
            <p className="eyebrow">{localizedRoom.type}</p>
            <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="font-display text-5xl font-bold leading-tight text-lune-ink">
                  {localizedRoom.name}
                </h1>
                <p className="mt-3 text-lg font-semibold text-lune-ink">
                  {formatCurrency(room.price)}
                  <span className="text-sm font-normal text-stone-500"> {t('common.perNight')}</span>
                </p>
                {approxNight ? <p className="mt-1 text-sm text-stone-500">{approxNight}</p> : null}
              </div>
            </div>
          </RevealOnScroll>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t('roomDetail.roomSize'), value: room.size, icon: Maximize2 },
              { label: t('common.guests'), value: `${room.maxGuests} ${t('common.guestsPlural')}`, icon: Users },
              { label: t('roomDetail.bedType'), value: localizedRoom.bed, icon: BedDouble },
              { label: t('roomDetail.bathroom'), value: t('roomDetail.private'), icon: Bath },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <RevealOnScroll key={item.label} variant="zoom" delay={index * 70} className="rounded-lg border border-stone-200 bg-white p-4">
                  <Icon className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
                  <span className="mt-3 block text-xs font-semibold uppercase text-stone-500">
                    {item.label}
                  </span>
                  <strong className="mt-1 block text-base text-lune-ink">{item.value}</strong>
                </RevealOnScroll>
              );
            })}
          </div>

          <RevealOnScroll as="section" variant="curve-left">
            <p className="eyebrow">{t('roomDetail.roomDetails')}</p>
            <h2 className="section-title mt-3">{t('roomDetail.detailsTitle')}</h2>
            <p className="muted-text mt-5">{localizedRoom.description}</p>
            {localizedRoom.suitableFor?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {localizedRoom.suitableFor.map((item) => (
                  <span key={item} className="rounded-full bg-lune-cream px-3 py-1 text-xs font-semibold text-lune-charcoal">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
            {localizedRoom.priceNote ? (
              <p className="mt-4 rounded-lg border border-lune-gold/20 bg-lune-cream p-4 text-sm leading-6 text-stone-700">
                {localizedRoom.priceNote}
              </p>
            ) : null}
          </RevealOnScroll>

          <RevealOnScroll as="section" variant="curve-right">
            <h3 className="font-display text-3xl font-bold text-lune-ink">{t('roomDetail.amenities')}</h3>
            <div className="mt-5">
              <AmenityList amenities={room.amenities} />
            </div>
          </RevealOnScroll>

          <RevealOnScroll variant="float">
            <BookingPolicy />
          </RevealOnScroll>
        </div>

        <RevealOnScroll as="aside" variant="curve-left" ref={bookingBoxRef} className="card h-fit scroll-mt-28 p-5 lg:sticky lg:top-28">
          <p className="eyebrow">{t('roomDetail.reserveStay')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-lune-ink">{localizedRoom.name}</h2>
          <p className="mt-2 text-base font-semibold text-lune-ink">
            {formatCurrency(room.price)}
            <span className="text-sm font-normal text-stone-500"> {t('common.perNight')}</span>
          </p>
          {approxNight ? <p className="mt-1 text-xs text-stone-500">{approxNight}</p> : null}

          <div className="mt-6">
            <DateSelector
              checkIn={booking.checkIn}
              checkOut={booking.checkOut}
              guests={booking.guests}
              adults={booking.adults}
              children={booking.children}
              maxGuests={room.maxGuests}
              compact
              onChange={handleBookingChange}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-stone-200 bg-white p-3">
            <div>
              <p className="text-sm font-semibold text-lune-ink">{t('common.roomsLabel')}</p>
              <p className="text-xs text-stone-500">
                {t('common.roomsAvailable', { count: availableRoomQuantity })}
              </p>
            </div>
            <div className="grid grid-cols-[40px_44px_40px] items-center" aria-label={t('common.roomQuantity')}>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-stone-300 text-lune-ink disabled:opacity-40"
                type="button"
                title={t('common.decreaseRooms')}
                disabled={booking.quantity <= 1}
                onClick={() => handleBookingChange({ quantity: booking.quantity - 1 })}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <strong className="text-center text-base text-lune-ink">{booking.quantity}</strong>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-stone-300 text-lune-ink disabled:opacity-40"
                type="button"
                title={t('common.increaseRooms')}
                disabled={booking.quantity >= Math.max(1, availableRoomQuantity)}
                onClick={() => handleBookingChange({ quantity: booking.quantity + 1 })}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {errorMessages.length ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {errorMessages.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-6 space-y-3 rounded-lg bg-lune-cream p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-stone-600">{t('common.nights')}</span>
              <strong>{totals.nights}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-600">{t('common.roomsLabel')}</span>
              <strong>{booking.quantity}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-stone-600">{t('common.roomSubtotal')}</span>
              <strong>{formatCurrency(totals.roomSubtotal)}</strong>
            </div>
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-3">
              <span className="font-semibold text-lune-ink">{t('common.totalPrice')}</span>
              <strong className="text-lg text-lune-ink">{formatCurrency(totals.total)}</strong>
            </div>
            {approxTotal ? <p className="text-right text-xs text-stone-500">{approxTotal}</p> : null}
          </div>

          <button
            className="btn-gold mt-6 w-full"
            type="button"
            disabled={isProcessing}
            onClick={handleReserve}
          >
            {isProcessing ? t('common.processing') : t('roomDetail.reserveThisRoom')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </RevealOnScroll>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(23,20,18,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-stone-500">{t('common.from')} {formatCurrency(room.price)} {t('common.perNight')}</p>
            <p className="truncate text-sm font-bold text-lune-ink">
              {t('common.total')} {formatCurrency(totals.total)}
            </p>
          </div>
          <button
            className="btn-gold shrink-0 px-4"
            type="button"
            disabled={isProcessing}
            onClick={handleReserve}
          >
            {isProcessing ? t('common.processing') : t('roomDetail.reserve')}
          </button>
        </div>
      </div>
    </section>
  );
}
