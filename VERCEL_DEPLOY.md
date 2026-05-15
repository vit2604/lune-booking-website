# Deploy Frontend Lune Booking lên Vercel

Frontend hiện nằm ở root project, không nằm trong subfolder `client`.

## Vercel Web

1. Push code lên GitHub.
2. Vào [vercel.com](https://vercel.com).
3. Chọn `Add New Project`.
4. Import GitHub repository.
5. Cấu hình:
   - Framework Preset: `Vite`
   - Root Directory: project root
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables nếu cần:
   - `VITE_API_BASE_URL=http://localhost:4000/api`
   - `VITE_SOCKET_URL=http://localhost:4000`
   - `VITE_USE_MOCK_FALLBACK=true`
7. Deploy.

## Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
vercel --prod
```

## Environment Variables

Khi chưa deploy backend, dùng:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_USE_MOCK_FALLBACK=true
```

Khi đã có backend public, đổi trong Vercel Project Settings:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_USE_MOCK_FALLBACK=true
```

Nếu backend public lỗi, frontend vẫn fallback mock/localStorage ở các service đã hỗ trợ.

## Notes

- `vercel.json` đã cấu hình SPA rewrites để refresh `/rooms`, `/booking`, `/payment`, `/admin/login`, `/admin/dashboard` không bị 404.
- Link Vercel hiện tại dùng để test frontend/mock: booking flow, admin mock, payment mock, chat mock, i18n và responsive UI.
- Dữ liệu mock lưu bằng `localStorage`, nên mỗi trình duyệt sẽ có dữ liệu riêng.
- Admin mock:
  - Username: `admin`
  - Password: `luneadmin123`
- Admin mock không dùng cho production.
- Payment mock không xử lý thanh toán thật.
- Backend thật hiện nằm trong `server/` và cần deploy riêng nếu muốn dùng API/database/JWT/Socket.IO thật.
