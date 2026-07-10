// The backend stores branding with different field names than the frontend store.
// These adapters translate between the two so admin edits and the public site
// stay in sync. Only fields present on the backend are mapped; the rest of the
// frontend branding (colours, featured amenities, etc.) keeps its local values.

const defined = (object) =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null));

export function backendToBranding(branding = {}) {
  return defined({
    hotelName: branding.hotelName,
    shortSlogan: branding.slogan,
    address: branding.address,
    phone: branding.phone,
    email: branding.email,
    logoUrl: branding.logoUrl,
    heroImage: branding.heroImage,
    introImage: branding.introImage,
    facebook: branding.facebookUrl,
    instagram: branding.instagramUrl,
    googleMapsLink: branding.googleMapsUrl,
    zalo: branding.zaloNumber,
    whatsapp: branding.whatsappNumber,
    heroTitle: branding.homeHeroTitle,
    heroSubtitle: branding.homeHeroSubtitle,
    footerDescription: branding.footerDescription,
  });
}

export function brandingToBackend(branding = {}) {
  return defined({
    hotelName: branding.hotelName,
    slogan: branding.shortSlogan || branding.slogan,
    address: branding.address,
    phone: branding.phone,
    email: branding.email,
    logoUrl: branding.logoUrl,
    heroImage: branding.heroImage,
    introImage: branding.introImage,
    facebookUrl: branding.facebook,
    instagramUrl: branding.instagram,
    googleMapsUrl: branding.googleMapsLink,
    zaloNumber: branding.zalo,
    whatsappNumber: branding.whatsapp,
    homeHeroTitle: branding.heroTitle,
    homeHeroSubtitle: branding.heroSubtitle,
    footerDescription: branding.footerDescription,
  });
}
