export default function AdminTable({ children, empty }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        {children || (
          <div className="p-8 text-center text-sm text-stone-500">
            {empty || 'No data available.'}
          </div>
        )}
      </div>
    </div>
  );
}
