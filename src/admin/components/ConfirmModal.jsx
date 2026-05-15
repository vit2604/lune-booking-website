export default function ConfirmModal({ open, title, message, confirmText = 'Confirm', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <h2 className="font-display text-3xl font-bold text-lune-ink">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-gold bg-red-700 hover:bg-red-800" type="button" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
