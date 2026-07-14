import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const adminUsername = process.env.ADMIN_USERNAME || (isProduction ? '' : 'admin');
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'luneadmin123');
const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@luneboutique.local');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const luneAddress = '92-94 Thạch Lam, Phường An Hải, Quận Sơn Trà, Đà Nẵng, Việt Nam';
const lunePhone = '+84 867 802 229';
const luneEmail = 'luneboutique92tl@gmail.com';
const luneFacebookUrl = 'https://www.facebook.com/p/Lune-Boutique-61582233127486/';
const luneInstagramUrl = 'https://www.instagram.com/lune_boutique_danang/';
const luneGoogleMapsUrl =
  'https://www.google.com/maps/search/?api=1&query=92-94%20Th%E1%BA%A1ch%20Lam%2C%20S%C6%A1n%20Tr%C3%A0%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng';

const amenities = [
  'Free Wi-Fi',
  'Air conditioning',
  'Private bathroom',
  'Balcony',
  'Kitchen',
  'Washing machine',
  'Work desk',
  'Elevator',
  'Sofa',
  'Near beach',
  'Long stay friendly',
  'Smart TV',
  'Mini fridge',
];

const roomImageSets = {
  studio: [
    '/images/lune/type-4-studio/type-4-studio-2.webp',
    '/images/lune/type-4-studio/type-4-studio-4.webp',
    '/images/lune/type-4-studio/type-4-studio-5.webp',
    '/images/lune/type-4-studio/type-4-studio-3.webp',
    '/images/lune/type-4-studio/type-4-studio-1.webp',
  ],
  r601: [
    '/images/lune/type-2-r601/type-2-r601-5.webp',
    '/images/lune/type-2-r601/type-2-r601-2.webp',
    '/images/lune/type-2-r601/type-2-r601-3.webp',
    '/images/lune/type-2-r601/type-2-r601-4.webp',
    '/images/lune/type-2-r601/type-2-r601-1.webp',
  ],
  r201: [
    '/images/lune/type-1-r201/type-1-r201-5.webp',
    '/images/lune/type-1-r201/type-1-r201-2.webp',
    '/images/lune/type-1-r201/type-1-r201-3.webp',
    '/images/lune/type-1-r201/type-1-r201-4.webp',
    '/images/lune/type-1-r201/type-1-r201-6.webp',
    '/images/lune/type-1-r201/type-1-r201-1.webp',
  ],
  type3Compact: [
    '/images/lune/type-3-standard/type-3-standard-5.webp',
    '/images/lune/type-3-standard/type-3-standard-6.webp',
    '/images/lune/type-3-standard/type-3-standard-2.webp',
    '/images/lune/type-3-standard/type-3-standard-3.webp',
    '/images/lune/type-3-standard/type-3-standard-4.webp',
    '/images/lune/type-3-standard/type-3-standard-1.webp',
  ],
  type3Kitchen: [
    '/images/lune/type-3-standard/type-3-standard-10.webp',
    '/images/lune/type-3-standard/type-3-standard-7.webp',
    '/images/lune/type-3-standard/type-3-standard-8.webp',
    '/images/lune/type-3-standard/type-3-standard-9.webp',
    '/images/lune/type-3-standard/type-3-standard-11.webp',
    '/images/lune/type-3-standard/type-3-standard-1.webp',
  ],
};

