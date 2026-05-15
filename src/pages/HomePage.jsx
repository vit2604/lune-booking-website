import {
  ArrowRight,
  Bath,
  Building2,
  Clock,
  Headphones,
  ShieldCheck,
  Snowflake,
  Waves,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import { getBrandingSettings } from '../admin/services/adminSettingsService.js';
import RoomCard from '../components/RoomCard.jsx';
import BookingPolicy from '../components/BookingPolicy.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import { buildBookingDraft, getDefaultDates } from '../utils/booking.js';
import { saveBookingDraft } from '../utils/storage.js';

const defaultAmenities = [
  { label: 'Free Wi-Fi', icon: Wifi },
  { label: 'Air conditioning', icon: Snowflake },
  { label: 'Private bathroom', icon: Bath },
  { label: 'Elevator', icon: Building2 },
  { label: 'Near beach', icon: Waves },
  { label: '24/7 support', icon: Headphones },
];

export default function HomePage() {
  const navigate = useNavigate();
  const defaults = getDefaultDates();
  const [rooms, setRooms] = useState(getVisibleRooms());
  const [branding, setBranding] = useState(getBrandingSettings());
  const { t } = useTranslation();
  const featured = rooms.slice(0, 3);
  const guestInfoItems = t('home.guestInfoItems');
  const reasons = [
    {
      title: t('amenities.Near beach'),
      text: t('policy.location', { address: branding.address }),
      icon: Waves,
    },
    {
      title: t('trust.noAccount'),
      text: t('trust.official'),
      icon: Building2,
    },
    {
      title: t('trust.support'),
      text: t('payment.safetyNote'),
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    const refresh = () => {
      setRooms(getVisibleRooms());
      setBranding(getBrandingSettings());
    };
    window.addEventListener('lune:rooms-updated', refresh);
    window.addEventListener('lune:settings-updated', refresh);
    return () => {
      window.removeEventListener('lune:rooms-updated', refresh);
      window.removeEventListener('lune:settings-updated', refresh);
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      checkIn: form.get('checkIn'),
      checkOut: form.get('checkOut'),
      guests: form.get('guests'),
    });
    navigate(`/rooms?${params.toString()}`);
  };

  const handleBook = (room) => {
    const draft = buildBookingDraft({
      room,
      checkIn: defaults.checkIn,
      checkOut: defaults.checkOut,
      guests: Math.min(2, room.maxGuests),
    });
    saveBookingDraft(draft);
    navigate('/booking');
  };

  return (
    <>
      <section className="relative isolate overflow-hidden bg-lune-ink text-white">
        <img
          src={branding.heroImage}
          alt="Boutique hotel pool and exterior"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/38 to-black/20" />
        <div className="page-shell flex min-h-[calc(100svh-8rem)] flex-col justify-center py-12 sm:py-14">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase text-lune-linen">{branding.hotelName}</p>
            <h1 className="mt-5 font-display text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/82">{t('home.heroSubtitle')}</p>
          </div>

          <form
            className="mt-10 grid gap-3 rounded-lg border border-white/20 bg-white/95 p-4 text-lune-ink shadow-soft sm:grid-cols-[1fr_1fr_0.8fr_auto]"
            onSubmit={handleSearch}
          >
            <label>
              <span className="label">{t('common.checkInDate')}</span>
              <input className="input-field" type="date" name="checkIn" defaultValue={defaults.checkIn} />
            </label>
            <label>
              <span className="label">{t('common.checkOutDate')}</span>
              <input className="input-field" type="date" name="checkOut" defaultValue={defaults.checkOut} />
            </label>
            <label>
              <span className="label">{t('common.guests')}</span>
              <select className="input-field" name="guests" defaultValue="2">
                {[1, 2, 3, 4].map((guest) => (
                  <option key={guest} value={guest}>
                    {guest} {guest === 1 ? t('common.guest') : t('common.guestsPlural')}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn-gold self-end" type="submit">
              {t('home.searchRooms')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="page-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-lg">
            <img src={branding.introImage} alt="Modern apartment lounge" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow">{t('home.aboutEyebrow')}</p>
            <h2 className="section-title mt-3">{t('home.aboutTitle')}</h2>
            <p className="muted-text mt-5">
              {t('home.aboutBody', { address: branding.address, hotelName: branding.hotelName })}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                [rooms.length, t('nav.rooms')],
                ['24/7', t('trust.support')],
                [t('common.from'), t('amenities.Near beach')],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-stone-200 p-5">
                  <strong className="block font-display text-4xl text-lune-ink">{value}</strong>
                  <span className="mt-1 block text-sm text-stone-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{t('home.featuredRooms')}</p>
              <h2 className="section-title mt-3">{t('home.chooseStay')}</h2>
            </div>
            <Link to="/rooms" className="btn-secondary">
              {t('home.viewAllRooms')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featured.map((room) => (
              <RoomCard key={room.id} room={room} onBook={handleBook} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="page-shell">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('roomDetail.amenities')}</p>
            <h2 className="section-title mt-3">{t('home.amenitiesTitle')}</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {defaultAmenities.map((amenity) => {
              const Icon = amenity.icon;
              return (
                <div key={amenity.label} className="rounded-lg border border-stone-200 bg-white p-6">
                  <Icon className="h-6 w-6 text-lune-goldDark" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold text-lune-ink">{t(`amenities.${amenity.label}`)}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-space bg-lune-mist">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow">{t('home.whyChoose')}</p>
              <h2 className="section-title mt-3">{t('home.calmBase')}</h2>
            </div>
            <div className="grid gap-4">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div key={reason.title} className="rounded-lg border border-white bg-white/70 p-6">
                    <div className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-lune-ink text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-lune-ink">{reason.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-stone-600">{reason.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-lg border border-lune-gold/30 bg-white p-6">
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-lune-gold text-white">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-lune-ink">{t('common.bookingSummary')}</h3>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      {t('common.checkIn')}, {t('common.checkOut')}, {t('common.guests')}, {t('common.nights')}, {t('common.totalPrice')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="page-shell">
          <p className="eyebrow">{t('home.guestInfoTitle')}</p>
          {Array.isArray(guestInfoItems) ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guestInfoItems.map((item) => (
                <div key={item} className="rounded-lg border border-stone-200 bg-lune-cream p-4 text-sm leading-6 text-stone-700">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-6">
            <BookingPolicy />
          </div>
        </div>
      </section>
    </>
  );
}
