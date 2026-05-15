import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adminPassword = 'luneadmin123';
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
];

const rooms = [
  {
    id: 'deluxe-studio',
    slug: 'deluxe-studio',
    name: 'Deluxe Studio',
    shortDescription: 'A bright studio for two guests near the beach.',
    fullDescription: 'A clean, modern studio with a queen bed, private bathroom, work corner, and everything needed for a comfortable Da Nang stay.',
    basePrice: 850000,
    size: '32m²',
    maxGuests: 2,
    bedType: '1 queen bed',
    numberOfBeds: 1,
    sortOrder: 1,
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1598928636135-d146006ff4be?auto=format&fit=crop&w=1400&q=80',
    ],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
  },
  {
    id: 'superior-apartment',
    slug: 'superior-apartment',
    name: 'Superior Apartment',
    shortDescription: 'A comfortable apartment for couples and short stays.',
    fullDescription: 'A spacious apartment with warm finishes, a queen bed, private bathroom, seating area, and quiet atmosphere for leisure or work trips.',
    basePrice: 990000,
    size: '40m²',
    maxGuests: 2,
    bedType: '1 queen bed',
    numberOfBeds: 1,
    sortOrder: 2,
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    ],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
  },
  {
    id: 'family-apartment',
    slug: 'family-apartment',
    name: 'Family Apartment',
    shortDescription: 'A larger apartment for families or small groups.',
    fullDescription: 'A family-friendly apartment with two beds, generous space, private bathroom, sofa area, and easy access to Lune support.',
    basePrice: 1350000,
    size: '56m²',
    maxGuests: 4,
    bedType: '2 beds',
    numberOfBeds: 2,
    sortOrder: 3,
    images: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1560185009-dddeb820c7b7?auto=format&fit=crop&w=1400&q=80',
    ],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
  },
  {
    id: 'long-stay-apartment',
    slug: 'long-stay-apartment',
    name: 'Long Stay Apartment',
    shortDescription: 'A practical apartment for longer stays in Da Nang.',
    fullDescription: 'Designed for longer visits with a kitchen, washing machine, comfortable bed, work desk, and a calm boutique apartment feel.',
    basePrice: 1150000,
    size: '45m²',
    maxGuests: 2,
    bedType: '1 queen bed',
    numberOfBeds: 1,
    sortOrder: 4,
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80',
    ],
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Work desk', 'Long stay friendly'],
  },
];