const rooms = [
  {
    id: 'one-bedroom-condo',
    slug: 'one-bedroom-condo',
    name: 'One Bedroom Apartment',
    shortDescription: 'A compact 18m² condo for solo travelers and couples close to My Khe Beach.',
    fullDescription:
      'The 1-Bedroom Condo is the easiest way to stay at Lune: a comfortable large double bed, private bathroom, air conditioning, free Wi-Fi, and the same warm boutique finishes as the larger apartments.',
    basePrice: 1056089,
    size: '18m²',
    maxGuests: 2,
    bedType: '1 large double bed',
    numberOfBeds: 1,
    sortOrder: 1,
    images: roomImageSets.studio,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
    suitableFor: ['Solo travelers', 'Couples', 'Short stays', 'Beach trips'],
    priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax).',
  },
  {
    id: 'one-bedroom-apartment-balcony',
    slug: 'one-bedroom-apartment-balcony',
    name: 'One Bedroom Studio Apartment with Balcony',
    shortDescription: 'A bright 40m² one-bedroom apartment with a private balcony and extra-long double bed.',
    fullDescription:
      'Apartment 1 pairs a private balcony with a comfortable extra-long double bed and everything two guests need day to day: air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower.',
    basePrice: 1679752,
    size: '40m²',
    maxGuests: 2,
    bedType: '1 large double bed (extra long)',
    numberOfBeds: 1,
    sortOrder: 2,
    images: roomImageSets.r601,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
    suitableFor: ['Couples', 'Short stays', 'Business travelers', 'Beach weekends'],
    priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax).',
  },
  {
    id: 'two-bedroom-apartment',
    slug: 'two-bedroom-apartment',
    name: 'Two Bedroom Apartment',
    shortDescription: 'A 52m² two-bedroom apartment with two large double beds for up to four guests.',
    fullDescription:
      'With two separate bedrooms and two large double beds across 52m², this apartment gives families and small groups real space to settle in. Air conditioning, free Wi-Fi, and a private bathroom cover the essentials.',
    basePrice: 1924357,
    size: '52m²',
    maxGuests: 4,
    bedType: '2 large double beds',
    numberOfBeds: 2,
    sortOrder: 3,
    images: roomImageSets.type3Compact,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
    suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
    priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax).',
  },
  {
    id: 'studio-two-bed-balcony',
    slug: 'studio-two-bed-balcony',
    name: 'Studio Apartment with Balcony',
    shortDescription: 'A 40m² non-smoking studio with two double beds and a private balcony.',
    fullDescription:
      'This studio fits up to four guests across two double beds, with a private balcony to unwind on. Air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower keep daily routines easy.',
    basePrice: 1924357,
    size: '40m²',
    maxGuests: 4,
    bedType: '2 double beds',
    numberOfBeds: 2,
    sortOrder: 4,
    images: roomImageSets.type3Kitchen,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
    suitableFor: ['Small groups', 'Families', 'Friends traveling together', 'Beach trips'],
    priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax).',
  },
  {
    id: 'two-bedroom-apartment-balcony',
    slug: 'two-bedroom-apartment-balcony',
    name: 'Two Bedroom Apartment With Balcony',
    shortDescription: 'The most spacious Lune apartment: 56m², two bedrooms, two bathrooms, and a private balcony.',
    fullDescription:
      'Apartment 2 is the largest option at Lune. Two bedrooms with large double beds, two private bathrooms with showers, a wardrobe, and a private balcony give families and groups a genuinely comfortable base.',
    basePrice: 2554692,
    size: '56m²',
    maxGuests: 4,
    bedType: '2 large double beds',
    numberOfBeds: 2,
    sortOrder: 5,
    images: roomImageSets.r201,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
    suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
    priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax).',
  },
];

