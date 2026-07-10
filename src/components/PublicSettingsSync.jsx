import { useEffect } from 'react';
import { saveBrandingSettings } from '../admin/services/adminSettingsService.js';
import { getPublicSettingsWithFallback } from '../services/settingsApiService.js';
import { backendToBranding } from '../services/settingsAdapter.js';

const placeholders = new Set([
  '',
  '#',
  '+84 000 000 000',
  '+84 236 000 0000',
  'hello@luneboutique.example',
  'hello@luneboutique.vn',
]);

const dropPlaceholders = (branding) =>
  Object.fromEntries(Object.entries(branding).filter(([, value]) => !placeholders.has(value)));

// Hydrates the local branding store from the backend so admin edits made on the
// server are reflected for every visitor, not just the browser that made them.
export default function PublicSettingsSync() {
  useEffect(() => {
    let cancelled = false;
    getPublicSettingsWithFallback()
      .then(({ source, settings }) => {
        if (cancelled || source !== 'api' || !settings?.branding) return;
        const branding = dropPlaceholders(backendToBranding(settings.branding));
        if (Object.keys(branding).length) saveBrandingSettings(branding);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
