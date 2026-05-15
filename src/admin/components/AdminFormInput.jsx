export default function AdminFormInput({
  label,
  error,
  as = 'input',
  className = '',
  children,
  ...props
}) {
  const Component = as;
  const normalizedProps =
    props.type === 'number'
      ? { ...props, type: 'text', inputMode: 'numeric' }
      : props;

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-lune-ink">{label}</span>
      {children || (
        <Component
          className="min-h-12 w-full rounded-md border border-stone-200 bg-white px-3 py-3 text-base text-lune-ink outline-none transition focus:border-lune-gold focus:ring-2 focus:ring-lune-gold/20 sm:text-sm"
          {...normalizedProps}
        />
      )}
      {error ? <span className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