const roomTranslations = {
  vi: {
    'one-bedroom-condo': [
      'Căn hộ 1 phòng ngủ',
      'Căn hộ 18m² gọn gàng, sạch sẽ cho khách đi một mình hoặc cặp đôi muốn ở gần biển Mỹ Khê.',
      'Căn hộ 1 phòng ngủ là lựa chọn tiện lợi nhất tại Lune: giường đôi lớn thoải mái, phòng tắm riêng, điều hòa, Wi-Fi miễn phí và phong cách boutique ấm áp như các căn hộ lớn hơn.',
    ],
    'one-bedroom-apartment-balcony': [
      'Căn hộ 1 - Một phòng ngủ có ban công',
      'Căn hộ 40m² sáng thoáng với ban công riêng, giường đôi lớn cực dài và đầy đủ tiện nghi trong phòng.',
      'Căn hộ 1 có ban công riêng, giường đôi lớn cực dài cùng mọi tiện nghi cho hai khách: điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen.',
    ],
    'two-bedroom-apartment': [
      'Căn hộ - 2 phòng ngủ',
      'Căn hộ 52m² với hai phòng ngủ và hai giường đôi lớn — thoải mái cho tối đa bốn khách.',
      'Với hai phòng ngủ riêng biệt và hai giường đôi lớn trên diện tích 52m², căn hộ này cho gia đình và nhóm nhỏ không gian sinh hoạt thực sự thoải mái.',
    ],
    'studio-two-bed-balcony': [
      'Căn hộ Studio 2 giường có ban công',
      'Studio 40m² không hút thuốc với hai giường đôi và ban công riêng — lựa chọn quen thuộc của nhóm nhỏ.',
      'Studio này đón tối đa bốn khách với hai giường đôi và ban công riêng để thư giãn. Điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen.',
    ],
    'two-bedroom-apartment-balcony': [
      'Căn hộ 2 - Hai phòng ngủ có ban công',
      'Căn hộ rộng nhất của Lune: 56m², hai phòng ngủ, hai phòng tắm và ban công riêng cho tối đa bốn khách.',
      'Căn hộ 2 là lựa chọn lớn nhất tại Lune. Hai phòng ngủ với giường đôi lớn, hai phòng tắm riêng có vòi sen, tủ quần áo và ban công riêng cho gia đình và nhóm khách.',
    ],
  },
  zh: {
    'one-bedroom-condo': ['一卧室公寓', '18平方米的紧凑公寓，适合独行旅客和情侣，靠近美溪海滩。', '一卧室公寓配有舒适的大号双人床、独立浴室、空调和免费 Wi-Fi，保留 Lune 温暖的精品公寓风格。'],
    'one-bedroom-apartment-balcony': ['带阳台一卧室公寓 1', '明亮的40平方米一卧室公寓，带私人阳台、加长双人床和齐全的房内设施。', '1号公寓配有私人阳台、加长双人床、空调、免费 Wi-Fi、小冰箱、电热水壶、吹风机和带淋浴的独立浴室。'],
    'two-bedroom-apartment': ['两卧室公寓', '52平方米两卧室公寓，配有两张大号双人床，最多可入住四位客人。', '公寓拥有两间独立卧室和两张大号双人床，52平方米的空间让家庭和小团体住得宽敞自在。'],
    'studio-two-bed-balcony': ['带阳台双床开放式公寓', '40平方米无烟开放式公寓，配有两张双人床和私人阳台。', '公寓配有两张双人床，最多可入住四位客人，并设有私人阳台、空调、免费 Wi-Fi、小冰箱、电热水壶和吹风机。'],
    'two-bedroom-apartment-balcony': ['带阳台两卧室公寓 2', 'Lune 最宽敞的公寓：56平方米、两间卧室、两个浴室和私人阳台。', '2号公寓是 Lune 最大的房型。两间卧室配大号双人床，两个带淋浴的独立浴室、衣柜和私人阳台。'],
  },
  ko: {
    'one-bedroom-condo': ['원 베드룸 콘도', '미케 비치 근처의 아늑한 18m² 콘도로, 1인 여행객과 커플에게 적합합니다.', '편안한 라지 더블베드, 전용 욕실, 에어컨, 무료 Wi-Fi를 갖춘 콘도로 Lune 특유의 따뜻한 부티크 감성을 담았습니다.'],
    'one-bedroom-apartment-balcony': ['발코니 1베드룸 아파트 1', '전용 발코니와 엑스트라 롱 더블베드를 갖춘 밝은 40m² 아파트입니다.', '아파트 1은 전용 발코니, 엑스트라 롱 더블베드, 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어, 샤워 시설을 갖춘 전용 욕실을 제공합니다.'],
    'two-bedroom-apartment': ['투 베드룸 아파트', '라지 더블베드 2개를 갖춘 52m² 투 베드룸 아파트로 최대 4인까지 숙박 가능합니다.', '독립된 침실 2개와 라지 더블베드 2개를 갖춘 52m² 아파트로 가족과 소그룹이 여유롭게 지낼 수 있습니다.'],
    'studio-two-bed-balcony': ['발코니 스튜디오 (더블베드 2개)', '더블베드 2개와 전용 발코니를 갖춘 40m² 금연 스튜디오입니다.', '더블베드 2개로 최대 4인까지 머물 수 있으며 전용 발코니, 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어를 갖췄습니다.'],
    'two-bedroom-apartment-balcony': ['발코니 아파트 2 (투 베드룸)', 'Lune에서 가장 넓은 아파트: 56m², 침실 2개, 욕실 2개, 전용 발코니.', '아파트 2는 Lune의 가장 큰 객실입니다. 라지 더블베드를 갖춘 침실 2개, 전용 욕실 2개, 옷장, 전용 발코니를 제공합니다.'],
  },
};

