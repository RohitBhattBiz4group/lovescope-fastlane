import { yupResolver } from "@hookform/resolvers/yup";
import React, { useState } from "react";
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
  Keyboard
} from "react-native";
import Images from "../../config/Images";
import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";
import TextInput from "../../components/common/TextInput";
import routes from "../../constants/routes";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import { getLoginValidationSchema } from "../../validation/auth";
import { styles } from "./Style";
import { Matrics } from "../../config/appStyling";
import authService from "../../services/authService";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import { useTranslation } from "../../hooks/useTranslation";
import { signInWithGoogle } from "../../services/googleSignIn";
import {
  withNetworkCheck,
  handleNetworkError,
  detectNetworkError
} from "../../utils/networkErrorHandler";
import { signInWithApple } from "../../services/appleSignIn";
import {
  customError,
  PASSWORD_MAX_LENGTH,
  VERIFICATION_TYPE,
  VERIFICATION_VIA
} from "../../constants/commonConstant";
import { handleLinkPress, isEmailValue } from "../../utils/helper";

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { setAuthData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isValid },
    getValues,
  } = useForm<LoginFormData>({
    resolver: yupResolver(getLoginValidationSchema()),
    mode: "onChange", // Validate in real-time as user types
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    // Dismiss keyboard when form is submitted
    const isEmail = isEmailValue(data.email);
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () => authService.signIn({
          email: data.email,
          password: data.password,
        }),
        t,
        "Login",
        t("auth.login.login_failed")
      );

      // Backend returns HTTP 200 with ResponseModal in body
      // For invalid credentials: { success: false, message: "Invalid email or password", status_code: 401, data: null }
      // For success: { success: true, message: "...", status_code: 200, data: {...} }
      if (res?.success && res.data) {
        // setAuthData handles storage automatically
        setAuthData(res.data);
        // navigation.navigate(routes.onboarding.QUESTION_ANSWER);
        toastMessageSuccess(t("auth.login.login_success"));
        // Navigate to home or appropriate screen
        // navigation.navigate(routes.user.HOME);
      } else {
        // Check if account is linked to Google
        const isGoogleLinked =
          res?.status_code === 400 &&
          res?.message &&
          res.message.toLowerCase().includes("linked with google");

        if (isGoogleLinked) {
          toastMessageError(
            t("auth.login.login_failed"),
            res.message || t("auth.messages.linked_with_google")
          );
          return;
        }

        // Check if email is not verified
        const isEmailNotVerified =
          res?.status_code === 403 ||
          (res?.message &&
            res.message.toLowerCase().includes("email not verified") ||
            res.message.toLowerCase().includes("phone number not verified"));

        if (isEmailNotVerified) {
          // Resend verification code and redirect to verification page
          try {
            const resendRes = await authService.resendOtp({
              email: data.email,
              type: VERIFICATION_TYPE.SIGNUP,
              verificationVia: isEmail ? VERIFICATION_VIA.EMAIL : VERIFICATION_VIA.PHONE_NUMBER,
            });

            if (resendRes?.success) {
              toastMessageSuccess(
                t("auth.verification.verification_code_resent"),
                t("auth.verification.verification_code_resent_message")
              );
              // Navigate to verification page with email and type
              navigation.navigate(routes.auth.VERIFICATION, {
                email: data.email,
                type: VERIFICATION_TYPE.SIGNUP,
                phoneNumber: data.email,
                verificationVia: isEmail ? VERIFICATION_VIA.EMAIL : VERIFICATION_VIA.PHONE_NUMBER,
              });
            } else {
              // If resend fails, still navigate to verification page
              toastMessageError(
                t("auth.verification.failed_to_resend"),
                resendRes?.message || t("auth.verification.failed_to_resend_message")
              );
              navigation.navigate(routes.auth.VERIFICATION, {
                email: data.email,
                type: VERIFICATION_TYPE.SIGNUP,
                verificationVia: isEmail ? VERIFICATION_VIA.EMAIL : VERIFICATION_VIA.PHONE_NUMBER,
              });
            }
          } catch (resendError) {
            // Handle network errors with common handler
            handleNetworkError(resendError, t, "Login", t("auth.verification.failed_to_resend"));
            // If resend fails, still navigate to verification page
            navigation.navigate(routes.auth.VERIFICATION, {
              email: data.email,
              type: VERIFICATION_TYPE.SIGNUP,
            });
          }
        } else {
          // Match Ensemble app error display pattern: toastMessageError(title, message)
          // Backend returns exact message: "Invalid email or password" in res.message
          // Display it exactly as returned (no translation)
          const errorMessage =
            res?.message || t("auth.login.check_credentials");
          toastMessageError(t("auth.login.login_failed"), errorMessage);
        }
      }
    } catch (error) {
      // Extract error message from backend response (matching Ensemble pattern)
      let errorMessage = t("auth.login.unexpected_error");
      let statusCode: number | undefined;
      let isEmailNotVerified = false;

      // Handle different error structures from FastAPI/backend
      if (error && typeof error === "object") {
        // Check for ResponseModal structure: { message: "...", success: false, status_code: 400 }
        if ("message" in error) {
          const errorData = error as {
            message: string;
            status_code?: number;
            success?: boolean;
          };
          errorMessage = errorData.message || errorMessage;
          statusCode = errorData.status_code;
        }
        // Check for FastAPI validation error structure: { detail: "..." } or { detail: [...] }
        else if ("detail" in error) {
          const errorData = error as {
            detail: string | Array<{ msg: string; loc: string[] }>;
          };
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (
            Array.isArray(errorData.detail) &&
            errorData.detail.length > 0
          ) {
            // Handle validation error array
            const firstError = errorData.detail[0];
            errorMessage = firstError.msg || JSON.stringify(firstError);
          }
        }
        // Check for error object with nested message
        else if (
          "error" in error &&
          typeof (error as any).error === "object" &&
          "message" in (error as any).error
        ) {
          errorMessage = (error as any).error.message;
          statusCode = (error as any).error.status_code;
        }
        // Check for status_code in error object
        if ("status_code" in error) {
          statusCode = (error as any).status_code;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check if email is not verified
      isEmailNotVerified =
        statusCode === 403 ||
        errorMessage.toLowerCase().includes("email not verified");

      if (isEmailNotVerified) {
        // Resend verification code and redirect to verification page
        try {
          const formData = getValues();
          const userEmail = formData.email;

          if (userEmail) {
            const resendRes = await withNetworkCheck(
              () => authService.resendOtp({
                email: userEmail,
                type: VERIFICATION_TYPE.SIGNUP,
                verificationVia: isEmail ? VERIFICATION_VIA.EMAIL : VERIFICATION_VIA.PHONE_NUMBER,
              }),
              t,
              "Login",
              t("auth.verification.failed_to_resend")
            );

            if (resendRes?.success) {
              toastMessageSuccess(
                t("auth.verification.verification_code_resent"),
                t("auth.verification.verification_code_resent_message")
              );
              // Navigate to verification page with email and type
              navigation.navigate(routes.auth.VERIFICATION, {
                email: userEmail,
                type: VERIFICATION_TYPE.SIGNUP,
              });
            } else {
              // If resend fails, still navigate to verification page
              toastMessageError(
                t("auth.verification.failed_to_resend"),
                resendRes?.message || t("auth.verification.failed_to_resend_message")
              );
              navigation.navigate(routes.auth.VERIFICATION, {
                email: userEmail,
                type: VERIFICATION_TYPE.SIGNUP,
              });
            }
          }
        } catch (resendError) {
          // Handle network errors with common handler
          handleNetworkError(resendError, t, "Login", t("auth.verification.failed_to_resend"));
          const formData = getValues();
          const userEmail = formData.email;
          if (userEmail) {
            navigation.navigate(routes.auth.VERIFICATION, {
              email: userEmail,
              type: VERIFICATION_TYPE.SIGNUP,
            });
          }
        }
      } else {
        // Use common network error handler for network errors, otherwise show specific error
        const networkError = detectNetworkError(error);
        if (networkError.isNetworkError) {
          handleNetworkError(error, t, "Login", t("auth.login.login_failed"));
        } else {
          toastMessageError(
            t("auth.login.login_failed"),
            errorMessage
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Get Google ID token
      const idToken = await signInWithGoogle();

      if (!idToken) {
        setLoading(false);
        return;
      }

      // Call backend Google sign-in endpoint with network check
      const res = await withNetworkCheck(
        () => authService.googleSignIn({ id_token: idToken }),
        t,
        "Login",
        t("auth.login.login_failed")
      );

      if (res?.success && res.data) {
        // setAuthData handles storage automatically
        setAuthData(res.data);

        toastMessageSuccess(t("auth.login.google_login_success"));
        // Navigate to home or appropriate screen
        // navigation.navigate(routes.user.HOME);
      } else {
        console.error("Google Login: Backend response failed");
        console.error("Error Message:", res?.message);

        // Check if account is linked to email/password
        const isEmailLinked =
          res?.status_code === 400 &&
          res?.message &&
          res.message.toLowerCase().includes("already linked to an email");

        if (isEmailLinked) {
          toastMessageError(
            t("auth.login.login_failed"),
            res.message || t("auth.messages.linked_with_email_password")
          );
          return;
        }

        // Check if it's a clock skew or token error that might be resolved with a retry
        const errorMessage = res?.message || "";
        const isRetryableError =
          errorMessage.toLowerCase().includes("clock") ||
          errorMessage.toLowerCase().includes("synchronization") ||
          errorMessage.toLowerCase().includes("token") ||
          errorMessage.toLowerCase().includes("authentication failed");

        // Retry once if it's a retryable error and we haven't retried yet
        if (isRetryableError && retryCount === 0) {
          // Wait a moment before retrying to allow for time sync
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
          setLoading(false);
          return handleGoogleLogin(1); // Retry once
        }

        toastMessageError(t("auth.login.login_failed"),
          res?.message || t("auth.login.google_login_failed"));
      }
    } catch (error) {
      console.error("Google Login: Error", error);
      // Use common network error handler
      handleNetworkError(error, t, "Login", t("auth.login.login_failed"));
    } finally {
      setLoading(false);
    }
  };

   const handleAppleLogin = async () => {
      try {
        setAppleLoading(true);
        const result = await signInWithApple();
        if (result.success && result.identityToken) {
          const res = await authService.appleSignIn({
            id_token: result.identityToken
          });
          if (res.success && res.data) {
            setAuthData(res.data);
            toastMessageSuccess(t("auth.signup.apple_login_success"));
          } else {
            toastMessageError(t("auth.signup.apple_login_failed"));
          }
        } else if (!result.success) {
          // Only show error if it's not a cancellation
          if (result.error !== "Apple Sign-In was cancelled") {
            toastMessageError(
              t(result.error || customError.something_went_wrong)
            );
          }
        } else {
          toastMessageError(t(customError.something_went_wrong));
        }
      } catch (error) {
        console.error("Apple sign up error:", error);
        toastMessageError(t(customError.something_went_wrong));
      } finally {
        setAppleLoading(false);
      }
    };

  const handleForgotPassword = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: routes.auth.FORGOT_PASSWORD }],
    });
  };

  const handleSignUp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: routes.auth.SIGNUP }],
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.auth_header}>
            <Image
              source={Images.LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t("auth.login.sign_in_title")}</Text>
            <Text style={styles.subtitle}>{t("auth.login.subtitle")}</Text>
          </View>

          {/* Email Input */}
          <TextInput
            label={t("auth.login.email_address")}
            placeholder={t("auth.login.enter_your_email")}
            autoCapitalize="none"
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            name="email"
            control={control}
            keyboardType="email-address"
            maxLength={254}
          />

          {/* Password Input */}
          <TextInput
            label={t("auth.login.password")}
            placeholder={t("auth.login.enter_your_password")}
            secureTextEntry={!showPassword}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            name="password"
            control={control}
            maxLength={PASSWORD_MAX_LENGTH}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <Image
                    source={Images.EYE_OPEN}
                    style={{ width: 25, height: 25 }}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={Images.EYE_CLOSE}
                    style={{ width: 25, height: 25 }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            }
          />

          {/* Forgot Password */}
          <View style={styles.checkboxRow}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>
                {t("auth.login.forgot_password")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <Button
            loading={loading}
            disabled={loading || !isValid || appleLoading}
            title={t("auth.login.sign_in_title")}
            onPress={handleSubmit(handleLogin)}
            containerStyle={commonStyles.buttonPrimary}
          />

          {/* Divider */}
          <View
            style={{ alignItems: "center", marginVertical: Matrics.vs(20) }}
          >
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {t("auth.login.or_sign_in_with")}
              </Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtonsContainer}>
            <View style={styles.socialButton}>
              <Button
                title={t("auth.social.google")}
                onPress={handleGoogleLogin}
                disabled={loading || appleLoading}
                leftIcon={
                  <Image
                    source={Images.GOOGLE_ICON}
                    style={{
                      width: 20,
                      height: 20,
                      resizeMode: "contain",
                    }}
                  />
                }
                containerStyle={commonStyles.buttonPrimaryFade}
                textStyle={commonStyles.buttonFadeText}
              />
            </View>

            {Platform.OS === "ios" && (
              <View style={styles.socialButton}>
                <Button
                  title={t("auth.social.apple")}
                  onPress={handleAppleLogin}
                  disabled={loading || appleLoading}
                  leftIcon={
                    <Image
                      source={Images.APPLE_ICON}
                      style={{
                        width: 20,
                        height: 20,
                        resizeMode: "contain",
                      }}
                    />
                  }
                  containerStyle={commonStyles.buttonPrimaryFade}
                  textStyle={commonStyles.buttonFadeText}
                />
              </View>
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>
              {t("auth.login.dont_have_account")}{" "}
            </Text>
            <Button
              onPress={handleSignUp}
              title={t("auth.login.sign_up")}
              containerStyle={commonStyles.clearButton}
              textStyle={commonStyles.clearButtonText}
            />
          </View>

          {/* Terms of Use */}
          <Text style={styles.termsText}>
            {t("auth.signup.terms_agreement")}{" "}
            <TouchableOpacity onPress={()=>{handleLinkPress('https://www.lovescope.app/terms-and-conditions')}}>
              <Text style={styles.termsLink}>
                {t("auth.signup.terms_of_service")}
              </Text>
            </TouchableOpacity>
            {" "}
            {t("auth.reset_password.and")}{" "}
            <TouchableOpacity onPress={()=>{handleLinkPress('https://www.lovescope.app/privacy-policy')}}>
              <Text style={styles.termsLink}>
                {t("auth.signup.privacy_policy")}
              </Text>
            </TouchableOpacity>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default Login;
