# Lune Boutique Hotel & Apartment Da Nang - Test Cases

## Smoke Test

| ID | Area | Test Case | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|
| SMK-001 | Public site | Home page loads | Open `/` | Hero, search box, rooms, amenities, footer load without blank screen | High | Not run |
| SMK-002 | Public site | Rooms page loads | Open `/rooms` | Room list loads with real room images, filters, prices | High | Not run |
| SMK-003 | Public site | Room detail loads | Open `/rooms/type-3-kitchen-apartment` | Gallery, room info, booking box, sticky mobile bar load | High | Not run |
| SMK-004 | Booking | Booking page loads with draft | From room detail, click Reserve | Booking form and summary show selected room/date/price | High | Not run |
| SMK-005 | Payment | Payment page loads with booking | Continue from Booking page | Payment methods and booking summary show correctly | High | Not run |
| SMK-006 | Success | Booking success loads | Confirm booking | Success page shows booking code and summary | High | Not run |
| SMK-007 | Admin | Admin login page loads | Open `/admin/login` | Login form visible | High | Not run |
| SMK-008 | Build | Production build | Run `npm run quality:check` | Tests pass and Vite build succeeds | High | Not run |

## Guest Booking Flow

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| GBF-001 | Booking flow | Vietnamese guest books normally | Website running | Home -> choose valid dates -> Rooms -> Room Detail -> Reserve -> fill form -> Pay at property -> Confirm | Booking created, success page shows code, payment status `pay_at_property` | High | Not run |
| GBF-002 | Booking flow | Foreign guest books in English | Language set to English | Select room, fill country/phone code/email, confirm booking | English UI, valid booking summary, no account required | High | Not run |
| GBF-003 | Booking flow | Guest changes room before booking | Booking draft exists | Go back to Rooms, choose another room, Reserve | Booking summary updates to new room and price | High | Not run |
| GBF-004 | Booking flow | Guest refreshes during flow | Booking draft exists | Refresh `/booking` and `/payment` | Draft remains available, no blank page | Medium | Not run |
| GBF-005 | Booking flow | Guest opens booking without room | No booking draft | Open `/booking` | Page asks user to choose room first | Medium | Not run |
| GBF-006 | Booking flow | Guest opens payment without booking | No booking draft | Open `/payment` | Page asks user to choose room first | Medium | Not run |

## Date, Availability, And Pricing

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| DAP-001 | Date validation | Check-in cannot be in past | Current date known | Select past check-in and submit | Error: check-in date cannot be in the past | High | Not run |
| DAP-002 | Date validation | Checkout equals check-in | Any room | Set check-in and checkout same date | Error: checkout must be after check-in | High | Not run |
| DAP-003 | Date validation | Checkout before check-in | Any room | Set checkout earlier than check-in | Error shown, cannot reserve | High | Not run |
| DAP-004 | Date validation | Missing check-in | Any room | Clear check-in and submit | Error asks to select check-in date | High | Not run |
| DAP-005 | Date validation | Missing checkout | Any room | Clear checkout and submit | Error asks to select checkout date | High | Not run |
| DAP-006 | Nights | One-night stay | Any room | Check-in `2026-05-15`, checkout `2026-05-16` | Nights = 1 | High | Not run |
| DAP-007 | Nights | Two-night stay | Any room | Check-in `2026-05-15`, checkout `2026-05-17` | Nights = 2 | High | Not run |
| DAP-008 | Capacity | Guest count exceeds room limit | 2-guest room | Select 3 or 4 guests and reserve | Booking blocked with capacity error | High | Not run |
| DAP-009 | Availability | Overlapping booking blocked | Existing booking `15 -> 17` | Try booking same room `16 -> 18` | Booking blocked | High | Not run |
| DAP-010 | Availability | Checkout handoff allowed | Existing booking `15 -> 17` | Try booking same room `17 -> 18` | Booking allowed | High | Not run |
| DAP-011 | Availability | Cancelled booking ignored | Cancelled booking exists | Try same room/date | Booking allowed | Medium | Not run |
| DAP-012 | Availability | Admin blocked date blocks room | Blocked date exists | Try booking blocked range | Booking blocked | High | Not run |
| DAP-013 | Pricing | Total price calculation | Room price known | Choose 3 nights | Total = price per night x 3 plus configured fees | High | Not run |
| DAP-014 | Pricing | Long-stay discount | Discount enabled | Choose nights >= min nights | Discount appears and total decreases | Medium | Not run |
| DAP-015 | Pricing | VND formatting | Any booking | View prices | Price displays like `990,000 VND`, never raw `990000` | High | Not run |