const paymentMethods = {
  payAtProperty: { enabled: true, visibleForGuests: true, displayName: 'Pay at property', sortOrder: 1, statusAfterConfirm: 'PAY_AT_PROPERTY' },
  cashAtProperty: { enabled: true, visibleForGuests: true, displayName: 'Cash at property', sortOrder: 2, statusAfterConfirm: 'PAY_AT_PROPERTY' },
  bankTransfer: {
    enabled: true,
    visibleForGuests: true,
    displayName: 'Bank transfer Vietnam',
    sortOrder: 3,
    statusAfterConfirm: 'PENDING',
    bankName: 'PLACEHOLDER_BANK_NAME',
    accountNumber: 'PLACEHOLDER_ACCOUNT_NUMBER',
    accountHolder: 'LUNE BOUTIQUE HOTEL',
    transferContentTemplate: 'Dang Trung Vuong chuyen tien',
    qrImageUrl: '',
  },
  vietQr: { enabled: false, visibleForGuests: true, displayName: 'VietQR', sortOrder: 4, statusAfterConfirm: 'PENDING' },
  creditCard: { enabled: true, visibleForGuests: true, displayName: 'International card', sortOrder: 5, statusAfterConfirm: 'PENDING' },
  stripe: { enabled: false, visibleForGuests: true, displayName: 'Stripe', sortOrder: 6, backendEndpoint: '/api/payments/stripe/create', statusAfterConfirm: 'PENDING' },
  paypal: { enabled: false, visibleForGuests: true, displayName: 'PayPal', sortOrder: 7, backendEndpoint: '/api/payments/paypal/create', statusAfterConfirm: 'PENDING' },
  vnpay: { enabled: false, visibleForGuests: true, displayName: 'VNPay', sortOrder: 8, backendEndpoint: '/api/payments/vnpay/create', statusAfterConfirm: 'PENDING' },
  momo: { enabled: false, visibleForGuests: true, displayName: 'MoMo', sortOrder: 9, backendEndpoint: '/api/payments/momo/create', statusAfterConfirm: 'PENDING' },
  zaloPay: { enabled: false, visibleForGuests: true, displayName: 'ZaloPay', sortOrder: 10, backendEndpoint: '/api/payments/zalopay/create', statusAfterConfirm: 'PENDING' },
  internationalTransfer: { enabled: false, visibleForGuests: true, displayName: 'International transfer', sortOrder: 11, statusAfterConfirm: 'PENDING' },
};

