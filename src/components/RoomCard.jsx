import { ArrowRight, BedDouble, Maximize2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../i18n/useCurrency.js';
import { getLocalizedRoom } from '../i18n/roomTranslations.js';
import { useTranslation } from '../i18n/useTranslation.js';
import { formatCurrency as formatVnd } from '../utils/booking.js';
import { getApproxPriceText } from '../utils/currencyUtils.js';
import AmenityList from './AmenityList.jsx';

export default function RoomCard({ room, onBook, isBooking = false }) {
  const { t, currentLanguage } = useTranslation();
  const { currentCurrency } = useCurrency();
  const localizedRoom = getLocalizedRoom(room, currentLanguage);
  const approxText = getApproxPriceText(room.price, currentCurrency, currentLanguage);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_18px_55px_rgba(23,20,18,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(23,20,18,0.14)]">
      <Link to={`/rooms/${room.slug}`} className="relative block overflow-hidden">
        <img
          src={room.image}
          alt={localizedRoom.name}
          className="h-72 w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/58 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-lune-ink shadow-soft backdrop-blur">
          {t('rooms.availableStays')}
        </span>
        <div className="absolute bottom-4 left-4 rounded-full bg-lune-gold px-4 py-2 text-sm font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]">
          {formatVnd(room.price)} {t('common.perNight')}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{localizedRoom.type}</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-lune-ink">{localizedRoom.name}</h3>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-lg font-bold text-lune-ink">{formatVnd(room.price)}</p>
            <p className="text-xs text-stone-500">{t('common.perNight')}</p>
            {approxText ? <p className="mt-1 text-xs text-stone-500">{approxText}</p> : null}
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-3 sm:text-xs">
          <span className="flex items-center gap-1.5 rounded-md bg-lune-mist px-2 py-2">
            <Maximize2 className="h-3.5 w-3.5 text-lune-sage" aria-hidden="true" />
            {room.size}
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-lune-mist px-2 py-2">
            <Users className="h-3.5 w-3.5 text-lune-sage" aria-hidden="true" />
            {room.maxGuests} {room.maxGuests === 1 ? t('common.guest') : t('common.guestsPlural')}
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-lune-mist px-2 py-2">
            <BedDouble className="h-3.5 w-3.5 text-lune-sage" aria-hidden="true" />
            {localizedRoom.bed}
          </span>
        </div>

        <p className="mt-4 flex-1 text-sm leading-7 text-stone-600">{localizedRoom.shortDescription}</p>

        <div className="mt-4">
          <AmenityList amenities={room.amenities.slice(0, 3)} compact />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to={`/rooms/${room.slug}`} className="btn-secondary">
            {t('rooms.viewDetails')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            className="btn-gold w-full"
            type="button"
            disabled={isBooking}
            onClick={() => onBook?.(room)}
          >
            {isBooking ? t('common.processing') : t('nav.bookNow')}
          </button>
        </div>
      </div>
    </article>
  );
}
