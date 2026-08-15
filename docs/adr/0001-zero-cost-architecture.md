# ADR 0001: Kiến trúc AI Content 0 VND

Ngày quyết định: 2026-08-01. Trạng thái: accepted.

## Quyết định

Giữ React/Express/Prisma/PostgreSQL hiện có. Database và worker chạy trên máy Windows của Lune; original media nằm trong `server/data/ai-content-media` ngoài web root và ngoài Git. Caption dùng Ollama local nếu model đã được duyệt, sau đó luôn rơi về template deterministic. Ảnh dùng Sharp; video dùng FFmpeg/FFprobe. Queue dùng PostgreSQL với lease/fencing, không dùng Redis. Meta Graph API là adapter ngoài duy nhất cần cho đăng thật; mặc định luôn là `MockPublisher`.

## Lý do

- Không có API AI trả phí, trial, thẻ hoặc overage.
- Tái sử dụng stack và auth hiện có, giảm rủi ro migration.
- Media lớn không đi qua hosting miễn phí có storage tạm thời.
- Mất mạng/Ollama không làm mất chức năng tạo checklist, caption cơ bản, duyệt và xếp hàng.

## Hệ quả

- Máy local và PostgreSQL phải chạy để scheduler hoạt động.
- Mobile web qua LAN HTTP tải file được nhưng service worker/thông báo web cần HTTPS.
- OpenCV/YuNet, Tesseract và whisper.cpp là công cụ local bổ sung; cho đến khi cài và benchmark, mọi media vẫn bị giữ ở `BLOCKED_FOR_REVIEW` và cần admin duyệt.
- Live Meta bị khóa bởi `AI_CONTENT_LIVE_META_ENABLED=false`, OAuth, Page ID cố định và bước xác nhận chủ Page.
