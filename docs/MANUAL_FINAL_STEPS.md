# Các bước thủ công cuối cùng

Không gửi password, app secret, access token hoặc encryption key vào chat.

## 1. FFmpeg/Python tùy chọn trên Windows

- Lý do: Codex không được tự chạy tác vụ Administrator/cài phần mềm hệ thống.
- PostgreSQL local đã kết nối, 9 migration đã deploy và E2E ảnh/dry-run đã pass ngày 2026-08-04.
- Cài FFmpeg/FFprobe vào PATH để render Reel.
- Cài Python 3 và `opencv-python-headless` nếu muốn detector privacy local; nếu không cài, media vẫn hoạt động nhưng luôn chờ review thủ công.
- Ollama là tùy chọn; nếu dùng, đặt `OLLAMA_NO_CLOUD=1`.
- Kiểm tra: `npm run ai-content:check`, `python --version`, `python -c "import cv2; print(cv2.__version__)"` và `docker info`.
- Kiểm tra định kỳ: `npm run db:deploy`, `npm --prefix server test` và `npm run ai-content:check`.

## 2. Đăng ký Task Scheduler (tùy chọn)

- Lý do: cần quyền Administrator.
- Chạy PowerShell Administrator: `powershell -ExecutionPolicy Bypass -File .\scripts\ai-content\install-scheduler.ps1`.
- Kiểm tra: Task Scheduler Library có `Lune AI Content`.

## 3. Tạo/xác nhận Meta Developer App và Page

- Lý do: chỉ chủ tài khoản được đăng nhập, xác nhận Page role, điều khoản và App Review.
- Mở [Meta for Developers](https://developers.facebook.com/apps/), tạo/chọn app của Lune và thêm Facebook Login for Business nếu giao diện hiện tại yêu cầu.
- Redirect URI: URL HTTPS frontend callback đã cấu hình; copy chính xác vào `META_OAUTH_REDIRECT_URI` trong `server/.env`.
- Page: xác nhận tài khoản quản lý Page ID `61582233127486` và có task `CREATE_CONTENT`.
- Quyền: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `read_insights`.
- Kiểm tra: Admin → AI Content → Meta status chỉ hiện Page ID/name/scopes và token masked.

## 4. Tạo secret tại máy

- `META_APP_ID`/`META_APP_SECRET`: copy từ app dashboard vào `server/.env`.
- Tạo key: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()` và dán vào `META_TOKEN_ENCRYPTION_KEY`.
- Không copy các giá trị này vào biến `VITE_*`.
- Kiểm tra: backend khởi động, diagnostics không lộ secret.

## 5. OAuth/App Review/Business Verification

- Bấm Kết nối Meta trong admin, đồng ý đúng ba quyền, chọn tài khoản quản lý Lune.
- Nếu app chỉ phục vụ người có app role cho Page Lune, Standard Access có thể đủ; nếu Meta yêu cầu hoặc phục vụ người ngoài app, gửi App Review/Business Verification.
- Kiểm tra: token health pass, Page ID đúng, không có quyền thừa.

## 6. Xác nhận bài thật đầu tiên

- Trước đó chạy full mock dry-run, xem ảnh/Reel/caption, FactGuard, consent và emergency stop.
- Chủ Page xác nhận bằng lời rõ ràng, sau đó mới đặt `AI_CONTENT_LIVE_META_ENABLED=true` và restart.
- Đăng bài đầu tiên ở `REVIEW_REQUIRED`, kiểm tra permalink trên Page. Nếu chưa xác nhận, giữ `false` mãi.

## 7. HTTPS/tunnel/DNS (chỉ khi cần ngoài LAN/PWA đầy đủ)

- Lý do: service worker, notification và truy cập ngoài nhà cần HTTPS; LAN HTTP chỉ là mobile web.
- Dùng named Cloudflare Tunnel/Access chỉ sau khi tự đăng nhập tài khoản và xác nhận không nâng cấp paid; không dùng Quick Tunnel production.
- Kiểm tra HTTPS, Access auth, rate limit và upload; LAN vẫn phải hoạt động nếu tunnel tắt.
