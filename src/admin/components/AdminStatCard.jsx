export default function AdminStatCard({ label, value, helper, icon: Icon }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <strong className="mt-2 block break-words text-2xl font-bold leading-tight text-lune-ink sm:text-3xl">
            {value}
          </strong>
          {helper ? <span className="mt-2 block text-xs text-stone-500">{helper}</span> : null}
        </div>
        {Icon ? (
          <span className="grid h-11 w-11 place-items-center rounded-md bg-lune-cream text-lune-goldDark">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
