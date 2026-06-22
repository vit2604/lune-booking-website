# Manual Testing Checklist

Use this checklist before switching Lune Boutique Hotel & Apartment Da Nang to real production booking.

## 1. Public Website

- [ ] Open `https://luneboutiquedanang.id.vn/`.
- [ ] Open `https://www.luneboutiquedanang.id.vn/`.
- [ ] Confirm both domains show the same website and HTTPS is valid.
- [ ] Confirm no horizontal scroll on 320, 360, 375, 390, 414, 768, 1024px.
- [ ] Confirm logo and `Lune Boutique Apartment` are readable on mobile.
- [ ] Confirm mobile menu opens and closes by touch.
- [ ] Confirm Book Now button is visible and tappable.
- [ ] Confirm chat bubble does not cover booking CTA.

## 2. Booking Flow

- [ ] Home: select today or a future check-in date.
- [ ] Home: select check-out after check-in.
- [ ] Home: select guests and search rooms.
- [ ] Rooms: all room types show by default when no date filter is applied.
- [ ] Rooms: after searching dates, only available rooms should be bookable.
- [ ] Room detail: select valid dates and guests.
- [ ] Room detail: total nights and total price are correct.
- [ ] Booking page: submit is disabled/blocked while processing.
- [ ] Booking page: missing full name, phone, check-in, or check-out shows clear error.
- [ ] Booking page: phone with letters is rejected.
- [ ] Success page: booking code is visible.
- [ ] Success page: copy booking code works.
- [ ] Refresh success page: booking summary still makes sense or asks user to choose a room again.

## 3. Invalid Booking Cases

- [ ] Check-in in the past is blocked.
- [ ] Check-out same as check-in is blocked.
- [ ] Check-out before check-in is blocked.
- [ ] Guests above room capacity are blocked.
- [ ] Duplicate booking for overlapping dates is blocked by backend.
- [ ] Booking that starts on previous guest check-out date is allowed.
- [ ] API failure shows a friendly message and does not create a fake production booking.

## 4. Payment

- [ ] Pay at property confirms booking with `PAY_AT_PROPERTY` status.
- [ ] Bank transfer shows official bank name, account number, holder, transfer content.
- [ ] Copy account number works on iPhone/Android.
- [ ] Copy transfer content works on iPhone/Android.
- [ ] PayOS QR appears only after backend PayOS env is configured.
- [ ] PayOS checkout link opens in a new tab.
- [ ] PayOS webhook updates payment status to paid after real payment confirmation.
- [ ] Reloading payment page does not create unlimited duplicate PayOS links.
- [ ] No card number/CVV field is shown for real payment unless a real provider is integrated.

## 5. Admin

- [ ] `/admin/login` is not indexed by Google.
- [ ] Admin login requires backend JWT in production.
- [ ] Admin dashboard opens after login.
- [ ] Admin can see new bookings from database.
- [ ] Admin can confirm booking.
- [ ] Admin can cancel booking.
- [ ] Admin can mark payment as paid/pending.
- [ ] Admin can edit room price/images and public rooms update after refresh.
- [ ] Admin payment settings do not expose secret API keys.

## 6. Chat

- [ ] Guest can open chat.
- [ ] Guest can send a message.
- [ ] Guest sees the waiting message after sending.
- [ ] Admin can see the chat in `/admin/messages`.
- [ ] Admin can reply.
- [ ] Guest sees admin reply.
- [ ] Korean/Chinese/Russian/Vietnamese/English messages are readable and translated where supported.
- [ ] Chat session survives reload.

## 7. Accessibility

- [ ] Keyboard Tab reaches skip link, nav, booking form, room buttons, chat and footer links.
- [ ] Focus ring is visible.
- [ ] Form fields have visible labels.
- [ ] Buttons have clear text or accessible labels.
- [ ] Important images have meaningful alt text.
- [ ] Decorative icons are hidden from screen readers.
- [ ] Text contrast is readable on hero and booking bar.
- [ ] Website is usable at browser zoom 200%.

## 8. SEO And Trust

- [ ] Title is `Lune Boutique Hotel & Apartment Da Nang`.
- [ ] Meta description describes boutique hotel/apartment in Da Nang.
- [ ] Open Graph preview image loads.
- [ ] Favicon shows correctly.
- [ ] `robots.txt` loads.
- [ ] `sitemap.xml` loads.
- [ ] Public pages have one main H1.
- [ ] Admin pages are not listed in sitemap.
- [ ] Contact page shows address, call, Zalo, WhatsApp, email and Google Maps section.
- [ ] Policies page includes booking, payment, cancellation and privacy notes.

## 9. Browser And Device

- [ ] Chrome desktop.
- [ ] Edge desktop.
- [ ] Chrome Android.
- [ ] iPhone Safari or emulation.
- [ ] Slow 4G test: homepage remains usable.
- [ ] Reduced motion enabled: animations should not feel disruptive.