## Room Catalog And Images

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| RCI-001 | Rooms | Room cards use overview photos | Rooms page | Inspect all room cards | Main card images are room overviews, not toilet/detail-only images | High | Not run |
| RCI-002 | Rooms | Type 3 is split into 2 room types | Rooms data updated | Open Rooms page | Shows `Deluxe Double Apartment` and `Type 3 Kitchen Apartment` as separate rooms | High | Not run |
| RCI-003 | Rooms | Gallery contains detail images after overview | Room detail | Open gallery | First image is overview; bathroom/detail images can appear later | Medium | Not run |
| RCI-004 | Rooms | Room type filter works | Rooms page | Choose each room type filter | Only matching room type appears | Medium | Not run |
| RCI-005 | Rooms | Sort price low to high | Rooms page | Select low to high | Room cards sorted ascending by price | Medium | Not run |
| RCI-006 | Rooms | Sort price high to low | Rooms page | Select high to low | Room cards sorted descending by price | Medium | Not run |

## Payment Flow

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| PAY-001 | Payment | Pay at property | Valid booking | Select Pay at property, confirm | Success page, payment status `pay_at_property` | High | Not run |
| PAY-002 | Payment | Cash at property | Method enabled | Select Cash at property, confirm | Success page, payment status `pay_at_property` | Medium | Not run |
| PAY-003 | Payment | Bank transfer info | Bank enabled | Select Bank transfer | Bank name, account number, holder, transfer content visible | High | Not run |
| PAY-004 | Payment | Copy account number | Bank transfer selected | Click Copy account number | Clipboard copy succeeds and copied state appears | Medium | Not run |
| PAY-005 | Payment | Copy transfer content | Bank transfer selected | Click Copy transfer content | Clipboard copy succeeds and copied state appears | Medium | Not run |
| PAY-006 | Payment | VietQR placeholder | VietQR enabled | Select VietQR | QR placeholder or admin QR image appears | Medium | Not run |
| PAY-007 | Payment | Card placeholder | Card enabled | Select Credit/Debit Card | No real card number required; placeholder note appears | High | Not run |
| PAY-008 | Payment | Disabled methods hidden | Admin disables method | Open Payment page | Disabled method not visible to guest | High | Not run |
| PAY-009 | Payment | No methods fallback | All methods disabled | Open Payment page | Friendly message asks guest to contact Lune | Medium | Not run |

## Language And Currency

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| LNC-001 | Language | Switch to English | Any page | Select English | Navbar, forms, buttons, policy text show English | High | Not run |
| LNC-002 | Language | Switch to Vietnamese | Any page | Select Tiếng Việt | Guest-facing content changes to Vietnamese | High | Not run |
| LNC-003 | Language | Switch to Chinese | Any page | Select 简体中文 | No `undefined`, no broken layout | Medium | Not run |
| LNC-004 | Language | Switch to Korean | Any page | Select 한국어 | No `undefined`, no broken layout | Medium | Not run |
| LNC-005 | Language | Switch to Japanese | Any page | Select 日本語 | Fallback works if a key is missing | Medium | Not run |
| LNC-006 | Language | Reload keeps language | Language selected | Refresh page | Same language remains selected | Medium | Not run |
| LNC-007 | Currency | Switch to USD | Any room/payment page | Select USD | VND remains primary; approx USD appears | Medium | Not run |
| LNC-008 | Currency | Switch to KRW/CNY/JPY | Any room/payment page | Select KRW/CNY/JPY | No `NaN`, no `undefined` | Medium | Not run |
| LNC-009 | Currency | Live rate fallback | Currency API unavailable | Change currency | Uses fallback rate and site does not crash | Medium | Not run |

## Contact, Map, And Chat

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| CMC-001 | Contact | Google Map displays | Contact page | Open `/contact` | Embedded map or fallback placeholder appears | Medium | Not run |
| CMC-002 | Contact | Open in Google Maps | Contact page | Click Open in Google Maps | New tab opens map search for Lune address | Medium | Not run |
| CMC-003 | Contact | Get directions | Contact page | Click Get directions | New tab opens directions to address | Medium | Not run |
| CMC-004 | Contact | Copy address | Contact page | Click Copy address | Address copied, copied state appears | Medium | Not run |
| CMC-005 | Contact | Submit contact form | Contact page | Fill form and submit | Friendly received message appears | Low | Not run |
| CMC-006 | Chat | Guest sends message | Chat enabled | Open widget, send message | Message appears in chat history | High | Not run |
| CMC-007 | Chat | Quick question sends | Chat enabled | Click quick question | Quick question appears as guest message | Medium | Not run |
| CMC-008 | Chat | Admin sees guest message | Admin logged in | Open `/admin/messages` | Guest session and unread message visible | High | Not run |
| CMC-009 | Chat | Admin replies | Admin messages page | Send reply | Guest sees admin reply in widget | High | Not run |
| CMC-010 | Chat | Close/reopen conversation | Admin messages page | Close then reopen session | Status changes correctly | Medium | Not run |

