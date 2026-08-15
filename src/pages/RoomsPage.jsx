import { CalendarDays, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import DateInput from '../components/DateInput.jsx';
import GuestSelector from '../components/GuestSelector.jsx';
import RoomCard from '../components/RoomCard.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { fetchRoomsWithFallback } from '../services/roomApiService.js';
import { addDays, buildBookingDraft, getDefaultDates, toDateInputValue, validateStay } from '../utils/booking.js';
import { fitsRoomCapacity, getRoomCapacity } from '../utils/occupancy.js';
import { saveBookingDraft } from '../utils/storage.js';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaults = getDefaultDates();
  const initialToday = toDateInputValue(new Date());
  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  const urlGuests = Number(searchParams.get('guests')) || 1;
  const urlAdults = Number(searchParams.get('adults')) || urlGuests;
  const urlChildren = Number(searchParams.get('children')) || 0;
  const initialGuests = Math.max(1, Number(searchParams.get('guests')) || urlAdults + urlChildren);
  const initialCheckIn = urlCheckIn && urlCheckIn >= initialToday ? urlCheckIn : defaults.checkIn;
  const initialCheckOut =
    urlCheckOut && urlCheckOut > initialCheckIn
      ? urlCheckOut
      : toDateInputValue(addDays(new Date(`${initialCheckIn}T12:00:00`), 1));
  const [rooms, setRooms] = useState(getVisibleRooms());
  const [filters, setFilters] = useState({
    guests: initialGuests,
    adults: urlAdults,
    children: urlChildren,
    type: 'all',
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
  });
  const [bookingError, setBookingError] = useState('');
  const [processingRoom, setProcessingRoom] = useState('');
  const { t, currentLanguage } = useTranslation();
  const roomTypeOptions = useMemo(() => {
    const roomMap = new Map();
    [...getVisibleRooms(), ...rooms].forEach((room) => {
      if (!room?.id) return;
      roomMap.set(room.id, room.translations?.[currentLanguage]?.name || room.name);
    });
    return Array.from(roomMap, ([value, label]) => ({ value, label }));
  }, [currentLanguage, rooms]);
  useDocumentMeta({
    title: `${t('nav.rooms')} | ${BRAND}`,
    description: t('rooms.title'),
    path: '/rooms',
  });
  const today = toDateInputValue(new Date());

  useEffect(() => {
    let ignore = false;
    const refresh = async () => {
      try {
        const { rooms: nextRooms } = await fetchRoomsWithFallback(
          {
            lang: currentLanguage,
            checkIn: filters.checkIn,
            checkOut: filters.checkOut,
            guests: filters.guests,
            adults: filters.adults,
            children: filters.children,
          },
          { timeoutMs: 25000 },
        );
        if (!ignore) {
          setRooms(nextRooms);
          setBookingError('');
        }
      } catch {
        // availability could not be verified — do not present rooms as bookable
        if (!ignore) {
          setRooms([]);
          setBookingError(t('errors.apiUnavailable'));
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
  }, [currentLanguage, filters.checkIn, filters.checkOut, filters.guests, filters.adults, filters.children, t]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => fitsRoomCapacity(room.maxGuests, filters.adults, filters.children))
      .filter((room) => filters.type === 'all' || room.id === filters.type)
      .sort((a, b) => a.price - b.price);
  }, [filters, rooms]);

  const updateFilter = (key, value) => {
    setFilters((current) => {
      if (key === 'checkIn') {
        const safeCheckIn = value && value < today ? today : value;
        const minCheckout = safeCheckIn ? toDateInputValue(addDays(new Date(`${safeCheckIn}T12:00:00`), 1)) : '';
        return {
          ...current,
          checkIn: safeCheckIn,
          checkOut: minCheckout,
        };
      }
      if (key === 'checkOut' && current.checkIn && value <= current.checkIn) {
        return {
          ...current,
          checkOut: toDateInputValue(addDays(new Date(`${current.checkIn}T12:00:00`), 1)),
        };
      }
      if (key === 'adults' || key === 'children') {
        const next = { ...current, ...value };
        return {
          ...next,
          guests: Number(next.adults || 1) + Number(next.children || 0),
        };
      }
      return { ...current, [key]: value };
    });
    setBookingError('');
  };

  const handleBook = (room) => {
    const errors = validateStay({
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
      maxGuests: room.maxGuests,
      messages: {
        checkInRequired: t('errors.checkInRequired'),
        checkOutRequired: t('errors.checkOutRequired'),
        checkoutAfterCheckin: t('errors.checkoutAfterCheckin'),
        guestsRequired: t('errors.guestsRequired'),
        guestsMax: t('errors.guestsMax', { max: getRoomCapacity(room.maxGuests).maxTotal }),
        checkInPast: t('errors.checkInPast'),
      },
    });

    if (Object.keys(errors).length) {
      setBookingError(Object.values(errors)[0]);
      return;
    }

    setProcessingRoom(room.id);
    const draft = buildBookingDraft({
      room,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
      adults: filters.adults,
      children: filters.children,
    });
    saveBookingDraft(draft);
    navigate('/booking');
  };

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:gap-8">
          <RevealOnScroll as="aside" variant="curve-right" className="h-fit rounded-lg border border-stone-200 bg-white p-4 shadow-soft sm:p-5 lg:sticky lg:top-28">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold text-lune-ink sm:text-3xl">{t('rooms.filters')}</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label>
                <span className="label">{t('common.checkIn')}</span>
                <DateInput
                  className="input-field"
                  min={today}
                  value={filters.checkIn}
                  onChange={(event) => updateFilter('checkIn', event.target.value)}
                />
              </label>
              <label>
                <span className="label">{t('common.checkOut')}</span>
                <DateInput
                  className="input-field"
                  min={filters.checkIn ? toDateInputValue(addDays(new Date(`${filters.checkIn}T12:00:00`), 1)) : today}
                  value={filters.checkOut}
                  onChange={(event) => updateFilter('checkOut', event.target.value)}
                />
              </label>
              <label>
                <span className="label">{t('common.guests')}</span>
                <GuestSelector
                  adults={filters.adults}
                  children={filters.children}
                  maxGuests={4}
                  onChange={(value) => updateFilter('adults', value)}
                  t={t}
                />
              </label>
              <label>
                <span className="label">{t('rooms.roomType')}</span>
                <select
                  className="input-field"
                  value={filters.type}
                  onChange={(event) => updateFilter('type', event.target.value)}
                >
                  <option value="all">{t('rooms.allTypes')}</option>
                  {roomTypeOptions.map((roomType) => (
                    <option key={roomType.value} value={roomType.value}>
                      {roomType.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </RevealOnScroll>

          <div className="min-w-0">
            <RevealOnScroll variant="float" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">{t('rooms.availableStays')}</p>
                <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-lune-ink sm:text-5xl">{t('rooms.title')}</h1>
              </div>
              <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm">
                <CalendarDays className="h-4 w-4 text-lune-goldDark" aria-hidden="true" />
                {t('rooms.roomsFound', { count: filteredRooms.length })}
              </p>
            </RevealOnScroll>

            {bookingError ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {bookingError}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:gap-6">
              {filteredRooms.map((room, index) => (
                <RevealOnScroll key={room.id} variant={index % 2 === 0 ? 'curve-left' : 'curve-right'} delay={index * 80}>
                  <RoomCard
                    room={room}
                    onBook={handleBook}
                    isBooking={processingRoom === room.id}
                  />
                </RevealOnScroll>
              ))}
            </div>

            {filteredRooms.length === 0 ? (
              <div className="mt-8 rounded-lg border border-stone-200 bg-white p-6 text-center shadow-soft sm:p-8">
                <h3 className="font-display text-2xl font-bold text-lune-ink sm:text-3xl">{t('rooms.noRoomsForSelectionTitle')}</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                  {t('rooms.noRoomsForSelectionBody')}
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    className="btn-gold"
                    type="button"
                    onClick={() => {
                      updateFilter('checkIn', defaults.checkIn);
                      updateFilter('checkOut', defaults.checkOut);
                    }}
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {t('rooms.tryDefaultDates')}
                  </button>
                  <Link className="btn-secondary" to="/contact">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    {t('common.contactLune')}
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
