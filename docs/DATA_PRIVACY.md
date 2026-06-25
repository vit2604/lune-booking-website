# Data Privacy

This document is technical guidance, not legal advice. A legal/privacy owner should review it before public launch.

## Personal data collected

Booking:

- full name: identify guest reservation;
- email: contact guest;
- phone code and phone number: contact/confirm booking;
- country/nationality: guest support and check-in preparation;
- check-in/check-out: reservation dates;
- special request/arrival time: guest service.

Chat:

- optional name, phone, email;
- chat messages;
- language;
- optional booking code.

Admin:

- username, email, password hash.

## Rules

- Do not collect passport numbers in this MVP.
- Do not place guest personal data in public URLs.
- Do not log password, token, full email, or full phone where avoidable.
- Use request IDs to debug instead of logging sensitive data.
- Only admin should access booking and chat records.

## Retention proposal

- Booking records: keep for operational/accounting period decided by owner.
- Chat messages: review and delete/archival after 90-180 days unless tied to a booking.
- Logs: retain 14-30 days.
- Backups: retain according to backup policy.

## User request channel

Guests can request data correction or deletion via:

- email shown on Contact page;
- phone/Zalo/WhatsApp contact.

## Third-party data transfer

AI translation currently may send message text to a translation provider if enabled by backend route. Owner should confirm privacy notice before using auto-translation in production.

