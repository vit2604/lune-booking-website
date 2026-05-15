import { Save } from 'lucide-react';
import { useState } from 'react';
import AdminFormInput from '../components/AdminFormInput.jsx';
import { getPolicies, savePolicies } from '../services/adminSettingsService.js';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState(getPolicies());
  const [message, setMessage] = useState('');

  const update = (field, value) => setPolicies((current) => ({ ...current, [field]: value }));

  const handleSave = (event) => {
    event.preventDefault();
    savePolicies(policies);
    setMessage('Policies saved. Guest room and booking pages will use the updated policies.');
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Guest policy</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Policy settings</h2>
          <p className="mt-2 text-sm text-stone-600">Short, clear policies shown across room detail and booking pages.</p>
        </div>
        <button className="btn-gold" type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save policies
        </button>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div> : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Check-in time" value={policies.checkInTime} onChange={(e) => update('checkInTime', e.target.value)} />
          <AdminFormInput label="Check-out time" value={policies.checkOutTime} onChange={(e) => update('checkOutTime', e.target.value)} />
          <AdminFormInput label="Early check-in note" value={policies.earlyCheckInNote} onChange={(e) => update('earlyCheckInNote', e.target.value)} />
          <AdminFormInput label="Cancellation policy" value={policies.cancellationPolicy} onChange={(e) => update('cancellationPolicy', e.target.value)} />
          <AdminFormInput label="Payment confirmation policy" value={policies.paymentConfirmationPolicy} onChange={(e) => update('paymentConfirmationPolicy', e.target.value)} />
          <AdminFormInput label="Smoking policy" value={policies.smokingPolicy} onChange={(e) => update('smokingPolicy', e.target.value)} />
          <AdminFormInput label="Pet policy" value={policies.petPolicy} onChange={(e) => update('petPolicy', e.target.value)} />
          <AdminFormInput label="Luggage storage policy" value={policies.luggageStoragePolicy} onChange={(e) => update('luggageStoragePolicy', e.target.value)} />
          <AdminFormInput label="Cleaning policy" value={policies.cleaningPolicy} onChange={(e) => update('cleaningPolicy', e.target.value)} />
          <AdminFormInput label="Long stay policy" value={policies.longStayPolicy} onChange={(e) => update('longStayPolicy', e.target.value)} />
          <AdminFormInput label="After booking contact note" className="lg:col-span-2" value={policies.contactAfterBooking} onChange={(e) => update('contactAfterBooking', e.target.value)} />
        </div>
      </section>
    </form>
  );
}
