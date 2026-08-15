# Vận hành AI Content

- Start: `npm run ai-content:start`
- Stop: `npm run ai-content:stop`
- Hardware/URL: `npm run ai-content:check`
- Logs: `.codex-logs/ai-content/*.log` (không chứa token theo thiết kế).
- Backup: đặt `DATABASE_URL`, rồi chạy `powershell -ExecutionPolicy Bypass -File .\scripts\ai-content\backup.ps1`. Script tôn trọng `AI_CONTENT_MEDIA_ROOT`, kế cả đường dẫn tương đối theo thư mục `server`.
- Diagnostics: Admin → AI Content; hiển thị DB, Ollama, FFmpeg, queue, Meta masked và `0 VND`.

Emergency stop chuyển publications đã hẹn sang `PAUSED`, hủy job pending và giữ draft/media. Bất kỳ STAFF/ADMIN được kích hoạt; chỉ ADMIN đăng nhập trong 15 phút gần nhất được mở lại.

Mở emergency stop chỉ khởi động lại worker; publication đã `PAUSED` không tự đăng lại. Quản trị viên phải xem xét và xếp lịch lại thủ công.

Retention khuyến nghị: temp 24 giờ, original/final 180 ngày sau lần dùng cuối, metadata/audit 365 ngày; không xóa original ngay sau publish. Trước cleanup phải có backup đã kiểm hash.

Backup local hiện không tự mã hóa và mặc định nằm cùng máy. Nếu cần chống hỏng/mất máy, chọn `-Destination` trên ổ rời hoặc kho đã mã hóa và bảo vệ quyền truy cập.
