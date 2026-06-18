const luneImages = {
  exterior: ['/images/lune/exterior/exterior-1.webp', '/images/lune/exterior/exterior-2.webp'],
  type1R201: [
    '/images/lune/type-1-r201/type-1-r201-5.webp',
    '/images/lune/type-1-r201/type-1-r201-2.webp',
    '/images/lune/type-1-r201/type-1-r201-3.webp',
    '/images/lune/type-1-r201/type-1-r201-4.webp',
    '/images/lune/type-1-r201/type-1-r201-6.webp',
    '/images/lune/type-1-r201/type-1-r201-1.webp',
  ],
  type2R601: [
    '/images/lune/type-2-r601/type-2-r601-5.webp',
    '/images/lune/type-2-r601/type-2-r601-2.webp',
    '/images/lune/type-2-r601/type-2-r601-3.webp',
    '/images/lune/type-2-r601/type-2-r601-4.webp',
    '/images/lune/type-2-r601/type-2-r601-1.webp',
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
  type4Studio: [
    '/images/lune/type-4-studio/type-4-studio-2.webp',
    '/images/lune/type-4-studio/type-4-studio-4.webp',
    '/images/lune/type-4-studio/type-4-studio-5.webp',
    '/images/lune/type-4-studio/type-4-studio-3.webp',
    '/images/lune/type-4-studio/type-4-studio-1.webp',
  ],
};

const defaultPolicies = [
  'Check-in from 14:00',
  'Check-out before 12:00',
  'Passport may be required at check-in according to local regulations.',
  'No smoking inside the room',
  'Pets are not allowed',
];

const defaultAvailabilityRules = {
  minNights: 1,
  maxNights: 30,
  allowSameDayBooking: true,
  advanceBookingDays: 365,
  cleaningBufferHours: 0,
};

const makePricingRules = (basePrice) => ({
  basePrice,
  weekendPrice: null,
  holidayPrice: null,
  longStayDiscount: {
    enabled: true,
    minNights: 7,
    discountPercent: 5,
  },
  serviceFeePercent: 0,
  taxPercent: 0,
});

const viPolicies = [
  'Nhận phòng từ 14:00',
  'Trả phòng trước 12:00',
  'Có thể cần xuất trình hộ chiếu/giấy tờ tùy thân khi nhận phòng.',
  'Không hút thuốc trong phòng',
  'Không nhận thú cưng',
];

const zhPolicies = ['14:00 后入住', '12:00 前退房', '入住时可能需要出示护照或身份证件。', '房内禁止吸烟', '不可携带宠物'];
const koPolicies = ['14:00부터 체크인', '12:00 전 체크아웃', '체크인 시 여권 또는 신분증이 필요할 수 있습니다.', '객실 내 금연', '반려동물 동반 불가'];

const baseRooms = [
  {
    id: 'deluxe-studio',
    slug: 'deluxe-studio',
    name: 'One Bedroom Studio Apartment',
    type: 'Studio',
    maxGuests: 2,
    bed: '1 king bed',
    size: '20m²',
    price: 860000,
    bathroom: 'Private bathroom with hot high-pressure shower',
    shortDescription:
      'A compact, polished studio for solo travelers and couples who want a clean room close to My Khe Beach.',
    description:
      'This studio is designed for easy short stays: a comfortable king bed, private bathroom, smart storage, bright finishes, and the calm boutique feeling guests expect from Lune. It is a practical choice for beach days, business stops, or late-night arrivals in Da Nang.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
    highlights: ['Value stay', 'New clean room', 'Near My Khe Beach'],
    image: luneImages.type4Studio[0],
    gallery: luneImages.type4Studio,
    pricingRules: makePricingRules(860000),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'One Bedroom Studio Apartment',
        shortDescription:
          'A compact, polished studio for solo travelers and couples who want a clean room close to My Khe Beach.',
        description:
          'This studio is designed for easy short stays: a comfortable king bed, private bathroom, smart storage, bright finishes, and the calm boutique feeling guests expect from Lune. It is a practical choice for beach days, business stops, or late-night arrivals in Da Nang.',
        fullDescription:
          'This studio is designed for easy short stays: a comfortable king bed, private bathroom, smart storage, bright finishes, and the calm boutique feeling guests expect from Lune. It is a practical choice for beach days, business stops, or late-night arrivals in Da Nang.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
        suitableFor: ['Solo travelers', 'Couples', 'Short stays', 'Beach trips'],
        policies: defaultPolicies,
        priceNote: 'Room Type 4 rate: 860,000 VND per night. Final payment is charged in VND.',
      },
      vi: {
        name: 'Studio một phòng ngủ',
        shortDescription: 'Phòng studio gọn đẹp, sạch sẽ, phù hợp khách đi một mình hoặc cặp đôi muốn ở gần biển Mỹ Khê.',
        description:
          'Studio được thiết kế cho kỳ lưu trú ngắn ngày với giường king thoải mái, phòng tắm riêng, không gian sáng, tiện ích gọn gàng và cảm giác boutique ấm áp. Phù hợp cho khách đi biển, công tác hoặc cần một điểm nghỉ tiện lợi tại Đà Nẵng.',
        fullDescription:
          'Studio được thiết kế cho kỳ lưu trú ngắn ngày với giường king thoải mái, phòng tắm riêng, không gian sáng, tiện ích gọn gàng và cảm giác boutique ấm áp. Phù hợp cho khách đi biển, công tác hoặc cần một điểm nghỉ tiện lợi tại Đà Nẵng.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
        suitableFor: ['Khách đi một mình', 'Cặp đôi', 'Lưu trú ngắn ngày', 'Đi biển'],
        policies: viPolicies,
        priceNote: 'Giá phòng loại 4: 860,000 VND/đêm. Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '一卧室单间公寓',
        shortDescription: '精致干净的单间公寓，适合独行旅客和情侣，靠近美溪海滩。',
        description:
          '此房型适合轻松短住，配有舒适大床、独立浴室、实用收纳和明亮设计，保留 Lune 温暖安静的精品公寓氛围。',
        fullDescription:
          '此房型适合轻松短住，配有舒适大床、独立浴室、实用收纳和明亮设计，保留 Lune 温暖安静的精品公寓氛围。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
        suitableFor: ['独行旅客', '情侣', '短期入住', '海边旅行'],
        policies: zhPolicies,
        priceNote: '4类房价格：每晚 860,000 VND。正式付款货币为 VND。',
      },
      ko: {
        name: '원 베드룸 스튜디오 아파트',
        shortDescription: '미케 비치 근처에서 깨끗하고 실용적인 객실을 원하는 1인 여행객과 커플에게 적합합니다.',
        description:
          '편안한 킹베드, 전용 욕실, 밝은 마감과 실용적인 수납을 갖춘 짧은 숙박용 스튜디오입니다. 다낭 해변 여행, 출장, 늦은 도착 일정에 잘 맞습니다.',
        fullDescription:
          '편안한 킹베드, 전용 욕실, 밝은 마감과 실용적인 수납을 갖춘 짧은 숙박용 스튜디오입니다. 다낭 해변 여행, 출장, 늦은 도착 일정에 잘 맞습니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge', 'Elevator', 'Near beach'],
        suitableFor: ['1인 여행객', '커플', '단기 숙박', '해변 여행'],
        policies: koPolicies,
        priceNote: '4번 객실 타입 요금: 1박 860,000 VND. 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'superior-apartment',
    slug: 'superior-apartment',
    name: '1-Bedroom Apartment with Balcony - R601',
    type: 'Balcony apartment',
    maxGuests: 2,
    bed: '1 queen bed',
    size: '40m²',
    price: 1100000,
    bathroom: 'Private bathroom with premium amenities',
    shortDescription:
      'A bright one-bedroom apartment with balcony-style comfort, warm wood details, and enough room to settle in.',
    description:
      'R601 is a balanced apartment for couples and short stays. It offers a queen bed, private bathroom, sitting corner, natural light, elevator access, and a quiet residential-apartment feel near restaurants, marts, and the beach.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
    highlights: ['Balcony feel', 'Soft natural light', 'Couple friendly'],
    image: luneImages.type2R601[0],
    gallery: luneImages.type2R601,
    pricingRules: makePricingRules(1100000),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: '1-Bedroom Apartment with Balcony - R601',
        shortDescription:
          'A bright one-bedroom apartment with balcony-style comfort, warm wood details, and enough room to settle in.',
        description:
          'R601 is a balanced apartment for couples and short stays. It offers a queen bed, private bathroom, sitting corner, natural light, elevator access, and a quiet residential-apartment feel near restaurants, marts, and the beach.',
        fullDescription:
          'R601 is a balanced apartment for couples and short stays. It offers a queen bed, private bathroom, sitting corner, natural light, elevator access, and a quiet residential-apartment feel near restaurants, marts, and the beach.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['Couples', 'Short stays', 'Business travelers', 'Beach weekends'],
        policies: defaultPolicies,
        priceNote: 'Room Type 2 rate: 1,100,000 VND per night. Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ 1 phòng ngủ có ban công - R601',
        shortDescription: 'Căn hộ một phòng ngủ sáng, ấm, có cảm giác ban công và đủ rộng để nghỉ ngơi thoải mái.',
        description:
          'R601 phù hợp cho cặp đôi và khách lưu trú ngắn ngày, có giường queen, phòng tắm riêng, góc ngồi, ánh sáng tự nhiên, thang máy và vị trí thuận tiện gần nhà hàng, cửa hàng tiện lợi và biển.',
        fullDescription:
          'R601 phù hợp cho cặp đôi và khách lưu trú ngắn ngày, có giường queen, phòng tắm riêng, góc ngồi, ánh sáng tự nhiên, thang máy và vị trí thuận tiện gần nhà hàng, cửa hàng tiện lợi và biển.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['Cặp đôi', 'Lưu trú ngắn ngày', 'Khách công tác', 'Kỳ nghỉ gần biển'],
        policies: viPolicies,
        priceNote: 'Giá phòng loại 2 R601: 1,100,000 VND/đêm. Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '一卧室阳台公寓 - R601',
        shortDescription: '明亮的一卧室公寓，带阳台感和温暖木质细节，空间舒适。',
        description:
          'R601 适合情侣和短期入住，配有大床、独立浴室、休息角、自然采光、电梯，并靠近餐厅、便利店和海滩。',
        fullDescription:
          'R601 适合情侣和短期入住，配有大床、独立浴室、休息角、自然采光、电梯，并靠近餐厅、便利店和海滩。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['情侣', '短期入住', '商务旅客', '海边周末'],
        policies: zhPolicies,
        priceNote: '2类房 R601 价格：每晚 1,100,000 VND。正式付款货币为 VND。',
      },
      ko: {
        name: '발코니형 1베드룸 아파트 - R601',
        shortDescription: '밝은 1베드룸 아파트로 따뜻한 우드 디테일과 여유로운 휴식 공간을 제공합니다.',
        description:
          'R601은 커플과 단기 숙박에 적합하며 퀸베드, 전용 욕실, 휴식 코너, 자연 채광, 엘리베이터 접근성을 갖췄습니다. 식당, 마트, 해변과 가까운 조용한 아파트형 객실입니다.',
        fullDescription:
          'R601은 커플과 단기 숙박에 적합하며 퀸베드, 전용 욕실, 휴식 코너, 자연 채광, 엘리베이터 접근성을 갖췄습니다. 식당, 마트, 해변과 가까운 조용한 아파트형 객실입니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['커플', '단기 숙박', '출장객', '해변 여행'],
        policies: koPolicies,
        priceNote: '2번 객실 타입 R601 요금: 1박 1,100,000 VND. 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'family-apartment',
    slug: 'family-apartment',
    name: 'Family Balcony Apartment - R201',
    type: 'Family apartment',
    maxGuests: 4,
    bed: '2 queen beds',
    size: '56m²',
    price: 2000000,
    bathroom: '2 private bathrooms',
    shortDescription:
      'A generous apartment for families or groups, with two beds, two bathrooms, and a home-like layout.',
    description:
      'R201 is the most spacious Lune option for families and groups. It is designed around comfort: two queen beds, two private bathrooms, warm lighting, thoughtful storage, and room to relax after the beach or a full day exploring Da Nang.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
    highlights: ['Best for families', 'Two bathrooms', 'Spacious layout'],
    image: luneImages.type1R201[0],
    gallery: luneImages.type1R201,
    pricingRules: makePricingRules(2000000),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Family Balcony Apartment - R201',
        shortDescription:
          'A generous apartment for families or groups, with two beds, two bathrooms, and a home-like layout.',
        description:
          'R201 is the most spacious Lune option for families and groups. It is designed around comfort: two queen beds, two private bathrooms, warm lighting, thoughtful storage, and room to relax after the beach or a full day exploring Da Nang.',
        fullDescription:
          'R201 is the most spacious Lune option for families and groups. It is designed around comfort: two queen beds, two private bathrooms, warm lighting, thoughtful storage, and room to relax after the beach or a full day exploring Da Nang.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
        policies: defaultPolicies,
        priceNote: 'Room Type 1 R201 rate: 2,000,000 VND per night. Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ gia đình có ban công - R201',
        shortDescription: 'Căn hộ rộng cho gia đình hoặc nhóm bạn, có hai giường, hai phòng tắm và bố cục như ở nhà.',
        description:
          'R201 là lựa chọn rộng rãi nhất của Lune cho gia đình hoặc nhóm khách. Phòng có hai giường queen, hai phòng tắm riêng, ánh sáng ấm, nhiều không gian lưu trữ và khu vực thư giãn sau một ngày đi biển hoặc khám phá Đà Nẵng.',
        fullDescription:
          'R201 là lựa chọn rộng rãi nhất của Lune cho gia đình hoặc nhóm khách. Phòng có hai giường queen, hai phòng tắm riêng, ánh sáng ấm, nhiều không gian lưu trữ và khu vực thư giãn sau một ngày đi biển hoặc khám phá Đà Nẵng.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['Gia đình', 'Nhóm bạn', 'Hai cặp đôi', 'Lưu trú dài hơn'],
        policies: viPolicies,
        priceNote: 'Giá phòng loại 1 R201: 2,000,000 VND/đêm. Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '家庭阳台公寓 - R201',
        shortDescription: '宽敞的家庭或团体公寓，配有两张床、两个浴室和居家式布局。',
        description:
          'R201 是 Lune 最宽敞的房型，适合家庭和团体。配有两张大床、两个独立浴室、温暖灯光、实用收纳和舒适休息空间。',
        fullDescription:
          'R201 是 Lune 最宽敞的房型，适合家庭和团体。配有两张大床、两个独立浴室、温暖灯光、实用收纳和舒适休息空间。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['家庭', '朋友团体', '两对情侣', '较长住宿'],
        policies: zhPolicies,
        priceNote: '1类房 R201 价格：每晚 2,000,000 VND。正式付款货币为 VND。',
      },
      ko: {
        name: '패밀리 발코니 아파트 - R201',
        shortDescription: '가족 또는 그룹을 위한 넓은 아파트로 침대 2개, 욕실 2개와 집처럼 편한 구조를 갖췄습니다.',
        description:
          'R201은 가족과 그룹을 위한 Lune의 가장 넓은 객실입니다. 퀸베드 2개, 전용 욕실 2개, 따뜻한 조명, 실용적인 수납과 해변 또는 다낭 여행 후 쉴 수 있는 여유 공간을 제공합니다.',
        fullDescription:
          'R201은 가족과 그룹을 위한 Lune의 가장 넓은 객실입니다. 퀸베드 2개, 전용 욕실 2개, 따뜻한 조명, 실용적인 수납과 해변 또는 다낭 여행 후 쉴 수 있는 여유 공간을 제공합니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Kitchen', 'Sofa', 'Elevator', 'Near beach'],
        suitableFor: ['가족', '친구 그룹', '두 커플', '긴 숙박'],
        policies: koPolicies,
        priceNote: '1번 객실 타입 R201 요금: 1박 2,000,000 VND. 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'long-stay-apartment',
    slug: 'long-stay-apartment',
    name: 'Deluxe Double Apartment, City View',
    type: 'Deluxe double',
    maxGuests: 2,
    bed: '1 king bed',
    size: '40m²',
    price: 1600000,
    bathroom: 'Private bathroom with walk-in shower',
    shortDescription:
      'A refined double apartment with city-view comfort, ideal for couples and two guests who want a calm boutique stay.',
    description:
      'This deluxe apartment combines Lune’s warm boutique design with everyday convenience: a comfortable bed, seating area, kitchenette-style amenities, strong shower, and an easy location near My Khe Beach, seafood restaurants, convenience stores, and local cafés.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
    highlights: ['City-view comfort', 'Compact Type 3 layout', 'Best for two guests'],
    image: luneImages.type3Compact[0],
    gallery: luneImages.type3Compact,
    pricingRules: makePricingRules(1600000),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Deluxe Double Apartment, City View',
        shortDescription:
          'A refined double apartment with city-view comfort, ideal for couples and two guests who want a calm boutique stay.',
        description:
          'This deluxe apartment combines Lune’s warm boutique design with everyday convenience: a comfortable bed, seating area, kitchenette-style amenities, strong shower, and an easy location near My Khe Beach, seafood restaurants, convenience stores, and local cafés.',
        fullDescription:
          'This deluxe apartment combines Lune’s warm boutique design with everyday convenience: a comfortable bed, seating area, kitchenette-style amenities, strong shower, and an easy location near My Khe Beach, seafood restaurants, convenience stores, and local cafés.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['Couples', 'Two guests', 'Business travelers', 'Short stays'],
        policies: defaultPolicies,
        priceNote: 'Room Type 3 rate: 1,600,000 VND per night. Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ Deluxe Double hướng phố',
        shortDescription: 'Căn hộ giường đôi hướng phố, phù hợp cho cặp đôi hoặc 2 khách muốn lưu trú gọn gàng và yên tĩnh.',
        description:
          'Căn hộ Deluxe Double sử dụng bố cục loại 3 gọn gàng với giường king thoải mái, chi tiết gỗ ấm, bàn làm việc, tủ đồ, phòng tắm riêng và vị trí thuận tiện gần biển Mỹ Khê.',
        fullDescription:
          'Căn hộ Deluxe Double sử dụng bố cục loại 3 gọn gàng với giường king thoải mái, chi tiết gỗ ấm, bàn làm việc, tủ đồ, phòng tắm riêng và vị trí thuận tiện gần biển Mỹ Khê.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['Cặp đôi', '2 khách', 'Khách công tác', 'Lưu trú ngắn ngày'],
        policies: viPolicies,
        priceNote: 'Giá phòng loại 3: 1,600,000 VND/đêm. Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '豪华双人城市景观公寓',
        shortDescription: '精致的城市景观双人公寓，适合情侣或两位客人安静入住。',
        description:
          '此豪华双人公寓采用紧凑的 3 类房布局，配有舒适大床、温暖木质细节、书桌、衣柜、独立浴室，并靠近美溪海滩。',
        fullDescription:
          '此豪华双人公寓采用紧凑的 3 类房布局，配有舒适大床、温暖木质细节、书桌、衣柜、独立浴室，并靠近美溪海滩。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['情侣', '两位客人', '商务旅客', '短期入住'],
        policies: zhPolicies,
        priceNote: '3类房价格：每晚 1,600,000 VND。正式付款货币为 VND。',
      },
      ko: {
        name: '디럭스 더블 아파트, 시티뷰',
        shortDescription: '커플 또는 2인 고객에게 적합한 조용하고 아늑한 시티뷰 더블 아파트입니다.',
        description:
          '디럭스 더블 아파트는 컴팩트한 3번 객실 타입으로, 편안한 킹베드, 따뜻한 우드 디테일, 업무용 책상, 수납공간, 전용 욕실을 갖추고 미케 비치와 가깝습니다.',
        fullDescription:
          '디럭스 더블 아파트는 컴팩트한 3번 객실 타입으로, 편안한 킹베드, 따뜻한 우드 디테일, 업무용 책상, 수납공간, 전용 욕실을 갖추고 미케 비치와 가깝습니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['커플', '2인 고객', '출장객', '단기 숙박'],
        policies: koPolicies,
        priceNote: '3번 객실 타입 요금: 1박 1,600,000 VND. 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'type-3-kitchen-apartment',
    slug: 'type-3-kitchen-apartment',
    name: 'Type 3 Kitchen Apartment',
    type: 'Type 3 kitchen',
    maxGuests: 3,
    bed: '1 king bed + sofa area',
    size: '45m²',
    price: 1600000,
    bathroom: 'Private bathroom with walk-in shower',
    shortDescription:
      'A Type 3 apartment with a more open kitchen and living layout, suitable for guests who want extra daily comfort.',
    description:
      'This Type 3 kitchen apartment is a separate room style from the compact double layout. It features a brighter open space, kitchen area, sofa-style living corner, washing machine, private bathroom, and the same convenient Lune location near the beach.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
    highlights: ['Open kitchen layout', 'Living corner', 'Long-stay friendly'],
    image: luneImages.type3Kitchen[0],
    gallery: luneImages.type3Kitchen,
    pricingRules: makePricingRules(1600000),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Type 3 Kitchen Apartment',
        shortDescription:
          'A Type 3 apartment with a more open kitchen and living layout, suitable for guests who want extra daily comfort.',
        description:
          'This Type 3 kitchen apartment is a separate room style from the compact double layout. It features a brighter open space, kitchen area, sofa-style living corner, washing machine, private bathroom, and the same convenient Lune location near the beach.',
        fullDescription:
          'This Type 3 kitchen apartment is a separate room style from the compact double layout. It features a brighter open space, kitchen area, sofa-style living corner, washing machine, private bathroom, and the same convenient Lune location near the beach.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['Couples', 'Small families', 'Long stays', 'Guests who want a kitchen'],
        policies: defaultPolicies,
        priceNote: 'Type 3 kitchen apartment rate: 1,600,000 VND per night. Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ loại 3 có bếp',
        shortDescription:
          'Căn hộ loại 3 với bố cục bếp và khu sinh hoạt thoáng hơn, phù hợp khách muốn tiện nghi như ở nhà.',
        description:
          'Đây là phong cách phòng riêng biệt với phòng Deluxe Double loại 3. Phòng có không gian sáng hơn, khu bếp, góc sofa, máy giặt, phòng tắm riêng và vị trí thuận tiện gần biển.',
        fullDescription:
          'Đây là phong cách phòng riêng biệt với phòng Deluxe Double loại 3. Phòng có không gian sáng hơn, khu bếp, góc sofa, máy giặt, phòng tắm riêng và vị trí thuận tiện gần biển.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['Cặp đôi', 'Gia đình nhỏ', 'Lưu trú dài ngày', 'Khách cần khu bếp'],
        policies: viPolicies,
        priceNote: 'Giá căn hộ loại 3 có bếp: 1,600,000 VND/đêm. Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '3类厨房公寓',
        shortDescription: '3类公寓，拥有更开放的厨房和生活空间，适合希望拥有更多日常便利的客人。',
        description:
          '这是一种不同于紧凑双人 3 类房的房型，配有更明亮的开放空间、厨房区、沙发角、洗衣机、独立浴室，并靠近海滩。',
        fullDescription:
          '这是一种不同于紧凑双人 3 类房的房型，配有更明亮的开放空间、厨房区、沙发角、洗衣机、独立浴室，并靠近海滩。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['情侣', '小家庭', '长期入住', '需要厨房的客人'],
        policies: zhPolicies,
        priceNote: '3类厨房公寓价格：每晚 1,600,000 VND。正式付款货币为 VND。',
      },
      ko: {
        name: '3번 타입 키친 아파트',
        shortDescription: '더 넓은 주방과 생활 공간을 갖춘 3번 타입 아파트로, 일상 편의를 원하는 고객에게 적합합니다.',
        description:
          '컴팩트한 3번 더블 타입과 다른 별도 객실 스타일입니다. 밝은 오픈 공간, 주방, 소파 코너, 세탁기, 전용 욕실을 갖추고 해변과 가까운 위치에 있습니다.',
        fullDescription:
          '컴팩트한 3번 더블 타입과 다른 별도 객실 스타일입니다. 밝은 오픈 공간, 주방, 소파 코너, 세탁기, 전용 욕실을 갖추고 해변과 가까운 위치에 있습니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchen', 'Washing machine', 'Sofa', 'Work desk', 'Elevator', 'Near beach'],
        suitableFor: ['커플', '소가족', '장기 숙박', '주방이 필요한 고객'],
        policies: koPolicies,
        priceNote: '3번 타입 키친 아파트 요금: 1박 1,600,000 VND. 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
];

const fallbackLanguages = ['zh-TW', 'ja', 'th', 'ru', 'fr', 'de', 'es', 'it', 'id', 'ms', 'ar', 'hi'];

export const rooms = baseRooms.map((room) => {
  const translations = { ...room.translations };
  fallbackLanguages.forEach((language) => {
    translations[language] = translations[language] || translations.en;
  });
  return { ...room, translations };
});

export const roomTypes = ['Studio', 'Balcony apartment', 'Family apartment', 'Deluxe double', 'Type 3 kitchen'];
