/**
 * Group Validation Rules
 * Contains validation schemas for group-related forms
 */

import * as yup from "yup";
import i18next from "i18next";

/**
 * Get validation messages from translations
 */
const getValidationMessages = () => {
  const t = (key: string) => {
    try {
      return i18next.t(key);
    } catch {
      return key;
    }
  };

  return {
    groupName: {
      required: t("group.add_edit_group.group_name_required") || "Group name is required",
      minLength: t("group.add_edit_group.group_name_min_length") || "Group name must be at least 2 characters",
      maxLength: t("group.add_edit_group.group_name_max_length") || "Group name cannot exceed 50 characters",
      noExtraSpaces: t("group.add_edit_group.group_name_no_extra_spaces") || "Only single spaces between names are allowed",
    },
    members: {
      required: t("group.add_edit_group.select_at_least_two_member") || "Please select at least two member",
    },
  };
};

/**
 * Create group form validation schema
 */
export const getCreateGroupValidationSchema = () => {
  const ValidationMessages = getValidationMessages();

  return yup.object().shape({
    group_name: yup
      .string()
      .required(ValidationMessages.groupName.required)
      .min(2, ValidationMessages.groupName.minLength)
      .max(50, ValidationMessages.groupName.maxLength)
      .test("noExtraSpaces", ValidationMessages.groupName.noExtraSpaces, function (value) {
        if (!value) return true;
        // Check for consecutive spaces (more than one space in a row)
        if (/\s{2,}/.test(value)) {
          return this.createError({ message: ValidationMessages.groupName.noExtraSpaces });
        }
        return true;
      }),
    group_icon_url: yup.string().nullable().default(null),
    members: yup
      .array()
      .of(yup.number().required())
      .min(2, ValidationMessages.members.required)
      .required(ValidationMessages.members.required),
  });
};

export const createGroupValidationSchema = getCreateGroupValidationSchema();
