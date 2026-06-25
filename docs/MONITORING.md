# Monitoring

## Health endpoints

- `/api/health`: app liveness only.
- `/api/ready`: database readiness.

## Uptime checks

Monitor:

- `https://www.luneboutiquedanang.com`
- `https://lune-booking-api.onrender.com/api/health`
- `https://lune-booking-api.onrender.com/api/ready`

## Alerts

Recommended alerts:

- frontend down;
- backend down;
- `/api/ready` fails;
- HTTP 5xx spike;
- SSL expires in less than 14 days;
- Render service restarts repeatedly;
- database backup fails;
- abnormal admin login failures;
- PayOS webhook failures if PayOS is enabled.

## Logging

Backend logs include:

- request ID;
- method;
- path;
- status;
- duration.

Do not log:

- JWT;
- passwords;
- payment secrets;
- full personal data.

## Future audit log

Add persistent audit events for:

- admin login/login fail;
- room price changes;
- booking status changes;
- payment status changes;
- room visibility changes;
- admin account changes.

