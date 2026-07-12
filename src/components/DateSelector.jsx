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
    <div className={compact ? 'grid gap-3' : 'grid gap-4 sm:grid-cols-3'}>
      <label>
        <span className="label">{t('common.checkIn')}</span>
        <DateInput
          className={inputClass}
          min={today}
          value={checkIn || defaults.checkIn}
          onChange={(event) => handleCheckInChange(event.target.value)}
        />
      </label>
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
        <GuestSelector
          className={inputClass}
          adults={adults || guests || 1}
          children={children || 0}
          maxGuests={maxGuests}
          onChange={onChange}
          t={t}
        />
      </label>
    </div>
  );
}
