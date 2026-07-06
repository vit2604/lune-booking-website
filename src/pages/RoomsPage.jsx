import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import { getBookings } from '../admin/services/adminBookingService.js';
import RoomCard from '../components/RoomCard.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { fetchRoomsWithFallback } from '../services/roomApiService.js';
import { addDays, buildBookingDraft, getDefaultDates, toDateInputValue, validateStay } from '../utils/booking.js';
import { isRoomAvailable } from '../utils/bookingAvailabilityUtils.js';
import { saveBookingDraft } from '../utils/storage.js';

const priceOptions = [
  { label: 'Any price', value: 'all' },
  { label: 'Under 1,000,000 VND', value: '1000000' },
  { label: 'Under 1,200,000 VND', value: '1200000' },
  { label: 'Under 1,400,000 VND', value: '1400000' },
];

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaults = getDefaultDates();
  const initialToday = toDateInputValue(new Date());
  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  const initialCheckIn = urlCheckIn && urlCheckIn >= initialToday ? urlCheckIn : defaults.checkIn;
  const initialCheckOut =
    urlCheckOut && urlCheckOut > initialCheckIn
      ? urlCheckOut
      : toDateInputValue(addDays(new Date(`${initialCheckIn}T12:00:00`), 1));
  const [rooms, setRooms] = useState(getVisibleRooms());
  const [bookings, setBookings] = useState(getBookings());
  const [filters, setFilters] = useState({
    guests: Number(searchParams.get('guests')) || 1,
    maxPrice: 'all',
    type: 'all',
    sort: 'low',
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
  });
  const [bookingError, setBookingError] = useState('');
  const [processingRoom, setProcessingRoom] = useState('');
  const roomTypes = [...new Set(rooms.map((room) => room.type).filter(Boolean))];
  const { t, currentLanguage } = useTranslation();
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
          },
          { timeoutMs: 12000 },
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
      if (!ignore) setBookings(getBookings());
    };

    refresh();
    window.addEventListener('lune:rooms-updated', refresh);
    window.addEventListener('lune:bookings-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      ignore = true;
      window.removeEventListener('lune:rooms-updated', refresh);
      window.removeEventListener('lune:bookings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [currentLanguage, filters.checkIn, filters.checkOut, filters.guests, t]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => room.maxGuests >= filters.guests)
      .filter((room) => filters.maxPrice === 'all' || room.price <= Number(filters.maxPrice))
      .filter((room) => filters.type === 'all' || room.type === filters.type)
      .filter((room) => isRoomAvailable(room.id, filters.checkIn, filters.checkOut, bookings, room))
      .sort((a, b) => (filters.sort === 'low' ? a.price - b.price : b.price - a.price));
  }, [bookings, filters, rooms]);

  const updateFilter = (key, value) => {
    setFilters((current) => {
      if (key === 'checkIn') {
        const safeCheckIn = value && value < today ? today : value;
        const minCheckout = safeCheckIn ? toDateInputValue(addDays(new Date(`${safeCheckIn}T12:00:00`), 1)) : '';
        return {
          ...current,
          checkIn: safeCheckIn,
          checkOut: current.checkOut && safeCheckIn && current.checkOut <= safeCheckIn ? minCheckout : current.checkOut,
        };
      }
      if (key === 'checkOut' && current.checkIn && value <= current.checkIn) {
        return {
          ...current,
          checkOut: toDateInputValue(addDays(new Date(`${current.checkIn}T12:00:00`), 1)),
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
        guestsMax: t('errors.guestsMax', { max: room.maxGuests }),
        checkInPast: t('errors.checkInPast'),
      },
    });

    if (Object.keys(errors).length) {
      setBookingError(Object.values(errors)[0]);
      return;
    }

    if (!isRoomAvailable(room.id, filters.checkIn, filters.checkOut, bookings, room)) {
      setBookingError(t('errors.roomUnavailable'));
      return;
    }

    setProcessingRoom(room.id);
    const draft = buildBookingDraft({
      room,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
    });
    saveBookingDraft(draft);
    navigate('/booking');
  };

  return (
    <RevealOnScroll as="section" direction="none" duration={450} className="section-space bg-lune-cream">
      <div className="page-shell">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <RevealOnScroll as="aside" variant="curve-right" className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-soft lg:sticky lg:top-28">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-lune-goldDark" aria-hidden="true" />
              <h2 className="font-display text-3xl font-bold text-lune-ink">{t('rooms.filters')}</h2>
            </div>
            <div className="mt-6 grid gap-4">
              <label>
                <span className="label">{t('common.checkIn')}</span>
                <input
                  className="input-field"
                  type="date"
                  min={today}
                  value={filters.checkIn}
                  onChange={(event) => updateFilter('checkIn', event.target.value)}
                />
              </label>
              <label>
                <span className="label">{t('common.checkOut')}</span>
                <input
                  className="input-field"
                  type="date"
                  min={filters.checkIn ? toDateInputValue(addDays(new Date(`${filters.checkIn}T12:00:00`), 1)) : today}
                  value={filters.checkOut}
                  onChange={(event) => updateFilter('checkOut', event.target.value)}
                />
              </label>
              <label>
                <span className="label">{t('common.guests')}</span>
                <select
                  className="input-field"
                  value={filters.guests}
                  onChange={(event) => updateFilter('guests', Number(event.target.value))}
                >
                  {[1, 2, 3, 4].map((guest) => (
                    <option key={guest} value={guest}>
                      {guest} {guest === 1 ? t('common.guest') : t('common.guestsPlural')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{t('rooms.priceRange')}</span>
                <select
                  className="input-field"
                  value={filters.maxPrice}
                  onChange={(event) => updateFilter('maxPrice', event.target.value)}
                >
                  {priceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value === 'all' ? t('rooms.anyPrice') : option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{t('rooms.roomType')}</span>
                <select
                  className="input-field"
                  value={filters.type}
                  onChange={(event) => updateFilter('type', event.target.value)}
                >
                  <option value="all">{t('rooms.allTypes')}</option>
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">{t('rooms.sort')}</span>
                <select
                  className="input-field"
                  value={filters.sort}
                  onChange={(event) => updateFilter('sort', event.target.value)}
                >
                  <option value="low">{t('rooms.lowToHigh')}</option>
                  <option value="high">{t('rooms.highToLow')}</option>
                </select>
              </label>
            </div>
          </RevealOnScroll>

          <div>
            <RevealOnScroll variant="float" className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">{t('rooms.availableStays')}</p>
                <h1 className="section-title mt-3">{t('rooms.title')}</h1>
              </div>
              <p className="text-sm font-medium text-stone-600">
                {t('rooms.roomsFound', { count: filteredRooms.length })}
              </p>
            </RevealOnScroll>

            {bookingError ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {bookingError}
              </div>
            ) : null}

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
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
              <div className="mt-8 rounded-lg border border-stone-200 bg-white p-8 text-center">
                <h3 className="font-display text-3xl font-bold text-lune-ink">{t('common.noRooms')}</h3>
                <p className="mt-2 text-sm text-stone-600">
                  {t('common.noRooms')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}
