import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import useTranslation from "../../hooks/useTranslation";
import Images from "../../config/Images";
import { CommonActions } from "@react-navigation/native";
import { NAV_ROUTES } from "../../constants/commonConstant";

const OnboardingComplete: React.FC<ScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const navigationFrom = route?.params?.navigationFrom;

  const handleContinue = () => {
    // If accessed from Settings, navigate back to Settings
    if (
      navigationFrom === NAV_ROUTES.SETTINGS_MAIN ||
      navigationFrom === "SettingsMain"
    ) {
      navigation.goBack();
    } else {
      // Otherwise, reset to main stack for initial onboarding flow
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: NAV_ROUTES.MAIN_STACK }],
        }),
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.WHITE}
        translucent={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "95%" }]} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Shake Hand Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={Images.SHAKE_HAND}
              style={styles.shakeHandIcon}
              resizeMode="contain"
            />
          </View>

          {/* Main Heading */}
          <Text style={styles.mainHeading}>{t("onboarding.all_set")}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t("onboarding.insights_prepared")}
          </Text>

          {/* Security Card */}
          <ImageBackground
            source={Images.LINEARGRADIENT_BG2}
            style={styles.securityCard}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            {/* Secure Icon with gradient background */}
            <View style={styles.secureIconContainer}>
              <Image
                source={Images.SECURE_ICON}
                style={styles.secureIcon}
                resizeMode="contain"
              />
            </View>

            {/* Card Content */}
            <View style={styles.secureCardcontent}>
              <Text style={styles.cardTitle}>
                {t("onboarding.feelings_safe")}
              </Text>
              <Text style={styles.cardDescription}>
                {t("onboarding.privacy_message")}
              </Text>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/images/arrow-left.png")}
              style={styles.backButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {t("common.continue")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  progressContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(16),
    paddingBottom: Matrics.vs(12),
  },
  progressBar: {
    height: Matrics.vs(7),
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Matrics.s(8),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(8),
  },
  content: {
    paddingHorizontal: Matrics.s(20),
    alignItems: "center",
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(20),
  },
  iconContainer: {
    marginBottom: Matrics.vs(30),
    alignItems: "center",
    justifyContent: "center",
  },
  shakeHandIcon: {
    width: Matrics.s(160),
    height: Matrics.s(160),
  },
  mainHeading: {
    fontSize: Matrics.ms(32),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    textAlign: "center",
    marginBottom: Matrics.vs(15),
    lineHeight: Matrics.vs(28),
  },
  subtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(16),
    marginBottom: Matrics.vs(60),
    paddingHorizontal: Matrics.s(18),
  },
  securityCard: {
    width: "100%",
    borderRadius: Matrics.s(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
    alignItems: "center",
  },
  cardImageStyle: {
    borderRadius: Matrics.s(16),
  },
  secureIconContainer: {
    width: Matrics.s(40),
    height: Matrics.s(40),
    borderRadius: Matrics.s(10),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Matrics.vs(10),
    marginTop: Matrics.vs(-18),
  },
  secureIcon: {
    width: "100%",
    height: "100%",
  },
  secureCardcontent: {
    paddingHorizontal: Matrics.s(15),
    paddingBottom: Matrics.vs(20),
  },
  cardTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    textAlign: "center",
    marginBottom: Matrics.vs(8),
  },
  cardDescription: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(16),
  },
  bottomContainer: {
    paddingHorizontal: Matrics.s(20),
    backgroundColor: colors.WHITE,
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(10),
  },
  bottomInner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(15),
  },
  backButton: {
    width: Matrics.s(50),
    minWidth: Matrics.s(50),
    height: Matrics.s(50),
    borderRadius: Matrics.s(100),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: colors.TEXT_DARK,
  },
  backButtonIcon: {
    width: Matrics.s(22),
    minWidth: Matrics.s(22),
    height: Matrics.s(22),
    tintColor: colors.TEXT_DARK,
  },
  continueButton: {
    flex: 1,
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(28),
    paddingVertical: Matrics.vs(16),
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
});

export default OnboardingComplete;