const roomTranslations = {
  vi: {
    'deluxe-studio': ['Studio Deluxe', 'Studio sáng sủa cho hai khách gần biển.', 'Studio hiện đại, sạch sẽ với giường queen, phòng tắm riêng và góc làm việc.'],
    'superior-apartment': ['Căn hộ Superior', 'Căn hộ thoải mái cho cặp đôi và kỳ nghỉ ngắn.', 'Căn hộ rộng rãi với phong cách ấm áp, giường queen, phòng tắm riêng và khu vực tiếp khách.'],
    'family-apartment': ['Căn hộ Gia đình', 'Căn hộ rộng hơn cho gia đình hoặc nhóm nhỏ.', 'Căn hộ phù hợp gia đình với hai giường, không gian thoáng và hỗ trợ trực tiếp từ Lune.'],
    'long-stay-apartment': ['Căn hộ Lưu trú dài ngày', 'Căn hộ tiện nghi cho kỳ lưu trú dài tại Đà Nẵng.', 'Thiết kế cho chuyến đi dài với bếp, máy giặt, bàn làm việc và cảm giác boutique yên tĩnh.'],
  },
  zh: {
    'deluxe-studio': ['豪华一室公寓', '适合两位客人的明亮海边一室公寓。', '现代洁净的一室公寓，配有大床、独立浴室和工作区。'],
    'superior-apartment': ['高级公寓', '适合情侣和短期入住的舒适公寓。', '宽敞温馨的公寓，配有大床、独立浴室和休息区。'],
    'family-apartment': ['家庭公寓', '适合家庭或小团体的较大公寓。', '家庭友好型公寓，配有两张床、宽敞空间和 Lune 团队支持。'],
    'long-stay-apartment': ['长住公寓', '适合在岘港长期入住的实用公寓。', '配有厨房、洗衣机、工作桌和舒适大床，适合长期住宿。'],
  },
  ko: {
    'deluxe-studio': ['디럭스 스튜디오', '해변 근처의 밝은 2인용 스튜디오입니다.', '퀸 침대, 전용 욕실, 업무 공간을 갖춘 깨끗하고 현대적인 스튜디오입니다.'],
    'superior-apartment': ['슈페리어 아파트', '커플과 단기 숙박에 적합한 편안한 아파트입니다.', '퀸 침대, 전용 욕실, 휴식 공간이 있는 넓고 따뜻한 분위기의 아파트입니다.'],
    'family-apartment': ['패밀리 아파트', '가족 또는 소규모 그룹을 위한 넓은 아파트입니다.', '두 개의 침대와 넉넉한 공간, Lune 팀의 직접 지원을 갖춘 가족 친화형 아파트입니다.'],
    'long-stay-apartment': ['장기 숙박 아파트', '다낭 장기 체류에 적합한 실용적인 아파트입니다.', '주방, 세탁기, 업무용 책상, 편안한 침대를 갖춘 장기 숙박용 아파트입니다.'],
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
    slogan: 'A boutique apartment experience near the beach',
    address: '92-94 Thạch Lam, Sơn Trà, Đà Nẵng, Việt Nam',
    phone: '+84 000 000 000',
    email: 'hello@luneboutique.example',
    logoUrl: '',
    homeHeroTitle: 'Stay Comfortably in Da Nang',
    homeHeroSubtitle: 'A boutique apartment experience near the beach',
    footerDescription: 'Modern boutique apartments near the beach in Da Nang.',
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
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash, role: 'ADMIN', isActive: true },
    create: {
      name: 'Lune Admin',
      email: 'admin@luneboutique.local',
      username: 'admin',
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

async function seedRooms() {
  for (const room of rooms) {
    const saved = await prisma.room.upsert({
      where: { slug: room.slug },
      update: {
        name: room.name,
        shortDescription: room.shortDescription,
        fullDescription: room.fullDescription,
        basePrice: room.basePrice,
        size: room.size,
        maxGuests: room.maxGuests,
        bedType: room.bedType,
        numberOfBeds: room.numberOfBeds,
        status: 'ACTIVE',
        sortOrder: room.sortOrder,
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

    await prisma.roomImage.deleteMany({ where: { roomId: saved.id } });
    await prisma.roomTranslation.deleteMany({ where: { roomId: saved.id } });
    await prisma.roomAmenity.deleteMany({ where: { roomId: saved.id } });

    await prisma.roomImage.createMany({
      data: room.images.map((url, index) => ({
        roomId: saved.id,
        url,
        altText: room.name,
        isMain: index === 0,
        sortOrder: index + 1,
      })),
    });

    await prisma.roomTranslation.create({
      data: {
        roomId: saved.id,
        languageCode: 'en',
        name: room.name,
        shortDescription: room.shortDescription,
        fullDescription: room.fullDescription,
        priceNote: 'Final payment is charged in VND.',
        policiesJson: ['Check-in from 14:00', 'Check-out before 12:00', 'No smoking inside the room'],
        suitableForJson: ['Couples', 'Short stays', 'Beach trips'],
      },
    });

    for (const languageCode of ['vi', 'zh', 'ko']) {
      const [name, shortDescription, fullDescription] = roomTranslations[languageCode][room.slug];
      await prisma.roomTranslation.create({
        data: {
          roomId: saved.id,
          languageCode,
          name,
          shortDescription,
          fullDescription,
          priceNote: 'Final payment is charged in VND.',
          policiesJson: [],
          suitableForJson: [],
        },
      });
    }

    const amenityRows = await prisma.amenity.findMany({ where: { key: { in: room.amenities } } });
    await prisma.roomAmenity.createMany({
      data: amenityRows.map((amenity) => ({ roomId: saved.id, amenityId: amenity.id })),
      skipDuplicates: true,
    });
  }
}

async function seedPayments() {
  for (const [key, config] of Object.entries(paymentMethods)) {
    await prisma.paymentMethodSetting.upsert({
      where: { key },
      update: {
        displayName: config.displayName,
        enabled: config.enabled,
        visibleForGuests: config.visibleForGuests,
        sortOrder: config.sortOrder,
        configJson: config,
      },
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
      update: { valueJson: value },
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
  console.log('Lune seed data created. Admin username: admin, password: luneadmin123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
