import { Save } from 'lucide-react';
import { useState } from 'react';
import AdminFormInput from '../components/AdminFormInput.jsx';
import { getRooms, updateRoom } from '../services/adminRoomService.js';
import { getLanguageSettings, saveLanguageSettings } from '../services/adminSettingsService.js';
import { languageOptions } from '../../i18n/translations.js';

const editableKeys = [
  ['home.heroTitle', 'Home hero title'],
  ['home.heroSubtitle', 'Home hero subtitle'],
  ['home.searchRooms', 'Hero button text'],
  ['home.aboutTitle', 'Home about title'],
  ['home.calmBase', 'Why book direct title'],
  ['success.received', 'Success title'],
  ['success.contactSoon', 'Success message'],
  ['success.contactNote', 'Success contact note'],
  ['payment.safetyNote', 'Payment safety note'],
  ['payment.cardPlaceholderNote', 'Card payment note'],
  ['payment.walletPlaceholderNote', 'Wallet payment note'],
  ['payment.internationalTransferNote', 'International transfer note'],
  ['contact.title', 'Contact title'],
  ['contact.body', 'Contact intro text'],
  ['home.guestInfoTitle', 'Guest information title'],
];

function setNestedValue(source, path, value) {
  const next = structuredClone(source || {});
  const keys = path.split('.');
  let cursor = next;
  keys.slice(0, -1).forEach((key) => {
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
  return next;
}

function getNestedValue(source, path) {
  return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : ''), source);
}

export default function AdminLanguages() {
  const [settings, setSettings] = useState(getLanguageSettings());
  const [rooms, setRooms] = useState(getRooms());
  const [activeLang, setActiveLang] = useState(settings.defaultLanguage || 'en');
  const [message, setMessage] = useState('');

  const toggleLanguage = (language) => {
    setSettings((current) => {
      const enabled = current.enabledLanguages.includes(language)
        ? current.enabledLanguages.filter((item) => item !== language)
        : [...current.enabledLanguages, language];
      return { ...current, enabledLanguages: enabled.length ? enabled : ['en'] };
    });
  };

  const updateContent = (path, value) => {
    setSettings((current) => ({
      ...current,
      content: {
        ...current.content,
        [activeLang]: setNestedValue(current.content?.[activeLang], path, value),
      },
    }));
  };

  const updateRoomTranslation = (roomId, field, value) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              translations: {
                ...room.translations,
                [activeLang]: {
                  ...(room.translations?.[activeLang] || room.translations?.en || {}),
                  [field]: value,
                },
              },
            }
          : room,
      ),
    );
  };

  const handleSave = (event) => {
    event.preventDefault();
    saveLanguageSettings(settings);
    rooms.forEach((room) => updateRoom(room.id, room));
    setMessage('Language content saved. Guest website will use these translations with English fallback.');
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">Guest languages</p>
          <h2 className="mt-2 font-display text-4xl font-bold text-lune-ink">Language settings</h2>
          <p className="mt-2 text-sm text-stone-600">
            Manage customer-facing translations. Admin stays in English for clarity.
          </p>
        </div>
        <button className="btn-gold" type="submit">
          <Save className="h-4 w-4" aria-hidden="true" />
          Save languages
        </button>
      </div>

      {message ? <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">{message}</div> : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Visible languages</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {languageOptions.map((language) => (
            <label key={language.code} className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={settings.enabledLanguages.includes(language.code)}
                onChange={() => toggleLanguage(language.code)}
              />
              {language.label}
            </label>
          ))}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <AdminFormInput label="Default website language">
            <select
              className="input-field"
              value={settings.defaultLanguage}
              onChange={(event) => setSettings((current) => ({ ...current, defaultLanguage: event.target.value }))}
            >
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </AdminFormInput>
          <AdminFormInput label="Edit language tab">
            <select className="input-field" value={activeLang} onChange={(event) => setActiveLang(event.target.value)}>
              {languageOptions.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </AdminFormInput>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Website text</h3>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {editableKeys.map(([path, label]) => (
            <AdminFormInput
              key={path}
              label={`${label} (${activeLang})`}
              as={path.includes('body') || path.includes('Note') || path.includes('message') ? 'textarea' : 'input'}
              value={getNestedValue(settings.content?.[activeLang], path)}
              onChange={(event) => updateContent(path, event.target.value)}
              placeholder="Leave blank to use default translation"
            />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-display text-3xl font-bold text-lune-ink">Room translations</h3>
        <div className="mt-5 grid gap-5">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-lg border border-stone-200 p-4">
              <h4 className="font-semibold text-lune-ink">{room.translations?.en?.name || room.name}</h4>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <AdminFormInput
                  label={`Room name (${activeLang})`}
                  value={room.translations?.[activeLang]?.name || ''}
                  onChange={(event) => updateRoomTranslation(room.id, 'name', event.target.value)}
                />
                <AdminFormInput
                  label={`Policy note (${activeLang})`}
                  value={room.translations?.[activeLang]?.policyNote || ''}
                  onChange={(event) => updateRoomTranslation(room.id, 'policyNote', event.target.value)}
                />
                <AdminFormInput
                  label={`Short description (${activeLang})`}
                  as="textarea"
                  value={room.translations?.[activeLang]?.shortDescription || ''}
                  onChange={(event) => updateRoomTranslation(room.id, 'shortDescription', event.target.value)}
                />
                <AdminFormInput
                  label={`Full description (${activeLang})`}
                  as="textarea"
                  value={room.translations?.[activeLang]?.description || ''}
                  onChange={(event) => updateRoomTranslation(room.id, 'description', event.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
