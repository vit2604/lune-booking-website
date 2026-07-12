import { Users } from 'lucide-react';

export default function GuestSelector({
  adults = 1,
  children = 0,
  maxGuests = 4,
  onChange,
  className = 'input-field',
  t,
  showIcon = true,
}) {
  const adultCount = Math.max(1, Number(adults || 1));
  const childCount = Math.max(0, Number(children || 0));
  const maxChildren = Math.max(0, Number(maxGuests || 4) - adultCount);

  const updateAdults = (value) => {
    const nextAdults = Math.max(1, Number(value || 1));
    const nextChildren = Math.min(childCount, Math.max(0, Number(maxGuests || 4) - nextAdults));
    onChange?.({
      adults: nextAdults,
      children: nextChildren,
      guests: nextAdults + nextChildren,
    });
  };

  const updateChildren = (value) => {
    const nextChildren = Math.max(0, Number(value || 0));
    onChange?.({
      adults: adultCount,
      children: nextChildren,
      guests: adultCount + nextChildren,
    });
  };

  return (
    <div className={`${className} flex min-h-0 items-center gap-3 py-2`}>
      {showIcon ? <Users className="h-5 w-5 shrink-0 text-lune-goldDark" aria-hidden="true" /> : null}
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('common.adults')}</span>
          <select
            className="min-h-10 w-full rounded-md bg-white text-base font-semibold text-lune-ink outline-none sm:text-sm"
            value={adultCount}
            onChange={(event) => updateAdults(event.target.value)}
          >
            {Array.from({ length: Number(maxGuests || 4) }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('common.children')}</span>
          <select
            className="min-h-10 w-full rounded-md bg-white text-base font-semibold text-lune-ink outline-none sm:text-sm"
            value={Math.min(childCount, maxChildren)}
            onChange={(event) => updateChildren(event.target.value)}
          >
            {Array.from({ length: maxChildren + 1 }, (_, index) => index).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
