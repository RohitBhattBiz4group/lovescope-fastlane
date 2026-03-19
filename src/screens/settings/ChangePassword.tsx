import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import CustomTextInput from "../../components/common/TextInput";
import Button from "../../components/common/Button";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import Images from "../../config/Images";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getChangePasswordValidationSchema } from "../../validation/user_profile";
import { useTranslation } from "../../hooks/useTranslation";
import userProfileService from "../../services/userProfile";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import LinearGradient from "react-native-linear-gradient";

/**
 * Form data interface for the change password form.
 */
interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Screen Component.
 * Provides a form for users to change their account password.
 * Includes real-time validation and password visibility toggles.
 */
const ChangePassword: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  // Loading state for API call
  const [loading, setLoading] = useState(false);

  // Password visibility toggle states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { isValid },
    reset,
    watch,
    trigger,
  } = useForm<ChangePasswordForm>({
    resolver: yupResolver(getChangePasswordValidationSchema()),
    mode: "onChange", // Validate in real-time as user types
    reValidateMode: "onChange", // Re-validate on change
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Watch newPassword and confirmPassword fields
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  // Trigger confirmPassword validation when newPassword changes
  // Only trigger if confirmPassword has a value to prevent showing "required" error by default
  useEffect(() => {
    // Only validate if confirmPassword field has been filled in (has a value)
    // This prevents showing "required" error when the field is empty
    if (confirmPassword && confirmPassword.length > 0) {
      trigger("confirmPassword");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newPassword]);

  /**
   * Handles the password update submission.
   * Sends the password change request to the API and handles the response.
   * @param data - The validated form data containing old and new passwords.
   */
  const handleUpdatePassword = async (data: ChangePasswordForm) => {
    setLoading(true);
    try {
      const response = await userProfileService.changePassword({
        current_password: data.oldPassword,
        new_password: data.newPassword,
      });

      if (response?.success) {
        toastMessageSuccess(t("user_profile.change_password.password_changed"));

        // Navigate to Settings page after successful password change
        setTimeout(() => {
          reset();
          navigation.navigate("SettingsMain");
        }, 500);
      } else {
        toastMessageError(response?.message);
        setTimeout(() => {
          reset();
        }, 300);
      }
    } catch (error) {
      toastMessageError(t("user_profile.change_password.error"));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renders a password visibility toggle button.
   * @param isVisible - Whether the password is currently visible.
   * @param onToggle - Callback function to toggle visibility.
   * @returns A TouchableOpacity component with an eye icon.
   */
  const renderPasswordToggle = (isVisible: boolean, onToggle: () => void) => (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
      <Image
        source={isVisible ? Images.EYE_OPEN : Images.EYE_CLOSE}
        style={styles.eyeIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Fields */}
          <View style={styles.formContainer}>
            <CustomTextInput
              label={t("user_profile.change_password.old_password")}
              name="oldPassword"
              // required
              control={control}
              editable={!loading}
              placeholder={t(
                "user_profile.change_password.old_password_placeholder"
              )}
              secureTextEntry={!showOldPassword}
              rightIcon={renderPasswordToggle(showOldPassword, () =>
                setShowOldPassword(!showOldPassword)
              )}
            />

            <CustomTextInput
              label={t("user_profile.change_password.new_password")}
              name="newPassword"
              control={control}
              // required
              placeholder={t(
                "user_profile.change_password.new_password_placeholder"
              )}
              editable={!loading}
              secureTextEntry={!showNewPassword}
              rightIcon={renderPasswordToggle(showNewPassword, () =>
                setShowNewPassword(!showNewPassword)
              )}
            />

            <CustomTextInput
              label={t("user_profile.change_password.confirm_password")}
              name="confirmPassword"
              control={control}
              // required
              editable={!loading}
              placeholder={t(
                "user_profile.change_password.confirm_password_placeholder"
              )}
              secureTextEntry={!showConfirmPassword}
              rightIcon={renderPasswordToggle(showConfirmPassword, () =>
                setShowConfirmPassword(!showConfirmPassword)
              )}
            />
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <Button
            title={t("user_profile.change_password.update_password")}
            onPress={handleSubmit(handleUpdatePassword)}
            loading={loading}
            disabled={loading || !isValid}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

/** Stylesheet for the ChangePassword screen */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(20),
  },
  formContainer: {
    flex: 1,
  },
  eyeIcon: {
    width: Matrics.s(21),
    height: Matrics.s(21),
    tintColor: colors.TEXT_DARK,
  },
  bottomContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(20),
    paddingBottom: Matrics.vs(20),
  },
});

export default ChangePassword;
