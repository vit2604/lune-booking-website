import { getBrandingSettings, getPolicies, getWebsiteSettings } from '../admin/services/adminSettingsService.js';
import { apiRequest } from './apiClient.js';

export async function getPublicSettingsWithFallback() {
  try {
    return { source: 'api', settings: await apiRequest('/settings/public') };
  } catch (_error) {
    return {
      source: 'local',
      settings: {
        branding: getBrandingSettings(),
        policies: getPolicies(),
        website: getWebsiteSettings(),
      },
    };
  }
}
