const TIMEZONE = 'Asia/Ho_Chi_Minh';

export function nextLocalSchedule(hour = 8, minute = 0, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day, hour - 7, minute);
  const candidate = new Date(utc);
  return candidate > now ? candidate : new Date(candidate.getTime() + 86_400_000);
}

export { TIMEZONE };
