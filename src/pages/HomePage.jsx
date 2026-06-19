import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Clock,
  Headphones,
  MapPin,
  ShieldCheck,
  Snowflake,
  Star,
  Users,
  Waves,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getVisibleRooms } from '../admin/services/adminRoomService.js';
import { defaultBrandingSettings, getBrandingSettings } from '../admin/services/adminSettingsService.js';
import RoomCard from '../components/RoomCard.jsx';
import BookingPolicy from '../components/BookingPolicy.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
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
  const translatedBranding = (key, translationKey) =>
    !branding[key] || branding[key] === defaultBrandingSettings[key] ? t(translationKey) : branding[key];
  const heroTitle = translatedBranding('heroTitle', 'home.heroTitle');
  const heroSubtitle = translatedBranding('heroSubtitle', 'home.heroSubtitle');
  const heroButtonText = translatedBranding('heroButtonText', 'home.searchRooms');
  const heroSlogan = translatedBranding('shortSlogan', 'home.shortSlogan');
  const heroHighlights = [
    {
      title: t('home.featuredRooms'),
      text: t('home.chooseStay'),
      icon: BedDouble,
    },
    {
      title: t('roomDetail.amenities'),
      text: t('home.amenitiesTitle'),
      icon: Star,
    },
    {
      title: t('amenities.Near beach'),
      text: t('policy.location', { address: branding.address }),
      icon: MapPin,
    },
    {
      title: t('trust.support'),
      text: t('chat.usuallyReplies'),
      icon: Headphones,
    },
  ];
  const reviewStats = [
    { value: '9.3/10', label: t('home.reviewScore') },
    { value: '9.9', label: t('home.reviewService') },
    { value: '9.8', label: t('home.reviewLocation') },
    { value: '9.5', label: t('home.reviewCleanliness') },
  ];
  const guestLoved = t('home.guestLovedItems');
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
      <RevealOnScroll as="section" direction="none" duration={500} className="lune-hero-section relative isolate overflow-hidden bg-lune-ink text-white">
        <img
          src={branding.heroImage}
          alt="Boutique hotel pool and exterior"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_62%_32%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(90deg,rgba(21,16,11,0.82),rgba(60,43,26,0.44)_42%,rgba(23,18,13,0.12)_78%)]" />
        <img
          src={branding.heroImage}
          alt=""
          aria-hidden="true"
          className="lune-hero-depth-layer pointer-events-none absolute inset-0 z-[12] hidden h-full w-full object-cover lg:block"
        />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="page-shell relative z-10 flex min-h-[760px] flex-col justify-end pb-0 pt-32 sm:min-h-[820px] lg:min-h-screen">
          <div className="max-w-3xl pb-10 sm:pb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-lune-gold sm:text-base">
              {heroSlogan || branding.hotelName}
            </p>
            <h1 className="lune-hero-title mt-5 max-w-2xl font-display text-5xl font-bold leading-[0.98] tracking-normal sm:text-7xl lg:text-8xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/88 sm:text-xl">{heroSubtitle}</p>
            <Link
              to="/rooms"
              className="mt-8 inline-flex min-h-14 items-center justify-center rounded-lg bg-lune-gold px-8 text-sm font-bold uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:bg-lune-goldDark"
            >
              {heroButtonText}
            </Link>
          </div>

          <form
            className="hero-search-panel relative z-20 -mb-16 grid gap-0 overflow-hidden rounded-2xl border border-white/70 bg-[#fffaf2] text-lune-ink shadow-[0_28px_80px_rgba(23,20,18,0.26)] md:grid-cols-[1fr_1fr_0.95fr_auto]"
            onSubmit={handleSearch}
          >
            <label className="bg-white/90 p-5 md:border-r md:border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.checkInDate')}</span>
              <span className="mt-2 flex items-center gap-3 rounded-lg bg-white px-3 py-1.5 ring-1 ring-stone-200">
                <CalendarDays className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <input
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  type="date"
                  name="checkIn"
                  defaultValue={defaults.checkIn}
                  min={defaults.checkIn}
                />
              </span>
            </label>
            <label className="bg-white/90 p-5 md:border-r md:border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.checkOutDate')}</span>
              <span className="mt-2 flex items-center gap-3 rounded-lg bg-white px-3 py-1.5 ring-1 ring-stone-200">
                <CalendarDays className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <input
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  type="date"
                  name="checkOut"
                  defaultValue={defaults.checkOut}
                  min={defaults.checkOut}
                />
              </span>
            </label>
            <label className="bg-white/90 p-5 md:border-r md:border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.guests')}</span>
              <span className="mt-2 flex items-center gap-3 rounded-lg bg-white px-3 py-1.5 ring-1 ring-stone-200">
                <Users className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <select
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  name="guests"
                  defaultValue="2"
                >
                {[1, 2, 3, 4].map((guest) => (
                  <option key={guest} value={guest}>
                    {guest} {guest === 1 ? t('common.guest') : t('common.guestsPlural')}
                  </option>
                ))}
                </select>
              </span>
            </label>
            <button
              className="m-3 inline-flex min-h-16 items-center justify-center gap-2 rounded-lg bg-[#463527] px-6 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-lune-goldDark md:min-w-[220px]"
              type="submit"
            >
              {heroButtonText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="float" className="bg-white pb-8 pt-24 shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="page-shell grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {heroHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-4 border-stone-200 py-2 lg:border-r lg:pr-6 last:lg:border-r-0">
                <Icon className="mt-1 h-9 w-9 shrink-0 text-[#4b392a]" strokeWidth={1.7} aria-hidden="true" />
                <div>
                  <h2 className="text-base font-bold text-lune-ink">{item.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-left" className="bg-lune-cream py-10">
        <div className="page-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">{t('home.guestLovedEyebrow')}</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-lune-ink sm:text-5xl">
              {t('home.guestLovedTitle')}
            </h2>
            <p className="mt-5 text-sm leading-7 text-stone-600">{t('home.guestLovedBody')}</p>
            <p className="hidden">
              Lune is built for travelers who want the comfort of an apartment and the ease of a hotel:
              clean rooms, practical amenities, responsive support, and a calm location in Sơn Trà.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {reviewStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white bg-white/80 p-4">
                  <strong className="block font-display text-3xl text-lune-ink">{stat.value}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              {(Array.isArray(guestLoved) ? guestLoved : []).map((item) => (
                <div key={item} className="rounded-lg border border-white bg-white/80 p-4 text-sm leading-6 text-stone-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-right" className="section-space bg-white">
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
                [rooms.length, t('home.roomTypeCountLabel')],
                ['24/7', t('trust.support')],
                [t('home.nearBeachStatValue'), t('amenities.Near beach')],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-stone-200 p-5">
                  <strong className="block font-display text-4xl text-lune-ink">{value}</strong>
                  <span className="mt-1 block text-sm text-stone-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="float" className="section-space bg-lune-cream">
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
            {featured.map((room, index) => (
              <RevealOnScroll key={room.id} variant={index % 2 === 0 ? 'curve-left' : 'curve-right'} delay={index * 90}>
                <RoomCard room={room} onBook={handleBook} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-left" className="section-space bg-white">
        <div className="page-shell">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('roomDetail.amenities')}</p>
            <h2 className="section-title mt-3">{t('home.amenitiesTitle')}</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {defaultAmenities.map((amenity, index) => {
              const Icon = amenity.icon;
              return (
                <RevealOnScroll key={amenity.label} variant="zoom" delay={index * 70} className="rounded-lg border border-stone-200 bg-white p-6">
                  <Icon className="h-6 w-6 text-lune-goldDark" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold text-lune-ink">{t(`amenities.${amenity.label}`)}</h3>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-right" className="section-space bg-lune-mist">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="eyebrow">{t('home.whyChoose')}</p>
              <h2 className="section-title mt-3">{t('home.calmBase')}</h2>
            </div>
            <div className="grid gap-4">
              {reasons.map((reason, index) => {
                const Icon = reason.icon;
                return (
                  <RevealOnScroll key={reason.title} variant={index % 2 === 0 ? 'curve-left' : 'curve-right'} delay={index * 90} className="rounded-lg border border-white bg-white/70 p-6">
                    <div className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-lune-ink text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-lune-ink">{reason.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-stone-600">{reason.text}</p>
                      </div>
                    </div>
                  </RevealOnScroll>
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
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="float" className="section-space bg-white">
        <div className="page-shell">
          <p className="eyebrow">{t('home.guestInfoTitle')}</p>
          {Array.isArray(guestInfoItems) ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {guestInfoItems.map((item, index) => (
                <RevealOnScroll key={item} variant="zoom" delay={index * 60} className="rounded-lg border border-stone-200 bg-lune-cream p-4 text-sm leading-6 text-stone-700">
                  {item}
                </RevealOnScroll>
              ))}
            </div>
          ) : null}
          <div className="mt-6">
            <BookingPolicy />
          </div>
        </div>
      </RevealOnScroll>
    </>
  );
}
