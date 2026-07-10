import { prisma } from '../../config/prisma.js';

const googleMapsUrl =
  'https://www.google.com/maps/search/?api=1&query=92-94%20Th%E1%BA%A1ch%20Lam%2C%20S%C6%A1n%20Tr%C3%A0%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng';
const facebookUrl = 'https://www.facebook.com/p/Lune-Boutique-61582233127486/';
const instagramUrl = 'https://www.instagram.com/lune_boutique_danang/';

export const defaultSettings = {
  branding: {
    hotelName: 'Lune Boutique Hotel & Apartment Da Nang',
    slogan: 'Boutique apartments near My Khe Beach',
    address: '92-94 Thạch Lam, Phường An Hải, Quận Sơn Trà, Đà Nẵng, Việt Nam',
    phone: '+84 867 802 229',
    email: 'luneboutique92tl@gmail.com',
    logoUrl: '',
    facebookUrl,
    instagramUrl,
    zaloNumber: '',
    whatsappNumber: '',
    googleMapsUrl,
    homeHeroTitle: 'Stay Comfortably in Da Nang',
    homeHeroSubtitle:
      'Boutique hotel and apartment stays near My Khe Beach with kitchen-equipped rooms, free Wi-Fi, daily housekeeping, and direct Lune support.',
    footerDescription:
      'Boutique hotel and apartment stays near My Khe Beach with kitchen-equipped rooms, free Wi-Fi, daily housekeeping, and direct Lune support.',
  },
  contact: {
    phone: '+84 867 802 229',
    email: 'luneboutique92tl@gmail.com',
    zaloNumber: '',
    whatsappNumber: '',
    facebookUrl,
    googleMapsUrl,
  },
  policies: {
    checkIn: 'Check-in from 14:00',
    checkOut: 'Check-out before 12:00',
    earlyCheckIn: 'Early check-in is subject to availability',
    smoking: 'No smoking inside the room',
    pets: 'Pets are not allowed',
    paymentConfirmation: 'Payment confirmation may be required for selected payment methods',
    contactAfterBooking: 'Our team will contact you shortly after receiving your booking',
  },
  languages: {
    defaultLanguage: 'en',
    enabledLanguages: ['en', 'vi', 'zh', 'ko', 'ja', 'zh-TW', 'th', 'ru', 'fr', 'de', 'es', 'it', 'id', 'ms'],
  },
  currency: {
    baseCurrency: 'VND',
    defaultDisplayCurrency: 'USD',
    liveRatesEnabled: true,
    supportedCurrencies: ['VND', 'USD', 'EUR', 'GBP', 'CNY', 'TWD', 'KRW', 'JPY', 'THB', 'RUB', 'AUD', 'SGD', 'MYR', 'IDR', 'INR'],
  },
  chat: {
    enabled: true,
    supportName: 'Lune Support',
    statusText: 'Usually replies shortly',
    quickQuestionsEnabled: true,
    browserNotificationsEnabled: false,
  },
  website: {
    status: 'online',
    directBookingEnabled: true,
    roomAvailabilityEnabled: true,
    scrollAnimationsEnabled: true,
  },
};

export async function ensureDefaultSettings() {
  await Promise.all(
    Object.entries(defaultSettings).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: {},
        create: { key, valueJson: value },
      }),
    ),
  );
}

export async function getSetting(key) {
  await ensureDefaultSettings();
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return setting?.valueJson ?? defaultSettings[key] ?? {};
}

export async function getAllSettings() {
  await ensureDefaultSettings();
  const rows = await prisma.siteSetting.findMany();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.valueJson;
    return acc;
  }, {});
}

export async function getPublicSettings() {
  const settings = await getAllSettings();
  return {
    branding: settings.branding,
    contact: settings.contact,
    policies: settings.policies,
    languages: settings.languages,
    currency: settings.currency,
    chat: settings.chat,
    website: settings.website,
  };
}

export async function saveSetting(key, value) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { valueJson: value },
    create: { key, valueJson: value },
  });
}
