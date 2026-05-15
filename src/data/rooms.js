export const rooms = [
  {
    id: 'deluxe-studio',
    slug: 'deluxe-studio',
    name: 'Deluxe Studio',
    type: 'Studio',
    maxGuests: 2,
    bed: '1 queen bed',
    size: '32m²',
    price: 850000,
    bathroom: 'Private bathroom with walk-in shower',
    shortDescription:
      'A bright studio for couples or solo travelers, designed for calm mornings and easy beach days.',
    description:
      'Deluxe Studio pairs warm textures, a queen bed, a compact work corner, and a private bathroom. It is ideal for short stays in Da Nang when comfort and simplicity matter most.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Smart TV', 'Mini fridge'],
    highlights: ['Quiet room', 'City view', 'Daily housekeeping'],
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85',
    ],
  },
  {
    id: 'superior-apartment',
    slug: 'superior-apartment',
    name: 'Superior Apartment',
    type: 'Apartment',
    maxGuests: 2,
    bed: '1 queen bed',
    size: '40m²',
    price: 990000,
    bathroom: 'Private bathroom with premium amenities',
    shortDescription:
      'A spacious apartment with a lounge area for travelers who want more room to settle in.',
    description:
      'Superior Apartment offers a generous layout, separate sitting space, warm lighting, and practical storage. It works beautifully for couples or business travelers staying a few nights.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Kitchenette', 'Elevator'],
    highlights: ['Lounge area', 'Kitchenette', 'Soft natural light'],
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85',
    ],
  },
  {
    id: 'family-apartment',
    slug: 'family-apartment',
    name: 'Family Apartment',
    type: 'Family',
    maxGuests: 4,
    bed: '2 beds',
    size: '56m²',
    price: 1350000,
    bathroom: 'Private family bathroom',
    shortDescription:
      'A relaxed apartment for small families, with two beds and space to unwind after exploring.',
    description:
      'Family Apartment gives small families a practical base near the beach, with two beds, a comfortable seating area, private bathroom, and thoughtful storage for longer bags.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private bathroom', 'Two beds', 'Dining corner'],
    highlights: ['Family layout', 'Dining corner', 'Extra storage'],
    image:
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85',
    ],
  },
  {
    id: 'long-stay-apartment',
    slug: 'long-stay-apartment',
    name: 'Long Stay Apartment',
    type: 'Long stay',
    maxGuests: 2,
    bed: '1 queen bed',
    size: '45m²',
    price: 1150000,
    bathroom: 'Private bathroom with shower',
    shortDescription:
      'A self-contained apartment with kitchen and washing machine for extended stays in Da Nang.',
    description:
      'Long Stay Apartment is built for guests who need independence: a kitchen, washing machine, work-friendly table, queen bed, and a quiet layout for weekly or monthly stays.',
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Kitchen', 'Washing machine', 'Private bathroom'],
    highlights: ['Kitchen', 'Washing machine', 'Work table'],
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85',
    gallery: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=85',
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=85',
    ],
  },
];

export const roomTypes = ['Studio', 'Apartment', 'Family', 'Long stay'];

