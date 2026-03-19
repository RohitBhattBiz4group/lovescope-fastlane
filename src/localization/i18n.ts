import { initReactI18next } from "react-i18next";
import i18next from "i18next";

import en from "./en/translation.json";

const resources = {
  en: {
    translation: en,
  },
};

void i18next.use(initReactI18next).init({
  lng: "en", // default language
  fallbackLng: "en",
  debug: __DEV__, // Enable debug mode in development
  resources,
  interpolation: {
    escapeValue: false, // React Native already escapes values
  },
});

export default i18next;