const siteSettings = {
  branding: {
    hotelName: 'Lune Boutique Hotel & Apartment Da Nang',
    slogan: 'Boutique apartments near My Khe Beach',
    address: luneAddress,
    phone: lunePhone,
    email: luneEmail,
    logoUrl: '/images/lune/logo-lune.png',
    heroImage: '/images/lune/exterior/exterior-1.webp',
    introImage: '/images/lune/exterior/exterior-2.webp',
    facebookUrl: luneFacebookUrl,
    instagramUrl: luneInstagramUrl,
    googleMapsUrl: luneGoogleMapsUrl,
    homeHeroTitle: 'Feel at home, away from home',
    homeHeroSubtitle:
      'Boutique hotel and apartment stays near My Khe Beach with kitchen-equipped rooms, free Wi-Fi, daily housekeeping, and direct Lune support.',
    footerDescription:
      'Boutique hotel and apartment stays near My Khe Beach with kitchen-equipped rooms, free Wi-Fi, daily housekeeping, and direct Lune support.',
  },
  contact: {
    phone: lunePhone,
    email: luneEmail,
    zaloNumber: '',
    whatsappNumber: '',
    facebookUrl: luneFacebookUrl,
    googleMapsUrl: luneGoogleMapsUrl,
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
    enabledLanguages: ['en', 'vi', 'zh', 'zh-TW', 'ko', 'ja', 'th', 'ru', 'fr', 'de', 'es', 'it', 'id', 'ms', 'ar', 'hi'],
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

async function seedAdmin() {
  if (!adminUsername || !adminPassword || !adminEmail) {
    throw new Error('ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_EMAIL are required before seeding production.');
  }

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  if (existing) {
    await prisma.user.update({
      where: { username: adminUsername },
      data: {
        name: 'Lune Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Lune Admin',
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
}

async function seedAmenities() {
  await Promise.all(
    amenities.map((name) =>
      prisma.amenity.upsert({
        where: { key: name },
        update: {},
        create: { key: name },
      }),
    ),
  );
}

async function ensureRoomImages(roomId, room) {
  const existingCount = await prisma.roomImage.count({ where: { roomId } });
  if (existingCount > 0) return;

  await prisma.roomImage.createMany({
    data: room.images.map((url, index) => ({
      roomId,
      url,
      altText: room.name,
      isMain: index === 0,
      sortOrder: index + 1,
    })),
  });
}

async function ensureRoomTranslations(roomId, room) {
  await prisma.roomTranslation.upsert({
    where: { roomId_languageCode: { roomId, languageCode: 'en' } },
    update: {
      name: room.name,
    },
    create: {
      roomId,
      languageCode: 'en',
      name: room.name,
      shortDescription: room.shortDescription,
      fullDescription: room.fullDescription,
      priceNote: room.priceNote,
      policiesJson: ['Check-in from 14:00', 'Check-out before 12:00', 'No smoking inside the room'],
      suitableForJson: room.suitableFor,
    },
  });

  for (const languageCode of ['vi', 'zh', 'ko']) {
    const translation = roomTranslations[languageCode]?.[room.slug];
    if (!translation) continue;
    const [name, shortDescription, fullDescription] = translation;
    await prisma.roomTranslation.upsert({
      where: { roomId_languageCode: { roomId, languageCode } },
      update: {
        name,
      },
      create: {
        roomId,
        languageCode,
        name,
        shortDescription,
        fullDescription,
        priceNote: room.priceNote,
        policiesJson: [],
        suitableForJson: [],
      },
    });
  }
}

async function ensureRoomAmenities(roomId, room) {
  const amenityRows = await prisma.amenity.findMany({ where: { key: { in: room.amenities } } });
  await prisma.roomAmenity.createMany({
    data: amenityRows.map((amenity) => ({ roomId, amenityId: amenity.id })),
    skipDuplicates: true,
  });
}

// Slugs from earlier catalogs that are no longer sold. Hidden on seed so the
// public API stops returning them, while their rows (and any booking history
// that references them) stay in the database.
const retiredRoomSlugs = [
  'deluxe-studio',
  'superior-apartment',
  'family-apartment',
  'long-stay-apartment',
  'type-3-kitchen-apartment',
  'premier-king-apartment',
];

async function seedRooms() {
  for (const room of rooms) {
    const saved = await prisma.room.upsert({
      where: { slug: room.slug },
      update: {
        name: room.name,
      },
      create: {
        id: room.id,
        slug: room.slug,
        name: room.name,
        shortDescription: room.shortDescription,
        fullDescription: room.fullDescription,
        basePrice: room.basePrice,
        size: room.size,
        maxGuests: room.maxGuests,
        bedType: room.bedType,
        numberOfBeds: room.numberOfBeds,
        status: 'ACTIVE',
        isFeatured: true,
        sortOrder: room.sortOrder,
      },
    });

    await ensureRoomImages(saved.id, room);
    await ensureRoomTranslations(saved.id, room);
    await ensureRoomAmenities(saved.id, room);
  }

  await prisma.room.updateMany({
    where: { slug: { in: retiredRoomSlugs } },
    data: { status: 'HIDDEN' },
  });
}

async function seedPayments() {
  for (const [key, config] of Object.entries(paymentMethods)) {
    await prisma.paymentMethodSetting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        displayName: config.displayName,
        description: config.description || null,
        enabled: config.enabled,
        visibleForGuests: config.visibleForGuests,
        sortOrder: config.sortOrder,
        configJson: config,
      },
    });
  }
}

// Bump when the seeded branding/contact/policies defaults change and the live DB
// should be refreshed to match. Existing keys are only overwritten when the marker
// differs, so admin edits made between version bumps are preserved.
const SETTINGS_SEED_VERSION = '2026-07-08-lune-real-contact';

async function seedSettings() {
  const marker = await prisma.siteSetting.findUnique({ where: { key: '_settingsSeedVersion' } });
  const refresh = marker?.valueJson !== SETTINGS_SEED_VERSION;

  for (const [key, value] of Object.entries(siteSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: refresh ? { valueJson: value } : {},
      create: { key, valueJson: value },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: '_settingsSeedVersion' },
    update: { valueJson: SETTINGS_SEED_VERSION },
    create: { key: '_settingsSeedVersion', valueJson: SETTINGS_SEED_VERSION },
  });
}

async function main() {
  await seedAdmin();
  await seedAmenities();
  await seedRooms();
  await seedPayments();
  await seedSettings();
  console.log(`Lune seed data ensured. Admin username: ${adminUsername}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
