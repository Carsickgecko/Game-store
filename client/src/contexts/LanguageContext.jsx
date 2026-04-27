import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { en } from "../i18n/en.js";
import { vi } from "../i18n/vi.js";
import { getUser, isAuthenticated, updatePreferredLanguage } from "../store/auth.js";

const translations = { en, vi };
const LanguageContext = createContext(null);

function getInitialLanguage() {
  const preferred = getUser()?.preferredLanguage;
  if (preferred === "vi" || preferred === "en") {
    return preferred;
  }

  if (typeof navigator === "undefined") {
    return "en";
  }

  return String(navigator.language || "").toLowerCase().startsWith("vi")
    ? "vi"
    : "en";
}

function resolveTranslation(language, key) {
  const branch = translations[language] || translations.en;
  return key.split(".").reduce((value, part) => value?.[part], branch);
}

function interpolate(template, variables) {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) => {
    return variables?.[token] ?? `{${token}}`;
  });
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === "vi" ? "vi" : "en";

    if (isAuthenticated() && getUser()?.preferredLanguage !== language) {
      updatePreferredLanguage(language).catch(() => {});
    }
  }, [language]);

  useEffect(() => {
    const syncLanguage = () => {
      const preferred = getUser()?.preferredLanguage;
      if (preferred === "vi" || preferred === "en") {
        setLanguage(preferred);
      }
    };

    window.addEventListener("auth:changed", syncLanguage);
    return () => window.removeEventListener("auth:changed", syncLanguage);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key, variables = undefined) =>
        interpolate(resolveTranslation(language, key) || key, variables),
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
