export function getRoomText(room, language = 'en', field) {
  return (
    room?.translations?.[language]?.[field] ??
    room?.translations?.en?.[field] ??
    room?.[field] ??
    ''
  );
}

const roomMetaLabels = {
  bed: {
    '1 king bed': {
      vi: '1 giường king',
      zh: '1张特大床',
      'zh-TW': '1張特大床',
      ko: '킹침대 1개',
      ja: 'キングベッド1台',
    },
    '1 queen bed': {
      vi: '1 giường queen',
      zh: '1张大床',
      'zh-TW': '1張大床',
      ko: '퀸침대 1개',
      ja: 'クイーンベッド1台',
    },
    '2 queen beds': {
      vi: '2 giường queen',
      zh: '2张大床',
      'zh-TW': '2張大床',
      ko: '퀸침대 2개',
      ja: 'クイーンベッド2台',
    },
    '1 king bed + sofa area': {
      vi: '1 giường king + khu sofa',
      zh: '1张特大床 + 沙发区',
      'zh-TW': '1張特大床 + 沙發區',
      ko: '킹침대 1개 + 소파 공간',
      ja: 'キングベッド1台 + ソファスペース',
    },
  },
  type: {
    Studio: {
      vi: 'Studio',
      zh: '单间公寓',
      'zh-TW': '單間公寓',
      ko: '스튜디오',
      ja: 'スタジオ',
    },
    'Balcony apartment': {
      vi: 'Căn hộ ban công',
      zh: '阳台公寓',
      'zh-TW': '陽台公寓',
      ko: '발코니 아파트',
      ja: 'バルコニー付きアパート',
    },
    'Family apartment': {
      vi: 'Căn hộ gia đình',
      zh: '家庭公寓',
      'zh-TW': '家庭公寓',
      ko: '패밀리 아파트',
      ja: 'ファミリーアパート',
    },
    'Deluxe double': {
      vi: 'Phòng đôi Deluxe',
      zh: '豪华双人房',
      'zh-TW': '豪華雙人房',
      ko: '디럭스 더블',
      ja: 'デラックスダブル',
    },
    'Type 3 kitchen': {
      vi: 'Căn hộ bếp Type 3',
      zh: '3类厨房公寓',
      'zh-TW': '3類廚房公寓',
      ko: '타입 3 키친 아파트',
      ja: 'タイプ3 キッチン付き',
    },
  },
};

export function localizeRoomMeta(value, language = 'en', kind = 'bed') {
  if (!value || language === 'en') return value || '';
  return roomMetaLabels[kind]?.[value]?.[language] || value;
}

export function getLocalizedRoom(room, language = 'en') {
  if (!room) return room;
  return {
    ...room,
    name: getRoomText(room, language, 'name'),
    shortDescription: getRoomText(room, language, 'shortDescription'),
    description: getRoomText(room, language, 'description') || getRoomText(room, language, 'fullDescription'),
    fullDescription: getRoomText(room, language, 'fullDescription'),
    policyNote: getRoomText(room, language, 'policyNote'),
    priceNote: getRoomText(room, language, 'priceNote'),
    bed: localizeRoomMeta(room.bed, language, 'bed'),
    type: localizeRoomMeta(room.type, language, 'type'),
    amenities: room?.translations?.[language]?.amenities || room?.translations?.en?.amenities || room.amenities || [],
    suitableFor: room?.translations?.[language]?.suitableFor || room?.translations?.en?.suitableFor || [],
    policies: room?.translations?.[language]?.policies || room?.translations?.en?.policies || [],
  };
}
