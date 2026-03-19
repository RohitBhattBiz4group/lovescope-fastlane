import { useTranslation as useI18nTranslation } from "react-i18next";

/**
 * Custom hook for translations that provides type safety and easier usage
 * @returns Object containing t function and i18n instance
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * Translate a key with optional interpolation values
   * @param key - Translation key (supports nested keys with dots)
   * @param options - Optional interpolation values
   * @returns Translated string
   */
  const translate = (key: string, options?: Record<string, any>): string => {
    // Add safety check for t function
    if (typeof t !== "function") {
      console.warn("Translation function t is not available, returning key:", key);
      return key;
    }

    try {
      return t(key, options);
    } catch (error) {
      console.warn("Translation error for key:", key, error);
      return key;
    }
  };

  /**
   * Change the current language
   * @param language - Language code (e.g., 'en', 'es', 'fr')
   */
  const changeLanguage = (language: string): Promise<void> => {
    return i18n.changeLanguage(language);
  };

  /**
   * Get the current language
   * @returns Current language code
   */
  const getCurrentLanguage = (): string => {
    return i18n.language;
  };

  /**
   * Check if a language is available
   * @param language - Language code to check
   * @returns True if language is available
   */
  const isLanguageAvailable = (language: string): boolean => {
    return i18n.hasResourceBundle(language, "translation");
  };

  return {
    t: translate,
    i18n,
    changeLanguage,
    getCurrentLanguage,
    isLanguageAvailable,
  };
};

export default useTranslation;

