import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const adminUsername = process.env.ADMIN_USERNAME || (isProduction ? '' : 'admin');
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'luneadmin123');
const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@luneboutique.local');
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

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
    id: 'deluxe-studio',
    slug: 'deluxe-studio',
    name: 'One Bedroom Studio Apartment',
    shortDescription: 'A compact, polished studio for solo travelers and couples close to My Khe Beach.',
    fullDescription:
      'This studio is designed for easy short stays with a comfortable king bed, private bathroom, smart storage, bright finishes, and the calm boutique feeling guests expect from Lune.',
    basePrice: 860000,
    size: '20m²',
    maxGuests: 2,
    bedType: '1 king bed',
    numberOfBeds: 1,
    sortOrder: 1,
    images: roomImageSets.studio,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
    suitableFor: ['Solo travelers', 'Couples', 'Short stays', 'Beach trips'],
    priceNote: 'Room Type 4 rate: 860,000 VND per night.',
  },
  {
    id: 'superior-apartment',
    slug: 'superior-apartment',
    name: '1-Bedroom Apartment with Balcony - R601',
    shortDescription: 'A bright one-bedroom apartment with balcony-style comfort and warm wood details.',
    fullDescription:
      'R601 is a balanced apartment for couples and short stays with a queen bed, private bathroom, sitting corner, natural light, elevator access, and an easy location near restaurants, marts, and the beach.',
    basePrice: 1100000,
    size: '40m²',
    maxGuests: 2,
    bedType: '1 queen bed',
    numberOfBeds: 1,
    sortOrder: 2,
    images: roomImageSets.r601,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
    suitableFor: ['Couples', 'Short stays', 'Business travelers', 'Beach weekends'],
    priceNote: 'Room Type 2 R601 rate: 1,100,000 VND per night.',
  },
  {
    id: 'family-apartment',
    slug: 'family-apartment',
    name: 'Family Balcony Apartment - R201',
    shortDescription: 'A generous apartment for families or groups, with two beds and two bathrooms.',
    fullDescription:
      'R201 is the most spacious Lune option for families and groups. It offers two queen beds, two private bathrooms, warm lighting, thoughtful storage, and room to relax after the beach or a full day exploring Da Nang.',
    basePrice: 2000000,
    size: '56m²',
    maxGuests: 4,
    bedType: '2 queen beds',
    numberOfBeds: 2,
    sortOrder: 3,
    images: roomImageSets.r201,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
    suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
    priceNote: 'Room Type 1 R201 rate: 2,000,000 VND per night.',
  },
  {
    id: 'long-stay-apartment',
    slug: 'long-stay-apartment',
    name: 'Deluxe Double Apartment, City View',
    shortDescription: 'A refined double apartment with city-view comfort for couples and two guests.',
    fullDescription:
      'This deluxe apartment combines Lune’s warm boutique design with everyday convenience: a comfortable bed, seating area, kitchenette-style amenities, strong shower, and an easy location near My Khe Beach, seafood restaurants, convenience stores, and local cafés.',
    basePrice: 1600000,
    size: '40m²',
    maxGuests: 2,
    bedType: '1 king bed',
    numberOfBeds: 1,
    sortOrder: 4,
    images: roomImageSets.type3Compact,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
    suitableFor: ['Couples', 'Two guests', 'Business travelers', 'Short stays'],
    priceNote: 'Room Type 3 rate: 1,600,000 VND per night.',
  },
  {
    id: 'type-3-kitchen-apartment',
    slug: 'type-3-kitchen-apartment',
    name: 'Type 3 Kitchen Apartment',
    shortDescription: 'A Type 3 apartment with a more open kitchen and living layout.',
    fullDescription:
      'This Type 3 kitchen apartment is a separate room style from the compact double layout. It features a brighter open space, kitchen area, sofa-style living corner, washing machine, private bathroom, and the same convenient Lune location near the beach.',
    basePrice: 1600000,
    size: '45m²',
    maxGuests: 3,
    bedType: '1 king bed + sofa area',
    numberOfBeds: 1,
    sortOrder: 5,
    images: roomImageSets.type3Kitchen,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
    suitableFor: ['Couples', 'Small families', 'Long stays', 'Guests who want a kitchen'],
    priceNote: 'Type 3 kitchen apartment rate: 1,600,000 VND per night.',
  },
];

