import { getDefaultDates, toDateInputValue } from '../utils/booking.js';
import { addDaysToDateString, calculateNights } from '../utils/dateUtils.js';
import { useTranslation } from '../i18n/useTranslation.js';
import DateInput from './DateInput.jsx';
import GuestSelector from './GuestSelector.jsx';

export default function DateSelector({
  checkIn,
  checkOut,
  guests,
  adults,
  children,
  maxGuests = 4,
  onChange,
  compact = false,
  showGuests = true,
  readOnlyGuests = false,
}) {
  const defaults = getDefaultDates();
  const today = toDateInputValue(new Date());
  const { t } = useTranslation();

  const inputClass = compact ? 'input-field py-2.5' : 'input-field';
  const checkoutMin = addDaysToDateString(checkIn || today, 1);

  const handleCheckInChange = (value) => {
    const changes = { checkIn: value };
    if (!checkOut || calculateNights(value, checkOut) <= 0) {
      changes.checkOut = addDaysToDateString(value, 1);
    }
    onChange(changes);
  };

  return (
    <div className={compact ? 'grid gap-3' : `grid gap-4 ${showGuests ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {showGuests ? <label>
        <span className="label">{t('common.checkIn')}</span>
        <DateInput
          className={inputClass}
          min={today}
          value={checkIn || defaults.checkIn}
          onChange={(event) => handleCheckInChange(event.target.value)}
        />
      </label> : null}
      <label>
        <span className="label">{t('common.checkOut')}</span>
        <DateInput
          className={inputClass}
          min={checkoutMin}
          value={checkOut || defaults.checkOut}
          onChange={(event) => onChange({ checkOut: event.target.value })}
        />
      </label>
      <label>
        <span className="label">{t('common.guests')}</span>
        {readOnlyGuests ? (
          <div className={`${inputClass} flex min-h-0 items-center gap-3 py-2`}>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('common.adults')}</span>
                <strong className="min-h-10 py-2 text-base font-semibold text-lune-ink sm:text-sm">
                  {Number(adults || guests || 1)}
                </strong>
              </div>
              <div className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t('common.children')}</span>
                <strong className="min-h-10 py-2 text-base font-semibold text-lune-ink sm:text-sm">
                  {Number(children || 0)}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <GuestSelector
            className={inputClass}
            adults={adults || guests || 1}
            children={children || 0}
            maxGuests={maxGuests}
            onChange={onChange}
            t={t}
          />
        )}
      </label>
    </div>
  );
}
