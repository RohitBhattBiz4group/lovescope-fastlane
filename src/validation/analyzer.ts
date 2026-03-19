/**
 * User Profile Validation Schema
 * Contains validation rules and messages for user profile related forms.
 */
import * as yup from "yup";
import i18next from "i18next";
import { INPUT_FORMAT_TEXT } from "../constants/commonConstant";
import { getMaxLength } from "../utils/helper";
import { IUserSubscriptionResponse } from "../interfaces/subscriptionInterface";

const getValidationMessages = (maxLength: number) =>{
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
        required: translate("analyzer.text_analyzer.validation.required") || "This field is required",
        conversationText: {
            maxLength: translate("analyzer.text_analyzer.validation.conversation_text_max_length") || `Conversation text must be less than ${maxLength} characters`,
        },
        context: {
            maxLength: translate("analyzer.text_analyzer.validation.context_max_length") || `Context must be less than ${maxLength} characters`,
        },
        specify_output_context: {
            maxLength: translate("analyzer.text_analyzer.validation.specify_output_context_max_length") || `Specify output context must be less than ${maxLength} characters`,
        },
    }
}

export const getTextAnalyzerSchema = (currentPlan?: IUserSubscriptionResponse)=>{
    const maxLength = getMaxLength(currentPlan);
    const ValidationMessages = getValidationMessages(maxLength);
    return yup.object().shape({
        profile: yup.string().required(ValidationMessages.required),
        conversationText: yup.string().when('inputType', {
            is: INPUT_FORMAT_TEXT,
            then: (schema) => schema.required(ValidationMessages.required).max(maxLength, ValidationMessages.conversationText.maxLength),
            otherwise: (schema) => schema.notRequired(),
        }),
        context: yup.string().when(['timeline_reference', 'want_to_add_more_context'], {
            is: (timelineRef: string, addMoreContext: boolean) => {
                if (!timelineRef || timelineRef === "") return true;
                if (addMoreContext) return true;
                return false;
            },
            then: (schema) => schema.required(ValidationMessages.required).max(maxLength, ValidationMessages.context.maxLength),
            otherwise: (schema) => schema.notRequired().max(maxLength, ValidationMessages.context.maxLength),
        }),
        timeline_reference: yup.string().notRequired(),
        want_to_add_more_context: yup.boolean().notRequired(),
        specify_output_context: yup.string().max(maxLength, ValidationMessages.specify_output_context.maxLength),
    })
}

const getArgumentAnalyzerValidationMessages = () => {
    const translate = (key: string) => {
        try {
            return i18next.t(key);
        } catch {
            return key;
        }
    };

    return {
        required: translate("analyzer.argument.validation.required") || "This field is required",
        profile: {
            required: translate("analyzer.argument.validation.profile_required") || "Profile is required",
        },
        context: {
            required: translate("analyzer.argument.validation.context_required") || "Context is required",
            maxLength: translate("analyzer.argument.validation.context_max_length") || "Maximum 200 characters allowed",
        },
        conversationText: {
            maxLength: translate("analyzer.argument.validation.conversation_text_max_length") || "Conversation text must be less than 1000 characters",
        },
    };
};

export const getArgumentAnalyzerSchema = (currentPlan?: IUserSubscriptionResponse) => {
    const maxLength = getMaxLength(currentPlan);
    const ValidationMessages = getArgumentAnalyzerValidationMessages();
    return yup.object().shape({
        profile: yup.string().required(ValidationMessages.profile.required),
        conversationText: yup.string().when("inputType", {
            is: INPUT_FORMAT_TEXT,
            then: (schema) => schema.max(maxLength, ValidationMessages.conversationText.maxLength),
            otherwise: (schema) => schema.notRequired(),
        }),
        context: yup.string().when(["timelineReference", "wantToAddMoreContext"], {
            is: (timelineRef: string, addMoreContext: boolean) => {
                if (!timelineRef || timelineRef === "") return true;
                if (addMoreContext) return true;
                return false;
            },
            then: (schema) => schema.required(ValidationMessages.context.required).max(maxLength, ValidationMessages.context.maxLength),
            otherwise: (schema) => schema.notRequired().max(maxLength, ValidationMessages.context.maxLength),
        }),
        timelineReference: yup.string().notRequired(),
        wantToAddMoreContext: yup.boolean().notRequired(),
    });
};