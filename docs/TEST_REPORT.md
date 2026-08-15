# Báo cáo kiểm thử AI Content

Ngày: 2026-08-04.

## Đã đạt

- Frontend: `npm test` — 19 file, 74 test pass.
- Backend: `npm --prefix server test` — 7 file, 34 test pass.
- Prisma: `npm --prefix server run prisma:generate` và `npx prisma validate` pass.
- Production: `npm run build` pass; chỉ còn cảnh báo i18n chunk có sẵn, không chặn build.
- Static syntax: `node --check` toàn bộ module AI Content pass.
- Diff hygiene: `git diff --check` pass; không có `TODO/FIXME/HACK` trong critical path.
- Visual QA: mobile 360/390, tablet và desktop không tràn ngang; ảnh bằng chứng nằm trong `outputs/ai-content-*.png`.
- Publisher unit tests xác nhận mock idempotent, live flag gate, ảnh multipart và Reel start/upload/finish.
- Domain unit tests bao phủ trend normalization/scoring/RSS, repetition penalty, FactGuard, state/timezone, MIME/filename, caption schema, quota, analytics và token encryption.
- PostgreSQL local: 9/9 migration deploy; ba generator chạy đồng thời vẫn chỉ tạo 3 ý tưởng nhờ advisory lock.
- E2E dry-run thật: fixture ảnh Lune → quality/privacy review → caption deterministic → FactGuard → Sharp 1080×1350 → approve → schedule → mock publish `PUBLISHED` → analytics 24h có `isMock=true`.

## Không thể chạy trên môi trường hiện tại

- Fixture render video thật: máy chưa có FFmpeg/FFprobe.
- Detector OpenCV thật: máy chưa có Python/OpenCV; fallback fail-closed đã được kiểm bằng mã.
- `npm audit --offline --audit-level=high` pass cho cả frontend và backend: 0 vulnerability trong cache advisory hiện có. Audit online vẫn phụ thuộc kết nối registry.
- Meta live: cố ý không gọi; cần chủ Page OAuth và xác nhận live.

## Kỳ vọng khi chủ máy hoàn tất dependency

PostgreSQL/migration/E2E ảnh đã pass. Giữ `AI_CONTENT_LIVE_META_ENABLED=false` cho đến khi owner duyệt bài live đầu tiên; cài FFmpeg/OpenCV rồi chạy thêm fixture Reel/privacy nếu cần tự động hai khả năng đó.
