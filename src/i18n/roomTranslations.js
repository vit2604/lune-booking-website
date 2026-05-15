export function getRoomText(room, language = 'en', field) {
  return (
    room?.translations?.[language]?.[field] ??
    room?.translations?.en?.[field] ??
    room?.[field] ??
    ''
  );
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
    amenities: room?.translations?.[language]?.amenities || room?.translations?.en?.amenities || room.amenities || [],
    suitableFor: room?.translations?.[language]?.suitableFor || room?.translations?.en?.suitableFor || [],
    policies: room?.translations?.[language]?.policies || room?.translations?.en?.policies || [],
  };
}