const roomTranslationMap = {
  'deluxe-studio': {
    en: {
      name: 'Deluxe Studio',
      shortDescription:
        'A bright studio for couples or solo travelers, designed for calm mornings and easy beach days.',
      description:
        'Deluxe Studio pairs warm textures, a queen bed, a compact work corner, and a private bathroom. It is ideal for short stays in Da Nang when comfort and simplicity matter most.',
      policyNote: 'Quiet studio room for short beach stays.',
    },
    vi: {
      name: 'Studio Deluxe',
      shortDescription:
        'Studio sáng sủa cho cặp đôi hoặc khách đi một mình, phù hợp cho những ngày gần biển.',
      description:
        'Studio Deluxe có giường queen, góc làm việc nhỏ, phòng tắm riêng và không gian ấm áp cho kỳ nghỉ ngắn tại Đà Nẵng.',
      policyNote: 'Phòng studio yên tĩnh cho kỳ nghỉ ngắn gần biển.',
    },
    zh: {
      name: '豪华一室房',
      shortDescription: '明亮的一室房，适合情侣或独自旅行者，适合轻松的海边假期。',
      description:
        '豪华一室房配有大床、小型工作角和独立浴室，适合在岘港短住并享受舒适简洁的空间。',
      policyNote: '适合短期海边住宿的安静一室房。',
    },
    ko: {
      name: '디럭스 스튜디오',
      shortDescription: '커플 또는 1인 여행객에게 적합한 밝고 편안한 스튜디오입니다.',
      description:
        '디럭스 스튜디오는 퀸 침대, 작은 업무 공간, 전용 욕실을 갖춘 따뜻한 분위기의 객실로 다낭 단기 숙박에 적합합니다.',
      policyNote: '해변 근처 단기 숙박에 좋은 조용한 스튜디오입니다.',
    },
  },
  'superior-apartment': {
    en: {
      name: 'Superior Apartment',
      shortDescription: 'A spacious apartment with a lounge area for travelers who want more room to settle in.',
      description:
        'Superior Apartment offers a generous layout, separate sitting space, warm lighting, and practical storage. It works beautifully for couples or business travelers staying a few nights.',
      policyNote: 'Comfortable apartment for couples and short stays.',
    },
    vi: {
      name: 'Căn hộ Superior',
      shortDescription: 'Căn hộ rộng rãi có khu vực ngồi riêng cho khách muốn không gian thoải mái hơn.',
      description:
        'Căn hộ Superior có bố cục rộng, khu vực ngồi riêng, ánh sáng ấm và tiện ích lưu trữ phù hợp cho cặp đôi hoặc khách công tác.',
      policyNote: 'Căn hộ thoải mái phù hợp cho cặp đôi và lưu trú ngắn ngày.',
    },
    zh: {
      name: '高级公寓',
      shortDescription: '带休息区的宽敞公寓，适合希望拥有更多空间的旅客。',
      description: '高级公寓空间宽敞，配有独立休息区、温暖灯光和实用收纳，适合情侣或商务旅客。',
      policyNote: '适合情侣和短期入住的舒适公寓。',
    },
    ko: {
      name: '슈페리어 아파트',
      shortDescription: '더 넓은 공간을 원하는 여행객을 위한 라운지 공간이 있는 아파트입니다.',
      description: '슈페리어 아파트는 넉넉한 구조, 별도 휴식 공간, 따뜻한 조명과 실용적인 수납을 제공합니다.',
      policyNote: '커플과 단기 숙박에 적합한 편안한 아파트입니다.',
    },
  },
  'family-apartment': {
    en: {
      name: 'Family Apartment',
      shortDescription: 'A relaxed apartment for small families, with two beds and space to unwind after exploring.',
      description:
        'Family Apartment gives small families a practical base near the beach, with two beds, a comfortable seating area, private bathroom, and thoughtful storage.',
      policyNote: 'Family-friendly room for up to four guests.',
    },
    vi: {
      name: 'Căn hộ Gia đình',
      shortDescription: 'Căn hộ thoải mái cho gia đình nhỏ, có hai giường và không gian nghỉ ngơi.',
      description:
        'Căn hộ Gia đình là lựa chọn thực tế gần biển với hai giường, khu vực ngồi, phòng tắm riêng và không gian để hành lý.',
      policyNote: 'Phòng phù hợp gia đình nhỏ tối đa bốn khách.',
    },
    zh: {
      name: '家庭公寓',
      shortDescription: '适合小家庭的舒适公寓，配有两张床和休息空间。',
      description: '家庭公寓靠近海滩，配有两张床、舒适休息区、独立浴室和实用收纳空间。',
      policyNote: '适合最多四位客人的家庭房。',
    },
    ko: {
      name: '패밀리 아파트',
      shortDescription: '침대 2개와 휴식 공간을 갖춘 소규모 가족용 아파트입니다.',
      description: '패밀리 아파트는 해변 근처에서 가족이 편하게 머물 수 있는 실용적인 객실입니다.',
      policyNote: '최대 4인까지 머물 수 있는 가족 친화 객실입니다.',
    },
  },
  'long-stay-apartment': {
    en: {
      name: 'Long Stay Apartment',
      shortDescription: 'A self-contained apartment with kitchen and washing machine for extended stays in Da Nang.',
      description:
        'Long Stay Apartment is built for guests who need independence: a kitchen, washing machine, work-friendly table, queen bed, and a quiet layout.',
      policyNote: 'Designed for weekly or monthly stays.',
    },
    vi: {
      name: 'Căn hộ Lưu trú dài ngày',
      shortDescription: 'Căn hộ có bếp và máy giặt, phù hợp cho khách lưu trú dài ngày tại Đà Nẵng.',
      description:
        'Căn hộ Lưu trú dài ngày có bếp, máy giặt, bàn làm việc, giường queen và bố cục yên tĩnh cho khách ở tuần hoặc tháng.',
      policyNote: 'Thiết kế cho lưu trú theo tuần hoặc theo tháng.',
    },
    zh: {
      name: '长住公寓',
      shortDescription: '带厨房和洗衣机的独立公寓，适合在岘港长期入住。',
      description: '长住公寓配有厨房、洗衣机、工作桌、大床和安静布局，适合周租或月租客人。',
      policyNote: '适合按周或按月入住。',
    },
    ko: {
      name: '장기 숙박 아파트',
      shortDescription: '주방과 세탁기가 있는 독립형 아파트로 다낭 장기 숙박에 적합합니다.',
      description: '장기 숙박 아파트는 주방, 세탁기, 업무용 테이블, 퀸 침대와 조용한 구조를 갖추고 있습니다.',
      policyNote: '주 단위 또는 월 단위 숙박에 적합합니다.',
    },
  },
};