## Admin

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| ADM-001 | Auth | Admin route protection | Logged out | Open `/admin/dashboard` | Redirects to `/admin/login` | High | Not run |
| ADM-002 | Auth | Mock/backend login | Login page | Login with admin credentials | Redirects to dashboard | High | Not run |
| ADM-003 | Auth | Invalid login | Login page | Enter wrong credentials | Error message appears | High | Not run |
| ADM-004 | Auth | Logout | Logged in | Click Logout | Token/session removed, redirects to login | High | Not run |
| ADM-005 | Dashboard | Stats render | Logged in | Open dashboard | Room, booking, payment, message stats visible | Medium | Not run |
| ADM-006 | Rooms | Add new room | Logged in | Create room with valid data | Room appears on admin and guest Rooms page | High | Not run |
| ADM-007 | Rooms | Edit room price | Existing room | Change price and save | Guest room card/detail show updated price | High | Not run |
| ADM-008 | Rooms | Edit room image | Existing room | Change main image/gallery | Guest room card/detail show updated images | High | Not run |
| ADM-009 | Rooms | Hide/show room | Existing room | Toggle status | Hidden room disappears from guest site; show makes it return | High | Not run |
| ADM-010 | Rooms | Block dates | Existing room | Add blocked date range | Guest cannot book that room in blocked range | High | Not run |
| ADM-011 | Bookings | View booking list | Existing booking | Open `/admin/bookings` | Booking appears with guest, room, total, status | High | Not run |
| ADM-012 | Bookings | Confirm booking | Existing booking | Mark as confirmed | Booking status updates | High | Not run |
| ADM-013 | Bookings | Cancel booking | Existing booking | Mark as cancelled | Booking status updates and availability frees up | High | Not run |
| ADM-014 | Payments | Mark paid/pending | Existing booking | Update payment status | Payment status updates | High | Not run |
| ADM-015 | Payment settings | Update bank info | Logged in | Save bank name/account/holder/QR | Guest Payment page shows updated info | High | Not run |
| ADM-016 | Branding | Update logo/contact | Logged in | Save logo/contact info | Navbar/footer/contact update | Medium | Not run |
| ADM-017 | Policies | Update policies | Logged in | Save policy changes | Room detail/booking policy uses new content | Medium | Not run |
| ADM-018 | Settings | Maintenance mode | Logged in | Turn website maintenance on | Guest site shows maintenance message; admin still works | Medium | Not run |

## Responsive And Animation

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| RSP-001 | Mobile | 320px layout | Browser devtools | Test Home, Rooms, Detail, Booking, Payment at 320px | No horizontal overflow, buttons easy to tap | High | Not run |
| RSP-002 | Mobile | 375px layout | Browser devtools | Test main flow at 375px | Navbar/menu, cards, forms, sticky booking bar work | High | Not run |
| RSP-003 | Mobile | 430px layout | Browser devtools | Test payment/contact/chat | No overlap, copy buttons usable | High | Not run |
| RSP-004 | Tablet | 768px layout | Browser devtools | Test Rooms and Admin | Layout uses available space cleanly | Medium | Not run |
| RSP-005 | Desktop | 1024px+ layout | Browser devtools | Test Room Detail | Booking sidebar sticky, content aligned | Medium | Not run |
| RSP-006 | Animation | Scroll reveal works | Any public page | Scroll slowly through page | Sections/cards appear with smooth varied animation | Medium | Not run |
| RSP-007 | Animation | Reduced motion respected | OS/browser reduced motion enabled | Reload and scroll | Animations disabled, content visible | Medium | Not run |
| RSP-008 | Chat mobile | Chat does not cover booking CTA | Room detail mobile | Open page with sticky booking bar and chat widget | Chat button does not block Reserve button | High | Not run |

## Production Readiness

| ID | Area | Test Case | Preconditions | Steps | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| PRD-001 | Frontend | Vercel SPA routing | Deployed frontend | Refresh `/rooms`, `/booking`, `/admin/login` | No 404, app route loads | High | Not run |
| PRD-002 | Backend | Health check | Backend deployed | Open `/api/health` | Returns server status, DB status, environment, time | High | Not run |
| PRD-003 | API | Rooms from backend | `VITE_USE_MOCK_FALLBACK=false` | Open Rooms page | Rooms come from backend, no mock booking silently created on API error | High | Not run |
| PRD-004 | API | Booking saved to database | Backend/database online | Create booking | Booking persists in PostgreSQL and appears in admin | High | Not run |
| PRD-005 | API | Admin JWT | Backend online | Login admin | JWT saved and admin API uses Bearer token | High | Not run |
| PRD-006 | CORS | Frontend domain allowed | Production env set | Use frontend domain | No CORS error in browser console | High | Not run |
| PRD-007 | Security | No frontend secrets | Production build | Search source/env | No real API secret/payment secret in frontend | High | Not run |
| PRD-008 | Database | Migration deploy | Production DB | Run `prisma migrate deploy` | Migration succeeds without reset | High | Not run |
| PRD-009 | Seed | Safe production seed | Production DB | Run seed | Creates missing defaults only; does not wipe DB | High | Not run |
| PRD-010 | Monitoring | Error handling | API error simulated | Trigger failed API request | Friendly UI error, backend does not crash | Medium | Not run |
