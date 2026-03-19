/**
 * User Profile Validation Schema
 * Contains validation rules and messages for user profile related forms.
 */

import * as yup from "yup";
import { useTranslation } from "../hooks/useTranslation";

const MAX_QUIZ_TITLE_LENGTH = 60;

/**
 * Retrieves localized validation messages for user profile forms.
 * Uses i18n translation with fallback to default English messages.
 * @returns An object containing all validation messages for password fields.
 */
const getValidationMessages = () => {
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
        required: translate("quiz.validation.required") || "This field is required",
        quiz_title: {
            required: translate("quiz.validation.quiz_title") || "Quiz title is required",
            max: translate("quiz.validation.quiz_title.max") || `Quiz title cannot exceed ${MAX_QUIZ_TITLE_LENGTH} characters`,
            noExtraSpaces: translate("quiz.validation.noExtraSpaces") || "Only single spaces between words are allowed",
        },
        purpose: {
            required: translate("quiz.validation.purpose") || "Purpose is required",
            max: translate("quiz.validation.purpose.max") || "Purpose is required",
        },
        no_of_questions: {
            required: translate("quiz.validation.no_of_questions") || "No of questions is required",
            min: translate("quiz.validation.no_of_questions.min") || "No of questions is required",
            max: translate("quiz.validation.no_of_questions.max") || "No of questions is required",
            numeric: translate("quiz.validation.no_of_questions.numeric") || "No of questions is required",
        },
        love_profile_id: translate("quiz.validation.love_profile_id") || "Love profile id is required",
    }
}

export const getCreateQuizValidation = () => {
    const ValidationMessages = getValidationMessages();
    return yup.object().shape({
        quiz_title: yup.string().required(ValidationMessages.quiz_title.required).max(MAX_QUIZ_TITLE_LENGTH, ValidationMessages.quiz_title.max)
            .test("noExtraSpaces", ValidationMessages.quiz_title.noExtraSpaces, function (value) {
                if (!value) return true;
                // Check for consecutive spaces (more than one space in a row)
                if (/\s{2,}/.test(value)) {
                    return this.createError({ message: ValidationMessages.quiz_title.noExtraSpaces });
                }
                return true;
            }),
        love_profile_id: yup
            .number()
            .typeError(ValidationMessages.love_profile_id)
            .required(ValidationMessages.love_profile_id)
            .min(1, ValidationMessages.love_profile_id),
        purpose: yup.string().required(ValidationMessages.purpose.required).max(200, ValidationMessages.purpose.max),
        no_of_questions: yup.number()
            .typeError(ValidationMessages.no_of_questions.numeric)
            .required(ValidationMessages.no_of_questions.required)
            .integer(ValidationMessages.no_of_questions.numeric)
            .min(1, ValidationMessages.no_of_questions.min)
            .max(50, ValidationMessages.no_of_questions.max),
        quiz_category: yup.string().notRequired(),
        timeline_reference: yup.string().notRequired(),
    })
}