rooms.forEach((room) => {
  room.translations = roomTranslationMap[room.id] || {
    en: {
      name: room.name,
      shortDescription: room.shortDescription,
      description: room.description,
      policyNote: '',
    },
  };
});

const roomNameTranslations = {
  'deluxe-studio': {
    'zh-TW': '豪華一室房',
    ja: 'デラックス スタジオ',
    th: 'ดีลักซ์สตูดิโอ',
    ru: 'Делюкс студио',
    fr: 'Studio Deluxe',
    de: 'Deluxe Studio',
    es: 'Estudio Deluxe',
    it: 'Studio Deluxe',
    id: 'Studio Deluxe',
    ms: 'Studio Deluxe',
    ar: 'استوديو ديلوكس',
    hi: 'डीलक्स स्टूडियो',
  },
  'superior-apartment': {
    'zh-TW': '高級公寓',
    ja: 'スーペリア アパートメント',
    th: 'ซูพีเรียร์อพาร์ตเมนต์',
    ru: 'Апартаменты Superior',
    fr: 'Appartement Supérieur',
    de: 'Superior Apartment',
    es: 'Apartamento Superior',
    it: 'Appartamento Superior',
    id: 'Apartemen Superior',
    ms: 'Apartmen Superior',
    ar: 'شقة سوبيريور',
    hi: 'सुपीरियर अपार्टमेंट',
  },
  'family-apartment': {
    'zh-TW': '家庭公寓',
    ja: 'ファミリー アパートメント',
    th: 'แฟมิลี่อพาร์ตเมนต์',
    ru: 'Семейные апартаменты',
    fr: 'Appartement Familial',
    de: 'Familienapartment',
    es: 'Apartamento Familiar',
    it: 'Appartamento Family',
    id: 'Apartemen Keluarga',
    ms: 'Apartmen Keluarga',
    ar: 'شقة عائلية',
    hi: 'फैमिली अपार्टमेंट',
  },
  'long-stay-apartment': {
    'zh-TW': '長住公寓',
    ja: 'ロングステイ アパートメント',
    th: 'ลองสเตย์อพาร์ตเมนต์',
    ru: 'Апартаменты для длительного проживания',
    fr: 'Appartement Long Séjour',
    de: 'Long-Stay Apartment',
    es: 'Apartamento de larga estancia',
    it: 'Appartamento Long Stay',
    id: 'Apartemen Long Stay',
    ms: 'Apartmen Long Stay',
    ar: 'شقة للإقامة الطويلة',
    hi: 'लॉन्ग स्टे अपार्टमेंट',
  },
};

