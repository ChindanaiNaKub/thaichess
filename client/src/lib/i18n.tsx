import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyParams,
  BOOTSTRAP_TRANSLATIONS,
  detectLanguage,
  ensureTranslations,
  fullEnglishLoaded,
  getTranslations,
  loadedTranslations,
  shouldEagerlyLoadEnglish,
  type Language,
} from './i18nRuntime';

export type { Language } from './i18nRuntime';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);
  const [catalogVersion, setCatalogVersion] = useState(0);

  const setLang = useCallback((newLang: Language) => {
    const applyLanguage = () => {
      setLangState(newLang);
      localStorage.setItem('thaichess-lang', newLang);
      document.documentElement.lang = newLang;
    };

    if (newLang === 'th' && !loadedTranslations.th) {
      void ensureTranslations(newLang).then(() => {
        applyLanguage();
        setCatalogVersion((version) => version + 1);
      });
      return;
    }

    if (newLang === 'en') {
      void ensureTranslations(newLang)
        .then(() => {
          setCatalogVersion((version) => version + 1);
        })
        .catch(() => {
          // Keep bootstrap translations active even if the full catalog fails to load.
        });
    }

    applyLanguage();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (lang !== 'th') {
      return;
    }

    if (loadedTranslations.th) {
      return;
    }

    let cancelled = false;

    void ensureTranslations(lang).then(() => {
      if (cancelled) return;
      setCatalogVersion((version) => version + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (lang !== 'en' || fullEnglishLoaded || !shouldEagerlyLoadEnglish) {
      return;
    }

    let cancelled = false;

    void ensureTranslations('en').then(() => {
      if (cancelled) return;
      setCatalogVersion((version) => version + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translations = getTranslations(lang);
    return applyParams(translations[key] || BOOTSTRAP_TRANSLATIONS[key] || key, params);
  }, [lang]);

  const value = useMemo<I18nContextType>(() => ({
    lang,
    setLang,
    t,
  }), [lang, setLang, t, catalogVersion]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}

export function useCurrentLanguage(): Language {
  return useContext(I18nContext)?.lang ?? detectLanguage();
}
