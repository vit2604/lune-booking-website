// Responses on these paths carry guest PII, payment data, or admin data and
// must never be stored by browsers or shared caches. The Vercel headers only
// cover the SPA HTML, not this API, so we set no-store at the API layer too.
const SENSITIVE_PATH = /^\/api\/(admin|bookings|payments|payment-methods|phone-verification)(\/|$)/;

export function noStoreForSensitive(req, res, next) {
  const path = req.path || req.originalUrl.split('?')[0];
  if (SENSITIVE_PATH.test(path)) {
    res.set('Cache-Control', 'no-store');
  }
  return next();
}
