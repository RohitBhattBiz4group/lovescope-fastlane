/**
 * User Profile Validation Schema
 * Contains validation rules and messages for user profile related forms.
 */

import * as yup from "yup";
import { useTranslation } from "../hooks/useTranslation";

/**
 * Retrieves localized validation messages for user profile forms.
 * Uses i18n translation with fallback to default English messages.
 * @returns An object containing all validation messages for password fields.
 */
const getValidationMessages = () =>{
    const { t } = useTranslation()
    /**
     * Helper function to safely translate a key with fallback.
     * @param key - The i18n translation key.
     * @returns The translated string or the key itself if translation fails.
     */
    const translate = (key: string) => {
        try {
            return t(key);
        } catch {
            return key;
        }
    };

    return {
        required: translate("user_profile.validation.required") || "This field is required",
        oldPassword: {
            required: translate("user_profile.validation.old_password_required") || "Old password is required",
            minLength: translate("user_profile.validation.old_password_min_length") || "Old Password must be at least 8 characters",
            maxLength: translate("user_profile.validation.old_password_max_length") || "Old Password cannot exceed 30 characters",
            noSpace: translate("user_profile.validation.old_password_no_space") || "Old Password cannot contain spaces",
            pattern: translate("user_profile.validation.old_password_pattern") || "Old Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        },
        newPassword: {
            required: translate("user_profile.validation.new_password_required") || "New password is required",
            minLength: translate("user_profile.validation.new_password_min_length") || "New Password must be at least 8 characters",
            maxLength: translate("user_profile.validation.new_password_max_length") || "New Password cannot exceed 30 characters",
            noSpace: translate("user_profile.validation.new_password_no_space") || "New Password cannot contain spaces",
            pattern: translate("user_profile.validation.new_password_pattern") || "New Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        },
        confirmPassword: {
            required: translate("user_profile.validation.confirm_password_required") || "Confirm Password is required",
            match: translate("user_profile.validation.confirm_password_match") || "Passwords does not match",
        },
        profile: {
            name: translate("user_profile.validation.name_required") || "Name is required",
            email: translate("user_profile.validation.email_required") || "Email is required",
            emailInvalid: translate("user_profile.validation.email_invalid") || "Please enter a valid email",
            phone: translate("user_profile.validation.phone_required") || "Phone number is required",
            phoneDigits: translate("user_profile.validation.invalid_phone_number") || "Phone number must contain only digits",
            phoneMinLength: translate("user_profile.validation.invalid_phone_number") || "Phone number must be at least 10 digits",
        },
    }
}

/**
 * Regular expression pattern for password validation.
 * Requires at least one uppercase letter, one lowercase letter,
 * one digit, and one special character.
 */
const passwordPatternRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>])/;

/**
 * Creates a Yup validation schema for the change password form.
 * Validates old password, new password, and confirm password fields.
 * @returns A Yup object schema with all password validation rules.
 */
export const getChangePasswordValidationSchema = () => {
    const ValidationMessages = getValidationMessages();
    return yup.object().shape({
        oldPassword: yup
            .string()
            .required(ValidationMessages.required)
            .test("no-spaces", ValidationMessages.oldPassword.noSpace, function (value) {
                // Skip pattern check if empty (required error will handle this)
                if (!value) return true;
                // Check for spaces first
                if (/\s/.test(value)) {
                    return this.createError({ message: ValidationMessages.oldPassword.noSpace });
                }
                return true;
            })
            .test("pattern", ValidationMessages.oldPassword.pattern, function (value) {
                if (!value) return true;
                // Skip pattern check if spaces are present (no-spaces test will handle it)
                if (/\s/.test(value)) return true;
                if (!passwordPatternRegex.test(value)) {
                    return this.createError({ message: ValidationMessages.oldPassword.pattern });
                }
                return true;
            })
            .test("minLength", ValidationMessages.oldPassword.minLength, function (value) {
                if (!value) return true;
                // Skip length check if empty or if pattern is not met
                if (/\s/.test(value)) return true;
                if (!passwordPatternRegex.test(value)) return true;
                if (value.length < 8) {
                    return this.createError({ message: ValidationMessages.oldPassword.minLength });
                }
                return true;
            })
            .test("maxLength", ValidationMessages.oldPassword.maxLength, function (value) {
                // Only check max length after other validations pass
                if (!value) return true;
                if (value.length > 30) {
                    return this.createError({ message: ValidationMessages.oldPassword.maxLength });
                }
                return true;
            }),
        newPassword: yup
            .string()
            .required(ValidationMessages.required)
            .test("no-spaces", ValidationMessages.newPassword.noSpace, function (value) {
                // Skip pattern check if empty (required error will handle this)
                if (!value) return true;
                // Check for spaces first
                if (/\s/.test(value)) {
                    return this.createError({ message: ValidationMessages.newPassword.noSpace });
                }
                return true;
            })
            .test("pattern", ValidationMessages.newPassword.pattern, function (value) {
                if (!value) return true;
                // Skip pattern check if spaces are present (no-spaces test will handle it)
                if (/\s/.test(value)) return true;
                if (!passwordPatternRegex.test(value)) {
                    return this.createError({ message: ValidationMessages.newPassword.pattern });
                }
                return true;
            })
            .test("minLength", ValidationMessages.newPassword.minLength, function (value) {
                if (!value) return true;
                // Skip length check if empty or if pattern is not met
                if (/\s/.test(value)) return true;
                if (!passwordPatternRegex.test(value)) return true;
                if (value.length < 8) {
                    return this.createError({ message: ValidationMessages.newPassword.minLength });
                }
                return true;
            })
            .test("maxLength", ValidationMessages.newPassword.maxLength, function (value) {
                // Only check max length after other validations pass
                if (!value) return true;
                if (value.length > 30) {
                    return this.createError({ message: ValidationMessages.newPassword.maxLength });
                }
                return true;
            }),
        confirmPassword: yup
            .string()
            .required(ValidationMessages.required)
            .test("match", ValidationMessages.confirmPassword.match, function (value) {
                const { newPassword } = this.parent;
                if (!value || !newPassword) return true; // Let required handle empty values
                if (value !== newPassword) {
                    return this.createError({ message: ValidationMessages.confirmPassword.match });
                }
                return true;
            }),
    })
}

