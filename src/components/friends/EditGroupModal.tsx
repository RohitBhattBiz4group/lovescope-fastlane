import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	StyleSheet,
	Modal,
	TouchableOpacity,
	Animated,
	Dimensions,
	KeyboardAvoidingView,
	Platform,
	TouchableWithoutFeedback,
	Image,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import TextInput from "../common/TextInput";
import Button from "../common/Button";
import { toastMessageError, toastMessageSuccess } from "../common/ToastMessage";
import {
	launchImageLibrary,
	ImagePickerResponse,
} from "react-native-image-picker";
import { extractPublicUrl, getGroupIconPresignedImageUrl, guessMimeTypeFromFileName, uploadFileToPresignedUrl } from "../../services/upload/presignedUpload";
import groupService from "../../services/groupService";
import { useTranslation } from "react-i18next";
import { CDN_IMAGE_URL } from "../../constants/commonConstant";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EditGroupModalProps {
	visible: boolean;
	onClose: () => void;
	groupName: string;
	groupAvatar?: string;
	groupId : number | null;
	onSave: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({
	visible,
	onClose,
	groupName: initialGroupName,
	groupAvatar: initialGroupAvatar,
	groupId,
	onSave,
}) => {
	const { t } = useTranslation();
	const [groupName, setGroupName] = useState(initialGroupName);
	const [groupAvatar, setGroupAvatar] = useState(initialGroupAvatar);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [uploadingImage, setUploadingImage] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
	const backdropOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			setGroupName(initialGroupName);
			setGroupAvatar(initialGroupAvatar);
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: SCREEN_HEIGHT,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [
		visible,
		slideAnim,
		backdropOpacity,
		initialGroupName,
		initialGroupAvatar,
	]);

	const handleSave = async() => {
		setLoading(true);
		if (groupName.trim() && groupId) {
			try{
				const data = {
					group_name: groupName,
					group_icon_url: selectedImage || ''
				}

				const updateResponse = await groupService.updateGroup(data,groupId)
				if(updateResponse.success){
					toastMessageSuccess(t("group.add_edit_group.group_updated_success"));
				}else{
					toastMessageError(updateResponse.message || t("group.add_edit_group.failed_to_update_group"));
				}
			}catch(error){
				console.log(error)
				toastMessageError(t("common.something_went_wrong"),t("group.add_edit_group.failed_to_update_group"));
			}finally{
				onSave();
				onClose();
				setLoading(false);
			}
		}else{
			setLoading(false);
			if(!groupName.trim()){
				toastMessageError(t("group.add_edit_group.group_name_required"));
			}else{
				toastMessageError(t("common.something_went_wrong"));
			}
		}
	};

	const handleClose = () => {
		onClose();
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
							response.errorMessage || t("group.add_edit_group.failed_to_select_image")
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
						if (fileSizeInMB > 5) {
							toastMessageError(
								t("group.add_edit_group.file_too_large_title"),
								t("group.add_edit_group.file_too_large_message", { size: fileSizeInMB.toFixed(2) })
							);
							return;
						}

						if (!fileUri) {
							toastMessageError(t("group.add_edit_group.file_uri_invalid"));
							return;
						}

						// Preview immediately for instant UI update
						setSelectedImage(fileUri);

						// Automatically upload the image via presigned URL
						await uploadGroupIconViaPresigned(fileUri, fileExtension);
					}
				}
			);
		} catch (error) {
			console.error("Error selecting image:", error);
			toastMessageError(t("group.add_edit_group.error"), t("group.add_edit_group.failed_to_select_image"));
		}
	};

	const uploadGroupIconViaPresigned = async (fileUri: string, fileExtension: string) => {
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
					presignedUrlResponse.message || t("group.add_edit_group.could_not_get_upload_url")
				);
				setSelectedImage(null);
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
				toastMessageError(t("group.add_edit_group.upload_failed_title"), t("group.add_edit_group.failed_to_upload_image"));
				setSelectedImage(null);
				return;
			}

			// Extract public URL from presigned URL
			const publicUrl = extractPublicUrl(presignedUrl);

			// Update profile with the uploaded image URL
			setGroupAvatar(publicUrl);
			setSelectedImage(presignedUrl);
		} catch (error) {
			console.error("Error uploading profile image:", error);
			toastMessageError(t("group.add_edit_group.error"), t("group.add_edit_group.failed_to_update_profile_image"));
			setSelectedImage(null);
		} finally {
			setUploadingImage(false);
		}
	}

	return (
		<Modal transparent visible={visible} animationType="fade">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.modalContainer}
			>
				{/* Backdrop with blur effect */}
				<TouchableWithoutFeedback disabled={loading} onPress={handleClose}>
					<Animated.View
						style={[styles.backdrop, { opacity: backdropOpacity }]}
					>
						<BlurView
							style={styles.blurView}
							blurType="light"
							blurAmount={20}
							reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.10)"
						/>
						<View style={styles.blurOverlay} />
					</Animated.View>
				</TouchableWithoutFeedback>

				{/* Modal Content */}
				<Animated.View
					style={[
						styles.modalContent,
						{ transform: [{ translateY: slideAnim }] },
					]}
				>
					<ScrollView
						showsVerticalScrollIndicator={false}
						bounces={false}
						keyboardShouldPersistTaps="handled"
					>
						{/* Header */}
						<View style={styles.header}>
							<Text style={styles.title}>{t("group.add_edit_group.title")}</Text>
							<TouchableOpacity
								style={styles.closeButton}
								onPress={handleClose}
								disabled={loading}
							>
								<View style={styles.closeIconContainer}>
									<Image
										source={Images.CLOSE_ICON}
										style={styles.closeIcon}
										resizeMode="contain"
									/>
								</View>
							</TouchableOpacity>
						</View>

						{/* Group Avatar */}
						<View style={styles.avatarSection}>
							<View style={styles.avatarContainer}>
								{groupAvatar ? (
									<Image
										source={{ uri: CDN_IMAGE_URL+groupAvatar }}
										style={styles.groupAvatar}
										resizeMode="cover"
									/>
								) : (
									<View style={styles.groupAvatarPlaceholder}>
										<Text style={styles.placeholderText}>{t("group.add_edit_group.avatar_placeholder")}</Text>
									</View>
								)}
								<TouchableOpacity
									style={[styles.editAvatarButton, loading && { opacity: 0.9 }]}
									onPress={handleChangeAvatar}
									disabled={loading}
									activeOpacity={0.7}
								>
									<View style={styles.editIconContainer}>
										{uploadingImage ? <ActivityIndicator color={colors.WHITE} size="small" /> : <Image
											source={Images.PENCIL_EDIT}
											style={styles.editIcon}
											resizeMode="contain"
										/>}
									</View>
								</TouchableOpacity>
							</View>
						</View>

						{/* Group Name Input */}
						<View style={styles.inputSection}>
							<Text style={styles.inputLabel}>{t("group.add_edit_group.group_name_label")}</Text>
							<TextInput
								value={groupName}
								onChangeText={setGroupName}
								placeholder={t("group.add_edit_group.group_name_placeholder")}
								placeholderTextColor="rgba(26, 26, 26, 0.4)"
								name="groupName"
								maxLength={50}
								readOnly={loading}
								containerStyle={styles.inputContainer}
								// inputStyle={styles.input}
							/>
						</View>

						{/* Save Button */}
						<Button
							title={t("group.add_edit_group.save_changes")}
							onPress={handleSave}
							disabled={!groupName.trim() || uploadingImage}
							containerStyle={[
								styles.saveButton,
								!groupName.trim() && { opacity: 0.6 },
							]}
							loading={loading}
						/>
					</ScrollView>
				</Animated.View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: "flex-end",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
	},
	blurView: {
		...StyleSheet.absoluteFillObject,
	},
	blurOverlay: {
		...StyleSheet.absoluteFillObject,
	},
	modalContent: {
		backgroundColor: colors.WHITE,
		borderTopLeftRadius: Matrics.s(30),
		borderTopRightRadius: Matrics.s(30),
		paddingTop: Matrics.vs(20),
		paddingHorizontal: Matrics.s(20),
		paddingBottom: Matrics.vs(30),
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: Matrics.vs(15),
	},
	title: {
		fontSize: FontsSize.Regular,
		fontFamily: typography.fontFamily.Poppins.SemiBold,
		fontWeight: "600",
		color: colors.TEXT_PRIMARY,
	},
	closeButton: {
		padding: Matrics.s(1),
	},
	closeIconContainer: {
		width: Matrics.s(20),
		height: Matrics.s(20),
		alignItems: "center",
		justifyContent: "center",
	},
	closeIcon: {
		width: "100%",
		height: "100%",
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
	placeholderText: {
		fontSize: FontsSize.Large,
		fontFamily: typography.fontFamily.Poppins.SemiBold,
		fontWeight: "600",
		color: colors.TEXT_PRIMARY,
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
	inputLabel: {
		fontSize: FontsSize.Small,
		fontFamily: typography.fontFamily.Poppins.Medium,
		fontWeight: "500",
		color: colors.TEXT_DARK,
		marginBottom: Matrics.vs(3),
	},
	inputContainer: {
		marginBottom: 0,
	},
	//   input: {
	//     borderRadius: Matrics.s(12),
	//     paddingHorizontal: Matrics.s(12),
	//     paddingVertical: Matrics.vs(12),
	//     fontSize: FontsSize.Medium,
	//     fontFamily: typography.fontFamily.Poppins.Regular,
	//     color: colors.TEXT_PRIMARY,
	//   },
	saveButton: {
		marginTop: Matrics.vs(10),
	},
});

export default EditGroupModal;