const roomCopyByLanguage = {
  'zh-TW': {
    short: '靠近海灘、乾淨舒適的精品公寓房型，適合輕鬆入住峴港。',
    full: '此房型結合明亮空間、實用設備與溫暖材質，適合情侶、小家庭、商務旅客或長住客在峴港享受便利且安靜的住宿。',
    suitableFor: ['情侶', '小家庭', '商務旅客', '長住客'],
    policies: ['14:00 後入住', '12:00 前退房', '房內禁止吸菸', '不可攜帶寵物'],
    priceNote: '房價以 VND 為正式付款金額。',
  },
  ja: {
    short: 'ビーチ近くで清潔に過ごせる、快適なブティックアパートメント客室です。',
    full: '明るい空間、実用的な設備、温かい素材感を備え、カップル、小さな家族、出張者、長期滞在の方に便利で落ち着いたダナン滞在を提供します。',
    suitableFor: ['カップル', '小さな家族', '出張者', '長期滞在'],
    policies: ['チェックインは14:00から', 'チェックアウトは12:00まで', '室内禁煙', 'ペット不可'],
    priceNote: '正式なお支払い金額はVNDです。',
  },
  th: {
    short: 'ห้องพักบูทีคอพาร์ตเมนต์สะอาด ใกล้ชายหาด และพักผ่อนได้สบายในดานัง',
    full: 'ห้องนี้ออกแบบให้สว่าง ใช้งานง่าย และอบอุ่น เหมาะสำหรับคู่รัก ครอบครัวเล็ก นักธุรกิจ และผู้เข้าพักระยะยาวที่ต้องการฐานพักสงบในดานัง',
    suitableFor: ['คู่รัก', 'ครอบครัวเล็ก', 'นักธุรกิจ', 'พักระยะยาว'],
    policies: ['เช็คอินตั้งแต่ 14:00', 'เช็คเอาต์ก่อน 12:00', 'ห้ามสูบบุหรี่ในห้อง', 'ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพัก'],
    priceNote: 'ยอดชำระจริงใช้สกุลเงิน VND',
  },
  ru: {
    short: 'Чистые и светлые бутик-апартаменты рядом с пляжем для спокойного отдыха в Дананге.',
    full: 'Номер сочетает светлое пространство, практичные удобства и теплые материалы. Он подходит парам, небольшим семьям, деловым гостям и тем, кто планирует длительное проживание.',
    suitableFor: ['Пары', 'Небольшие семьи', 'Деловые гости', 'Длительное проживание'],
    policies: ['Заезд с 14:00', 'Выезд до 12:00', 'Курение в номере запрещено', 'Размещение с животными не допускается'],
    priceNote: 'Официальная сумма оплаты указана в VND.',
  },
  fr: {
    short: 'Un appartement boutique propre et lumineux près de la plage pour un séjour simple à Da Nang.',
    full: 'Cette chambre associe espace lumineux, équipements pratiques et matières chaleureuses, idéale pour couples, petites familles, voyageurs d’affaires et longs séjours.',
    suitableFor: ['Couples', 'Petites familles', 'Voyageurs d’affaires', 'Longs séjours'],
    policies: ['Arrivée à partir de 14:00', 'Départ avant 12:00', 'Non-fumeur dans la chambre', 'Animaux non admis'],
    priceNote: 'Le montant officiel de paiement est en VND.',
  },
  de: {
    short: 'Saubere, helle Boutique-Apartments nahe dem Strand für einen entspannten Aufenthalt in Da Nang.',
    full: 'Dieses Zimmer verbindet helle Räume, praktische Ausstattung und warme Materialien. Es eignet sich für Paare, kleine Familien, Geschäftsreisende und Langzeitgäste.',
    suitableFor: ['Paare', 'Kleine Familien', 'Geschäftsreisende', 'Langzeitgäste'],
    policies: ['Check-in ab 14:00', 'Check-out vor 12:00', 'Nichtraucherzimmer', 'Haustiere nicht erlaubt'],
    priceNote: 'Der offizielle Zahlungsbetrag ist in VND.',
  },
  es: {
    short: 'Apartamento boutique limpio y luminoso cerca de la playa para una estancia cómoda en Da Nang.',
    full: 'La habitación combina luz natural, servicios prácticos y materiales cálidos. Es ideal para parejas, familias pequeñas, viajeros de negocios y estancias largas.',
    suitableFor: ['Parejas', 'Familias pequeñas', 'Viajeros de negocios', 'Estancias largas'],
    policies: ['Check-in desde las 14:00', 'Check-out antes de las 12:00', 'No fumar dentro de la habitación', 'No se admiten mascotas'],
    priceNote: 'El importe oficial de pago es en VND.',
  },
  it: {
    short: 'Un appartamento boutique pulito e luminoso vicino alla spiaggia per soggiorni comodi a Da Nang.',
    full: 'La camera unisce luce naturale, dotazioni pratiche e materiali caldi. È ideale per coppie, piccole famiglie, viaggiatori business e soggiorni lunghi.',
    suitableFor: ['Coppie', 'Piccole famiglie', 'Business traveler', 'Soggiorni lunghi'],
    policies: ['Check-in dalle 14:00', 'Check-out prima delle 12:00', 'Vietato fumare in camera', 'Animali non ammessi'],
    priceNote: 'L’importo ufficiale di pagamento è in VND.',
  },
  id: {
    short: 'Apartemen boutique bersih dan terang dekat pantai untuk menginap nyaman di Da Nang.',
    full: 'Kamar ini memadukan ruang terang, fasilitas praktis, dan sentuhan hangat. Cocok untuk pasangan, keluarga kecil, tamu bisnis, dan long stay.',
    suitableFor: ['Pasangan', 'Keluarga kecil', 'Tamu bisnis', 'Long stay'],
    policies: ['Check-in mulai 14:00', 'Check-out sebelum 12:00', 'Dilarang merokok di kamar', 'Hewan peliharaan tidak diperbolehkan'],
    priceNote: 'Nominal pembayaran resmi menggunakan VND.',
  },
  ms: {
    short: 'Apartmen butik bersih dan cerah berhampiran pantai untuk penginapan selesa di Da Nang.',
    full: 'Bilik ini menggabungkan ruang terang, kemudahan praktikal dan suasana hangat. Sesuai untuk pasangan, keluarga kecil, tetamu bisnes dan penginapan panjang.',
    suitableFor: ['Pasangan', 'Keluarga kecil', 'Tetamu bisnes', 'Penginapan panjang'],
    policies: ['Daftar masuk dari 14:00', 'Daftar keluar sebelum 12:00', 'Dilarang merokok di bilik', 'Haiwan peliharaan tidak dibenarkan'],
    priceNote: 'Jumlah bayaran rasmi adalah dalam VND.',
  },
  ar: {
    short: 'شقة بوتيك نظيفة ومشرقة بالقرب من الشاطئ لإقامة مريحة في دا نانغ.',
    full: 'تجمع هذه الغرفة بين المساحة المضيئة والمرافق العملية واللمسات الدافئة، وهي مناسبة للأزواج والعائلات الصغيرة ورجال الأعمال والإقامات الطويلة.',
    suitableFor: ['الأزواج', 'العائلات الصغيرة', 'رحلات العمل', 'الإقامات الطويلة'],
    policies: ['تسجيل الوصول من 14:00', 'تسجيل المغادرة قبل 12:00', 'ممنوع التدخين داخل الغرفة', 'الحيوانات الأليفة غير مسموحة'],
    priceNote: 'المبلغ الرسمي للدفع هو بالـ VND.',
  },
  hi: {
    short: 'डा नांग में समुद्र तट के पास साफ और उजला बुटीक अपार्टमेंट कमरा।',
    full: 'यह कमरा उजले स्पेस, उपयोगी सुविधाओं और गर्माहट भरे डिज़ाइन को जोड़ता है। यह कपल्स, छोटे परिवारों, बिज़नेस यात्रियों और लंबी अवधि के मेहमानों के लिए उपयुक्त है।',
    suitableFor: ['कपल्स', 'छोटे परिवार', 'बिज़नेस यात्री', 'लॉन्ग स्टे'],
    policies: ['चेक-इन 14:00 से', 'चेक-आउट 12:00 से पहले', 'कमरे में धूम्रपान नहीं', 'पालतू जानवर की अनुमति नहीं'],
    priceNote: 'आधिकारिक भुगतान राशि VND में है।',
  },
};

rooms.forEach((room) => {
  const english = room.translations.en || {};
  Object.entries(roomCopyByLanguage).forEach(([language, copy]) => {
    room.translations[language] = {
      ...english,
      name: roomNameTranslations[room.id]?.[language] || english.name || room.name,
      shortDescription: copy.short,
      description: copy.full,
      fullDescription: copy.full,
      amenities: room.amenities,
      suitableFor: copy.suitableFor,
      policies: copy.policies,
      policyNote: copy.policies[0],
      priceNote: copy.priceNote,
    };
  });

  Object.values(room.translations).forEach((translation) => {
    translation.fullDescription = translation.fullDescription || translation.description;
    translation.amenities = translation.amenities || room.amenities;
    translation.suitableFor = translation.suitableFor || ['Couples', 'Small families', 'Business travelers'];
    translation.policies = translation.policies || ['Check-in from 14:00', 'Check-out before 12:00'];
    translation.priceNote = translation.priceNote || 'VND is the official payment currency.';
  });
});
