import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SUPPORTED_LOCALES, translations, type Locale } from './translations';

const STORAGE_KEY = 'statspalpite.locale';

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'pt-BR';

/** Idioma do aparelho, quando suportado; caso contrário, português. */
function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageTag ?? 'pt-BR';
  if (tag.startsWith('pt')) return 'pt-BR';
  if (tag.startsWith('en')) return 'en';
  return 'pt-BR';
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Data e número localizados, como pede o RF75. */
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (value: string | Date) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale());

  // Restaura a escolha anterior do usuário, que vence o idioma do aparelho.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
          setLocaleState(stored as Locale);
        }
      })
      .catch(() => undefined);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    i18n.locale = locale;
    const intlLocale = locale === 'pt-BR' ? 'pt-BR' : 'en-US';

    return {
      locale,
      setLocale,
      t: (key, options) => i18n.t(key, options),
      formatDate: (input, options) =>
        new Intl.DateTimeFormat(intlLocale, options ?? { day: '2-digit', month: 'long' }).format(
          typeof input === 'string' ? new Date(input) : input,
        ),
      formatTime: (input) =>
        new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit' }).format(
          typeof input === 'string' ? new Date(input) : input,
        ),
      formatNumber: (input, options) => new Intl.NumberFormat(intlLocale, options).format(input),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n precisa estar dentro de I18nProvider');
  return context;
}

export { SUPPORTED_LOCALES };
export type { Locale };
