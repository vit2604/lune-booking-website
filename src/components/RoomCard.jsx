import { ArrowRight, BedDouble, Maximize2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../i18n/useCurrency.js';
import { getLocalizedRoom } from '../i18n/roomTranslations.js';
import { useTranslation } from '../i18n/useTranslation.js';
import { getDisplayPriceText } from '../utils/currencyUtils.js';
import AmenityList from './AmenityList.jsx';
import LuneImage from './LuneImage.jsx';

export default function RoomCard({ room, onBook, isBooking = false }) {
  const { t, currentLanguage } = useTranslation();
  const { currentCurrency } = useCurrency();
  const localizedRoom = getLocalizedRoom(room, currentLanguage);
  const displayPrice = getDisplayPriceText(room.price, currentCurrency);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-softLg">
      <Link to={`/rooms/${room.slug}`} className="relative block overflow-hidden">
        <LuneImage
          src={room.image}
          alt={localizedRoom.name}
          className="h-56 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-64 lg:h-72"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/58 to-transparent" />
        <div className="absolute bottom-3 left-3 rounded-full bg-lune-goldDark px-3 py-2 text-xs font-bold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)] sm:bottom-4 sm:left-4 sm:px-4 sm:text-sm">
          {displayPrice} {t('common.perNight')}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold leading-tight text-lune-ink sm:text-3xl">{localizedRoom.name}</h3>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-lg font-bold text-lune-ink">{displayPrice}</p>
            <p className="text-xs text-stone-500">{t('common.perNight')}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-3 sm:text-xs">
          <span className="flex items-center gap-1.5 rounded-lg bg-lune-mist px-2 py-2">
            <Maximize2 className="h-3.5 w-3.5 text-lune-sage" aria-hidden="true" />
            {room.size}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-lune-mist px-2 py-2">
            <Users className="h-3.5 w-3.5 text-lune-sage" aria-hidden="true" />
            {room.maxGuests} {room.maxGuests === 1 ? t('common.guest') : t('common.guestsPlural')}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-lune-mist px-2 py-2">
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
