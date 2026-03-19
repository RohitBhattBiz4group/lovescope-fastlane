import * as yup from "yup";
import { AddFriendFormData } from "../interfaces/friendInterface";
import { emailRegexLogin, phoneRegex } from "./auth";

export const getFriendValidationSchema = (
  t: (key: string) => string
): yup.ObjectSchema<AddFriendFormData> => {
  const requiredMessage = t("auth.validation.required");
  const emailInvalidMessage = t("auth.validation.email_invalid");
  const phoneInvalidMessage = t("auth.validation.phone_invalid");

  return yup
    .object({
      method: yup
        .mixed<"email" | "phone">()
        .oneOf(["email", "phone"])
        .required(requiredMessage),
      email: yup
        .string()
        .default("")
        .max(254, t("auth.validation.email_max_length"))
        .when("method", {
          is: "email",
          then: (schema) =>
            schema
              .required(requiredMessage)
              .matches(emailRegexLogin, emailInvalidMessage),
          otherwise: (schema) => schema.default("").notRequired(),
        }),
      country_code: yup
        .string()
        .default("US")
        .when("method", {
          is: "phone",
          then: (schema) => schema.required(requiredMessage),
          otherwise: (schema) => schema.default("US").notRequired(),
        }),
      calling_code: yup
        .string()
        .default("1")
        .when("method", {
          is: "phone",
          then: (schema) => schema.required(requiredMessage),
          otherwise: (schema) => schema.default("1").notRequired(),
        }),
      phone: yup
        .string()
        .default("")
        .when("method", {
          is: "phone",
          then: (schema) =>
            schema
              .required(requiredMessage)
              .matches(phoneRegex, phoneInvalidMessage),
          otherwise: (schema) => schema.default("").notRequired(),
        }),
    })
    .required();
};