import { Globe2 } from 'lucide-react';
import { languageOptions } from '../i18n/translations.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function LanguageSwitcher({ mobile = false }) {
  const { currentLanguage, enabledLanguages, changeLanguage, t } = useTranslation();
  const options = languageOptions.filter((language) => enabledLanguages.includes(language.code));

  return (
    <label className={mobile ? 'block' : 'flex items-center gap-2'}>
      <span className={mobile ? 'label' : 'sr-only'}>{t('nav.language')}</span>
      {!mobile ? <Globe2 className="h-4 w-4 text-lune-goldDark" aria-hidden="true" /> : null}
      <select
        className={`min-h-11 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-lune-ink outline-none focus:border-lune-gold ${
          mobile ? 'w-full' : 'max-w-[180px]'
        }`}
        value={currentLanguage}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label={t('nav.language')}
      >
        {options.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
