import { MOBILE_MEDIA_QUERY, getMobileVariant } from '../utils/responsiveImage.js';

// The <img> giu nguyen moi class/props; <picture> dung `contents` de khong anh huong layout (grid/flex).
// Man hinh < lg nhan ban "-mobile.webp", tu lg tro len luon nhan anh goc (desktop khong doi chat luong).
export default function LuneImage({ src, ...imgProps }) {
  const mobileSrc = getMobileVariant(src);
  if (!mobileSrc) return <img src={src} {...imgProps} />;
  return (
    <picture className="contents">
      <source media={MOBILE_MEDIA_QUERY} srcSet={mobileSrc} />
      <img src={src} {...imgProps} />
    </picture>
  );
}
