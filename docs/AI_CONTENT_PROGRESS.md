# Tiến độ AI Content

Cập nhật: 2026-08-04. Múi giờ: `Asia/Ho_Chi_Minh`.

## Trạng thái triển khai

| Hạng mục | Trạng thái | Bằng chứng chính |
|---|---|---|
| Kiến trúc local-first 0 VND | Hoàn thành | PostgreSQL hiện có, filesystem local, template deterministic; Ollama/cloud đều không bắt buộc |
| Schema và migration | Hoàn thành | 9 migration đã deploy thật vào PostgreSQL local, gồm schema AI Content và nhãn analytics mock |
| Trend Radar | Hoàn thành | RSS chính thức Đà Nẵng allowlist cố định, fetch giới hạn, dedup, scoring, expiry, từ khóa quản trị viên |
| Daily Content Director | Hoàn thành | Tối đa 3 ý tưởng/ngày; PostgreSQL advisory lock chặn tạo vượt trần khi API/worker chạy đồng thời |
| Upload/quality/privacy | Hoàn thành về mã | Disk quarantine, magic bytes, Sharp/FFprobe, SHA-256 + perceptual hash, OpenCV local optional, consent fail-closed |
| Caption/FactGuard | Hoàn thành | Ollama loopback tùy chọn, template fallback, schema Vi–En, FactGuard deterministic |
| Render | Hoàn thành về mã | Sharp 1080×1350, FFmpeg 1080×1920, final hash/metadata; fixture thật chờ FFmpeg trên máy |
| Ba autonomy mode | Hoàn thành | Review mặc định; auto chỉ sau media đã duyệt; full-auto-safe có confidence/risk/frequency/reuse gates |
| Job queue/scheduler | Hoàn thành | PostgreSQL lease/fencing, retry, dead-letter, daily jobs, cleanup, token health, reconciliation |
| Meta Graph API | Hoàn thành ở mức dry-run/mã | OAuth state một lần, Page pinning, AES-GCM token, ảnh `/photos`, Page Reels 3 phase, processing/reconciliation |
| Analytics/notification | Hoàn thành theo phạm vi local | Mock/Meta adapter; mốc 24/72/168 giờ; thông báo trình duyệt khi PWA đang hoạt động trong secure context; không có remote push |
| Backup/retention/diagnostics | Hoàn thành về mã | `pg_dump`, media copy, SHA-256, retention 14 ngày, Task Scheduler 02:30, storage/worker/trend/token diagnostics |
| Mobile/PWA/visual QA | Hoàn thành | 360, 390, tablet, desktop đã kiểm; preview original/final tải qua endpoint có JWT/device key; service worker chỉ đăng ký trong secure context |
| Unit/build/static verification | Hoàn thành | Frontend 19 file/74 test; backend 7 file/34 test; Prisma generate/validate, production build, PowerShell parse và audit offline pass |
| PostgreSQL integration/E2E thật | Hoàn thành cho luồng ảnh/dry-run | DB advisory-lock concurrency; upload fixture Lune, review, caption, Sharp 1080×1350, approve, schedule, mock publish và analytics `isMock=true` đều pass |
| Live Page verification | Bước chủ Page | Cần owner OAuth/App Review nếu Meta yêu cầu và xác nhận bật live |

## Quyết định an toàn còn hiệu lực

- `REVIEW_REQUIRED` và mock publisher là mặc định.
- OpenCV không khả dụng thì media vẫn `BLOCKED_FOR_REVIEW`, không tự coi là sạch.
- Trend chỉ giữ tiêu đề, URL và ngày; không sao chép nội dung bài nguồn và không giả lập growth.
- Timeout sau khi Meta có thể đã nhận bài vào `PUBLISH_UNKNOWN`; worker chỉ xác nhận khi tìm đúng một bài khớp tuyệt đối.
- Không có secret hoặc original media trong public web root/Git.

## Bước cuối cần chủ máy

Xem `docs/MANUAL_FINAL_STEPS.md`: PostgreSQL/migration/E2E ảnh đã xong. Cài FFmpeg và Python + OpenCV nếu muốn Reel/detector tự động; cuối cùng owner mới thực hiện Meta OAuth và xác nhận live.
