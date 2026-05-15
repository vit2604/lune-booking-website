# Lune Booking Backend

Backend thật cho MVP booking Lune Boutique Hotel & Apartment Da Nang.

## Stack

- Node.js + Express.js
- PostgreSQL
- Prisma ORM
- Socket.IO cho live chat
- JWT admin auth
- bcrypt password hashing
- zod validation
- helmet, cors, morgan, express-rate-limit

## Chạy local

1. Cài backend:

```bash
cd server
npm install
```

2. Tạo env:

```bash
copy .env.example .env
```

3. Chạy PostgreSQL:

```bash
docker compose up -d
```

4. Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

5. Chạy backend:

```bash
npm run dev
```

6. Chạy frontend ở thư mục root:

```bash
npm install
npm run dev
```

## URL

- API base: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Socket.IO: `http://localhost:4000`
- Prisma Studio: `cd server && npm run prisma:studio`

## Admin dev account

- Username: `admin`
- Password: `luneadmin123`

Đây là tài khoản dev được seed sẵn. Production phải đổi mật khẩu, bật HTTPS, dùng secret mạnh, backup database, và quản lý phân quyền rõ ràng.

## Frontend env

Root `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Nếu backend chưa chạy, frontend vẫn fallback về mock/localStorage ở các service đã nối dần.

## API chính

- `GET /api/health`
- `POST /api/auth/admin/login`
- `GET /api/auth/me`
- `GET /api/rooms`
- `GET /api/rooms/:slug`
- `GET /api/rooms/:id/availability`
- `POST /api/bookings`
- `GET /api/bookings/:bookingCode`
- `GET /api/payment-methods`
- `POST /api/payments/create`
- `POST /api/payments/verify`
- `GET /api/currency/rates`
- `GET /api/currency/convert`
- `GET /api/settings/public`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/:sessionCode/messages`
- `POST /api/chat/sessions/:sessionCode/messages`

Admin APIs dùng `Authorization: Bearer <token>`.

## Security notes

- Không lưu password plain text. Seed dùng bcrypt.
- `JWT_SECRET` phải lấy từ `.env`, không hard-code.
- Không lưu secret payment key trong frontend.
- Không xử lý thẻ thật ở frontend.
- Webhook payment hiện là skeleton. Production phải verify signature từ provider/bank.
- Currency live rate demo dùng provider public/fallback; API có key phải gọi từ backend.
- Chat realtime hiện sẵn Socket.IO room theo session; production nên lưu đầy đủ DB, audit log và rate limit nâng cao.
