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

import Images from "../../config/Images";
import colors from "../../config/appStyling/colors";
import typography from "../../config/appStyling/typography";

import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";
import OTPInput from "../../components/common/OTPInput";
import { AuthNavigationProp, AuthStackParamList } from "../../interfaces/navigationTypes";
import { RouteProp } from "@react-navigation/native";
import { styles } from "./Style";
import authService from "../../services/authService";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import { useTranslation } from "../../hooks/useTranslation";
import { getOtpValidationSchema } from "../../validation/auth";
import useAuth from "../../hooks/useAuth";
import {
  withNetworkCheck,
  handleNetworkError,
} from "../../utils/networkErrorHandler";
import {
  OTP_LENGTH,
  OTP_TIMER_SECONDS,
  VERIFICATION_TYPE,
  VERIFICATION_VIA,
} from "../../constants/commonConstant";
import { handleLinkPress } from "../../utils/helper";

interface AccountVerificationFormData {
  otp: string;
}

interface Props {
  navigation: AuthNavigationProp;
  route: RouteProp<AuthStackParamList, "Verification">;
}

const AccountVerification: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(OTP_TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);

  const email = route?.params?.email || "";
  const verificationType =
    route?.params?.type || VERIFICATION_TYPE.SIGNUP;

  const phoneNumber = route?.params?.phoneNumber || "";
  const verificationVia = route?.params?.verificationVia || "";

  const {
    handleSubmit,
    control,
    formState: { isValid, errors },
  } = useForm<AccountVerificationFormData>({
    resolver: yupResolver(getOtpValidationSchema()),
    mode: "onChange", // Real-time validation as user types
    defaultValues: {
      otp: "",
    },
  });

  // Timer for OTP resend
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // Disable back navigation on OTP verification screen
  useEffect(() => {
    // Handle Android hardware back button - prevent going back
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true; // Prevent default back behavior
      }
    );

    // Disable iOS swipe-back gesture
    navigation.setOptions({
      gestureEnabled: false,
    });

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const formatTime = (time: number) => {
    // Display remaining time: when time is 60, show 00:59 (59 seconds remaining)
    const displayTime = time > 0 ? time - 1 : 0;
    const minutes = Math.floor(displayTime / 60);
    const seconds = displayTime % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleResendOTP = async () => {
    try {
      setSeconds(OTP_TIMER_SECONDS);
      setTimerActive(true);
      setResendLoading(true);

      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () =>
          authService.resendOtp({
            email,
            type: verificationType,
            phoneNumber,
            verificationVia,
          }),
        t,
        "AccountVerification",
        t("auth.verification.failed_to_resend")
      );

      if (res?.success) {
        toastMessageSuccess(
          t("auth.verification.verification_code_resent"),
          t("auth.verification.verification_code_resent_message")
        );
      } else {
        toastMessageError(
          t("auth.verification.failed_to_resend"),
          res?.message || t("auth.verification.failed_to_resend_message")
        );
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(
        error,
        t,
        "AccountVerification",
        t("auth.verification.failed_to_resend")
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (data: AccountVerificationFormData) => {
    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Validate OTP length before proceeding (must be exactly 4 digits)
      if (data.otp.length !== OTP_LENGTH) {
        toastMessageError(
          t("auth.verification.invalid_code"),
          t("auth.verification.invalid_code_message")
        );
        setLoading(false);
        return;
      }

      // Validate OTP is numeric only
      if (!/^[0-9]{4}$/.test(data.otp)) {
        toastMessageError(
          t("auth.verification.invalid_code"),
          t("auth.verification.invalid_code_message")
        );
        setLoading(false);
        return;
      }

      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () =>
          authService.verifyOtp({
            email,
            otp: data.otp,
            type: verificationType,
            phoneNumber,
            verificationVia,
          }),
        t,
        "AccountVerification",
        t("auth.verification.verification_failed")
      );

      if (res?.success) {
        // Successful OTP verification
        toastMessageSuccess(
          t("auth.verification.verification_successful"),
          verificationType === VERIFICATION_TYPE.SIGNUP
            ? t("auth.verification.account_verified")
            : t("auth.verification.email_verified")
        );

        if (verificationType === VERIFICATION_TYPE.FORGOT_PASSWORD) {
          const resetToken = res.data?.access_token || res.data?.token;
          if (resetToken) {
            navigation.navigate("ResetPassword", {
              token: resetToken,
            });
          } else {
            toastMessageError(
              t("common.error"),
              t("auth.verification.token_missing")
            );
          }
        } else {
          // Handle account verification success - log the user in
          if (res.data && "access_token" in res.data) {
            // For signup verification, setAuthData handles storage automatically
            setAuthData(res.data);
            // Show success message
            toastMessageSuccess(
              t("auth.verification.account_created_successfully")
            );
            // Navigate to home or appropriate screen
            // navigation.navigate(routes.user.HOME);
          } else {
            toastMessageError(
              t("auth.verification.login_error"),
              t("auth.verification.login_error_message")
            );
            // Navigate to Login screen
            navigation.navigate("Login");
          }
        }
      } else {
        // Failed OTP verification
        toastMessageError(
          t("auth.verification.verification_failed"),
          res?.message || t("auth.verification.verification_failed_message")
        );
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(
        error,
        t,
        "AccountVerification",
        t("auth.verification.verification_failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={Images.AUTH_BG}
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        // behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <Text style={styles.title}>
                {t("auth.verification.title") || "Account Verification"}
              </Text>
              <Text style={styles.subtitle}>
                {t("auth.verification.subtitle") ||
                  "Enter the verification code we've sent you to"}{" "}
              </Text>
              <Text style={styles.emailText}>{verificationVia === VERIFICATION_VIA.EMAIL ? email : phoneNumber}</Text>
            </View>

            {/* OTP Input */}
            <OTPInput
              name="otp"
              control={control}
              length={4}
              label={
                t("auth.verification.verification_code") || "Verification Code"
              }
              error={errors.otp?.message}
            />

            {/* Verify Button */}
            <Button
              loading={loading}
              disabled={loading || !isValid || resendLoading}
              title={t("auth.verification.verify") || "Verify"}
              onPress={handleSubmit(handleVerifyOTP)}
              containerStyle={[commonStyles.buttonPrimary, { marginTop: 15 }]}
            />

            {/* Resend OTP */}
            <View style={[styles.signupContainer, { marginTop: 20 }]}>
              <Text style={styles.signupText}>
                {t("auth.verification.didnt_receive_code") ||
                  "Didn't receive code?"}{" "}
                <Text
                  style={{
                    color: colors.PRIMARY,
                    fontFamily: typography.fontFamily.Satoshi.SemiBold,
                  }}
                >
                  {timerActive
                    ? t("auth.verification.resend_in", {
                        time: formatTime(seconds),
                      })
                    : ""}
                </Text>
              </Text>
              {!timerActive && (
                <TouchableOpacity onPress={handleResendOTP}>
                  <Text
                    style={[
                      styles.signupText,
                      {
                        color: colors.PRIMARY,
                        fontFamily: typography.fontFamily.Satoshi.SemiBold,
                      },
                    ]}
                  >
                    {t("auth.verification.resend_code") || "Resend Code"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Back to Login */}
            {/* <View style={[styles.signupContainer, { marginBottom: 0 }]}>
              <TouchableOpacity onPress={handleBackPress}>
                <Text
                  style={[
                    styles.signupText,
                    { color: commonStyles.buttonPrimary.backgroundColor },
                  ]}
                >
                  {t("auth.verification.back_to_login") || "Back to Login"}
                </Text>
              </TouchableOpacity>
            </View> */}
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

export default AccountVerification;
