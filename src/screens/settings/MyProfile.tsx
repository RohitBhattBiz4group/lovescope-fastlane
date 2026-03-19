import React, { useState } from "react";
import {
  launchImageLibrary,
  ImagePickerResponse,
} from "react-native-image-picker";
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { IAuthData, ScreenProps } from "../../interfaces/commonInterfaces";
import CustomTextInput from "../../components/common/TextInput";
import PhoneInput from "../../components/common/PhoneInput";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useAuth from "../../hooks/useAuth";
import useTranslation from "../../hooks/useTranslation";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import {
  getProfileImagePresignedImageUrl,
  uploadFileToPresignedUrl,
  extractPublicUrl,
  guessMimeTypeFromFileName,
} from "../../services/upload/presignedUpload";
import userProfileService from "../../services/userProfile";
import Button from "../../components/common/Button";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import { CDN_IMAGE_URL } from "../../constants/commonConstant";
import { IUpdateUserProfile } from "../../interfaces/userProfile";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getProfileValidationSchema } from "../../validation/user_profile";

interface ProfileFormData {
  name: string;
  email: string;
  phone_number: string;
}

const MyProfile: React.FC<ScreenProps> = () => {
  const { t } = useTranslation();
  const { authData, setAuthData, signOut } = useAuth();
  const user = authData?.user;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [updatingUser, setUpdatingUser] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>(
    user?.country_name ?? "US"
  );
  const [callingCode, setCallingCode] = useState<string>(
    user?.country_code ?? "1"
  );
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [phoneFieldTouched, setPhoneFieldTouched] = useState<boolean>(false);
  const [showEmailUpdateModal, setShowEmailUpdateModal] = useState<boolean>(false);
  const [pendingProfileData, setPendingProfileData] = useState<ProfileFormData | null>(null);

  // Initialize form with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    trigger,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(getProfileValidationSchema(countryCode)),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone_number: user?.phone_number ?? "",
    },
  });

  // Handle image selection - following Ensemble app pattern
  const handleSelectImage = async () => {
    try {
      // Launch image library (react-native-image-picker handles permissions automatically)
      launchImageLibrary(
        {
          mediaType: "photo",
          quality: 0.8,
          maxWidth: 1024,
          maxHeight: 1024,
        },
        async (response: ImagePickerResponse) => {
          if (response.didCancel) {
            return;
          }

          if (response.errorCode) {
            toastMessageError(
              response.errorMessage || t("user_profile.my_profile.failed_to_select_image")
            );
            return;
          }

          if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            const fileUri = asset.uri;
            const fileExtension = fileUri?.split(".").pop()?.toLowerCase();

            // Validate file type (only allow JPEG and PNG)
            if (
              !fileExtension ||
              !["jpg", "jpeg", "png"].includes(fileExtension)
            ) {
              toastMessageError(
                t("user_profile.my_profile.invalid_file_type"),
                t("user_profile.my_profile.only_jpeg_png_allowed")
              );
              return;
            }

            // Validate file size (max 5MB)
            const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
            if (fileSizeInMB > 5) {
              toastMessageError(
                t("user_profile.my_profile.file_too_large"),
                t("user_profile.my_profile.file_too_large_message", { size: fileSizeInMB.toFixed(2) })
              );
              return;
            }

            if (!fileUri) {
              toastMessageError(t("user_profile.my_profile.file_uri_invalid"));
              return;
            }

            // Preview immediately for instant UI update
            setSelectedImage(fileUri);

            // Automatically upload the image via presigned URL
            await uploadProfileImageViaPresigned(fileUri, fileExtension);
          }
        }
      );
    } catch (error) {
      console.error("Error selecting image:", error);
      toastMessageError(t("common.error"), t("user_profile.my_profile.failed_to_select_image"));
    }
  };

  // Upload profile image to server using presigned URL - following Ensemble app pattern
  const uploadProfileImageViaPresigned = async (
    fileUri: string,
    fileExtension: string
  ) => {
    try {
      setUploadingImage(true);

      const time = Date.now();
      const userId = user && user.id ? String(user.id) : "user";
      const fileName = `user-profiles/${userId}_${time}.${fileExtension}`;
      const contentType = guessMimeTypeFromFileName(fileName);

      // Get presigned URL
      const presignedUrlResponse = await getProfileImagePresignedImageUrl({
        fileName,
        contentType,
      });

      if (!presignedUrlResponse.success || !presignedUrlResponse.data?.url) {
        toastMessageError(
          t("user_profile.my_profile.upload_error"),
          presignedUrlResponse.message || t("user_profile.my_profile.could_not_get_upload_url")
        );
        setSelectedImage(null);
        return;
      }

      const presignedUrl = presignedUrlResponse.data.url;

      // Upload to S3
      const uploadOk = await uploadFileToPresignedUrl(
        fileUri,
        presignedUrl,
        contentType
      );

      if (!uploadOk) {
        toastMessageError(t("user_profile.my_profile.upload_failed"), t("user_profile.my_profile.failed_to_upload_image"));
        setSelectedImage(null);
        return;
      }

      // Extract public URL from presigned URL
      const publicUrl = extractPublicUrl(presignedUrl);

      // Update profile with the uploaded image URL
      setUpdatingUser(true);
      const response = await userProfileService.updateProfile({
        url: publicUrl,
      });

      if (response.success) {
        // Fetch updated profile
        const userResponse = await userProfileService.profile();

        if (userResponse.success && userResponse.data) {
          const updatedUserData = userResponse.data;

          // Update AuthContext immediately to reflect new avatar
          if (authData && updatedUserData) {
            const userData = updatedUserData as Record<string, any>;
            const nextAuthData = {
              ...authData,
              user: { ...authData.user, ...userData },
            } as any;
            setAuthData(nextAuthData);
          } else if (updatedUserData) {
            setAuthData({ user: updatedUserData as any });
          }

          // Clear selectedImage to use server URL from authData
          // setSelectedImage(null);

          toastMessageSuccess(t("user_profile.my_profile.profile_image_updated_successfully"));
        } else {
          toastMessageError(userResponse.message || t("user_profile.my_profile.failed_to_update_profile"));
        }
      } else {
        toastMessageError(
          t("user_profile.my_profile.image_update_failed"),
          response.message || t("user_profile.my_profile.failed_to_update_profile_image")
        );
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toastMessageError(t("common.error"), t("user_profile.my_profile.failed_to_update_profile_image"));
      setSelectedImage(null);
    } finally {
      setUploadingImage(false);
      setUpdatingUser(false);
    }
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      // Check if email is being updated
      const isEmailUpdating = data.email !== (user?.email ?? "");
      
      if (isEmailUpdating) {
        // Store the data and show confirmation modal
        setPendingProfileData(data);
        setShowEmailUpdateModal(true);
        return;
      }

      // Proceed with normal update if email is not changing
      await proceedWithProfileUpdate(data);
    } catch (error) {
      toastMessageError(t("user_profile.my_profile.failed_to_update_profile"));
    }
  };

  const proceedWithProfileUpdate = async (data: ProfileFormData) => {
    try {
      setSavingProfile(true);

      const payload: IUpdateUserProfile = {};

      if (data.name !== (user?.name ?? "")) {
        payload.name = data.name;
      }
      if (data.email !== (user?.email ?? "")) {
        payload.email = data.email;
      }
      if (data.phone_number !== (user?.phone_number ?? "")) {
        payload.phone_number = data.phone_number;
      }
      if (callingCode !== (user?.country_code ?? "")) {
        payload.country_code = callingCode;
      }
      if (countryCode !== (user?.country_name ?? "")) {
        payload.country_name = countryCode;
      }

      if (Object.keys(payload).length === 0) {
        toastMessageError(t("user_profile.my_profile.no_changes_to_save"));
        return;
      }

      const response = await userProfileService.updateUserProfile(payload);
      if (response.success) {
        const userResponse = await userProfileService.profile();

        if (userResponse.success && userResponse.data) {
          const updatedUserData = userResponse.data as Record<string, unknown>;

          if (authData) {
            const nextAuthData = {
              ...authData,
              user: { ...authData.user, ...updatedUserData },
            } as IAuthData;
            setAuthData(nextAuthData);
          }
        }

        toastMessageSuccess(t("user_profile.my_profile.profile_updated_successfully"));
        
        // Check if email was updated and logout if needed
        if (payload.email) {
          setTimeout(() => {
            signOut();
          }, 1000);
        }
      } else {
        toastMessageError(response.message || t("user_profile.my_profile.failed_to_update_profile"));
      }
    } catch (error) {
      toastMessageError(t("user_profile.my_profile.failed_to_update_profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmailUpdateConfirm = async () => {
    setShowEmailUpdateModal(false);
    if (pendingProfileData) {
      await proceedWithProfileUpdate(pendingProfileData);
      setPendingProfileData(null);
    }
  };

  const handleEmailUpdateCancel = () => {
    setShowEmailUpdateModal(false);
    setPendingProfileData(null);
  };

  const getProfileContactText = (): string => {
    const isEmailVerified = user?.is_email_verified ?? false;
    const isPhoneVerified = user?.is_phone_verified ?? false;

    if (isEmailVerified && isPhoneVerified) {
      return `${user?.email} / +${user?.country_code} ${user?.phone_number}`;
    }
    if (isEmailVerified) {
      return user?.email ?? "";
    }
    if (isPhoneVerified) {
      return `+${user?.country_code} ${user?.phone_number}`;
    }
    return user?.email ?? "";
  };

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
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  selectedImage
                    ? { uri: selectedImage }
                    : user?.image
                      ? { uri: CDN_IMAGE_URL + user.image }
                      : Images.NO_USER_IMAGE
                }
                style={styles.avatar}
              />
              <TouchableOpacity
                style={[
                  styles.editIconContainer,
                  (uploadingImage || updatingUser || savingProfile) &&
                    styles.disabledEditIconContainer,
                ]}
                onPress={handleSelectImage}
                activeOpacity={0.7}
                disabled={uploadingImage || updatingUser || savingProfile}
              >
                {uploadingImage || updatingUser ? (
                  <ActivityIndicator color={colors.WHITE} size="small" />
                ) : (
                  <Image
                    source={Images.EDIT_CIRCLE}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name as string}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <CustomTextInput
              label={t("user_profile.my_profile.name")}
              name="name"
              control={control}
              editable={true}
              placeholder={t("user_profile.my_profile.enter_your_name")}
              required={true}
            />

            {!user?.is_email_verified && (
              <CustomTextInput
                label={t("user_profile.my_profile.email")}
                name="email"
                control={control}
                placeholder={t("user_profile.my_profile.enter_your_email")}
                keyboardType="email-address"
                autoCapitalize="none"
                required={true}
              />
            )}

            
              <PhoneInput
                key={`${countryCode}-${callingCode}`}
                label={t("user_profile.my_profile.phone_number")}
                placeholder={t("user_profile.my_profile.enter_your_phone_number")}
                value={control._formValues.phone_number}
                countryCode={countryCode}
                callingCode={callingCode}
                onPhoneChange={(phone) => {
                  setValue("phone_number", phone, { shouldDirty: true, shouldValidate: true });
                }}
                disabled={user?.is_phone_verified}
                onCountryChange={(countryCode, callingCode) => {
                  setCountryCode(countryCode);
                  setCallingCode(callingCode);
                  // Re-initialize form with new country code for validation
                  trigger("phone_number");
                }}
                error={errors.phone_number?.message}
                touched={phoneFieldTouched}
                onBlur={() => {
                  setPhoneFieldTouched(true);
                  trigger("phone_number");
                }}
              />
            
          </View>
        </ScrollView>

        <View style={styles.bottomContainer}>
          <Button
            title={t("user_profile.my_profile.save_changes")}
            onPress={handleSubmit(handleSaveProfile)}
            disabled={uploadingImage || updatingUser || savingProfile || !isValid || !isDirty}
            loading={savingProfile}
          />
        </View>
      </KeyboardAvoidingView>
      
      <ConfirmationModal
        visible={showEmailUpdateModal}
        title={t("user_profile.my_profile.mail_update_warning")}
        message={t("user_profile.my_profile.mail_update_warning_message")}
        onYesPress={handleEmailUpdateConfirm}
        onNoPress={handleEmailUpdateCancel}
        confirmText={t("common.ok")}
        cancelText={t("common.cancel")}
        loading={savingProfile}
      />
    </LinearGradient>
  );
};

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
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(20),
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  avatarContainer: {
    position: "relative",
    marginRight: Matrics.s(16),
  },
  avatar: {
    width: Matrics.s(60),
    height: Matrics.s(60),
    borderRadius: Matrics.s(100),
    borderColor: "#dfdfdf",
    borderWidth: 1,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: Matrics.s(24),
    height: Matrics.s(24),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledEditIconContainer: {
    opacity: 0.4,
  },
  editIcon: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontsSize.SemiLarge,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(0),
  },
  profileEmail: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_SECONDARY,
    margin: 0,
  },
  formContainer: {
    flex: 1,
  },
  disabledInputContainer: {
    opacity: 0.5,
  },
  phoneContainer: {
    marginBottom: Matrics.vs(15),
  },
  phoneLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(5),
  },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF1F3",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
    overflow: "hidden",
  },
  countryCodeSection: {
    paddingLeft: Matrics.s(5),
  },
  countryCodeSelect: {
    marginBottom: 0,
    marginEnd: 10,
  },
  countryCodePicker: {
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(8),
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  divider: {
    width: 1,
    height: Matrics.vs(24),
    backgroundColor: "#EDF1F3",
  },
  phoneInputSection: {
    flex: 1,
  },
  phoneInput: {
    marginBottom: 0,
  },
  phoneInputField: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  bottomContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(20),
    paddingBottom: Matrics.vs(20),
  },
});

export default MyProfile;
