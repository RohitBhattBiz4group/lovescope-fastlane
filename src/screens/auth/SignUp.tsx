import { yupResolver } from "@hookform/resolvers/yup";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Keyboard
} from "react-native";
import { CountryCode } from "react-native-country-picker-modal";

import Images from "../../config/Images";
import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";
import Radio from "../../components/common/Radio";
import TextInput from "../../components/common/TextInput";
import PhoneInput from "../../components/common/PhoneInput";
import routes from "../../constants/routes";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import { getSignupValidationSchema } from "../../validation/auth";
import { styles } from "./Style";
import { Matrics } from "../../config/appStyling";
import authService from "../../services/authService";
import {
  toastMessageError,
  toastMessageSuccess
} from "../../components/common/ToastMessage";
import { useTranslation } from "../../hooks/useTranslation";
import { signInWithGoogle } from "../../services/googleSignIn";
import useAuth from "../../hooks/useAuth";
import {
  withNetworkCheck,
  handleNetworkError
} from "../../utils/networkErrorHandler";
import { signInWithApple } from "../../services/appleSignIn";
import {
  customError,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  NAME_MAX_LENGTH,
  VERIFICATION_TYPE,
} from "../../constants/commonConstant";
import { handleLinkPress } from "../../utils/helper";

interface SignUpFormData {
  name: string;
  email: string;
  country_code: string;
  calling_code: string;
  phone: string;
  verification_via: "email" | "phone_number";
  password: string;
  confirmPassword: string;
}

