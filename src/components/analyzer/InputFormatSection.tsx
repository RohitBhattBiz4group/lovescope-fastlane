import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { Asset } from "react-native-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";

import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";
import config from "../../config/config";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import useAuth from "../../hooks/useAuth";
import {
  InputFormatType,
  INPUT_FORMAT_TEXT,
  INPUT_FORMAT_IMAGE,
  ANALYZER_MAX_IMAGES,
} from "../../constants/commonConstant";
import { AnalyzerNavigationProp } from "../../interfaces/navigationTypes";
import LinearGradient from "react-native-linear-gradient";

interface InputFormatSectionProps {
  inputFormat: InputFormatType;
  onInputFormatChange: (format: InputFormatType) => void;
  preselectedImages: Asset[];
  uploadedImages: Asset[];
  onImagePick: () => void;
  onRemoveImage: (index: number, isPreselected: boolean) => void;
  disabled?: boolean;
}

export const replaceWithCdnUrl = (url: string): string => {
  if (!url || !url.startsWith("http")) {
    return url;
  }
  try {
    const urlParts = url.split("/");
    if (urlParts.length < 4) {
      return url;
    }
    const pathAndQuery = "/" + urlParts.slice(3).join("/");
    const cdnBaseUrl = config.cdn_image_url.endsWith("/")
      ? config.cdn_image_url.slice(0, -1)
      : config.cdn_image_url;
    return `${cdnBaseUrl}${pathAndQuery}`;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return url;
  }
};