/**
 * Creates a Yup validation schema for the profile form.
 * Validates name, email, and phone number fields using same patterns as signup.
 * @returns A Yup object schema with all profile validation rules.
 */
export const getProfileValidationSchema = (countryCode: string = "US") => {
    const ValidationMessages = getValidationMessages();
    
    // Import the same validation patterns as signup
    const fullNameRegex = /^[a-zA-Z0-9 ]*$/;
    const emailRegexSignup = /^[a-zA-Z0-9]+([a-zA-Z0-9\.]*[a-zA-Z0-9])?@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/i;
    
    // Phone validation rules from auth.ts
    const getPhoneValidationRules = (countryCode: string) => {
        const PHONE_VALIDATION_RULES = require("../constants/commonConstant").PHONE_VALIDATION_RULES;
        const DEFAULT_PHONE_VALIDATION = require("../constants/commonConstant").DEFAULT_PHONE_VALIDATION;
        const rules = PHONE_VALIDATION_RULES[countryCode as keyof typeof PHONE_VALIDATION_RULES] || DEFAULT_PHONE_VALIDATION;
        
        return {
            validatePhoneNumber: (phoneNumber: string) => {
                const digitsOnly = phoneNumber.replace(/\D/g, '');
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
            ...rules
        };
    };

    return yup.object().shape({
        name: yup
            .string()
            .required(ValidationMessages.profile.name)
            .max(100, "Full Name cannot exceed 100 characters")
            .test("trimmedLength", "Full Name must be at least 2 characters", function (value) {
                if (!value) return true;
                const trimmed = value.trim();
                if (trimmed.length < 2) {
                    return this.createError({ message: "Full Name must be at least 2 characters" });
                }
                return true;
            })
            .test("validCharacters", "Full Name must be between 2 and 100 characters and can only contain letters, numbers, and spaces", function (value) {
                if (!value) return true;
                const trimmed = value.trim();
                if (!fullNameRegex.test(trimmed)) {
                    return this.createError({ message: "Full Name must be between 2 and 100 characters and can only contain letters, numbers, and spaces" });
                }
                return true;
            })
            .test("noExtraSpaces", "Only single spaces between names are allowed", function (value) {
                if (!value) return true;
                if (/\s{2,}/.test(value)) {
                    return this.createError({ message: "Only single spaces between names are allowed" });
                }
                return true;
            })
            .test("maxLength", "Full Name cannot exceed 100 characters", function (value) {
                if (!value) return true;
                const trimmed = value.trim();
                if (trimmed.length > 100) {
                    return this.createError({ message: "Full Name cannot exceed 100 characters" });
                }
                return true;
            }),
        email: yup
            .string()
            .required(ValidationMessages.profile.email)
            .max(254, "Email cannot exceed 254 characters")
            .matches(emailRegexSignup, ValidationMessages.profile.emailInvalid),
        phone_number: yup
            .string()
            .required(ValidationMessages.profile.phone)
            .test("phone-libphonenumber", ValidationMessages.profile.phoneDigits, function (value) {
                if (!value) return true;
                const phoneRules = getPhoneValidationRules(countryCode);
                return phoneRules.validatePhoneNumber(value);
            })
            .test("phone-length", "Phone number length is invalid for selected country", function (value) {
                if (!value) return true;
                const phoneRules = getPhoneValidationRules(countryCode);
                const digitsOnly = value.replace(/\D/g, '');
                return digitsOnly.length >= phoneRules.minLength && digitsOnly.length <= phoneRules.maxLength;
            }),
    })
}