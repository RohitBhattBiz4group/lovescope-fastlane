/**
 * Authentication Validation Rules
 * Contains validation schemas for auth-related forms: Signup, Login, ForgotPassword, Verification, ResetPassword
 * Following the exact same validation rules as the Ensemble app
 */

import * as yup from "yup";
import i18next from "i18next";
import { PHONE_VALIDATION_RULES, DEFAULT_PHONE_VALIDATION } from "../constants/commonConstant";

/**
 * Get validation messages from translations
 * This function ensures translations are available when validation schemas are created
 */
const getValidationMessages = () => {
  // Use i18next.t directly for validation messages
  // This allows validation to work even if translations aren't loaded yet (falls back to key)
  const t = (key: string) => {
    try {
      return i18next.t(key);
    } catch {
      return key;
    }
  };

  return {
    required: t("auth.validation.required") || "This field is required",
    email: t("auth.validation.email_invalid") || "Please enter a valid email address",
    emailOrPhone:
      t("auth.validation.email_or_phone_invalid") ||
      "Please enter a valid email or phone number",
    emailMaxLength: t("auth.validation.email_max_length") || "Email cannot exceed 254 characters",
    fullName: {
      required: t("auth.validation.full_name_required") || "Full Name is required",
      minLength: t("auth.validation.full_name_min_length") || "Full Name must be at least 2 characters",
      maxLength: t("auth.validation.full_name_max_length") || "Full Name cannot exceed 100 characters",
      pattern: t("auth.validation.full_name_pattern") || "Full Name must be between 2 and 100 characters and can only contain letters, numbers, and spaces",
      noExtraSpaces: t("auth.validation.full_name_no_extra_spaces") || "Only single spaces between names are allowed",
    },
    password: {
      required: t("auth.validation.password_required") || "Password is required",
      minLength: t("auth.validation.password_min_length") || "Password must be at least 8 characters",
      maxLength: t("auth.validation.password_max_length") || "Password cannot exceed 30 characters",
      noSpace: t("auth.validation.password_no_space") || "Password cannot contain spaces",
      pattern: t("auth.validation.password_pattern") || "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    },
    confirmPassword: {
      required: t("auth.validation.confirm_password_required") || "Confirm Password is required",
      match: t("auth.validation.confirm_password_match") || "Passwords does not match",
    },
    otp: {
      required: t("auth.validation.otp_required") || "Verification code is required",
        pattern: t("auth.validation.otp_pattern") || "Verification code must be a 4-digit number",
    },
    phone: {
      required: t("auth.validation.phone_required") || "Mobile number is required",
      invalid:
        t("auth.validation.phone_invalid") ||
        "Please enter a valid phone number",
      invalidLength:
        t("auth.validation.phone_invalid_length") ||
        "Phone number length is invalid for selected country",
    },
  };
};

/**
 * Email validation regex - matches Ensemble app pattern exactly
 * Login and Forgot Password use: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
 * Signup uses stricter pattern: /^[a-zA-Z0-9]+([a-zA-Z0-9\.]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/i
 */
export const emailRegexLogin = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const emailRegexSignup = /^[a-zA-Z0-9]+([a-zA-Z0-9\.]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/i;

/**
 * Full name validation regex - matches Ensemble app exactly
 * Only allows letters, numbers, and spaces (no periods, apostrophes, or hyphens)
 */
const fullNameRegex = /^[a-zA-Z0-9 ]*$/;

/**
 * Password validation regex - matches Ensemble app exactly
 * Must contain: uppercase, lowercase, number, and special character
 */
const passwordPatternRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/;

/**
 * OTP validation regex - matches Ensemble app exactly
 * Must be exactly 4 digits
 */
const otpRegex = /^[0-9]{4}$/;

/**
 * Phone validation regex
 * Digits only, length between 7 and 15 (E.164 max is 15)
 */
export const phoneRegex = /^[0-9]{7,15}$/;

/**
 * Get country-specific phone validation rules using simple pattern matching
 */
const getPhoneValidationRules = (countryCode: string) => {
  const rules = PHONE_VALIDATION_RULES[countryCode as keyof typeof PHONE_VALIDATION_RULES] || DEFAULT_PHONE_VALIDATION;
  
  return {
    validatePhoneNumber: (phoneNumber: string) => {
      // Remove all non-digit characters for validation
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // Check if the number matches the country-specific pattern and length
      return rules.pattern.test(digitsOnly) && 
             digitsOnly.length >= rules.minLength && 
             digitsOnly.length <= rules.maxLength;
    },
    getErrorMessage: (phoneNumber: string) => {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      if (digitsOnly.length < rules.minLength) {
        return `Phone number must be at least ${rules.minLength} digits`;
      }
      if (digitsOnly.length > rules.maxLength) {
        return `Phone number cannot exceed ${rules.maxLength} digits`;
      }
      return "Please enter a valid phone number";
    },
    // Keep the original rules for backward compatibility
    ...rules
  };
};

/**
 * Login form validation schema
 * Matches Ensemble app validation rules exactly
 */
export const getLoginValidationSchema = () => {
  const ValidationMessages = getValidationMessages();
  return yup.object().shape({
    email: yup
      .string()
      .required(ValidationMessages.required)
      .max(254, ValidationMessages.emailMaxLength)
      .test(
        "email-or-phone",
        ValidationMessages.emailOrPhone,
        function (value) {
          if (!value) return true;
          const trimmed = value.trim();
          return emailRegexLogin.test(trimmed) || phoneRegex.test(trimmed);
        }
      ),
    password: yup
      .string()
      .required(ValidationMessages.password.required)
      .max(30, ValidationMessages.password.maxLength)
      .test("no-spaces", ValidationMessages.password.noSpace, function (value) {
        if (!value) return true; // Let required handle empty values
        if (/\s/.test(value)) {
          return this.createError({ message: ValidationMessages.password.noSpace });
        }
        return true;
      }),
  });
};

// Export a default instance for backward compatibility
export const loginValidationSchema = getLoginValidationSchema();

/**
 * Signup form validation schema
 * Matches Ensemble app validation rules exactly
 * Validation order: spaces check first, then pattern, then minLength, then maxLength
 */
export const getSignupValidationSchema = (countryCode: string = "US") => {
  const ValidationMessages = getValidationMessages();
  
  return yup.object().shape({
    name: yup
      .string()
      .required(ValidationMessages.fullName.required)
      .max(100, ValidationMessages.fullName.maxLength)
      .test("trimmedLength", ValidationMessages.fullName.minLength, function (value) {
        if (!value) return true; // Let required handle empty values
        const trimmed = value.trim();
        if (trimmed.length < 2) {
          return this.createError({ message: ValidationMessages.fullName.minLength });
        }
        return true;
      })
      .test("validCharacters", ValidationMessages.fullName.pattern, function (value) {
        if (!value) return true;
        const trimmed = value.trim();
        if (!fullNameRegex.test(trimmed)) {
          return this.createError({ message: ValidationMessages.fullName.pattern });
        }
        return true;
      })
      .test("noExtraSpaces", ValidationMessages.fullName.noExtraSpaces, function (value) {
        if (!value) return true;
        // Check for consecutive spaces (more than one space in a row)
        if (/\s{2,}/.test(value)) {
          return this.createError({ message: ValidationMessages.fullName.noExtraSpaces });
        }
        return true;
      })
      .test("maxLength", ValidationMessages.fullName.maxLength, function (value) {
        if (!value) return true;
        const trimmed = value.trim();
        if (trimmed.length > 100) {
          return this.createError({ message: ValidationMessages.fullName.maxLength });
        }
        return true;
      }),
    email: yup
      .string()
      .required(ValidationMessages.required)
      .max(254, ValidationMessages.emailMaxLength)
      .matches(emailRegexSignup, ValidationMessages.email),
    country_code: yup.string().required(ValidationMessages.required),
    calling_code: yup.string().required(ValidationMessages.required),
    phone: yup
      .string()
      .required(ValidationMessages.phone.required)
      .test("phone-libphonenumber", ValidationMessages.phone.invalid, function (value) {
        if (!value) return true; // Let required handle empty values
        const phoneRules = getPhoneValidationRules(countryCode);
        return phoneRules.validatePhoneNumber(value);
      })
      .test("phone-length", ValidationMessages.phone.invalidLength, function (value) {
        if (!value) return true; // Let required handle empty values
        const phoneRules = getPhoneValidationRules(countryCode);
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= phoneRules.minLength && digitsOnly.length <= phoneRules.maxLength;
      }),
    verification_via: yup
      .string()
      .oneOf(["email", "phone_number"])
      .required(ValidationMessages.required),
    password: yup
      .string()
      .required(ValidationMessages.password.required)
      .test("no-spaces", ValidationMessages.password.noSpace, function (value) {
        // Skip pattern check if empty (required error will handle this)
        if (!value) return true;
        // Check for spaces first
        if (/\s/.test(value)) {
          return this.createError({ message: ValidationMessages.password.noSpace });
        }
        return true;
      })
      .test("pattern", ValidationMessages.password.pattern, function (value) {
        if (!value) return true;
        // Skip pattern check if spaces are present (no-spaces test will handle it)
        if (/\s/.test(value)) return true;
        if (!passwordPatternRegex.test(value)) {
          return this.createError({ message: ValidationMessages.password.pattern });
        }
        return true;
      })
      .test("minLength", ValidationMessages.password.minLength, function (value) {
        if (!value) return true;
        // Skip length check if empty or if pattern is not met
        if (/\s/.test(value)) return true;
        if (!passwordPatternRegex.test(value)) return true;
        if (value.length < 8) {
          return this.createError({ message: ValidationMessages.password.minLength });
        }
        return true;
      })
      .test("maxLength", ValidationMessages.password.maxLength, function (value) {
        // Only check max length after other validations pass
        if (!value) return true;
        if (value.length > 30) {
          return this.createError({ message: ValidationMessages.password.maxLength });
        }
        return true;
      }),
    confirmPassword: yup
      .string()
      .required(ValidationMessages.confirmPassword.required)
      .test("match", ValidationMessages.confirmPassword.match, function (value) {
        const { password } = this.parent;
        if (!value || !password) return true; // Let required handle empty values
        if (value !== password) {
          return this.createError({ message: ValidationMessages.confirmPassword.match });
        }
        return true;
      }),
  });
};

// Export a default instance for backward compatibility
export const signupValidationSchema = getSignupValidationSchema();

/**
 * Forgot password validation schema
 * Matches Ensemble app validation rules exactly
 */
export const getForgotPasswordValidationSchema = () => {
  const ValidationMessages = getValidationMessages();
  
  return yup.object().shape({
    email: yup
      .string()
      .required(ValidationMessages.required)
      .max(254, ValidationMessages.emailMaxLength)
      .matches(emailRegexLogin, ValidationMessages.email),
  });
};

// Export a default instance for backward compatibility
export const forgotPasswordValidationSchema = getForgotPasswordValidationSchema();

/**
 * Verification code (OTP) validation schema
 * Matches Ensemble app validation rules exactly - must be exactly 4 digits
 */
export const getOtpValidationSchema = () => {
  const ValidationMessages = getValidationMessages();
  
  return yup.object().shape({
    otp: yup
      .string()
      .required(ValidationMessages.otp.required)
      .matches(otpRegex, ValidationMessages.otp.pattern),
  });
};

// Export a default instance for backward compatibility
export const otpValidationSchema = getOtpValidationSchema();

/**
 * Reset password validation schema
 * Matches Ensemble app validation rules exactly
 * Uses the same password validation as signup
 */
export const getResetPasswordValidationSchema = () => {
  const ValidationMessages = getValidationMessages();
  
  return yup.object().shape({
    new_password: yup
      .string()
      .required(ValidationMessages.password.required)
      .test("no-spaces", ValidationMessages.password.noSpace, function (value) {
        // Skip pattern check if empty (required error will handle this)
        if (!value) return true;
        // Check for spaces first
        if (/\s/.test(value)) {
          return this.createError({ message: ValidationMessages.password.noSpace });
        }
        return true;
      })
      .test("pattern", ValidationMessages.password.pattern, function (value) {
        if (!value) return true;
        // Skip pattern check if spaces are present (no-spaces test will handle it)
        if (/\s/.test(value)) return true;
        if (!passwordPatternRegex.test(value)) {
          return this.createError({ message: ValidationMessages.password.pattern });
        }
        return true;
      })
      .test("minLength", ValidationMessages.password.minLength, function (value) {
        if (!value) return true;
        // Skip length check if empty or if pattern is not met
        if (/\s/.test(value)) return true;
        if (!passwordPatternRegex.test(value)) return true;
        if (value.length < 8) {
          return this.createError({ message: ValidationMessages.password.minLength });
        }
        return true;
      })
      .test("maxLength", ValidationMessages.password.maxLength, function (value) {
        // Only check max length after other validations pass
        if (!value) return true;
        if (value.length > 30) {
          return this.createError({ message: ValidationMessages.password.maxLength });
        }
        return true;
      }),
    confirm_password: yup
      .string()
      .required(ValidationMessages.confirmPassword.required)
      .test("match", ValidationMessages.confirmPassword.match, function (value) {
        const { new_password } = this.parent;
        if (!value || !new_password) return true; // Let required handle empty values
        if (value !== new_password) {
          return this.createError({ message: ValidationMessages.confirmPassword.match });
        }
        return true;
      }),
  });
};

// Export a default instance for backward compatibility
export const resetPasswordValidationSchema = getResetPasswordValidationSchema();

