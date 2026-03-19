import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import {
  extractPublicUrl,
  getGroupIconPresignedImageUrl,
  guessMimeTypeFromFileName,
  uploadFileToPresignedUrl,
} from "../../services/upload/presignedUpload";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import {
  ImagePickerResponse,
  launchImageLibrary,
} from "react-native-image-picker";
import groupService from "../../services/groupService";
import { ICreateGroup } from "../../interfaces/groupInterface";
import { getAllFriends } from "../../services/friends";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import CommonHeader from "../../components/common/CommonHeader";
import LinearGradient from "react-native-linear-gradient";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getCreateGroupValidationSchema } from "../../validation/group";
import { getInitials, truncateText } from "../../utils/helper";
import { IMAGE_FILE_SIZE, FRIEND_NAME_TRUNCATE_LENGTH, NAME_TRUNCATION_SUFFIX, CDN_IMAGE_URL } from "../../constants/commonConstant";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
}

interface CreateGroupFormData {
  group_name: string;
  group_icon_url: string | null;
  members: number[];
}

const CreateGroupPage: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateGroupFormData>({
    resolver: yupResolver(getCreateGroupValidationSchema()),
    mode: "all",
    defaultValues: {
      group_name: "",
      group_icon_url: null,
      members: [],
    },
  });

  const groupName = watch("group_name");
  const selectedMemberIds = watch("members");
  const selectedImage = watch("group_icon_url");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoadingFriends(true);
        const response = await getAllFriends();
        if (response.success && response.data) {
          const mappedFriends: Friend[] = response.data.map((friend) => ({
            id: String(friend.friend_id),
            name: friend.friend_name,
            avatar: friend.friend_image,
          }));
          setFriends(mappedFriends);
        }
      } catch (error) {
        console.error("Error fetching friends:", error);
        toastMessageError(t("common.something_went_wrong"), t("common.try_again_later"));
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriends();
  }, []);

  const onSubmit = async (formData: CreateGroupFormData) => {
    setLoading(true);
    try {
      const data: ICreateGroup = {
        group_name: formData.group_name.trim(),
        members: formData.members,
        group_icon_url: formData.group_icon_url || "",
      };

      const response = await groupService.createGroup(data);

      if (response.success) {
        toastMessageSuccess(response.message);
        reset();
        navigation.goBack();
      } else {
        toastMessageError(t("common.something_went_wrong"), response.message);
      }
    } catch (error) {
      console.log(error);
      toastMessageError(
        t("common.something_went_wrong"),
        t("group.add_edit_group.failed_to_create_group")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAvatar = () => {
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
              response.errorMessage ||
              t("group.add_edit_group.failed_to_select_image")
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
                t("group.add_edit_group.invalid_file_type_title"),
                t("group.add_edit_group.invalid_file_type_message")
              );
              return;
            }

            // Validate file size (max 5MB)
            const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
            if (fileSizeInMB > IMAGE_FILE_SIZE) {
              toastMessageError(
                t("group.add_edit_group.file_too_large_title"),
                t("group.add_edit_group.file_too_large_message", {
                  size: fileSizeInMB.toFixed(2),
                })
              );
              return;
            }

            if (!fileUri) {
              toastMessageError(t("group.add_edit_group.file_uri_invalid"));
              return;
            }

            // Preview immediately for instant UI update
            setValue("group_icon_url", fileUri, { shouldValidate: true });

            // Automatically upload the image via presigned URL
            await uploadGroupIconViaPresigned(fileUri, fileExtension);
          }
        }
      );
    } catch (error) {
      console.error("Error selecting image:", error);
      toastMessageError(
        t("group.add_edit_group.error"),
        t("group.add_edit_group.failed_to_select_image")
      );
    }
  };

  const uploadGroupIconViaPresigned = async (
    fileUri: string,
    fileExtension: string
  ) => {
    try {
      setUploadingImage(true);

      const time = Date.now();
      const group = "group";
      const fileName = `group-icon/${group}_${time}.${fileExtension}`;
      const contentType = guessMimeTypeFromFileName(fileName);

      // Get presigned URL
      const presignedUrlResponse = await getGroupIconPresignedImageUrl({
        fileName,
        contentType,
      });

      if (!presignedUrlResponse.success || !presignedUrlResponse.data?.url) {
        toastMessageError(
          t("group.add_edit_group.upload_error_title"),
          presignedUrlResponse.message ||
          t("group.add_edit_group.could_not_get_upload_url")
        );
        setValue("group_icon_url", null, { shouldValidate: true });
        return;
      }

      const presignedUrl = presignedUrlResponse.data.url;

      // Upload to S3
      const uploadOk = await uploadFileToPresignedUrl(
        fileUri,
        presignedUrl,
        contentType,
        "group-icon"
      );

      if (!uploadOk) {
        toastMessageError(
          t("group.add_edit_group.upload_failed_title"),
          t("group.add_edit_group.failed_to_upload_image")
        );
        setValue("group_icon_url", null, { shouldValidate: true });
        return;
      }

      // Extract public URL from presigned URL
      const publicUrl = extractPublicUrl(presignedUrl);

      // Update profile with the uploaded image URL
      setValue("group_icon_url", publicUrl, { shouldValidate: true });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toastMessageError(
        t("group.add_edit_group.error"),
        t("group.add_edit_group.failed_to_update_profile_image")
      );
      setValue("group_icon_url", null, { shouldValidate: true });
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleMember = (friend: Friend) => {
    const currentMembers = watch("members");
    const friendId = parseInt(friend.id, 10);
    const isSelected = currentMembers.includes(friendId);

    if (isSelected) {
      setValue(
        "members",
        currentMembers.filter((id) => id !== friendId),
        { shouldValidate: true, shouldTouch: true }
      );
    } else {
      setValue("members", [...currentMembers, friendId], {
        shouldValidate: true,
        shouldTouch: true,
      });
    }
  };

  const removeMember = (memberId: string) => {
    const currentMembers = watch("members");
    const id = parseInt(memberId, 10);
    setValue(
      "members",
      currentMembers.filter((existingId) => existingId !== id),
      { shouldValidate: true, shouldTouch: true }
    );
  };

  const selectedMembers = friends.filter((f: Friend) =>
    selectedMemberIds.includes(parseInt(f.id, 10))
  );

  const availableFriends = friends.filter(
    (f: Friend) => !selectedMemberIds.includes(parseInt(f.id, 10))
  );

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <CommonHeader
          showBackButton
          title={t("group.add_edit_group.create_group")}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Group Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.groupAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.groupAvatarPlaceholder}>
                  <Image
                    source={Images.GROUPS_ICON}
                    style={styles.placeholderIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.placeholderText}>
                    {t("group.add_edit_group.avatar_placeholder")}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.editAvatarButton, loading && { opacity: 0.9 }]}
                onPress={handleChangeAvatar}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.editIconContainer}>
                  {uploadingImage ? (
                    <ActivityIndicator color={colors.WHITE} size="small" />
                  ) : (
                    <Image
                      source={Images.PENCIL_EDIT}
                      style={styles.editIcon}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Group Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>
              {t("group.add_edit_group.group_name_label")}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t("group.add_edit_group.group_name_placeholder")}
                placeholderTextColor="rgba(26, 26, 26, 0.4)"
                value={groupName}
                onChangeText={(text) =>
                  setValue("group_name", text, {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
              />
            </View>
            {errors.group_name && (
              <Text style={styles.errorText}>
                {(errors.group_name.message as string) || ""}
              </Text>
            )}
          </View>

          {/* Add Members Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>
              {t("group.add_edit_group.add_members")}
            </Text>
            <TouchableOpacity
              style={[styles.dropdownButton, loadingFriends && { opacity: 0.6 }]}
              onPress={() => !loadingFriends && setIsDropdownOpen(!isDropdownOpen)}
              disabled={loadingFriends}
            >
              <Text style={styles.dropdownPlaceholder}>
                {t("group.add_edit_group.select_members")}
              </Text>
              {loadingFriends ? (
                <ActivityIndicator size="small" color={colors.PRIMARY} />
              ) : (
                <Image
                  source={Images.ARROW_DOWN}
                  style={[
                    styles.dropdownIcon,
                    isDropdownOpen &&
                    availableFriends.length > 0 &&
                    styles.dropdownIconRotated,
                  ]}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>

            {isDropdownOpen && availableFriends.length > 0 && (
              <View style={styles.dropdownList}>
                <ScrollView
                  style={styles.dropdownScroll}
                  nestedScrollEnabled={true}
                >
                  {availableFriends.map((friend: Friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.dropdownItem}
                      onPress={() => toggleMember(friend)}
                    >
                      {friend.avatar ? (
                        <Image
                          source={{ uri: CDN_IMAGE_URL+friend.avatar }}
                          style={styles.dropdownAvatar}
                        />
                      ) : (
                        <View style={styles.dropdownInitials}>
                          <Text style={styles.dropdownInitialsText}>
                            {getInitials(friend.name)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.dropdownItemText}>{truncateText(friend.name, 25)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.members && (
              <Text style={styles.errorText}>
                {(errors.members.message as string) || ""}
              </Text>
            )}
          </View>

          {selectedMembers.length > 0 && (
            <>
              <Text style={styles.selectedLabel}>
                {t("group.add_edit_group.selected_members")}
              </Text>

              <View style={styles.selectedContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedScrollContent}
                >
                  {selectedMembers.map((member: Friend) => (
                    <View key={member.id} style={styles.memberChip}>
                      {member.avatar ? (
                        <Image
                          source={{ uri: CDN_IMAGE_URL+member.avatar }}
                          style={styles.chipAvatar}
                        />
                      ) : (
                        <View style={styles.chipInitials}>
                          <Text style={styles.chipInitialsText}>
                            {getInitials(member.name)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.chipName} numberOfLines={1}>
                        {member.name.length > FRIEND_NAME_TRUNCATE_LENGTH
                          ? member.name.substring(0, FRIEND_NAME_TRUNCATE_LENGTH) + NAME_TRUNCATION_SUFFIX
                          : member.name}
                      </Text>
                      <TouchableOpacity
                        style={styles.chipRemove}
                        onPress={() => removeMember(member.id)}
                      >
                        <Image
                          source={Images.CLOSE_ICON2}
                          style={styles.chipRemoveIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Create Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              (uploadingImage ||
                loading) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={uploadingImage || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.WHITE} size="small" />
            ) : (
              <Text style={styles.createButtonText}>
                {t("group.add_edit_group.create_group")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(30),
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Matrics.vs(24),
  },
  avatarContainer: {
    position: "relative",
  },
  groupAvatar: {
    width: Matrics.s(160),
    height: Matrics.s(160),
    borderRadius: Matrics.s(100),
    borderWidth: 1,
    borderColor: colors.GRAY_MEDIUM,
  },
  groupAvatarPlaceholder: {
    width: Matrics.s(160),
    height: Matrics.s(160),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 8,
    right: 10,
  },
  editIconContainer: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon: {
    width: Matrics.s(16),
    height: Matrics.s(16),
    tintColor: colors.WHITE,
  },
  inputSection: {
    marginBottom: Matrics.vs(15),
  },
  placeholderIcon: {
    width: Matrics.s(35),
    height: Matrics.s(35),
    tintColor: colors.TEXT_PRIMARY,
    opacity: 0.8,
    marginBottom: Matrics.vs(2),
  },
  placeholderText: {
    fontSize: FontsSize.SemiLarge,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    opacity: 0.8,
    lineHeight: Matrics.ms(20),
  },
  label: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
  },
  input: {
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_PRIMARY,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(14),
    backgroundColor: colors.WHITE,
  },
  dropdownPlaceholder: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: "rgba(26, 26, 26, 0.4)",
  },
  dropdownIcon: {
    width: Matrics.s(14),
    height: Matrics.vs(14),
    tintColor: colors.TEXT_PRIMARY,
  },
  dropdownIconRotated: {
    transform: [{ rotate: "180deg" }],
  },
  dropdownList: {
    marginTop: Matrics.vs(8),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
    maxHeight: Matrics.vs(110),
  },
  dropdownScroll: {
    paddingVertical: Matrics.vs(8),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.s(15),
    paddingVertical: Matrics.vs(8),
  },
  dropdownAvatar: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(10),
  },
  dropdownInitials: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(10),
  },
  dropdownInitialsText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  dropdownItemText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  selectedLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  selectedContainer: {
    marginBottom: Matrics.vs(20),
  },
  selectedScrollContent: {
    flexDirection: "row",
    gap: Matrics.s(5),
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(47, 89, 235, 0.20)",
    borderRadius: Matrics.s(25),
    paddingLeft: Matrics.s(4),
    paddingRight: Matrics.s(6),
    paddingVertical: Matrics.vs(3),
  },
  chipAvatar: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(6),
  },
  chipInitials: {
    width: Matrics.s(20),
    height: Matrics.s(20),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(7),
  },
  chipInitialsText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  chipName: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Bold,
    lineHeight: Matrics.vs(16),
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(10),
  },
  chipRemove: {
    width: Matrics.s(16),
    height: Matrics.s(16),
    borderRadius: Matrics.s(8),
    alignItems: "center",
    justifyContent: "center",
  },
  chipRemoveIcon: {
    width: "100%",
    height: "100%",
  },
  createButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: Matrics.vs(5),
  },
  createButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
  errorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Regular,
    color: colors.DANGER,
    marginTop: Matrics.vs(4),
  },
});

export default CreateGroupPage;
