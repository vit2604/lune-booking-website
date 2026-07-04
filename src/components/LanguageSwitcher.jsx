import { Globe2 } from 'lucide-react';
import { languageOptions } from '../i18n/translations.js';
import { useTranslation } from '../i18n/useTranslation.js';

export default function LanguageSwitcher({ mobile = false, tone = 'default' }) {
  const { currentLanguage, enabledLanguages, changeLanguage, t } = useTranslation();
  const options = languageOptions.filter((language) => enabledLanguages.includes(language.code));
  const isLight = tone === 'light' && !mobile;

  return (
    <label className={mobile ? 'block' : 'flex items-center gap-2'}>
      <span className={mobile ? 'label' : 'sr-only'}>{t('nav.language')}</span>
      {!mobile ? (
        <Globe2 className={`h-4 w-4 ${isLight ? 'text-white/90' : 'text-lune-goldDark'}`} aria-hidden="true" />
      ) : null}
      <select
        className={`min-h-11 rounded-md px-3 py-2 text-sm font-semibold outline-none focus:border-lune-gold ${
          mobile ? 'w-full' : 'max-w-[180px]'
        } ${
          isLight
            ? 'border border-white/25 bg-white/10 text-white'
            : 'border border-stone-200 bg-white text-lune-ink'
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
