import { RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import AdminFormInput from '../components/AdminFormInput.jsx';
import ImageUploader from '../components/ImageUploader.jsx';
import {
  defaultBrandingSettings,
  getBrandingSettings,
  saveBrandingSettings,
} from '../services/adminSettingsService.js';

export default function AdminBranding() {
  const [settings, setSettings] = useState(getBrandingSettings());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }));

  const handleSave = (event) => {
    event.preventDefault();
    const result = saveBrandingSettings(settings);
    if (!result.ok) {
      setError(result.message);
      setMessage('');
      return;
    }
    setError('');
    setMessage('Branding saved. Guest website will use the updated logo and content.');
  };

  const reset = () => {
    setSettings(defaultBrandingSettings);
    saveBrandingSettings(defaultBrandingSettings);
    setMessage('Branding reset to default Lune settings.');
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Branding</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Logo, hotel info, and home content</h2>
          <p className="mt-2 text-sm text-stone-600">Keep the guest website accurate without touching code.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn-secondary" type="button" onClick={reset}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset logo/content
          </button>
          <button className="btn-gold" type="submit">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save branding
          </button>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div> : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Brand info</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Hotel name" value={settings.hotelName} onChange={(e) => update('hotelName', e.target.value)} />
          <AdminFormInput label="Short name" value={settings.shortName} onChange={(e) => update('shortName', e.target.value)} />
          <AdminFormInput label="Short slogan" value={settings.shortSlogan} onChange={(e) => update('shortSlogan', e.target.value)} />
          <AdminFormInput label="Phone number" value={settings.phone} onChange={(e) => update('phone', e.target.value)} />
          <AdminFormInput label="Email" value={settings.email} onChange={(e) => update('email', e.target.value)} />
          <AdminFormInput label="Zalo / WhatsApp optional" value={settings.zalo || settings.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} />
          <AdminFormInput label="Facebook link optional" value={settings.facebook} onChange={(e) => update('facebook', e.target.value)} />
          <AdminFormInput label="Instagram link optional" value={settings.instagram} onChange={(e) => update('instagram', e.target.value)} />
          <AdminFormInput label="Google Maps link optional" value={settings.googleMapsLink || ''} onChange={(e) => update('googleMapsLink', e.target.value)} />
          <AdminFormInput label="Address" className="lg:col-span-2" value={settings.address} onChange={(e) => update('address', e.target.value)} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Logo and colors</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-5">
            <ImageUploader label="Logo mock upload or URL" images={settings.logoUrl ? [settings.logoUrl] : []} multiple={false} onChange={(images) => update('logoUrl', images[0] || '')} />
            <AdminFormInput label="Logo URL" value={settings.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} />
          </div>
          <div className="rounded-lg border border-stone-200 bg-lune-cream p-5">
            <p className="text-sm font-semibold text-stone-500">Logo preview</p>
            <div className="mt-4 grid h-32 place-items-center rounded-lg bg-white">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo preview" className="max-h-24 max-w-40 object-contain" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-md bg-lune-ink font-display text-2xl font-bold text-white">L</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdminFormInput label="Primary color" type="color" value={settings.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
          <AdminFormInput label="Accent color" type="color" value={settings.accentColor} onChange={(e) => update('accentColor', e.target.value)} />
          <AdminFormInput label="Background color" type="color" value={settings.backgroundColor} onChange={(e) => update('backgroundColor', e.target.value)} />
          <AdminFormInput label="Button color" type="color" value={settings.buttonColor} onChange={(e) => update('buttonColor', e.target.value)} />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Home page content</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <AdminFormInput label="Home hero title" value={settings.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} />
          <AdminFormInput label="Home hero subtitle" value={settings.heroSubtitle} onChange={(e) => update('heroSubtitle', e.target.value)} />
          <AdminFormInput label="Hero button text" value={settings.heroButtonText} onChange={(e) => update('heroButtonText', e.target.value)} />
          <AdminFormInput label="Hero image URL" value={settings.heroImage} onChange={(e) => update('heroImage', e.target.value)} />
          <AdminFormInput label="Book direct section title" value={settings.bookDirectTitle} onChange={(e) => update('bookDirectTitle', e.target.value)} />
          <AdminFormInput label="Footer description" as="textarea" value={settings.footerDescription} onChange={(e) => update('footerDescription', e.target.value)} />
        </div>
      </section>
    </form>
  );
}
