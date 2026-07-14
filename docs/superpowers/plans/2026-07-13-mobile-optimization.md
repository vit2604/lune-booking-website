# Mobile Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tối ưu tốc độ + UX mobile cho các trang khách, desktop giữ nguyên tuyệt đối (layout và chất lượng ảnh).

**Architecture:** Thêm bản ảnh mobile cạnh ảnh gốc và để trình duyệt chọn qua `srcset`; tách i18n thành module theo ngôn ngữ load động (en bundle sẵn); font load không chặn render; sticky CTA + form attributes + skeleton cho mobile UX.

**Tech Stack:** React 19, Vite 7, Tailwind 3, sharp (devDependency, chỉ dùng cho script một lần).

## Global Constraints

- Ảnh gốc trong `public/images` giữ nguyên byte — không nén, không resize, không ghi đè.
- Desktop (≥1024px) không thay đổi layout/giao diện, trừ skeleton loading (đã duyệt áp dụng chung).
- Thay đổi UI mobile phải nằm dưới breakpoint Tailwind `lg:` hoặc là HTML attribute desktop bỏ qua.
- Không đụng giao diện admin, `mobile-support-app`, backend.
- Sau mỗi task: `npm run test` và `npm run build` phải pass.

---

### Task 1: Sinh bản ảnh mobile

**Files:**
- Create: `scripts/generate-mobile-images.mjs`
- Create: `public/images/lune/**/*-mobile.webp` (sinh tự động)
- Modify: `package.json` (thêm `sharp` devDependency + script `images:mobile`)

**Interfaces:**
- Produces: với mỗi ảnh `<name>.webp|jpg` có chiều rộng > 900px trong `public/images/lune`, tồn tại file `<name>-mobile.webp` rộng 750px, quality 78.

- [ ] **Step 1:** `npm install -D sharp`
- [ ] **Step 2:** Viết `scripts/generate-mobile-images.mjs`:

```js
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public/images/lune');
const MOBILE_WIDTH = 750;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

for await (const file of walk(ROOT)) {
  if (!/\.(webp|jpe?g|png)$/i.test(file) || /-mobile\.webp$/i.test(file)) continue;
  const meta = await sharp(file).metadata();
  if ((meta.width ?? 0) <= 900) continue;
  const out = file.replace(/\.(webp|jpe?g|png)$/i, '-mobile.webp');
  await sharp(file).resize({ width: MOBILE_WIDTH }).webp({ quality: 78 }).toFile(out);
  const { size } = await stat(out);
  console.log(`${path.relative(ROOT, out)} ${(size / 1024).toFixed(0)} KB`);
}
```

- [ ] **Step 3:** Chạy `node scripts/generate-mobile-images.mjs`, kiểm tra output: mỗi bản mobile < 120 KB, ảnh gốc không đổi (`git status` không hiện file gốc bị modify).
- [ ] **Step 4:** Commit script + ảnh mới.

### Task 2: srcset + preload hero + chống giật layout

**Files:**
- Create: `src/utils/responsiveImage.js`
- Modify: `index.html` (preload hero), `src/pages/HomePage.jsx`, `src/components/RoomCard.jsx`, `src/pages/RoomDetailPage.jsx`, `src/pages/ContactPage.jsx`, `src/components/GuestLayout.jsx` (nếu có `<img>`)

**Interfaces:**
- Produces: `getMobileVariant(src): string | null` — trả `<name>-mobile.webp` nếu `src` là ảnh local `/images/lune/` có bản mobile tồn tại theo quy ước, ngược lại `null`; `responsiveImageProps(src, sizes)` trả `{ src, srcSet, sizes }` (srcSet chỉ khi có bản mobile).

- [ ] **Step 1:** Viết `src/utils/responsiveImage.js`:

```js
const LOCAL_PREFIX = '/images/lune/';

export function getMobileVariant(src) {
  if (typeof src !== 'string' || !src.startsWith(LOCAL_PREFIX)) return null;
  if (src.includes('-mobile.')) return null;
  const match = src.match(/^(.*)\.(webp|jpe?g|png)$/i);
  return match ? `${match[1]}-mobile.webp` : null;
}

export function responsiveImageProps(src, sizes = '100vw') {
  const mobile = getMobileVariant(src);
  if (!mobile) return { src };
  return { src, srcSet: `${mobile} 750w, ${src} 1920w`, sizes };
}
```

