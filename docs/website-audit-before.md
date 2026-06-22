# Website Audit Before

## 1. Kien truc hien tai

- Frontend: React 19, Vite, React Router, Tailwind CSS.
- Backend: Node.js, Express, Prisma ORM, PostgreSQL, Socket.IO.
- Authentication: JWT admin login, bcrypt password hash, role middleware.
- Data layer: PostgreSQL in production, localStorage/mock fallback on frontend when enabled.
- Payment: Pay at property, bank transfer, PayOS QR integration in progress, webhook route under `/api/webhooks/payment/:provider`.
- Deployment: Vercel frontend, Render/Railway/VPS-ready backend docs, Docker Compose PostgreSQL for local DB.
- i18n/currency/chat: custom React context/services with fallback behavior.

## 2. Cong nghe su dung

| Layer | Technology |
|---|---|
| Frontend framework | React + Vite |
| Routing | React Router |
| Styling | Tailwind CSS + CSS variables |
| Backend framework | Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Realtime | Socket.IO |
| Payment provider | PayOS SDK backend-only, bank transfer fallback |
| Test | Vitest |
| Hosting | Vercel frontend, Render/Railway/VPS backend |

## 3. Loi ban dau phat hien

| ID | Hang muc | Muc do | Mo ta | File lien quan | Huong sua |
|---|---|---|---|---|---|
| B-001 | Payment | High | PayOS can co cau hinh env ro rang, webhook va UI QR khong duoc tao gia khi thieu key. | `server/src/modules/payments/payment.service.js`, `src/pages/PaymentPage.jsx` | Hoan thien PayOS backend-only, QR data URL, webhook verification, env docs. |
| B-002 | Mobile UI | High | Brand text `Lune Boutique Apartment` co nguy co bi cat tren mobile nho. | `src/components/Navbar.jsx` | Tach `Apartment` xuong dong va thu gon width/letter spacing mobile. |
| B-003 | SEO structured data | Medium | JSON-LD address bi loi encoding tieng Viet. | `index.html` | Sua dia chi UTF-8 dung. |
| B-004 | CSP/SEO | Medium | CSP tren Vercel co the chan Google Fonts va inline JSON-LD. | `vercel.json`, `index.html` | Cho phep dung domain font va them hash JSON-LD thay vi mo inline rong. |
| B-005 | Accessibility | Medium | Chua co skip-link ro rang den main content. | `src/components/GuestLayout.jsx`, `src/index.css` | Them skip link va `main#main-content`. |
| B-006 | Test docs | Low | Checklist yeu cau report sau va manual test checklist rieng. | `docs/` | Tao `website-audit-after.md` va `manual-testing-checklist.md`. |

## 4. Ket qua baseline

- `npm test`: pass 18/18 tests.
- `npm run build`: pass.
- `npm audit --audit-level=high`: found 0 vulnerabilities.
- `npm --prefix server audit --audit-level=high`: found 0 vulnerabilities.

## 5. Nguyen tac sua

- Khong commit secret PayOS, database, JWT, Bluejay.
- Khong thay doi API contract neu khong can thiet.
- Booking/payment total van do backend tinh va xac minh.
- Giu giao dien thuong hieu hien tai, chi sua cac diem anh huong UX, SEO, accessibility va payment.
