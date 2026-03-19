/**
 * Love Profile Validation Schema
 * Contains validation rules and messages for love profile related forms.
 */

import * as yup from "yup";
import i18next from "i18next";

/**
 * Full name validation regex - matches signup validation exactly
 * Only allows letters, numbers, and spaces (no periods, apostrophes, or hyphens)
 */
const fullNameRegex = /^[a-zA-Z0-9 ]*$/;

/**
 * Retrieves localized validation messages for love profile forms.
 * Uses i18n translation with fallback to default English messages.
 * @returns An object containing all validation messages for profile fields.
 */
const getValidationMessages = () => {
  /**
   * Helper function to safely translate a key with fallback.
   * @param key - The i18n translation key.
   * @returns The translated string or the key itself if translation fails.
   */
  const translate = (key: string) => {
    try {
      return i18next.t(key);
    } catch {
      return key;
    }
  };

  return {
    required: translate("love_profile.validation.name_required") || "This field is required",
    name: {
      required: translate("auth.validation.full_name_required") || "Full Name is required",
      minLength: translate("auth.validation.full_name_min_length") || "Full Name must be at least 2 characters",
      maxLength: translate("auth.validation.full_name_max_length") || "Full Name cannot exceed 100 characters",
      pattern: translate("auth.validation.full_name_pattern") || "Full Name must be between 2 and 100 characters and can only contain letters, numbers, and spaces",
      noExtraSpaces: translate("auth.validation.full_name_no_extra_spaces") || "Only single spaces between names are allowed",
    },
    age: {
      required: translate("love_profile.validation.age_required") || "Age is required",
      numeric: translate("love_profile.validation.age_numeric") || "Age must be a number",
      min: translate("love_profile.validation.age_min") || "Age must be at least 16",
      max: translate("love_profile.validation.age_max") || "Age must be less than or equal to 60",
    },
    gender: {
      required: translate("love_profile.validation.gender_required") || "Gender is required",
    },
    relationship: {
      required: translate("love_profile.validation.relationship_required") || "Relationship is required",
      oneOf: translate("love_profile.validation.relationship_one_of") || "Please select a valid relationship type",
    },
    about: {
      maxLength: translate("love_profile.validation.about_max_length") || "About must be less than 200 characters",
    },
  };
};

/**
 * Creates a Yup validation schema for the love profile form.
 * Validates name, age, gender, relationship, and about fields.
 * @returns A Yup object schema with all profile validation rules.
 */
export const getLoveProfileValidationSchema = () => {
  const validationMessages = getValidationMessages();
  return yup.object().shape({
    name: yup
      .string()
      .required(validationMessages.name.required)
      .max(100, validationMessages.name.maxLength)
      .test("trimmedLength", validationMessages.name.minLength, function (value) {
        if (!value) return true; // Let required handle empty values
        const trimmed = value.trim();
        if (trimmed.length < 2) {
          return this.createError({ message: validationMessages.name.minLength });
        }
        return true;
      })
      .test("validCharacters", validationMessages.name.pattern, function (value) {
        if (!value) return true;
        const trimmed = value.trim();
        if (!fullNameRegex.test(trimmed)) {
          return this.createError({ message: validationMessages.name.pattern });
        }
        return true;
      })
      .test("noExtraSpaces", validationMessages.name.noExtraSpaces, function (value) {
        if (!value) return true;
        // Check for consecutive spaces (more than one space in a row)
        if (/\s{2,}/.test(value)) {
          return this.createError({ message: validationMessages.name.noExtraSpaces });
        }
        return true;
      })
      .test("maxLength", validationMessages.name.maxLength, function (value) {
        if (!value) return true;
        const trimmed = value.trim();
        if (trimmed.length > 100) {
          return this.createError({ message: validationMessages.name.maxLength });
        }
        return true;
      }),
    age: yup
      .number()
      .required(validationMessages.age.required)
      .typeError(validationMessages.age.numeric)
      .min(16, validationMessages.age.min)
      .max(60, validationMessages.age.max)
      .integer(validationMessages.age.numeric),
    gender: yup.string().required(validationMessages.gender.required),
    relationship: yup
      .string()
      .required(validationMessages.relationship.required)
      .oneOf(
        ["Dating", "Situationship", "Talking", "Crush", "Friend", "Ex", "Unsure"],
        validationMessages.relationship.oneOf
      ),
    ethnicity: yup.array().of(yup.string()).default([]),
    region: yup.string().default(""),
    about: yup.string().max(200, validationMessages.about.maxLength),
  });
};