Lưu ý: chỉ áp dụng cho ảnh đã có bản mobile từ Task 1 (ảnh > 900px). Với ảnh không chắc có bản mobile, kiểm tra danh sách file sinh ra ở Task 1 trước khi gắn srcSet.

- [ ] **Step 2:** Viết unit test `src/utils/responsiveImage.test.js` (URL ngoài → null, ảnh local → đúng path), chạy `npm run test`.
- [ ] **Step 3:** Áp dụng vào hero HomePage (KHÔNG lazy, thêm `fetchpriority="high"`), gallery HomePage, intro image, RoomCard, gallery RoomDetailPage, ContactPage: spread `responsiveImageProps(...)`, thêm `loading="lazy"` + `decoding="async"` cho ảnh ngoài màn hình đầu, thêm `width`/`height` hoặc class `aspect-*` khớp kích thước hiển thị hiện tại (không đổi layout).
- [ ] **Step 4:** `index.html` thêm trước font links:

```html
<link
  rel="preload"
  as="image"
  fetchpriority="high"
  imagesrcset="/images/lune/exterior/exterior-1-mobile.webp 750w, /images/lune/exterior/exterior-1.webp 1920w"
  imagesizes="100vw"
/>
```

- [ ] **Step 5:** Verify bằng browser: viewport 375px tải `-mobile.webp`, viewport 1280px tải bản gốc (check Network requests); layout hai viewport không vỡ. Commit.

### Task 3: Tách i18n theo ngôn ngữ

**Files:**
- Create: `scripts/split-locales.mjs` (chạy một lần), `src/i18n/locales/en.js`, `src/i18n/locales/vi.js`, `src/i18n/locales/zh.js`, `src/i18n/locales/ko.js`
- Modify: `src/i18n/translations.js` (chỉ còn `languageOptions`, `futureLanguageOptions`, re-export en), `src/i18n/LanguageContext.jsx`, `src/i18n/useTranslation.js`
- Delete: `src/i18n/translationExtensions.js`, `src/i18n/liveTranslationOverrides.js` (sau khi merge vào locales)

**Interfaces:**
- Produces: mỗi `locales/<lang>.js` có `export default { ... }` là object translation ĐÃ merge đủ extensions + overrides (bằng đúng `translations[lang]` hiện tại). `LanguageContext` cung cấp thêm `translationsByLanguage` (object các locale đã load, luôn có `en`).
- Consumes: logic merge hiện có trong `applyTranslationExtensions` / `applyLiveTranslationOverrides`.

- [ ] **Step 1:** Viết `scripts/split-locales.mjs`: import `translations` từ `src/i18n/translations.js` (object đã merge sẵn), với mỗi lang trong `['en','vi','zh','ko']` ghi file `src/i18n/locales/<lang>.js` nội dung `export default ` + `JSON.stringify(translations[lang], null, 2)` + `;`. Chạy script.
- [ ] **Step 2:** Viết test snapshot trước khi refactor: `src/i18n/localeSplit.test.js` so sánh `locales/<lang>.js` deep-equal với `translations[<lang>]` cũ. Chạy pass rồi mới refactor.
- [ ] **Step 3:** Refactor `translations.js`: giữ `languageOptions`, `futureLanguageOptions`; `export { default as enTranslations } from './locales/en.js'`. Xoá import extensions/overrides.
- [ ] **Step 4:** `LanguageContext.jsx`: state `translationsByLanguage` khởi tạo `{ en: enTranslations }`; effect khi `currentLanguage` đổi và chưa có trong state thì `import(./locales/${currentLanguage}.js)` (dùng map tĩnh `{ vi: () => import('./locales/vi.js'), ... }` để Vite tách chunk rõ ràng) rồi merge vào state. `changeLanguage` giữ nguyên hành vi. Đưa `translationsByLanguage` vào context value.
- [ ] **Step 5:** `useTranslation.js`: bỏ import tĩnh `translations`; đọc `translationsByLanguage` từ context; fallback `en` giữ nguyên logic (`translationsByLanguage.en`). Trong lúc locale chưa load xong, `t()` fallback về en (chấp nhận nháy nhẹ một frame khi đổi ngôn ngữ lần đầu).
- [ ] **Step 6:** Cập nhật test snapshot ở Step 2 thành so sánh với bản git cũ đã lưu (hoặc xoá test tạm sau khi xác nhận), xoá 2 file extensions/overrides, sửa mọi import còn sót (grep `translationExtensions|liveTranslationOverrides|from './translations`).
- [ ] **Step 7:** `npm run test` + `npm run build`; so sánh kích thước `dist/assets/index-*.js` (kỳ vọng giảm ≥ 80 KB); browser verify: đổi ngôn ngữ VI/ZH/KO hiển thị đúng, Network thấy chunk locale load động. Commit.

