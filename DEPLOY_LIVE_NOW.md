# Deploy Live Now - Lune Booking

Mục tiêu production thật:

- Frontend: Vercel
- Backend API + Socket.IO: Render
- Database: Render PostgreSQL qua `render.yaml`

## 1. Push code lên GitHub

Repo hiện tại:

```text
https://github.com/vit2604/lune-booking-website.git
```

Trước khi deploy, cần commit/push toàn bộ code mới.

```bash
npm run quality:check
git add .
git commit -m "Prepare Lune production deployment"
git push origin main
```

Nếu branch hiện tại không phải `main`, push đúng branch bạn dùng rồi chọn branch đó trong Vercel/Render.

## 2. Deploy Backend + PostgreSQL trên Render

Render có thể đọc file `render.yaml` ở root repo.

1. Vào Render Dashboard.
2. Chọn `New` -> `Blueprint`.
3. Connect GitHub repo `vit2604/lune-booking-website`.
4. Blueprint path: `render.yaml`.
5. Render sẽ tạo:
   - Web service: `lune-booking-api`
   - PostgreSQL database: `lune-booking-db`

Khi Render hỏi env có `sync: false`, nhập:

```text
CORS_ORIGIN=https://your-vercel-domain.vercel.app
SOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-real-strong-password
ADMIN_EMAIL=your-email@example.com
```

Lưu ý:

- Không dùng mật khẩu demo `luneadmin123` cho production.
- `JWT_SECRET` được Render tự generate.
- `DATABASE_URL` được lấy tự động từ Render PostgreSQL.

Sau khi backend deploy xong, kiểm tra:

```text
https://your-render-service.onrender.com/api/health
```

Kết quả cần có:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "databaseConnected": true
  }
}
```

## 3. Deploy Frontend trên Vercel

1. Vào Vercel.
2. Add New Project.
3. Import GitHub repo `vit2604/lune-booking-website`.
4. Framework: `Vite`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Root Directory: repo root.

Set Environment Variables:

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com/api
VITE_SOCKET_URL=https://your-render-service.onrender.com
VITE_USE_MOCK_FALLBACK=false
```

Deploy frontend.

## 4. Update Backend CORS Sau Khi Có Vercel URL

Sau khi có Vercel URL thật, quay lại Render -> service `lune-booking-api` -> Environment.

Set:

```text
CORS_ORIGIN=https://your-vercel-domain.vercel.app
SOCKET_CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

Nếu có domain riêng, thêm cả domain riêng, phân tách bằng dấu phẩy:

```text
CORS_ORIGIN=https://lune.example.com,https://your-vercel-domain.vercel.app
SOCKET_CORS_ORIGIN=https://lune.example.com,https://your-vercel-domain.vercel.app
```

Redeploy backend.

## 5. Test Booking Thật

Test theo thứ tự:

1. Mở frontend Vercel.
2. Vào `/rooms`.
3. Chọn phòng.
4. Chọn ngày hợp lệ.
5. Điền form booking.
6. Chọn `Pay at property` hoặc `Bank transfer`.
7. Confirm booking.
8. Vào `/admin/login`.
9. Login bằng admin production.
10. Vào `/admin/bookings`.
11. Kiểm tra booking mới có trong database.
12. Mark booking confirmed.
13. Mark payment paid nếu khách chuyển khoản.

## 6. Domain Riêng

Gợi ý DNS:

```text
luneboutique.vn      -> Vercel frontend
www.luneboutique.vn  -> Vercel frontend
api.luneboutique.vn  -> Render backend
```

Sau khi trỏ domain:

- Trong Vercel: Add domain `luneboutique.vn`.
- Trong Render: Add custom domain `api.luneboutique.vn`.
- Cập nhật frontend env:

```text
VITE_API_BASE_URL=https://api.luneboutique.vn/api
VITE_SOCKET_URL=https://api.luneboutique.vn
VITE_USE_MOCK_FALLBACK=false
```

- Cập nhật backend env:

```text
CORS_ORIGIN=https://luneboutique.vn,https://www.luneboutique.vn
SOCKET_CORS_ORIGIN=https://luneboutique.vn,https://www.luneboutique.vn
```

Redeploy cả frontend và backend.
