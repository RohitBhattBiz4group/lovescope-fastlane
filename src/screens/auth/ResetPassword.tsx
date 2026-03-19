import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  BackHandler,
} from "react-native";

import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";
import TextInput from "../../components/common/TextInput";
import routes from "../../constants/routes";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import { AuthStackParamList } from "../../interfaces/navigationTypes";
import { styles } from "./Style";
import authService from "../../services/authService";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import { useTranslation } from "../../hooks/useTranslation";
import { getResetPasswordValidationSchema } from "../../validation/auth";
import Images from "../../config/Images";
import {
  withNetworkCheck,
  handleNetworkError,
} from "../../utils/networkErrorHandler";
import { PASSWORD_MAX_LENGTH } from "../../constants/commonConstant";
import { handleLinkPress } from "../../utils/helper";

interface ResetPasswordFormData {
  new_password: string;
  confirm_password: string;
}

interface ResetPasswordProps
  extends ScreenProps<AuthStackParamList, "ResetPassword"> {}

const ResetPassword: React.FC<ResetPasswordProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = route?.params?.token || "";

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
    trigger,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(getResetPasswordValidationSchema()),
    mode: "onChange", // Real-time validation as user types
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Watch new_password and confirm_password fields
  const newPassword = watch("new_password");
  const confirmPassword = watch("confirm_password");

  // Trigger confirm_password validation when new_password changes
  // Only trigger if confirm_password has a value to prevent showing "required" error by default
  useEffect(() => {
    // Only validate if confirm_password field has been filled in (has a value)
    // This prevents showing "required" error when the field is empty
    if (confirmPassword && confirmPassword.length > 0) {
      trigger("confirm_password");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword]);

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();

    if (!token) {
      toastMessageError(
        t("auth.reset_password.missing_token"),
        t("auth.reset_password.missing_token_message")
      );
      navigation.navigate(routes.auth.FORGOT_PASSWORD);
      return;
    }

    setLoading(true);
    try {
      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () =>
          authService.resetPassword({
            token,
            new_password: data.new_password,
            confirm_password: data.confirm_password,
          }),
        t,
        "ResetPassword",
        t("auth.reset_password.reset_failed") || t("common.error")
      );

      // Check if the error is about the same password
      if (
        !res?.success &&
        res?.message &&
        res.message.toLowerCase().includes("same")
      ) {
        toastMessageError(
          t("auth.reset_password.same_password"),
          t("auth.reset_password.same_password_message")
        );
        setLoading(false);
        return;
      }

      if (res?.success) {
        // Password reset was successful
        toastMessageSuccess(
          t("auth.reset_password.password_updated"),
          t("auth.reset_password.password_updated_message")
        );

        // Navigate to login page
        setTimeout(() => {
          navigation.navigate(routes.auth.LOGIN);
        }, 2000);
      } else {
        toastMessageError(
          t("auth.reset_password.token_expired"),
          t("auth.reset_password.token_expired_message")
        );
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(
        error,
        t,
        "ResetPassword",
        t("auth.reset_password.reset_failed") || t("common.error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation on both Android and iOS
  // Navigate to Login screen instead of going back through the stack
  useEffect(() => {
    // Handle Android hardware back button
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.reset({
          index: 0,
          routes: [{ name: routes.auth.LOGIN }],
        });
        return true; // Prevent default back behavior
      }
    );

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  // Handle iOS swipe-back gesture - use separate effect to avoid infinite loop
  useEffect(() => {
    // Set gestureEnabled to false to disable iOS swipe back gesture
    navigation.setOptions({
      gestureEnabled: false,
    });
  }, [navigation]);

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
              <Text style={styles.title}>{t("auth.reset_password.title")}</Text>
              <Text style={[styles.subtitle, { paddingHorizontal: 10 }]}>
                {t("auth.reset_password.subtitle")}
              </Text>
            </View>

            {/* New Password Input */}
            <View style={{ position: "relative" }}>
              <TextInput
                name="new_password"
                label={t("auth.reset_password.new_password")}
                placeholder={t("auth.reset_password.new_password_placeholder")}
                control={control}
                secureTextEntry={!showPassword}
                placeholderTextColor="rgba(47, 46, 44, 0.6)"
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <TouchableOpacity
                style={{ position: "absolute", right: 12, top: 46, zIndex: 1 }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Image
                  source={showPassword ? Images.EYE_OPEN : Images.EYE_CLOSE}
                  style={{ width: 25, height: 25 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={{ position: "relative" }}>
              <TextInput
                name="confirm_password"
                label={t("auth.reset_password.confirm_password")}
                placeholder={t("auth.reset_password.confirm_password_placeholder")}
                control={control}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="rgba(47, 46, 44, 0.6)"
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <TouchableOpacity
                style={{ position: "absolute", right: 12, top: 46, zIndex: 1 }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Image
                  source={
                    showConfirmPassword ? Images.EYE_OPEN : Images.EYE_CLOSE
                  }
                  style={{ width: 25, height: 25 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Reset Password Button */}
            <Button
              loading={loading}
              disabled={loading || !isValid}
              title={t("auth.reset_password.reset_password")}
              onPress={handleSubmit(handleResetPassword)}
              containerStyle={[commonStyles.buttonPrimary, { marginTop: 15 }]}
            />

            {/* Login Link */}
            <View
              style={[
                styles.signupContainer,
                { marginTop: 30, marginBottom: 0, gap: 3 },
              ]}
            >
              <Text style={styles.signupText}>
                {t("auth.reset_password.remember_password")}{" "}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(routes.auth.LOGIN)}
              >
                <Text
                  style={[
                    styles.signupText,
                    { color: commonStyles.buttonPrimary.backgroundColor },
                  ]}
                >
                  {t("auth.reset_password.sign_in")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms of Use - Fixed at Bottom */}
          <Text style={[styles.termsText, { margin: 0 }]}>
            {t("auth.reset_password.terms_agreement")}{" "}
            <Text 
              style={styles.termsLink} 
              onPress={() => handleLinkPress('https://www.lovescope.app/terms-and-conditions')}
            >
              {t("auth.reset_password.terms_of_service")}
            </Text>
            {" "}{t("auth.reset_password.and")}{" "}
            <Text 
              style={styles.termsLink} 
              onPress={() => handleLinkPress('https://www.lovescope.app/privacy-policy')}
            >
              {t("auth.reset_password.privacy_policy")}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ResetPassword;