### Task 4: Font không chặn render

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Đổi stylesheet Google Fonts sang pattern không chặn:

```html
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
  media="print"
  onload="this.media='all'"
/>
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" />
</noscript>
```

- [ ] **Step 2:** Build + browser verify font vẫn áp dụng đúng (kiểm tra computed `font-family` trên heading và body). Commit.

### Task 5: Mobile UX — sticky CTA, form attributes, rà 375px

**Files:**
- Modify: `src/pages/RoomDetailPage.jsx` (sticky CTA), `src/pages/BookingPage.jsx` + `src/pages/PaymentPage.jsx` (+ component form con nếu input nằm trong đó), các file phát hiện lỗi khi rà 375px

- [ ] **Step 1:** RoomDetailPage: thêm thanh sticky đáy màn hình chỉ mobile, hiện giá + nút đặt phòng dùng đúng handler/link đặt phòng hiện có của trang:

```jsx
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 backdrop-blur lg:hidden">
  <div className="flex items-center justify-between gap-3">
    <div className="text-sm font-semibold text-lune-ink">{/* giá/đêm hiện có */}</div>
    {/* nút Book Now tái dùng handler hiện có, min-h-[44px] */}
  </div>
</div>
```

Thêm `pb-20 lg:pb-0` cho container nội dung để không che footer.

- [ ] **Step 2:** Booking/Payment forms: input điện thoại `type="tel" inputmode="tel" autocomplete="tel"`; email `inputmode="email" autocomplete="email"`; tên `autocomplete="name"`; các input số `inputmode="numeric"`.
- [ ] **Step 3:** Rà 8 trang khách ở 375px bằng browser (read_page + screenshot): touch target < 44px, chữ/bảng tràn ngang, khoảng cách nút. Sửa từng lỗi bằng responsive class (`max-lg:` hoặc mặc định + `lg:` khôi phục desktop).
- [ ] **Step 4:** Verify 1280px từng trang giống hiện trạng (screenshot so sánh). Test + build. Commit.

### Task 6: Skeleton loading chuyển trang (chung desktop + mobile)

**Files:**
- Modify: `src/App.jsx` (`RouteLoader`)

- [ ] **Step 1:** Thay hộp "Loading Lune..." bằng skeleton trung tính:

```jsx
function RouteLoader() {
  return (
    <div className="min-h-[55vh] animate-pulse bg-lune-cream px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-8 w-2/3 rounded bg-stone-200" />
        <div className="h-4 w-1/2 rounded bg-stone-200" />
        <div className="h-64 rounded-xl bg-stone-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-40 rounded-xl bg-stone-200" />
          <div className="h-40 rounded-xl bg-stone-200" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2:** Verify bằng browser (throttle hoặc điều hướng trang chưa cache). Test + build. Commit.

### Task 7: Kiểm chứng tổng

- [ ] `npm run test` — ghi lại số test pass.
- [ ] `npm run build` — ghi lại kích thước index chunk trước/sau.
- [ ] Browser: HomePage/Rooms/RoomDetail/Booking ở 375px và 1280px, screenshot làm bằng chứng; Network xác nhận mobile tải `-mobile.webp`, locale chunk chỉ load khi đổi ngôn ngữ.