const roomTranslations = {
  vi: {
    'deluxe-studio': [
      'Studio một phòng ngủ',
      'Phòng studio gọn đẹp, sạch sẽ, phù hợp khách đi một mình hoặc cặp đôi muốn ở gần biển Mỹ Khê.',
      'Studio được thiết kế cho kỳ lưu trú ngắn ngày với giường king thoải mái, phòng tắm riêng, không gian sáng, tiện ích gọn gàng và cảm giác boutique ấm áp.',
    ],
    'superior-apartment': [
      'Căn hộ 1 phòng ngủ có ban công - R601',
      'Căn hộ một phòng ngủ sáng, ấm, có cảm giác ban công và đủ rộng để nghỉ ngơi thoải mái.',
      'R601 phù hợp cho cặp đôi và khách lưu trú ngắn ngày, có giường queen, phòng tắm riêng, góc ngồi, ánh sáng tự nhiên, thang máy và vị trí thuận tiện gần nhà hàng, cửa hàng tiện lợi và biển.',
    ],
    'family-apartment': [
      'Căn hộ gia đình có ban công - R201',
      'Căn hộ rộng cho gia đình hoặc nhóm bạn, có hai giường, hai phòng tắm và bố cục như ở nhà.',
      'R201 là lựa chọn rộng rãi nhất của Lune cho gia đình hoặc nhóm khách, có hai giường queen, hai phòng tắm riêng và khu vực thư giãn sau một ngày đi biển hoặc khám phá Đà Nẵng.',
    ],
    'long-stay-apartment': [
      'Căn hộ Deluxe Double hướng phố',
      'Căn hộ giường đôi hướng phố, phù hợp cho cặp đôi hoặc 2 khách muốn lưu trú gọn gàng và yên tĩnh.',
      'Căn hộ Deluxe Double sử dụng bố cục loại 3 gọn gàng với giường king thoải mái, chi tiết gỗ ấm, bàn làm việc, tủ đồ, phòng tắm riêng và vị trí thuận tiện gần biển Mỹ Khê.',
    ],
    'type-3-kitchen-apartment': [
      'Căn hộ loại 3 có bếp',
      'Căn hộ loại 3 với bố cục bếp và khu sinh hoạt thoáng hơn, phù hợp khách muốn tiện nghi như ở nhà.',
      'Đây là phong cách phòng riêng biệt với phòng Deluxe Double loại 3. Phòng có không gian sáng hơn, khu bếp, góc sofa, máy giặt, phòng tắm riêng và vị trí thuận tiện gần biển.',
    ],
  },
  zh: {
    'deluxe-studio': ['一卧室单间公寓', '精致干净的单间公寓，适合独行旅客和情侣，靠近美溪海滩。', '此房型适合轻松短住，配有舒适大床、独立浴室、实用收纳和明亮设计。'],
    'superior-apartment': ['一卧室阳台公寓 - R601', '明亮的一卧室公寓，带阳台感和温暖木质细节。', 'R601 适合情侣和短期入住，配有大床、独立浴室、休息角、自然采光、电梯，并靠近餐厅、便利店和海滩。'],
    'family-apartment': ['家庭阳台公寓 - R201', '宽敞的家庭或团体公寓，配有两张床和两个浴室。', 'R201 是 Lune 最宽敞的房型，适合家庭和团体。配有两张大床、两个独立浴室、温暖灯光和舒适休息空间。'],
    'long-stay-apartment': ['豪华双人城市景观公寓', '精致的城市景观双人公寓，适合情侣或两位客人安静入住。', '此豪华双人公寓采用紧凑的 3 类房布局，配有舒适大床、温暖木质细节、书桌、衣柜、独立浴室，并靠近美溪海滩。'],
    'type-3-kitchen-apartment': ['3类厨房公寓', '3类公寓，拥有更开放的厨房和生活空间，适合希望拥有更多日常便利的客人。', '这是一种不同于紧凑双人 3 类房的房型，配有更明亮的开放空间、厨房区、沙发角、洗衣机、独立浴室，并靠近海滩。'],
  },
  ko: {
    'deluxe-studio': ['원 베드룸 스튜디오 아파트', '미케 비치 근처에서 깨끗하고 실용적인 객실을 원하는 1인 여행객과 커플에게 적합합니다.', '편안한 킹베드, 전용 욕실, 밝은 마감과 실용적인 수납을 갖춘 짧은 숙박용 스튜디오입니다.'],
    'superior-apartment': ['발코니형 1베드룸 아파트 - R601', '밝은 1베드룸 아파트로 따뜻한 우드 디테일과 여유로운 휴식 공간을 제공합니다.', 'R601은 커플과 단기 숙박에 적합하며 퀸베드, 전용 욕실, 휴식 코너, 자연 채광, 엘리베이터 접근성을 갖췄습니다.'],
    'family-apartment': ['패밀리 발코니 아파트 - R201', '가족 또는 그룹을 위한 넓은 아파트로 침대 2개와 욕실 2개를 갖췄습니다.', 'R201은 가족과 그룹을 위한 Lune의 가장 넓은 객실입니다. 퀸베드 2개, 전용 욕실 2개와 여유 공간을 제공합니다.'],
    'long-stay-apartment': ['디럭스 더블 아파트, 시티뷰', '커플 또는 2인 고객에게 적합한 조용하고 아늑한 시티뷰 더블 아파트입니다.', '디럭스 더블 아파트는 컴팩트한 3번 객실 타입으로, 편안한 킹베드, 따뜻한 우드 디테일, 업무용 책상, 수납공간, 전용 욕실을 갖추고 미케 비치와 가깝습니다.'],
    'type-3-kitchen-apartment': ['3번 타입 키친 아파트', '더 넓은 주방과 생활 공간을 갖춘 3번 타입 아파트로, 일상 편의를 원하는 고객에게 적합합니다.', '컴팩트한 3번 더블 타입과 다른 별도 객실 스타일입니다. 밝은 오픈 공간, 주방, 소파 코너, 세탁기, 전용 욕실을 갖추고 해변과 가까운 위치에 있습니다.'],
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
    transferContentTemplate: 'LUNE-{bookingCode}-{guestName}',
    qrImageUrl: '',
  },
  vietQr: { enabled: false, visibleForGuests: true, displayName: 'VietQR', sortOrder: 4, statusAfterConfirm: 'PENDING' },
  creditCard: { enabled: false, visibleForGuests: true, displayName: 'Credit/Debit Card', sortOrder: 5, statusAfterConfirm: 'PENDING' },
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
    slogan: 'Your peaceful stay near My Khe Beach',
    address: '92-94 Thạch Lam, Sơn Trà, Đà Nẵng, Việt Nam',
    phone: '+84 000 000 000',
    email: 'hello@luneboutique.example',
    logoUrl: '/images/lune/logo-lune.png',
    heroImage: '/images/lune/exterior/exterior-1.webp',
    introImage: '/images/lune/exterior/exterior-2.webp',
    homeHeroTitle: 'Feel at home, away from home',
    homeHeroSubtitle: 'Warm boutique apartments near My Khe Beach with thoughtful details, clean rooms, and direct Lune support.',
    footerDescription: 'New, clean boutique apartments near My Khe Beach in Da Nang.',
  },
  contact: {
    phone: '+84 000 000 000',
    email: 'hello@luneboutique.example',
    zaloNumber: '',
    whatsappNumber: '',
    facebookUrl: '',
    googleMapsUrl: '',
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
  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
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
    update: {},
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
      update: {},
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

async function seedRooms() {
  for (const room of rooms) {
    const saved = await prisma.room.upsert({
      where: { slug: room.slug },
      update: {},
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

async function seedSettings() {
  for (const [key, value] of Object.entries(siteSettings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, valueJson: value },
    });
  }
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
