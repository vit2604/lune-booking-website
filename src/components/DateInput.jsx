import { formatDateInputDisplay } from '../utils/dateFormatUtils.js';

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
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </span>
  );
}
