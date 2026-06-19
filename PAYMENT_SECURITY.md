# Lune Payment Security Checklist

This MVP does not process real card payments in the frontend.

## Active safeguards

- Payment API accepts only known payment method IDs.
- Public booking and payment endpoints are rate-limited.
- Payment settings strip secret-like fields before saving or returning data.
- Payment requests cannot be created for cancelled bookings.
- Payment requests reuse an existing pending payment instead of creating duplicates repeatedly.
- Frontend payment QR image URLs allow only HTTPS, local images, or image data URLs.
- Vercel security headers add CSP, clickjacking protection, MIME sniffing protection, and no-store cache rules for booking/payment/admin routes.

## Production rules

- Never collect card numbers, OTPs, banking passwords, or card CVV in this React app.
- Real card, wallet, VietQR, or bank API integrations must be created through backend endpoints.
- Payment provider secret keys, webhook secrets, bank API keys, and private keys must live in backend environment variables.
- Payment status should be marked paid only by admin confirmation or verified backend webhook.
- Webhooks must verify provider signatures before updating booking/payment status.

## Recommended next hardening

- Enable paid Render instance so payment API does not sleep.
- Add email/SMS alerts for every new booking and payment status change.
- Add audit logs for admin payment status changes.
- Add provider-specific webhook signature verification before enabling real gateways.
- Rotate admin password before public launch.
