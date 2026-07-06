import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultApiBaseUrl, storageKeys } from './config';

async function getApiBaseUrl() {
  return (await AsyncStorage.getItem(storageKeys.apiBaseUrl)) || defaultApiBaseUrl;
}

export async function getToken() {
  return AsyncStorage.getItem(storageKeys.token);
}

export async function saveAuth({ token, admin }) {
  await AsyncStorage.multiSet([
    [storageKeys.token, token],
    [storageKeys.admin, JSON.stringify(admin || {})],
  ]);
}

export async function clearAuth() {
  await AsyncStorage.multiRemove([storageKeys.token, storageKeys.admin]);
}

export async function apiRequest(path, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const token = options.token === undefined ? await getToken() : options.token;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      const error = new Error(payload.message || `Request failed (${response.status})`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}
