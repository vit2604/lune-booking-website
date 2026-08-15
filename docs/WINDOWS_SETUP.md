# Cài đặt Windows

## Một lần

```powershell
npm ci
npm --prefix server ci
npm run ai-content:check
```

Cài PostgreSQL 15+ hoặc mở Docker Desktop rồi chạy `docker compose up -d`. Cài FFmpeg/FFprobe vào `PATH`. Sao chép `server/.env.example` thành `server/.env` và điền secret tại máy; không gửi secret vào chat.

## Khởi động

```powershell
npm run build
npm run ai-content:start
```

Máy tính: `http://localhost:4173/admin/ai-content`. Điện thoại cùng Wi-Fi: chạy `npm run ai-content:check` và dùng URL được in ra. LAN HTTP là mobile web; PWA install/offline/notification cần HTTPS.

## Task Scheduler (cần Administrator, chỉ chạy khi bạn đồng ý)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ai-content\install-scheduler.ps1
```

Gỡ an toàn:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\ai-content\uninstall-scheduler.ps1
```
