import { RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import AdminFormInput from '../components/AdminFormInput.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { getWebsiteSettings, resetDemoData, saveWebsiteSettings } from '../services/adminSettingsService.js';
import { resetRooms } from '../services/adminRoomService.js';

export default function AdminSettings() {
  const [settings, setSettings] = useState(getWebsiteSettings());
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }));

  const handleSave = (event) => {
    event.preventDefault();
    saveWebsiteSettings(settings);
    setMessage('Website settings saved.');
  };

  const handleReset = () => {
    resetDemoData();
    resetRooms();
    setSettings(getWebsiteSettings());
    setConfirmOpen(false);
    setMessage('Demo data reset.');
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">General settings</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Website settings</h2>
          <p className="mt-2 text-sm text-stone-600">Control site status, defaults, contact routing, and demo reset.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn-secondary text-red-700" type="button" onClick={() => setConfirmOpen(true)}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset demo data
          </button>
          <button className="btn-gold" type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save settings
          </button>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div> : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Website status">
            <select className="input-field" value={settings.websiteStatus} onChange={(e) => update('websiteStatus', e.target.value)}>
              <option value="online">Online</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </AdminFormInput>
          <AdminFormInput label="Default currency" value={settings.defaultCurrency} onChange={(e) => update('defaultCurrency', e.target.value)} />
          <AdminFormInput label="Default language" value={settings.defaultLanguage} onChange={(e) => update('defaultLanguage', e.target.value)} />
          <AdminFormInput label="Contact email" value={settings.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} />
          <AdminFormInput label="Notification email placeholder" value={settings.notificationEmail} onChange={(e) => update('notificationEmail', e.target.value)} />
          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 text-sm font-semibold">
            <input type="checkbox" checked={settings.directBookingEnabled} onChange={(e) => update('directBookingEnabled', e.target.checked)} />
            Enable direct booking
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-stone-200 p-4 text-sm font-semibold">
            <input type="checkbox" checked={settings.availabilityMockEnabled} onChange={(e) => update('availabilityMockEnabled', e.target.checked)} />
            Enable room availability mock
          </label>
          <AdminFormInput label="Maintenance message" className="lg:col-span-2" as="textarea" value={settings.maintenanceMessage} onChange={(e) => update('maintenanceMessage', e.target.value)} />
        </div>
      </section>

      <ConfirmModal
        open={confirmOpen}
        title="Reset demo data?"
        message="This resets local mock settings and room data to default values. Bookings are kept."
        confirmText="Reset demo data"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReset}
      />
    </form>
  );
}