const SignUp: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { setAuthData } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneFieldTouched, setPhoneFieldTouched] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [smsConsentChecked, setSmsConsentChecked] = useState(false);

  // Initialize form with default country
  const defaultCountry = "US";

  const {
    handleSubmit,
    control,
    formState: { isValid, errors },
    watch,
    trigger,
    setValue
  } = useForm<SignUpFormData>({
    resolver: yupResolver(getSignupValidationSchema(defaultCountry)),
    mode: "onChange", // Validate in real-time as user types
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      name: "",
      email: "",
      country_code: defaultCountry,
      calling_code: "1",
      phone: "",
      verification_via: "email",
      password: "",
      confirmPassword: ""
    }
  });

  // Watch form values
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");
  const countryCode = watch("country_code") as CountryCode;
  const callingCode = watch("calling_code");
  const verificationVia = watch("verification_via");

  // Trigger confirmPassword validation when password changes
  // Only trigger if confirmPassword has a value to prevent showing "required" error by default
  useEffect(() => {
    // Only validate if confirmPassword field has been filled in (has a value)
    // This prevents showing "required" error when the field is empty
    if (confirmPassword && confirmPassword.length > 0) {
      trigger("confirmPassword");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  // Update validation schema when country changes
  useEffect(() => {
    // Re-validate phone field when country changes
    trigger("phone");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  const handleSignUp = async (data: SignUpFormData) => {
    if (!smsConsentChecked) {
      toastMessageError(
        t("auth.signup.signup_failed"),
        t("auth.signup.sms_consent_required")
      );
      return;
    }

    // Dismiss keyboard when form is submitted
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Use network check wrapper for API call
      const res = await withNetworkCheck(
        () =>
          authService.signUp({
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            country_code: data.calling_code,
            country_name: data.country_code,
            verification_via: data.verification_via
          }),
        t,
        "SignUp",
        t("auth.signup.signup_failed")
      );

      if (res?.success) {
        // Check if this is a resend scenario for an existing unverified user
        const isResend = Boolean(res.data?.is_resend);

        // Customize toast message based on whether it's a new account or resending OTP
        toastMessageSuccess(
          t("auth.signup.verification_code_sent"),
          isResend
            ? t("auth.signup.verification_code_resent")
            : t("auth.signup.verify_email_message")
        );
        // Navigate to verification screen
        navigation.navigate(routes.auth.VERIFICATION, {
          email: data.email,
          type: VERIFICATION_TYPE.SIGNUP,
          phoneNumber: data.phone,
          verificationVia: data.verification_via
        });
      } else {
        // Handle signup failure, show backend error if available
        const errorMsg = res?.message || t("auth.signup.signup_failed_message");
        toastMessageError(t("auth.signup.signup_failed"), errorMsg);
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(error, t, "SignUp", t("auth.signup.signup_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (retryCount = 0) => {
    setLoading(true);
    try {
      // Get Google ID token
      const idToken = await signInWithGoogle();

      if (!idToken) {
        setLoading(false);
        return;
      }

      // Call backend Google sign-up endpoint with network check
      const res = await withNetworkCheck(
        () => authService.googleSignUp({ id_token: idToken }),
        t,
        "SignUp",
        t("auth.signup.signup_failed")
      );

      if (res?.success && res.data) {
        // setAuthData handles storage automatically
        setAuthData(res.data);

        toastMessageSuccess(t("auth.signup.google_signup_success"));
        // Navigate to home or appropriate screen
        // navigation.navigate(routes.user.HOME);
      } else {
        console.error("Google Sign-Up: Backend response failed");
        console.error("Error Message:", res?.message);

        // Check if account is linked to email/password
        const isEmailLinked =
          res?.status_code === 400 &&
          res?.message &&
          res.message.toLowerCase().includes("already linked to an email");

        if (isEmailLinked) {
          toastMessageError(
            t("auth.signup.signup_failed"),
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
          await new Promise<void>((resolve) =>
            setTimeout(() => resolve(), 1000)
          );
          setLoading(false);
          return handleGoogleSignUp(1); // Retry once
        }

        toastMessageError(
          t("auth.signup.signup_failed"),
          res?.message || t("auth.signup.google_signup_failed")
        );
      }
    } catch (error) {
      // Use common network error handler
      handleNetworkError(error, t, "SignUp", t("auth.signup.signup_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    try {
      setAppleLoading(true);
      const result = await signInWithApple();
      if (result.success && result.identityToken) {
        const res = await authService.appleSignIn({
          id_token: result.identityToken
        });
        if (res.success && res.data) {
          setAuthData(res.data);
          toastMessageSuccess(t("auth.signup.apple_signup_success"));
        } else {
          toastMessageError(t("auth.signup.apple_signup_failed"));
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

  const handleLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: routes.auth.LOGIN }],
    });
  };


  // Allowed countries for phone number selection
  const allowedCountries: CountryCode[] = ["US", "GB", "CA", "NZ", "AU", "IE", "IN"];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
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

          <View style={[styles.auth_header, { marginBottom: 29 }]}>
            <Image
              source={Images.LOGO}
              style={[styles.logo, { marginBottom: 20 }]}
              resizeMode="contain"
            />
            <Text style={[styles.title, { marginBottom: 20 }]}>
              {t("auth.signup.create_your_account")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.signup.create_account_subtitle")}
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View style={[styles.socialButtonsContainer, { marginBottom: 0 }]}>
            <View style={styles.socialButton}>
              <Button
                title={t("auth.social.google")}
                onPress={handleGoogleSignUp}
                disabled={loading || appleLoading}
                leftIcon={
                  <Image
                    source={Images.GOOGLE_ICON}
                    style={{
                      width: 25,
                      height: 25,
                      resizeMode: "contain"
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
                  onPress={handleAppleSignUp}
                  disabled={loading || appleLoading}
                  leftIcon={
                    <Image
                      source={Images.APPLE_ICON}
                      style={{
                        width: 25,
                        height: 25,
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

          {/* Divider */}
          <View style={{ alignItems: "center", marginVertical: Matrics.vs(5) }}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {t("auth.signup.or_sign_up_with")}
              </Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Full Name Input */}
          <TextInput
            label={t("auth.signup.full_name")}
            placeholder={t("auth.signup.enter_full_name")}
            autoCapitalize="words"
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            name="name"
            control={control}
            maxLength={NAME_MAX_LENGTH}
          />

          {/* Email Input */}
          <TextInput
            label={t("auth.signup.email")}
            placeholder={t("auth.signup.enter_email")}
            autoCapitalize="none"
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            name="email"
            control={control}
            maxLength={EMAIL_MAX_LENGTH}
          />

          <PhoneInput
            label={t("auth.signup.mobile_number")}
            placeholder={t("auth.signup.enter_phone_number")}
            value={watch("phone") || ""}
            countryCode={countryCode}
            callingCode={callingCode}
            onPhoneChange={(phone) => setValue("phone", phone, { shouldValidate: true })}
            onCountryChange={(countryCode, callingCode) => {
              setValue("country_code", countryCode as CountryCode, { shouldValidate: true });
              setValue("calling_code", callingCode, { shouldValidate: true });
            }}
            error={errors.phone?.message}
            touched={phoneFieldTouched}
            onBlur={() => {
              setPhoneFieldTouched(true);
              trigger("phone");
            }}
            allowedCountries={allowedCountries}
          />

          <View style={{ marginBottom: Matrics.vs(15) }}>
            <Text style={commonStyles.inputLabel}>
              {t("auth.verification.verification_code")}
            </Text>
            <Radio
              options={[
                { label: t("auth.signup.email"), value: "email" },
                { label: t("auth.signup.mobile_number"), value: "phone_number" },
              ]}
              selectedValue={verificationVia}
              onValueChange={(value) =>
                setValue("verification_via", value as SignUpFormData["verification_via"], {
                  shouldValidate: true,
                })
              }
            />
          </View>

          {/* Password Input */}
          <TextInput
            name="password"
            label={t("auth.signup.password")}
            placeholder={t("auth.signup.enter_password")}
            control={control}
            secureTextEntry={!showPassword}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
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

          {/* Confirm Password Input */}
          <TextInput
            name="confirmPassword"
            label={t("auth.signup.confirm_password")}
            placeholder={t("auth.signup.enter_password_again")}
            control={control}
            secureTextEntry={!showConfirmPassword}
            placeholderTextColor="rgba(47, 46, 44, 0.6)"
            maxLength={PASSWORD_MAX_LENGTH}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSmsConsentChecked((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginTop: 8,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderWidth: 1,
                borderColor: "#2F2E2C",
                borderRadius: 3,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 2,
                marginRight: 8,
                backgroundColor: smsConsentChecked ? "#2F2E2C" : "transparent",
              }}
            >
              {smsConsentChecked ? (
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
                  ✓
                </Text>
              ) : null}
            </View>
            <Text
              style={{
                flex: 1,
                color: "#2F2E2C",
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              {t("auth.signup.sms_consent_message")}{" "}
              {t("auth.signup.terms_agreement")}{" "}
              <Text
                style={styles.termsLink}
                onPress={() => handleLinkPress("https://www.lovescope.app/terms-and-conditions")}>
                {t("auth.signup.terms_of_service")}
              </Text>{" "}
              {t("auth.signup.and")}{" "}
              <Text
                style={styles.termsLink}
                onPress={() => handleLinkPress("https://www.lovescope.app/privacy-policy")}>
                {t("auth.signup.privacy_policy")}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <Button
            loading={loading}
            disabled={loading || !isValid || appleLoading || !smsConsentChecked}
            title={t("auth.signup.sign_up")}
            onPress={handleSubmit(handleSignUp)}
            containerStyle={[commonStyles.buttonPrimary, { marginTop: 15 }]}
          />

          {/* Login Link */}
          <View
            style={[styles.signupContainer, { marginTop: 30, marginBottom: 0 }]}
          >
            <Text style={styles.signupText}>
              {t("auth.signup.already_have_account")}{" "}
            </Text>
            <Button
              onPress={handleLogin}
              disabled={loading || appleLoading}
              title={t("auth.signup.sign_in")}
              containerStyle={commonStyles.clearButton}
              textStyle={commonStyles.clearButtonText}
            />
          </View>

          {/* Terms of Use */}
          {/* <Text style={styles.termsText}>
            {t("auth.signup.terms_agreement")}{" "}
            <Text style={styles.termsLink}>
              {t("auth.signup.terms_of_service")}
            </Text>{" "}
            {t("auth.signup.and")}{" "}
            <Text style={styles.termsLink}>
              {t("auth.signup.privacy_policy")}
            </Text>
          </Text> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default SignUp;
