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
    <article className="card flex h-full flex-col overflow-hidden">
      <Link to={`/rooms/${room.slug}`} className="block overflow-hidden">
        <img
          src={room.image}
          alt={localizedRoom.name}
          className="h-64 w-full object-cover transition duration-500 hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{room.type}</p>
            <h3 className="mt-2 font-display text-3xl font-bold text-lune-ink">{localizedRoom.name}</h3>
          </div>
          <div className="text-right">
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
            {room.bed}
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
