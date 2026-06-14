"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  LANGUAGES,
  MESSAGES,
  type Lang,
  type MessageKey,
} from "@/lib/i18n/dictionary";

const STORAGE_KEY = "wc26.lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Translate a key for the active language. */
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function isLang(value: string | null): value is Lang {
  return !!value && (LANGUAGES as readonly string[]).includes(value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Thai is the default for first-time visitors; a saved choice (below) wins.
  const [lang, setLangState] = useState<Lang>("th");

  // Hydrate the saved preference on mount (client-only to avoid SSR mismatch).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) setLangState(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang(lang === "en" ? "th" : "en"),
      t: (key) => MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key,
    }),
    [lang, setLang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <LanguageProvider>.");
  return ctx;
}
