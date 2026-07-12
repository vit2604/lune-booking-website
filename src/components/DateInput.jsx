import { formatDateInputDisplay } from '../utils/dateFormatUtils.js';

// The native input is invisible (opacity-0), which also hides the browser's
// calendar icon — on desktop Chrome/Edge that icon is the only click target
// that opens the calendar. Open it explicitly on any click instead.
const openNativePicker = (event) => {
  const input = event.currentTarget;
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
    } catch {
      // showPicker requires a user gesture; fall back to native focus behavior
    }
  }
};

export default function DateInput({
  value,
  onChange,
  className = 'input-field',
  placeholder = 'dd/mm/yyyy',
  ...props
}) {
  const displayValue = formatDateInputDisplay(value);

  return (
    <span className={`relative flex items-center ${className}`}>
      <span className={`pointer-events-none block truncate ${displayValue ? 'text-lune-ink' : 'text-stone-400'}`}>
        {displayValue || placeholder}
      </span>
      <input
        {...props}
        type="date"
        value={value || ''}
        onChange={onChange}
        onClick={openNativePicker}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}
