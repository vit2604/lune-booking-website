import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
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
import DateInput from '../components/DateInput.jsx';
import GuestSelector from '../components/GuestSelector.jsx';
import RoomCard from '../components/RoomCard.jsx';
import BookingPolicy from '../components/BookingPolicy.jsx';
import RevealOnScroll from '../components/animations/RevealOnScroll.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import useDocumentMeta, { BRAND } from '../hooks/useDocumentMeta.js';
import { fetchRoomsWithFallback } from '../services/roomApiService.js';
import { addDays, buildBookingDraft, getDefaultDates, toDateInputValue } from '../utils/booking.js';
import { saveBookingDraft } from '../utils/storage.js';

const defaultAmenities = [
  { label: 'Free Wi-Fi', icon: Wifi, descKey: 'home.amenityWifiDesc' },
  { label: 'Air conditioning', icon: Snowflake, descKey: 'home.amenityAirDesc' },
  { label: 'Private bathroom', icon: Bath, descKey: 'home.amenityBathroomDesc' },
  { label: 'Elevator', icon: Building2, descKey: 'home.amenityElevatorDesc' },
  { label: 'Near beach', icon: Waves, descKey: 'home.amenityBeachDesc' },
  { label: '24/7 support', icon: Headphones, descKey: 'home.amenitySupportDesc' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const defaults = getDefaultDates();
  const today = toDateInputValue(new Date());
  const nextDay = (date) => toDateInputValue(addDays(new Date(`${date}T12:00:00`), 1));
  const [heroDates, setHeroDates] = useState({ checkIn: defaults.checkIn, checkOut: defaults.checkOut });
  const [heroGuests, setHeroGuests] = useState({ adults: 2, children: 0, guests: 2 });
  const [rooms, setRooms] = useState(getVisibleRooms());
  const [branding, setBranding] = useState(getBrandingSettings());
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);

  const setCheckIn = (value) => {
    const checkIn = value && value < today ? today : value;
    setHeroDates((current) => ({
      checkIn,
      checkOut: !current.checkOut || current.checkOut <= checkIn ? nextDay(checkIn) : current.checkOut,
    }));
  };

  const setCheckOut = (value) => {
    setHeroDates((current) => ({
      ...current,
      checkOut: value <= current.checkIn ? nextDay(current.checkIn) : value,
    }));
  };
  const { t, currentLanguage } = useTranslation();
  useDocumentMeta({
    title: BRAND,
    description: `${t('home.heroTitle')} — ${t('home.heroSubtitle')}`,
    path: '/',
  });
  const featured = rooms.slice(0, 6);
  const featuredSignature = featured.map((room) => room.id).join('|');
  const visibleFeaturedRooms = featured.length
    ? Array.from({ length: Math.min(featured.length, 3) }, (_, offset) => featured[(featuredStartIndex + offset) % featured.length])
    : [];
  const guestInfoItems = t('home.guestInfoItems');
  const faqItems = t('home.faqItems');
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
  const bookingProof = [
    { value: '400m', label: t('home.proofBeach') },
    { value: '16', label: t('home.proofApartments') },
    { value: '24h', label: t('home.proofFrontDesk') },
    { value: '14:00', label: t('home.proofCheckIn') },
  ];
  const galleryImages = [
    { src: '/images/lune/exterior/exterior-2.webp', alt: 'Lune Boutique Apartment exterior' },
    { src: '/images/lune/type-3-standard/type-3-standard-2.webp', alt: 'Bright Lune apartment bedroom' },
    { src: '/images/lune/type-4-studio/type-4-studio-1.webp', alt: 'Lune studio apartment room' },
    { src: '/images/lune/type-1-r201/type-1-r201-2.webp', alt: 'Lune apartment living details' },
  ];
  const heroSlides = [
    { src: branding.heroImage, alt: 'Lune Boutique Hotel facade on Thach Lam street' },
    { src: '/images/lune/type-3-standard/type-3-standard-2.webp', alt: 'Bright Lune apartment bedroom' },
    { src: '/images/lune/type-4-studio/type-4-studio-1.webp', alt: 'Lune studio apartment room' },
    { src: '/images/lune/type-2-r601/type-2-r601-2.webp', alt: 'Warm apartment room at Lune' },
    { src: '/images/lune/type-1-r201/type-1-r201-2.webp', alt: 'Lune apartment interior detail' },
  ];

  useEffect(() => {
    let ignore = false;
    const refresh = async () => {
      try {
        const { rooms: nextRooms } = await fetchRoomsWithFallback({ lang: currentLanguage });
        if (!ignore) setRooms(nextRooms);
      } catch {
        if (!ignore) setRooms(getVisibleRooms());
      }
      if (!ignore) setBranding(getBrandingSettings());
    };
    refresh();
    window.addEventListener('lune:rooms-updated', refresh);
    window.addEventListener('lune:settings-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      ignore = true;
      window.removeEventListener('lune:rooms-updated', refresh);
      window.removeEventListener('lune:settings-updated', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [currentLanguage]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    setFeaturedStartIndex(0);
  }, [featuredSignature]);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams({
      checkIn: heroDates.checkIn,
      checkOut: heroDates.checkOut,
      adults: heroGuests.adults,
      children: heroGuests.children,
      guests: heroGuests.guests,
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

  const scrollFeaturedRooms = (direction) => {
    if (featured.length <= 1) return;
    setFeaturedStartIndex((current) => (current + direction + featured.length) % featured.length);
  };

  const parkingArea = branding.address || '92-94 Thạch Lam, Sơn Trà, Đà Nẵng';
  const parkingQuery = encodeURIComponent(`bãi đỗ xe ô tô gần ${parkingArea}`);
  const parkingEmbedUrl = `https://www.google.com/maps?q=${parkingQuery}&output=embed`;
  const parkingMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parkingQuery}`;

  return (
    <>
      <RevealOnScroll as="section" direction="none" duration={500} className="lune-hero-section relative isolate overflow-hidden bg-lune-ink text-white">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={index === activeHeroIndex ? slide.alt : ''}
            aria-hidden={index === activeHeroIndex ? undefined : 'true'}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={index === 0 ? 'high' : 'auto'}
            className={`lune-hero-image ${index === 0 ? 'lune-hero-image-exterior' : 'lune-hero-image-room'} absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === activeHeroIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="lune-hero-overlay absolute inset-0 z-[1] bg-[radial-gradient(circle_at_62%_32%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(90deg,rgba(21,16,11,0.82),rgba(60,43,26,0.44)_42%,rgba(23,18,13,0.12)_78%)]" />
        <img
          src={heroSlides[activeHeroIndex]?.src || branding.heroImage}
          alt=""
          aria-hidden="true"
          className="lune-hero-depth-layer pointer-events-none absolute inset-0 z-[12] hidden h-full w-full object-cover lg:block"
        />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-black/45 to-transparent" />

        <div className="page-shell relative z-20 flex min-h-[560px] flex-col justify-end pb-0 pt-24 sm:min-h-[820px] sm:pt-32 lg:min-h-screen">
          <div className="max-w-3xl pb-6 sm:pb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-lune-gold sm:text-base">
              {heroSlogan || branding.hotelName}
            </p>
            <h1 className="lune-hero-title mt-5 max-w-2xl font-display text-5xl font-bold leading-[0.98] tracking-normal sm:text-7xl lg:text-8xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-white/88 sm:mt-6 sm:text-xl">{heroSubtitle}</p>
            <Link
              to="/rooms"
              className="mt-6 inline-flex min-h-14 items-center justify-center rounded-xl bg-lune-goldDark px-8 text-sm font-bold uppercase tracking-wide text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition duration-200 hover:bg-lune-goldDeep sm:mt-8"
            >
              {heroButtonText}
            </Link>
            <div className="mt-5 flex items-center gap-3 sm:mt-7" aria-label="Hero image selector">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className="group grid h-11 min-w-11 place-items-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeHeroIndex}
                  onClick={() => setActiveHeroIndex(index)}
                  onMouseEnter={() => setActiveHeroIndex(index)}
                  onFocus={() => setActiveHeroIndex(index)}
                >
                  <span
                    className={`h-3.5 rounded-full border border-white/70 transition-all duration-300 ${
                      index === activeHeroIndex ? 'w-10 bg-white' : 'w-3.5 bg-white/35 group-hover:bg-white/75'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <form className="hero-search-panel relative z-40 mb-10 rounded-3xl border border-white bg-white p-3 text-lune-ink shadow-[0_32px_90px_rgba(23,20,18,0.34)] ring-1 ring-stone-200/80" onSubmit={handleSearch}>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_0.9fr_220px]">
            <label className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_10px_28px_rgba(23,20,18,0.05)] sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.checkInDate')}</span>
              <span className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                <CalendarDays className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <DateInput
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  name="checkIn"
                  value={heroDates.checkIn}
                  min={today}
                  onChange={(event) => setCheckIn(event.target.value)}
                />
              </span>
            </label>
            <label className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_10px_28px_rgba(23,20,18,0.05)] sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.checkOutDate')}</span>
              <span className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                <CalendarDays className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <DateInput
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  name="checkOut"
                  value={heroDates.checkOut}
                  min={nextDay(heroDates.checkIn)}
                  onChange={(event) => setCheckOut(event.target.value)}
                />
              </span>
            </label>
            <label className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_10px_28px_rgba(23,20,18,0.05)] sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{t('common.guests')}</span>
              <span className="mt-3 flex items-center gap-3 rounded-xl bg-white px-3 py-2 ring-1 ring-stone-200">
                <Users className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                <GuestSelector
                  className="min-h-12 w-full bg-white text-base font-semibold text-lune-ink outline-none [color-scheme:light]"
                  adults={heroGuests.adults}
                  children={heroGuests.children}
                  maxGuests={4}
                  onChange={setHeroGuests}
                  t={t}
                  showIcon={false}
                />
              </span>
            </label>
            <button
              className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-[#463527] px-6 text-sm font-bold uppercase tracking-wide text-white opacity-100 shadow-[0_12px_34px_rgba(23,20,18,0.18)] transition hover:bg-lune-goldDark lg:min-h-full"
              type="submit"
            >
              {heroButtonText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            </div>
          </form>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="float" className="bg-white py-10 shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
        <div className="page-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group flex gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_16px_45px_rgba(23,20,18,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(23,20,18,0.1)]">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lune-cream text-[#4b392a] transition group-hover:bg-lune-goldDark group-hover:text-white">
                  <Icon className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-lune-ink">{item.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-left" className="bg-[#171412] py-8 text-white">
        <div className="page-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bookingProof.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <strong className="block text-3xl font-bold text-lune-gold sm:text-4xl">{item.value}</strong>
              <span className="mt-2 block text-sm leading-6 text-white/78">{item.label}</span>
            </div>
          ))}
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
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_22px_60px_rgba(23,20,18,0.08)]">
            <img src={branding.introImage} alt="Lune Boutique Apartment exterior near My Khe Beach" className="h-full min-h-[520px] w-full object-cover" />
            <div className="relative m-4 rounded-2xl bg-white p-4 shadow-soft sm:absolute sm:inset-x-5 sm:bottom-5 sm:m-0 sm:bg-white/92 sm:p-5 sm:backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lune-goldDark">{t('home.locationSnapshot')}</p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                {(Array.isArray(t('home.nearbyItems')) ? t('home.nearbyItems') : []).map((item) => (
                  <div key={item.title} className="rounded-xl bg-lune-cream p-3">
                    <strong className="block text-lune-ink">{item.title}</strong>
                    <span className="mt-1 block text-stone-600">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="eyebrow">{t('home.aboutEyebrow')}</p>
            <h2 className="section-title mt-3">{t('home.aboutTitle')}</h2>
            <p className="muted-text mt-5">
              {t('home.aboutBody', { address: branding.address, hotelName: branding.hotelName })}
            </p>
            <div className="mt-6 grid gap-3">
              {(Array.isArray(t('home.professionalHighlights')) ? t('home.professionalHighlights') : []).map((item) => (
                <div key={item} className="flex gap-3 rounded-xl border border-stone-200 bg-lune-cream/70 p-4 text-sm leading-6 text-stone-700">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['16', t('home.apartmentCountLabel')],
                ['24/7', t('trust.support')],
                ['400m', t('amenities.Near beach')],
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

      <RevealOnScroll as="section" variant="curve-left" className="section-space bg-lune-cream">
        <div className="page-shell">
          <div className="grid gap-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_22px_60px_rgba(23,20,18,0.08)] lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-center gap-5 p-6 sm:p-10">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-lune-cream px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-lune-goldDark">
                <Car className="h-4 w-4" aria-hidden="true" />
                {t('home.parkingEyebrow')}
              </span>
              <h2 className="section-title">{t('home.parkingTitle')}</h2>
              <p className="muted-text max-w-xl">{t('home.parkingBody')}</p>
              <a
                className="btn-gold w-fit"
                href={parkingMapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t('home.parkingMapCta')}
              </a>
            </div>
            <div className="relative min-h-[320px] bg-lune-cream lg:min-h-[420px]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={parkingEmbedUrl}
                title={t('home.parkingTitle')}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="float" className="section-space bg-[#f7f1e8]">
        <div className="page-shell">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="eyebrow">{t('home.galleryEyebrow')}</p>
              <h2 className="section-title mt-3">{t('home.galleryTitle')}</h2>
              <p className="mt-5 text-sm leading-7 text-stone-600">{t('home.galleryBody')}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <span className="rounded-full border border-lune-gold/30 bg-white px-4 py-2 text-sm font-semibold text-lune-ink">
                {t('home.proofBeach')}
              </span>
              <span className="rounded-full border border-lune-gold/30 bg-white px-4 py-2 text-sm font-semibold text-lune-ink">
                {t('home.proofFrontDesk')}
              </span>
            </div>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <RevealOnScroll variant="curve-left" className="relative overflow-hidden rounded-3xl shadow-[0_26px_70px_rgba(23,20,18,0.16)]">
              <img src={galleryImages[0].src} alt={galleryImages[0].alt} className="h-[420px] w-full object-cover sm:h-[560px]" loading="lazy" />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white bg-white p-5 shadow-[0_18px_50px_rgba(23,20,18,0.2)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-lune-goldDark">92-94 Thạch Lam</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-lune-ink">{t('home.galleryLocationNote')}</p>
              </div>
            </RevealOnScroll>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {galleryImages.slice(1).map((image, index) => (
                <RevealOnScroll key={image.src} variant={index % 2 === 0 ? 'curve-right' : 'zoom'} delay={index * 80} className="overflow-hidden rounded-3xl shadow-[0_18px_50px_rgba(23,20,18,0.1)]">
                  <img src={image.src} alt={image.alt} className="h-56 w-full object-cover transition duration-500 hover:scale-105 lg:h-[176px]" loading="lazy" />
                </RevealOnScroll>
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
          <div className="relative mt-10">
            {featured.length > 3 && (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-[42%] z-20 hidden h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-lune-ink shadow-[0_18px_45px_rgba(23,20,18,0.16)] transition hover:border-lune-goldDark hover:bg-lune-goldDark hover:text-white lg:flex"
                  aria-label="Previous rooms"
                  onClick={() => scrollFeaturedRooms(-1)}
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="absolute right-0 top-[42%] z-20 hidden h-12 w-12 translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-lune-ink shadow-[0_18px_45px_rgba(23,20,18,0.16)] transition hover:border-lune-goldDark hover:bg-lune-goldDark hover:text-white lg:flex"
                  aria-label="Next rooms"
                  onClick={() => scrollFeaturedRooms(1)}
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}

            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-label={t('home.chooseStay')}
              aria-live="polite"
            >
              {visibleFeaturedRooms.map((room, index) => (
                <RevealOnScroll
                  key={`${room.id}-${featuredStartIndex}`}
                  variant={index % 2 === 0 ? 'curve-left' : 'curve-right'}
                  delay={index * 90}
                  className={index === 2 ? 'sm:hidden lg:block' : ''}
                >
                  <div className="h-full">
                    <RoomCard room={room} onBook={handleBook} />
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {featured.length > 1 && (
              <div className="mt-2 flex justify-center gap-3 lg:hidden">
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-lune-ink shadow-soft"
                  aria-label="Previous rooms"
                  onClick={() => scrollFeaturedRooms(-1)}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-lune-ink shadow-soft"
                  aria-label="Next rooms"
                  onClick={() => scrollFeaturedRooms(1)}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" variant="curve-left" className="section-space bg-white">
        <div className="page-shell">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow">{t('roomDetail.amenities')}</p>
              <h2 className="section-title mt-3">{t('home.amenitiesTitle')}</h2>
              <p className="mt-5 text-sm leading-7 text-stone-600">{t('home.amenitiesBody')}</p>
              <div className="mt-6 overflow-hidden rounded-2xl">
                <img src="/images/lune/type-3-standard/type-3-standard-1.webp" alt="Bright apartment room with practical amenities" className="h-72 w-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {defaultAmenities.map((amenity, index) => {
                const Icon = amenity.icon;
                return (
                  <RevealOnScroll key={amenity.label} variant="zoom" delay={index * 70} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_14px_40px_rgba(23,20,18,0.05)]">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-lune-cream text-lune-goldDark">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-lune-ink">{t(`amenities.${amenity.label}`)}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{t(amenity.descKey)}</p>
                  </RevealOnScroll>
                );
              })}
            </div>
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
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-lune-goldDark text-white">
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
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <p className="eyebrow">{t('home.faqEyebrow')}</p>
              <h2 className="section-title mt-3">{t('home.faqTitle')}</h2>
              <p className="mt-5 text-sm leading-7 text-stone-600">{t('home.faqBody')}</p>
            </div>
            <div className="grid gap-3">
              {(Array.isArray(faqItems) ? faqItems : []).map((item, index) => (
                <RevealOnScroll key={item.question} variant={index % 2 === 0 ? 'curve-left' : 'curve-right'} delay={index * 60} className="rounded-2xl border border-stone-200 bg-lune-cream/70 p-5">
                  <h3 className="text-base font-bold text-lune-ink">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.answer}</p>
                </RevealOnScroll>
              ))}
            </div>
          </div>
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
