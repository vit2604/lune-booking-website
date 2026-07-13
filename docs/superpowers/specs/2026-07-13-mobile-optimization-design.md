# Thiết kế: Tối ưu trải nghiệm web mobile (trang khách)

Ngày: 2026-07-13
Phạm vi: chỉ các trang khách (HomePage, RoomsPage, RoomDetailPage, BookingPage, PaymentPage, ContactPage, PoliciesPage, SuccessPage). Không đụng giao diện admin.

## Ràng buộc cứng

- **Desktop giữ nguyên tuyệt đối**: layout, giao diện, và chất lượng ảnh trên desktop không thay đổi. Ảnh gốc trong `public/images` giữ nguyên byte — không nén, không resize, không ghi đè.
- Mọi thay đổi giao diện dành cho mobile phải nằm dưới breakpoint (Tailwind `lg:` trở xuống) hoặc là attribute HTML mà desktop bỏ qua.
- Ngoại lệ đã được duyệt: skeleton loading khi chuyển trang áp dụng chung cho cả desktop và mobile (thay hộp "Loading Lune...").

## Hiện trạng đo được

- `public/images`: 34 ảnh, 4.14 MB. Ảnh hero `exterior-1.webp` 722 KB, là LCP element của trang chủ, không có preload.
- Bundle chính `dist/assets/index-*.js` 373 KB: chứa toàn bộ 4 ngôn ngữ i18n (`translations.js` 31 KB + `translationExtensions.js` 92 KB + `liveTranslationOverrides.js` 12 KB nguồn).
- `socket.io-client` tách chunk riêng (46 KB) — cần xác nhận thời điểm load.
- Google Fonts 2 family / 6 weight load qua CSS bên ngoài, chặn render.
- `loading="lazy"` mới có 7 chỗ; gallery RoomDetailPage chưa có; nhiều `<img>` thiếu `width`/`height`.
- Route đã lazy-load đầy đủ qua `React.lazy` trong `src/App.jsx`.

## Phần 1 — Ảnh: thêm bản mobile, giữ nguyên bản gốc

1. Script (chạy một lần, dùng `sharp`) tạo bản mobile ~750px WebP cho: ảnh hero (2 ảnh exterior) và ảnh đại diện các loại phòng dùng trong RoomCard/gallery. Đặt cạnh ảnh gốc với hậu tố `-mobile` (ví dụ `exterior-1-mobile.webp`). Không ghi đè file gốc.
2. `<img>` liên quan dùng `srcset` + `sizes`: viewport nhỏ nhận bản mobile, viewport lớn nhận bản gốc.
3. `index.html`: thêm `<link rel="preload" as="image" fetchpriority="high">` cho ảnh hero với `imagesrcset`/`imagesizes` tương ứng.
4. Mọi `<img>` trang khách: `loading="lazy"` (trừ hero), `decoding="async"`, `width`/`height` hoặc `aspect-ratio` để CLS ~ 0.

Kỳ vọng: ảnh hero trên mobile ~60–80 KB thay vì 722 KB; desktop không đổi.

## Phần 2 — Bundle JS

1. Tách i18n theo ngôn ngữ: mỗi ngôn ngữ (`en`, `vi`, `zh`, `ko`) một module riêng, load bằng `import()` động trong `LanguageContext`. Tiếng Anh (mặc định) bundle sẵn để không nháy chữ lần tải đầu. Gộp phần mở rộng của `translationExtensions.js` và `liveTranslationOverrides.js` vào module từng ngôn ngữ tương ứng.
2. Defer `socket.io-client`: `import()` động trong `socketChatClient` chỉ khi khách mở chat widget lần đầu (nếu hiện đang load ngay khi vào trang).
3. Font: chuyển sang load không chặn render (pattern `media="print" onload` hoặc preload + swap), giữ nguyên 2 family và các weight đang dùng thật.

Kỳ vọng: bundle chính giảm ~90–100 KB nguồn i18n; first paint sớm hơn do font không chặn.

## Phần 3 — UX mobile

1. Rà 6 trang khách trên viewport 375px bằng browser: touch target ≥ 44px, khoảng cách nút, chữ/bảng không tràn ngang. Sửa bằng responsive class, không đổi layout desktop.
2. Sticky CTA "Đặt phòng" ở đáy màn hình trên RoomDetailPage, chỉ render dưới `lg:`.
3. Form Booking/Payment: `inputmode` (`tel`, `numeric`, `email`), `autocomplete` (`name`, `tel`, `email`) — desktop bỏ qua.
4. Skeleton loading thay `RouteLoader` hiện tại khi chuyển trang (áp dụng chung desktop + mobile, đã duyệt).

## Kiểm chứng

- `npm run test` và `npm run build` sau mỗi phần.
- So sánh kích thước chunk `dist/assets` trước/sau.
- Browser preview: kiểm tra từng trang khách ở 375px (mobile) và 1280px (desktop) — desktop phải giống hệt hiện tại.
- Xác nhận qua Network: mobile viewport tải bản `-mobile`, desktop tải bản gốc; socket.io chỉ tải khi mở chat.

## Ngoài phạm vi

- Giao diện admin, `mobile-support-app`, Vercel Image Optimization, service worker/PWA, thay đổi backend.
