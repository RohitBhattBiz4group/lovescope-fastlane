import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, Keyboard, ImageBackground, Image, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import Images from "../../config/Images";

import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";
import TextInput from "../../components/common/TextInput";
import routes from "../../constants/routes";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import { forgotPasswordValidationSchema } from "../../validation/auth";
import { styles } from "./Style";
import authService from "../../services/authService";
import { toastMessageError, toastMessageSuccess } from "../../components/common/ToastMessage";
import { useTranslation } from "../../hooks/useTranslation";
import { withNetworkCheck, handleNetworkError } from "../../utils/networkErrorHandler";
import { EMAIL_MAX_LENGTH, VERIFICATION_TYPE, VERIFICATION_VIA } from "../../constants/commonConstant";
import { handleLinkPress } from "../../utils/helper";

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { handleSubmit, control, formState: { isValid }, reset } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordValidationSchema),
    mode: "onChange", // Real-time validation as user types
    defaultValues: {
      email: "",
    },
  });

  // Reset form when screen is focused (e.g., when navigating back from Reset Password)
  useFocusEffect(
    React.useCallback(() => {
      // Reset the form to clear the email field when the screen is focused
      reset({
        email: "",
      });
    }, [reset])
  );

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () => authService.forgotPassword({ email: data.email }),
        t,
        "ForgotPassword",
        t("auth.forgot_password.reset_failed")
      );

      if (res?.success) {
        // OTP sent successfully
        navigation.navigate(routes.auth.VERIFICATION, {
          email: data.email,
          type: VERIFICATION_TYPE.FORGOT_PASSWORD,
          verificationVia: VERIFICATION_VIA.EMAIL,
        });

        toastMessageSuccess(
          t("auth.forgot_password.reset_link_sent"),
          t("auth.forgot_password.verification_code_message")
        );
      } else {
        // Check if account is linked to Google
        const isGoogleLinked =
          res?.status_code === 400 &&
          res?.message &&
          res.message.toLowerCase().includes("linked with google");

        if (isGoogleLinked) {
          toastMessageError(
            t("auth.forgot_password.reset_failed") || "Reset Failed",
            res.message || "This account is linked with Google. Please sign in using Google."
          );
          return;
        }

        // Handle errors including non-existent email
        // Check if error is about email not found
        if (
          res?.status_code === 404 ||
          (res?.message &&
            res.message.toLowerCase().includes("email not found"))
        ) {
          toastMessageError(
            t("auth.forgot_password.email_not_found"),
            t("auth.forgot_password.email_not_found_message")
          );
          return;
        }

        // Handle other errors
        toastMessageError(
          t("auth.forgot_password.reset_failed"),
          res?.message || t("common.please_try_again") || t("auth.forgot_password.please_try_again")
        );
        // Do not navigate to OTP screen
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(error, t, "ForgotPassword", t("auth.forgot_password.reset_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: routes.auth.LOGIN }],
    });
  };

  return (
    <ImageBackground
      source={Images.AUTH_BG}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo at Top */}
          <View style={{ alignItems: "center", marginBottom: 0 }}>
            <Image
              source={Images.LOGO}
              style={[styles.logo, { marginBottom: 0 }]}
              resizeMode="contain"
            />
          </View>

          {/* Center Content */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            {/* Header */}
            <View style={[styles.auth_header, { marginTop: 0 }]}>
              <Text style={styles.title}>{t("auth.forgot_password.title")}</Text>
              <Text style={styles.subtitle}>
                {t("auth.forgot_password.subtitle")}
              </Text>
            </View>

            {/* Email Input */}
            <TextInput
              name="email"
              label={t("auth.forgot_password.email")}
              placeholder={t("auth.forgot_password.enter_email")}
              control={control}
              autoCapitalize="none"
              placeholderTextColor="rgba(47, 46, 44, 0.6)"
              maxLength={EMAIL_MAX_LENGTH}
            />

            {/* Reset Password Button */}
            <Button
              loading={loading}
              disabled={loading || !isValid}
              title={t("auth.forgot_password.send_reset_link")}
              onPress={handleSubmit(handleForgotPassword)}
              containerStyle={[commonStyles.buttonPrimary, { marginTop: 15 }]}
            />

            {/* Login Link */}
            <View
              style={[
                styles.signupContainer,
                { marginTop: 30, marginBottom: 0 },
              ]}
            >
              <Text style={styles.signupText}>
                {t("auth.forgot_password.remember_password")}{" "}
              </Text>
              <Button
                onPress={handleLogin}
                title={t("auth.forgot_password.sign_in")}
                containerStyle={commonStyles.clearButton}
                textStyle={commonStyles.clearButtonText}
              />
            </View>
          </View>

          {/* Terms of Use - Fixed at Bottom */}
          <Text style={[styles.termsText, { margin: 0 }]}>
            {t("auth.signup.terms_agreement")}{" "}
            <Text 
              style={styles.termsLink} 
              onPress={() => handleLinkPress('https://www.lovescope.app/terms-and-conditions')}
            >
              {t("auth.signup.terms_of_service")}
            </Text>
            {" "}{t("auth.reset_password.and")}{" "}
            <Text 
              style={styles.termsLink} 
              onPress={() => handleLinkPress('https://www.lovescope.app/privacy-policy')}
            >
              {t("auth.signup.privacy_policy")}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ForgotPassword;