const InputFormatSection: React.FC<InputFormatSectionProps> = ({
  inputFormat,
  onInputFormatChange,
  preselectedImages,
  uploadedImages,
  onImagePick,
  onRemoveImage,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const route = useRoute();
  const { authData } = useAuth();
  const currentPlan = authData?.plan;

  const planImageLimitRaw = currentPlan?.limits?.limit;
  const planImageLimit =
    planImageLimitRaw === null || planImageLimitRaw === undefined
      ? ANALYZER_MAX_IMAGES
      : Number(planImageLimitRaw);

  const totalImages = preselectedImages.length + uploadedImages.length;
  const isMaxImagesReached =
    Number.isFinite(planImageLimit) && planImageLimit > 0
      ? totalImages >= planImageLimit
      : totalImages >= ANALYZER_MAX_IMAGES;

  const canUpgradeForMoreImages =
    Number.isFinite(planImageLimit) && planImageLimit < ANALYZER_MAX_IMAGES;

  const handleUpgradePress = () => {
    const parentNav = navigation.getParent?.();
    if (parentNav) {
      parentNav.navigate("SettingsTab", {
        screen: "Subscription",
        params: {
          navigationFrom: {
            tab: "FilesTab",
            screen: route?.name,
          },
        },
      });
      return;
    }
    (navigation as any).navigate?.("Subscription");
  };

  const getImageUri = (
    uri: string | undefined,
    isPreselected: boolean,
  ): string => {
    if (!uri) return "";
    if (isPreselected) {
      return replaceWithCdnUrl(uri);
    }
    return uri;
  };

  return (
    <>
      {/* Input Format Toggle */}
      <View style={styles.inputFormatContainer}>
        <Text style={styles.inputFormatLabel}>
          {t("analyzer.text_analyzer.input_format")}
        </Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => onInputFormatChange(INPUT_FORMAT_TEXT)}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <View
              style={[
                styles.radioOuter,
                inputFormat === INPUT_FORMAT_TEXT && styles.radioOuterSelected,
              ]}
            >
              {inputFormat === INPUT_FORMAT_TEXT && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.radioText,
                inputFormat === INPUT_FORMAT_TEXT && styles.radioTextSelected,
              ]}
            >
              {t("analyzer.text_analyzer.text")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioButton}
            onPress={() => onInputFormatChange(INPUT_FORMAT_IMAGE)}
            activeOpacity={0.8}
            disabled={disabled}
          >
            <View
              style={[
                styles.radioOuter,
                inputFormat === INPUT_FORMAT_IMAGE && styles.radioOuterSelected,
              ]}
            >
              {inputFormat === INPUT_FORMAT_IMAGE && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text
              style={[
                styles.radioText,
                inputFormat === INPUT_FORMAT_IMAGE && styles.radioTextSelected,
              ]}
            >
              {t("analyzer.text_analyzer.image")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upload Image Section - Only show when Image format is selected */}
      {inputFormat === INPUT_FORMAT_IMAGE && (
        <View style={styles.uploadContainer}>
          <Text style={styles.uploadLabel}>
            {t("analyzer.text_analyzer.upload_image")}
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              isMaxImagesReached &&
                !canUpgradeForMoreImages &&
                styles.uploadBoxDisabled,
            ]}
            onPress={
              isMaxImagesReached && canUpgradeForMoreImages
                ? handleUpgradePress
                : onImagePick
            }
            activeOpacity={0.7}
            disabled={
              disabled || (isMaxImagesReached && !canUpgradeForMoreImages)
            }
          >
            {isMaxImagesReached && canUpgradeForMoreImages ? (
              <View style={styles.upgradeUploadContent}>
                <LinearGradient
                  colors={[colors.PRIMARY, "#5B7FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumBadgeGradient}
                >
                  <Image
                    source={Images.LOCK_ICON}
                    style={styles.upgradeLockIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.upgradeTitleText}>
                  {t("analyzer.text_analyzer.max_images_limit", {
                    limit: planImageLimit,
                  })}
                </Text>
                <View style={styles.upgradeCtaRow}>
                  <Text style={styles.upgradeCtaText}>
                    {t("analyzer.text_analyzer.upgrade_to_more_images", {
                      limit: ANALYZER_MAX_IMAGES,
                    })}
                  </Text>
                </View>
                <View style={styles.upgradeFooterTextBox}>
                  <Text style={styles.upgradeFooterText}>
                    {t("analyzer.text_analyzer.upgrade_more_accurate")}
                  </Text>
                  <Image
                    source={Images.BACK_ICON}
                    style={styles.upgradeArrowIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
            ) : (
              <>
                <Image
                  source={Images.IMAGE_UPLOAD}
                  style={styles.uploadIcon}
                  resizeMode="contain"
                />
                <Text style={styles.uploadText}>
                  {t("analyzer.text_analyzer.upload_image")}
                </Text>
                <Text style={styles.uploadSubtext}>
                  {t("analyzer.text_analyzer.max_file_size_message")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Warning message when more than 1 image is selected */}
          {totalImages > 1 && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                {t("analyzer.text_analyzer.multiple_images_warning_message")}
              </Text>
            </View>
          )}

          {/* Scrollable row of all images (preselected + uploaded) */}
          {totalImages > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScrollContainer}
              contentContainerStyle={styles.imagesScrollContent}
            >
              {/* Render preselected images first */}
              {preselectedImages.map((image, index) => (
                <View
                  key={`preselected-${image.uri || index}`}
                  style={styles.imagePreviewItem}
                >
                  <Image
                    source={{ uri: getImageUri(image.uri, true) }}
                    style={styles.previewImageThumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => onRemoveImage(index, true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {/* Render uploaded images after preselected ones */}
              {uploadedImages.map((image, index) => (
                <View
                  key={`uploaded-${image.uri || index}`}
                  style={styles.imagePreviewItem}
                >
                  <Image
                    source={{ uri: getImageUri(image.uri, false) }}
                    style={styles.previewImageThumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      onRemoveImage(preselectedImages.length + index, false)
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  inputFormatContainer: {
    marginBottom: Matrics.vs(15),
  },
  inputFormatLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  radioContainer: {
    flexDirection: "row",
    gap: Matrics.s(10),
  },
  radioButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: Matrics.vs(14),
    paddingHorizontal: Matrics.s(16),
    borderRadius: Matrics.s(12),
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "#EDF1F3",
    gap: Matrics.s(10),
  },
  radioOuter: {
    width: Matrics.s(22),
    height: Matrics.s(22),
    borderRadius: Matrics.s(11),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: colors.PRIMARY,
  },
  radioInner: {
    width: Matrics.s(10),
    height: Matrics.s(10),
    borderRadius: Matrics.s(5),
    backgroundColor: colors.PRIMARY,
  },
  radioText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
  },
  radioTextSelected: {
    fontFamily: typography.fontFamily.Satoshi.Medium,
  },
  uploadContainer: {
    marginBottom: Matrics.vs(15),
  },
  uploadLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: Matrics.s(16),
    paddingVertical: Matrics.vs(25),
    paddingHorizontal: Matrics.s(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE,
    marginBottom: Matrics.vs(8),
  },
  uploadBoxDisabled: {
    opacity: 0.5,
  },
  uploadIcon: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    marginBottom: Matrics.vs(5),
  },
  uploadText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(4),
  },
  uploadSubtext: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.GRAY_DARK,
  },
  upgradeUploadContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadgeGradient: {
    width: Matrics.s(42),
    height: Matrics.s(42),
    borderRadius: Matrics.s(42),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Matrics.vs(8),
  },
  upgradeLockIcon: {
    width: Matrics.s(26),
    height: Matrics.s(26),
    tintColor: colors.WHITE,
  },
  upgradeTitleText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.GRAY_DARK,
    textAlign: "center",
    marginBottom: Matrics.vs(8),
  },
  upgradeCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Matrics.s(8),
    marginBottom: Matrics.vs(6),
  },
  upgradeCtaText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.PRIMARY,
    textAlign: "center",
  },
  upgradeArrowIcon: {
    width: Matrics.s(20),
    height: Matrics.s(16),
    tintColor: colors.GRAY_DARK,
    transform: [{ rotate: "180deg" }],
    marginBottom: Matrics.s(-5),
  },
  upgradeFooterTextBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upgradeFooterText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.GRAY_DARK,
    textAlign: "center",
  },
  imagesScrollContainer: {
    marginTop: Matrics.vs(12),
  },
  imagesScrollContent: {
    gap: Matrics.s(10),
  },
  imagePreviewItem: {
    position: "relative",
    borderRadius: Matrics.s(12),
    overflow: "hidden",
  },
  previewImageThumb: {
    width: Matrics.s(100),
    height: Matrics.s(100),
    borderRadius: Matrics.s(12),
    borderWidth: 1,
    borderColor: "#eceff0ff",
  },
  removeImageButton: {
    position: "absolute",
    top: Matrics.vs(5),
    right: Matrics.s(5),
    width: Matrics.s(22),
    height: Matrics.s(22),
    borderRadius: Matrics.s(11),
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeImageText: {
    color: colors.WHITE,
    fontSize: FontsSize.Small,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFC107",
    borderRadius: Matrics.s(8),
    paddingVertical: Matrics.vs(10),
    paddingHorizontal: Matrics.ms(12),
    marginTop: Matrics.vs(6),
    marginBottom: Matrics.vs(8),
  },
  warningText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: "#856404",
    textAlign: "center",
  },
});

export default InputFormatSection;
