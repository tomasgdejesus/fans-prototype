import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./resources/en";
import { es } from "./resources/es";

export const supportedLanguages = ["en", "es"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const defaultLanguage: SupportedLanguage = "en";
const languageStorageKey = "fans.language";

function normalizeLanguage(language: string | null | undefined): SupportedLanguage | undefined {
  const baseLanguage = language?.toLowerCase().split("-")[0];
  return supportedLanguages.find((candidate) => candidate === baseLanguage);
}

function detectLanguage(): SupportedLanguage {
  let storedLanguage: SupportedLanguage | undefined;
  try {
    storedLanguage = normalizeLanguage(localStorage.getItem(languageStorageKey));
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
  if (storedLanguage) return storedLanguage;

  for (const language of navigator.languages) {
    const supportedLanguage = normalizeLanguage(language);
    if (supportedLanguage) return supportedLanguage;
  }

  return defaultLanguage;
}

function applyLanguage(language: string) {
  const supportedLanguage = normalizeLanguage(language) ?? defaultLanguage;
  document.documentElement.lang = supportedLanguage;
  try {
    localStorage.setItem(languageStorageKey, supportedLanguage);
  } catch {
    // Language switching should still work when storage is unavailable.
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectLanguage(),
  fallbackLng: defaultLanguage,
  defaultNS: "translation",
  supportedLngs: [...supportedLanguages],
  nonExplicitSupportedLngs: true,
  interpolation: { escapeValue: false },
  initAsync: false,
});

applyLanguage(i18n.resolvedLanguage ?? i18n.language);
i18n.on("languageChanged", applyLanguage);

export { i18n };
