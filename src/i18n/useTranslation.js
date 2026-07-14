import { useContext } from 'react';
import { LanguageContext } from './LanguageContext.jsx';

function getNestedValue(source, path) {
  return path.split('.').reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), source);
}

function interpolate(value, params = {}) {
  if (typeof value !== 'string') return value;
  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement),
    value,
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used inside LanguageProvider');

  const { currentLanguage, languageSettings, translationsByLanguage } = context;

  const t = (key, params) => {
    const override = getNestedValue(languageSettings.content?.[currentLanguage], key);
    const languageValue =
      override !== undefined && override !== ''
        ? override
        : getNestedValue(translationsByLanguage[currentLanguage], key);
    const fallback = getNestedValue(translationsByLanguage.en, key) ?? key;
    return interpolate(languageValue ?? fallback, params);
  };

  return { ...context, t };
}
