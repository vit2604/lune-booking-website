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
    id: 'one-bedroom-condo',
    slug: 'one-bedroom-condo',
    name: 'One Bedroom Apartment',
    type: 'One Bedroom Apartment',
    maxGuests: 2,
    bed: '1 large double bed',
    size: '18m²',
    price: 1056089,
    bathroom: 'Private bathroom',
    shortDescription:
      'A compact 18m² condo for solo travelers and couples who want a clean, calm room close to My Khe Beach.',
    description:
      'The 1-Bedroom Condo is the easiest way to stay at Lune: a comfortable large double bed, private bathroom, air conditioning, free Wi-Fi, and the same warm boutique finishes as the larger apartments. A practical base for beach days and short stays in Da Nang.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
    highlights: ['Compact studio layout', 'Best for 2 guests', 'Near My Khe Beach'],
    image: luneImages.type4Studio[0],
    gallery: luneImages.type4Studio,
    pricingRules: makePricingRules(1056089),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'One Bedroom Apartment',
        shortDescription:
          'A compact 18m² condo for solo travelers and couples who want a clean, calm room close to My Khe Beach.',
        description:
          'The 1-Bedroom Condo is the easiest way to stay at Lune: a comfortable large double bed, private bathroom, air conditioning, free Wi-Fi, and the same warm boutique finishes as the larger apartments. A practical base for beach days and short stays in Da Nang.',
        fullDescription:
          'The 1-Bedroom Condo is the easiest way to stay at Lune: a comfortable large double bed, private bathroom, air conditioning, free Wi-Fi, and the same warm boutique finishes as the larger apartments. A practical base for beach days and short stays in Da Nang.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['Solo travelers', 'Couples', 'Short stays', 'Beach trips'],
        policies: defaultPolicies,
        priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax). Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ 1 phòng ngủ',
        shortDescription: 'Căn hộ 18m² gọn gàng, sạch sẽ cho khách đi một mình hoặc cặp đôi muốn ở gần biển Mỹ Khê.',
        description:
          'Căn hộ 1 phòng ngủ là lựa chọn tiện lợi nhất tại Lune: giường đôi lớn thoải mái, phòng tắm riêng, điều hòa, Wi-Fi miễn phí và phong cách boutique ấm áp như các căn hộ lớn hơn. Điểm nghỉ thuận tiện cho kỳ đi biển và lưu trú ngắn ngày tại Đà Nẵng.',
        fullDescription:
          'Căn hộ 1 phòng ngủ là lựa chọn tiện lợi nhất tại Lune: giường đôi lớn thoải mái, phòng tắm riêng, điều hòa, Wi-Fi miễn phí và phong cách boutique ấm áp như các căn hộ lớn hơn. Điểm nghỉ thuận tiện cho kỳ đi biển và lưu trú ngắn ngày tại Đà Nẵng.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['Khách đi một mình', 'Cặp đôi', 'Lưu trú ngắn ngày', 'Đi biển'],
        policies: viPolicies,
        priceNote: 'Giá tham khảo theo trang Agoda (09/2026, chưa gồm thuế). Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '一卧室公寓',
        shortDescription: '18平方米的紧凑公寓，适合独行旅客和情侣，靠近美溪海滩。',
        description:
          '一卧室公寓配有舒适的大号双人床、独立浴室、空调和免费 Wi-Fi，保留 Lune 温暖的精品公寓风格，是海滩度假和短期入住的实用选择。',
        fullDescription:
          '一卧室公寓配有舒适的大号双人床、独立浴室、空调和免费 Wi-Fi，保留 Lune 温暖的精品公寓风格，是海滩度假和短期入住的实用选择。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['独行旅客', '情侣', '短期入住', '海边旅行'],
        policies: zhPolicies,
        priceNote: '价格参考 Agoda 页面（2026年9月，不含税）。正式付款货币为 VND。',
      },
      ko: {
        name: '원 베드룸 콘도',
        shortDescription: '미케 비치 근처의 아늑한 18m² 콘도로, 1인 여행객과 커플에게 적합합니다.',
        description:
          '편안한 라지 더블베드, 전용 욕실, 에어컨, 무료 Wi-Fi를 갖춘 콘도로 Lune 특유의 따뜻한 부티크 감성을 그대로 담았습니다. 해변 여행과 단기 숙박에 실용적인 선택입니다.',
        fullDescription:
          '편안한 라지 더블베드, 전용 욕실, 에어컨, 무료 Wi-Fi를 갖춘 콘도로 Lune 특유의 따뜻한 부티크 감성을 그대로 담았습니다. 해변 여행과 단기 숙박에 실용적인 선택입니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['1인 여행객', '커플', '단기 숙박', '해변 여행'],
        policies: koPolicies,
        priceNote: 'Agoda 페이지 기준 참고 요금(2026년 9월, 세금 별도). 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'one-bedroom-apartment-balcony',
    slug: 'one-bedroom-apartment-balcony',
    name: 'One Bedroom Studio Apartment with Balcony',
    type: 'One Bedroom Studio Apartment with Balcony',
    maxGuests: 2,
    bed: '1 large double bed (extra long)',
    size: '40m²',
    price: 1679752,
    bathroom: '1 private bathroom with shower',
    shortDescription:
      'A bright 40m² one-bedroom apartment with a private balcony, extra-long double bed, and full in-room comforts.',
    description:
      'Apartment 1 pairs a private balcony with a comfortable extra-long double bed and everything two guests need day to day: air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower. A quiet, well-lit space near restaurants, marts, and the beach.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
    highlights: ['Private balcony', '40m² of space', 'Extra-long double bed'],
    image: luneImages.type2R601[0],
    gallery: luneImages.type2R601,
    pricingRules: makePricingRules(1679752),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'One Bedroom Studio Apartment with Balcony',
        shortDescription:
          'A bright 40m² one-bedroom apartment with a private balcony, extra-long double bed, and full in-room comforts.',
        description:
          'Apartment 1 pairs a private balcony with a comfortable extra-long double bed and everything two guests need day to day: air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower. A quiet, well-lit space near restaurants, marts, and the beach.',
        fullDescription:
          'Apartment 1 pairs a private balcony with a comfortable extra-long double bed and everything two guests need day to day: air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower. A quiet, well-lit space near restaurants, marts, and the beach.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['Couples', 'Short stays', 'Business travelers', 'Beach weekends'],
        policies: defaultPolicies,
        priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax). Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ 1 - Một phòng ngủ có ban công',
        shortDescription: 'Căn hộ 40m² sáng thoáng với ban công riêng, giường đôi lớn cực dài và đầy đủ tiện nghi trong phòng.',
        description:
          'Căn hộ 1 có ban công riêng, giường đôi lớn cực dài cùng mọi tiện nghi cho hai khách: điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen. Không gian yên tĩnh, nhiều ánh sáng, gần nhà hàng, cửa hàng tiện lợi và biển.',
        fullDescription:
          'Căn hộ 1 có ban công riêng, giường đôi lớn cực dài cùng mọi tiện nghi cho hai khách: điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen. Không gian yên tĩnh, nhiều ánh sáng, gần nhà hàng, cửa hàng tiện lợi và biển.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['Cặp đôi', 'Lưu trú ngắn ngày', 'Khách công tác', 'Kỳ nghỉ gần biển'],
        policies: viPolicies,
        priceNote: 'Giá tham khảo theo trang Agoda (09/2026, chưa gồm thuế). Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '带阳台一卧室公寓 1',
        shortDescription: '明亮的40平方米一卧室公寓，带私人阳台、加长双人床和齐全的房内设施。',
        description:
          '1号公寓配有私人阳台、加长双人床，以及两位客人所需的日常设施：空调、免费 Wi-Fi、小冰箱、电热水壶、吹风机和带淋浴的独立浴室。空间安静明亮，靠近餐厅、便利店和海滩。',
        fullDescription:
          '1号公寓配有私人阳台、加长双人床，以及两位客人所需的日常设施：空调、免费 Wi-Fi、小冰箱、电热水壶、吹风机和带淋浴的独立浴室。空间安静明亮，靠近餐厅、便利店和海滩。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['情侣', '短期入住', '商务旅客', '海边周末'],
        policies: zhPolicies,
        priceNote: '价格参考 Agoda 页面（2026年9月，不含税）。正式付款货币为 VND。',
      },
      ko: {
        name: '발코니 1베드룸 아파트 1',
        shortDescription: '전용 발코니와 엑스트라 롱 더블베드를 갖춘 밝은 40m² 아파트입니다.',
        description:
          '아파트 1은 전용 발코니, 엑스트라 롱 더블베드와 함께 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어, 샤워 시설을 갖춘 전용 욕실 등 두 사람에게 필요한 모든 것을 제공합니다. 식당, 마트, 해변과 가까운 조용하고 밝은 공간입니다.',
        fullDescription:
          '아파트 1은 전용 발코니, 엑스트라 롱 더블베드와 함께 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어, 샤워 시설을 갖춘 전용 욕실 등 두 사람에게 필요한 모든 것을 제공합니다. 식당, 마트, 해변과 가까운 조용하고 밝은 공간입니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['커플', '단기 숙박', '출장객', '해변 여행'],
        policies: koPolicies,
        priceNote: 'Agoda 페이지 기준 참고 요금(2026년 9월, 세금 별도). 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'two-bedroom-apartment',
    slug: 'two-bedroom-apartment',
    name: 'Two Bedroom Apartment',
    type: 'Two Bedroom Apartment',
    maxGuests: 4,
    bed: '2 large double beds',
    size: '52m²',
    price: 1924357,
    bathroom: 'Private bathroom',
    shortDescription:
      'A 52m² two-bedroom apartment with two large double beds — room for up to four guests to spread out.',
    description:
      'With two separate bedrooms and two large double beds across 52m², this apartment gives families and small groups real space to settle in. Air conditioning, free Wi-Fi, and a private bathroom cover the essentials, with the beach and local restaurants close by.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
    highlights: ['Two separate bedrooms', '52m² for up to 4 guests', 'Family friendly'],
    image: luneImages.type3Compact[0],
    gallery: luneImages.type3Compact,
    pricingRules: makePricingRules(1924357),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Two Bedroom Apartment',
        shortDescription:
          'A 52m² two-bedroom apartment with two large double beds — room for up to four guests to spread out.',
        description:
          'With two separate bedrooms and two large double beds across 52m², this apartment gives families and small groups real space to settle in. Air conditioning, free Wi-Fi, and a private bathroom cover the essentials, with the beach and local restaurants close by.',
        fullDescription:
          'With two separate bedrooms and two large double beds across 52m², this apartment gives families and small groups real space to settle in. Air conditioning, free Wi-Fi, and a private bathroom cover the essentials, with the beach and local restaurants close by.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
        policies: defaultPolicies,
        priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax). Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ - 2 phòng ngủ',
        shortDescription: 'Căn hộ 52m² với hai phòng ngủ và hai giường đôi lớn — thoải mái cho tối đa bốn khách.',
        description:
          'Với hai phòng ngủ riêng biệt và hai giường đôi lớn trên diện tích 52m², căn hộ này cho gia đình và nhóm nhỏ không gian sinh hoạt thực sự thoải mái. Điều hòa, Wi-Fi miễn phí và phòng tắm riêng đáp ứng đủ nhu cầu thiết yếu, gần biển và các nhà hàng địa phương.',
        fullDescription:
          'Với hai phòng ngủ riêng biệt và hai giường đôi lớn trên diện tích 52m², căn hộ này cho gia đình và nhóm nhỏ không gian sinh hoạt thực sự thoải mái. Điều hòa, Wi-Fi miễn phí và phòng tắm riêng đáp ứng đủ nhu cầu thiết yếu, gần biển và các nhà hàng địa phương.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['Gia đình', 'Nhóm bạn', 'Hai cặp đôi', 'Lưu trú dài hơn'],
        policies: viPolicies,
        priceNote: 'Giá tham khảo theo trang Agoda (09/2026, chưa gồm thuế). Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '两卧室公寓',
        shortDescription: '52平方米两卧室公寓，配有两张大号双人床，最多可入住四位客人。',
        description:
          '公寓拥有两间独立卧室和两张大号双人床，52平方米的空间让家庭和小团体住得宽敞自在。空调、免费 Wi-Fi 和独立浴室满足日常所需，且靠近海滩和当地餐厅。',
        fullDescription:
          '公寓拥有两间独立卧室和两张大号双人床，52平方米的空间让家庭和小团体住得宽敞自在。空调、免费 Wi-Fi 和独立浴室满足日常所需，且靠近海滩和当地餐厅。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['家庭', '朋友团体', '两对情侣', '较长住宿'],
        policies: zhPolicies,
        priceNote: '价格参考 Agoda 页面（2026年9月，不含税）。正式付款货币为 VND。',
      },
      ko: {
        name: '투 베드룸 아파트',
        shortDescription: '라지 더블베드 2개를 갖춘 52m² 투 베드룸 아파트로 최대 4인까지 숙박 가능합니다.',
        description:
          '독립된 침실 2개와 라지 더블베드 2개를 갖춘 52m² 아파트로 가족과 소그룹이 여유롭게 지낼 수 있습니다. 에어컨, 무료 Wi-Fi, 전용 욕실을 갖췄으며 해변과 현지 식당이 가깝습니다.',
        fullDescription:
          '독립된 침실 2개와 라지 더블베드 2개를 갖춘 52m² 아파트로 가족과 소그룹이 여유롭게 지낼 수 있습니다. 에어컨, 무료 Wi-Fi, 전용 욕실을 갖췄으며 해변과 현지 식당이 가깝습니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom'],
        suitableFor: ['가족', '친구 그룹', '두 커플', '긴 숙박'],
        policies: koPolicies,
        priceNote: 'Agoda 페이지 기준 참고 요금(2026년 9월, 세금 별도). 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'studio-two-bed-balcony',
    slug: 'studio-two-bed-balcony',
    name: 'Studio Apartment with Balcony',
    type: 'Studio Apartment with Balcony',
    maxGuests: 4,
    bed: '2 double beds',
    size: '40m²',
    price: 1924357,
    bathroom: '1 private bathroom with shower',
    shortDescription:
      'A 40m² non-smoking studio with two double beds and a private balcony — a favorite for small groups.',
    description:
      'This studio fits up to four guests across two double beds, with a private balcony to unwind on. Air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower keep daily routines easy. The entire studio is non-smoking.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
    highlights: ['Two double beds', 'Private balcony', 'Great for small groups'],
    image: luneImages.type3Kitchen[0],
    gallery: luneImages.type3Kitchen,
    pricingRules: makePricingRules(1924357),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Studio Apartment with Balcony',
        shortDescription:
          'A 40m² non-smoking studio with two double beds and a private balcony — a favorite for small groups.',
        description:
          'This studio fits up to four guests across two double beds, with a private balcony to unwind on. Air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower keep daily routines easy. The entire studio is non-smoking.',
        fullDescription:
          'This studio fits up to four guests across two double beds, with a private balcony to unwind on. Air conditioning, free Wi-Fi, mini fridge, electric kettle, hairdryer, and a private bathroom with shower keep daily routines easy. The entire studio is non-smoking.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['Small groups', 'Families', 'Friends traveling together', 'Beach trips'],
        policies: defaultPolicies,
        priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax). Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ Studio 2 giường có ban công',
        shortDescription: 'Studio 40m² không hút thuốc với hai giường đôi và ban công riêng — lựa chọn quen thuộc của nhóm nhỏ.',
        description:
          'Studio này đón tối đa bốn khách với hai giường đôi và ban công riêng để thư giãn. Điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen giúp sinh hoạt hằng ngày thuận tiện. Toàn bộ phòng không hút thuốc.',
        fullDescription:
          'Studio này đón tối đa bốn khách với hai giường đôi và ban công riêng để thư giãn. Điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước, máy sấy tóc và phòng tắm riêng với vòi sen giúp sinh hoạt hằng ngày thuận tiện. Toàn bộ phòng không hút thuốc.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['Nhóm nhỏ', 'Gia đình', 'Nhóm bạn', 'Đi biển'],
        policies: viPolicies,
        priceNote: 'Giá tham khảo theo trang Agoda (09/2026, chưa gồm thuế). Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '带阳台双床开放式公寓',
        shortDescription: '40平方米无烟开放式公寓，配有两张双人床和私人阳台，深受小团体喜爱。',
        description:
          '公寓配有两张双人床，最多可入住四位客人，并设有私人阳台。空调、免费 Wi-Fi、小冰箱、电热水壶、吹风机和带淋浴的独立浴室让日常起居轻松便利。全屋禁烟。',
        fullDescription:
          '公寓配有两张双人床，最多可入住四位客人，并设有私人阳台。空调、免费 Wi-Fi、小冰箱、电热水壶、吹风机和带淋浴的独立浴室让日常起居轻松便利。全屋禁烟。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['小团体', '家庭', '朋友出行', '海边旅行'],
        policies: zhPolicies,
        priceNote: '价格参考 Agoda 页面（2026年9月，不含税）。正式付款货币为 VND。',
      },
      ko: {
        name: '발코니 스튜디오 (더블베드 2개)',
        shortDescription: '더블베드 2개와 전용 발코니를 갖춘 40m² 금연 스튜디오로 소그룹에게 인기 있습니다.',
        description:
          '더블베드 2개로 최대 4인까지 머물 수 있으며 전용 발코니에서 휴식할 수 있습니다. 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어, 샤워 시설을 갖춘 전용 욕실로 일상이 편리합니다. 전 객실 금연입니다.',
        fullDescription:
          '더블베드 2개로 최대 4인까지 머물 수 있으며 전용 발코니에서 휴식할 수 있습니다. 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어, 샤워 시설을 갖춘 전용 욕실로 일상이 편리합니다. 전 객실 금연입니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer'],
        suitableFor: ['소그룹', '가족', '친구 여행', '해변 여행'],
        policies: koPolicies,
        priceNote: 'Agoda 페이지 기준 참고 요금(2026년 9월, 세금 별도). 최종 결제는 VND로 진행됩니다.',
      },
    },
  },
  {
    id: 'two-bedroom-apartment-balcony',
    slug: 'two-bedroom-apartment-balcony',
    name: 'Two Bedroom Apartment With Balcony',
    type: 'Two Bedroom Apartment With Balcony',
    maxGuests: 4,
    bed: '2 large double beds',
    size: '56m²',
    price: 2554692,
    bathroom: '2 private bathrooms with shower',
    shortDescription:
      'The most spacious Lune apartment: 56m², two bedrooms, two bathrooms, and a private balcony for up to four guests.',
    description:
      'Apartment 2 is the largest option at Lune. Two bedrooms with large double beds, two private bathrooms with showers, a wardrobe, and a private balcony give families and groups a genuinely comfortable base. Air conditioning, free Wi-Fi, mini fridge, electric kettle, and hairdryer are all included.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
    highlights: ['Two bedrooms & two bathrooms', 'Private balcony', 'Most spacious layout'],
    image: luneImages.type1R201[0],
    gallery: luneImages.type1R201,
    pricingRules: makePricingRules(2554692),
    availabilityRules: defaultAvailabilityRules,
    blockedDates: [],
    translations: {
      en: {
        name: 'Two Bedroom Apartment With Balcony',
        shortDescription:
          'The most spacious Lune apartment: 56m², two bedrooms, two bathrooms, and a private balcony for up to four guests.',
        description:
          'Apartment 2 is the largest option at Lune. Two bedrooms with large double beds, two private bathrooms with showers, a wardrobe, and a private balcony give families and groups a genuinely comfortable base. Air conditioning, free Wi-Fi, mini fridge, electric kettle, and hairdryer are all included.',
        fullDescription:
          'Apartment 2 is the largest option at Lune. Two bedrooms with large double beds, two private bathrooms with showers, a wardrobe, and a private balcony give families and groups a genuinely comfortable base. Air conditioning, free Wi-Fi, mini fridge, electric kettle, and hairdryer are all included.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
        suitableFor: ['Families', 'Groups of friends', 'Two couples', 'Longer stays'],
        policies: defaultPolicies,
        priceNote: 'Reference rate from the Agoda listing (Sep 2026, before tax). Final payment is charged in VND.',
      },
      vi: {
        name: 'Căn hộ 2 - Hai phòng ngủ có ban công',
        shortDescription: 'Căn hộ rộng nhất của Lune: 56m², hai phòng ngủ, hai phòng tắm và ban công riêng cho tối đa bốn khách.',
        description:
          'Căn hộ 2 là lựa chọn lớn nhất tại Lune. Hai phòng ngủ với giường đôi lớn, hai phòng tắm riêng có vòi sen, tủ quần áo và ban công riêng mang lại không gian thực sự thoải mái cho gia đình và nhóm khách. Đầy đủ điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước và máy sấy tóc.',
        fullDescription:
          'Căn hộ 2 là lựa chọn lớn nhất tại Lune. Hai phòng ngủ với giường đôi lớn, hai phòng tắm riêng có vòi sen, tủ quần áo và ban công riêng mang lại không gian thực sự thoải mái cho gia đình và nhóm khách. Đầy đủ điều hòa, Wi-Fi miễn phí, tủ lạnh nhỏ, ấm đun nước và máy sấy tóc.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
        suitableFor: ['Gia đình', 'Nhóm bạn', 'Hai cặp đôi', 'Lưu trú dài hơn'],
        policies: viPolicies,
        priceNote: 'Giá tham khảo theo trang Agoda (09/2026, chưa gồm thuế). Thanh toán chính thức bằng VND.',
      },
      zh: {
        name: '带阳台两卧室公寓 2',
        shortDescription: 'Lune 最宽敞的公寓：56平方米、两间卧室、两个浴室和私人阳台，最多可入住四位客人。',
        description:
          '2号公寓是 Lune 最大的房型。两间卧室配大号双人床，两个带淋浴的独立浴室、衣柜和私人阳台，为家庭和团体提供真正舒适的空间。空调、免费 Wi-Fi、小冰箱、电热水壶和吹风机一应俱全。',
        fullDescription:
          '2号公寓是 Lune 最大的房型。两间卧室配大号双人床，两个带淋浴的独立浴室、衣柜和私人阳台，为家庭和团体提供真正舒适的空间。空调、免费 Wi-Fi、小冰箱、电热水壶和吹风机一应俱全。',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
        suitableFor: ['家庭', '朋友团体', '两对情侣', '较长住宿'],
        policies: zhPolicies,
        priceNote: '价格参考 Agoda 页面（2026年9月，不含税）。正式付款货币为 VND。',
      },
      ko: {
        name: '발코니 아파트 2 (투 베드룸)',
        shortDescription: 'Lune에서 가장 넓은 아파트: 56m², 침실 2개, 욕실 2개, 전용 발코니로 최대 4인까지 숙박 가능합니다.',
        description:
          '아파트 2는 Lune의 가장 큰 객실입니다. 라지 더블베드를 갖춘 침실 2개, 샤워 시설이 있는 전용 욕실 2개, 옷장, 전용 발코니로 가족과 그룹에게 진정 편안한 공간을 제공합니다. 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어가 모두 갖춰져 있습니다.',
        fullDescription:
          '아파트 2는 Lune의 가장 큰 객실입니다. 라지 더블베드를 갖춘 침실 2개, 샤워 시설이 있는 전용 욕실 2개, 옷장, 전용 발코니로 가족과 그룹에게 진정 편안한 공간을 제공합니다. 에어컨, 무료 Wi-Fi, 미니 냉장고, 전기 주전자, 헤어드라이어가 모두 갖춰져 있습니다.',
        amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Balcony', 'Mini fridge', 'Electric kettle', 'Hairdryer', 'Wardrobe'],
        suitableFor: ['가족', '친구 그룹', '두 커플', '긴 숙박'],
        policies: koPolicies,
        priceNote: 'Agoda 페이지 기준 참고 요금(2026년 9월, 세금 별도). 최종 결제는 VND로 진행됩니다.',
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

export const roomTypes = [
  'One Bedroom Apartment',
  'One Bedroom Studio Apartment with Balcony',
  'Two Bedroom Apartment',
  'Studio Apartment with Balcony',
  'Two Bedroom Apartment With Balcony',
];
