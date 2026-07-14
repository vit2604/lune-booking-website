import { createContext, useEffect, useMemo, useState } from 'react';
import { getLanguageSettings } from '../admin/services/adminSettingsService.js';
import { legacyStorageKeys, storageKeys } from '../constants/storageKeys.js';
import { enTranslations, localeLoaders } from './translations.js';

const LANGUAGE_KEY = storageKeys.language;

export const LanguageContext = createContext(null);

function getStoredLanguage(settings) {
  const stored =
    localStorage.getItem(LANGUAGE_KEY) ||
    legacyStorageKeys.language.map((key) => localStorage.getItem(key)).find(Boolean);
  if (stored && settings.enabledLanguages.includes(stored)) return stored;
  return settings.defaultLanguage || 'en';
}

export function LanguageProvider({ children }) {
  const [settings, setSettings] = useState(getLanguageSettings());
  const [currentLanguage, setCurrentLanguage] = useState(() => getStoredLanguage(getLanguageSettings()));
  // Chi tieng Anh bundle san; locale khac duoc import() khi can va cache lai day.
  const [translationsByLanguage, setTranslationsByLanguage] = useState({ en: enTranslations });

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    localStorage.setItem('lune_guest_language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    if (translationsByLanguage[currentLanguage] || !localeLoaders[currentLanguage]) return;
    let ignore = false;
    localeLoaders[currentLanguage]()
      .then((module) => {
        if (!ignore) {
          setTranslationsByLanguage((current) => ({ ...current, [currentLanguage]: module.default }));
        }
      })
      .catch(() => {
        // Loi mang khi tai locale: giu fallback tieng Anh.
      });
    return () => {
      ignore = true;
    };
  }, [currentLanguage, translationsByLanguage]);

  useEffect(() => {
    const refresh = () => {
      const nextSettings = getLanguageSettings();
      setSettings(nextSettings);
      if (!nextSettings.enabledLanguages.includes(currentLanguage)) {
        setCurrentLanguage(nextSettings.defaultLanguage || 'en');
      }
    };
    window.addEventListener('lune:language-settings-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('lune:language-settings-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [currentLanguage]);

  const value = useMemo(
    () => ({
      currentLanguage,
      enabledLanguages: settings.enabledLanguages,
      languageSettings: settings,
      translationsByLanguage,
      changeLanguage: (language) => {
        if (localeLoaders[language] && settings.enabledLanguages.includes(language)) {
          setCurrentLanguage(language);
        }
      },
    }),
    [currentLanguage, settings, translationsByLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
