# Xử lý sự cố AI Content

- `Database migration failed`: mở PostgreSQL/Docker Desktop, kiểm `DATABASE_URL`, chạy `npm --prefix server run prisma:deploy`.
- Ollama unavailable: không phải lỗi chặn; hệ thống dùng template. Kiểm `OLLAMA_NO_CLOUD=1`, `ollama list` và loopback.
- FFmpeg unavailable: bài ảnh vẫn dùng được; cài FFmpeg vào PATH rồi restart.
- Media `BLOCKED_FOR_REVIEW`: đây là mặc định an toàn; admin xem ảnh/video và ghi consent/NOT_REQUIRED.
- Video rejected: kiểm codec, resolution ≥540×540, duration 1–90 giây và file hoàn chỉnh.
- `PUBLISH_UNKNOWN`: không retry mù. Vào Facebook Page kiểm tra bài, sau đó reconcile/manual decision.
- Meta 401/403: dừng live và reconnect. 429: giữ lịch, chờ theo header/rate limit.
- Điện thoại không cài PWA qua LAN: HTTP LAN không phải secure context; upload web vẫn dùng được, PWA cần HTTPS.
