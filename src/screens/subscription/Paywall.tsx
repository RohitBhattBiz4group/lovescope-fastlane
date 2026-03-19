import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";

type PlanType = "monthly" | "yearly";

interface PlanFeature {
  text: string;
}

const PRO_FEATURES: PlanFeature[] = [
  { text: "Create a max of 10 profiles" },
  { text: "Unlimited analyses" },
  { text: "Unlimited evaluations" },
  { text: "Unlimited messages with full response priority" },
  { text: "Unlimited quiz sending and participation" },
];

const Paywall = ({ navigation }: ScreenProps) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("monthly");

  const renderFeatureItem = (feature: PlanFeature, index: number) => (
    <View key={index} style={styles.featureItem}>
      <View style={styles.bulletPoint} />
      <Text style={styles.featureText}>{feature.text}</Text>
    </View>
  );

  const handleGetFullAccess = () => {
    // Handle purchase logic here
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.mainTitle}>
          {t("subscription.get_unlimited_access")}
        </Text>

        {/* Monthly Plan Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedPlan("monthly")}
        >
          <ImageBackground
            source={Images.PAYWALL_CARDBG}
            style={styles.planCard}
            imageStyle={styles.planCardImageStyle}
            resizeMode="cover"
          >
            <View style={styles.planCardContent}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPlan === "monthly" && styles.radioOuterSelected,
                ]}
              >
                {selectedPlan === "monthly" && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.planDetails}>
                <Text style={styles.planName}>{t("subscription.monthly")}</Text>
                <Text style={styles.planPrice}>$9.99/month</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Yearly Plan Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedPlan("yearly")}
        >
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.planCard}
            imageStyle={styles.planCardImageStyle}
            resizeMode="cover"
          >
            <View style={styles.planCardContent}>
              <View
                style={[
                  styles.radioOuter,
                  selectedPlan === "yearly" && styles.radioOuterSelected,
                ]}
              >
                {selectedPlan === "yearly" && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.planDetails}>
                <Text style={styles.planName}>{t("subscription.yearly")}</Text>
                <Text style={styles.planPrice}>$7.99/month</Text>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 20%</Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Included Features */}
        <Text style={styles.featuresTitle}>{t("subscription.included_features")}</Text>
        <View style={styles.featuresList}>
          {PRO_FEATURES.map((feature, index) =>
            renderFeatureItem(feature, index)
          )}
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.getAccessButton}
          activeOpacity={0.7}
          onPress={handleGetFullAccess}
        >
          <Text style={styles.getAccessButtonText}>{t("subscription.get_full_access")}</Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.termsText}>{t("subscription.terms_of_service")}</Text>
          </TouchableOpacity>
          <View style={styles.termsDot} />
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.termsText}>{t("subscription.privacy_policy")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(20),
  },
  // Title
  mainTitle: {
    fontSize: Matrics.ms(32),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    lineHeight: Matrics.vs(32),
    marginBottom: Matrics.vs(20),
  },
  // Plan Cards
  planCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(12),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
    overflow: "hidden",
  },
  planCardImageStyle: {
    borderRadius: Matrics.s(10),
  },
  planCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  planDetails: {
    flex: 1,
    marginLeft: Matrics.s(15),
  },
  planName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(4),
    lineHeight: 18,
  },
  planPrice: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: 18,
  },
  // Radio Button
  radioOuter: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    borderRadius: Matrics.s(100),
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.WHITE,
  },
  radioOuterSelected: {
    borderColor: colors.PRIMARY,
  },
  radioInner: {
    width: Matrics.s(13),
    height: Matrics.s(13),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY,
  },
  // Save Badge
  saveBadge: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(20),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(4),
  },
  saveBadgeText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.WHITE,
    lineHeight: 16,
  },
  // Features Section
  featuresTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginTop: Matrics.vs(8),
    marginBottom: Matrics.vs(3),
  },
  featuresList: {
    gap: Matrics.vs(4),
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletPoint: {
    width: Matrics.s(4),
    height: Matrics.s(4),
    borderRadius: Matrics.s(4),
    backgroundColor: colors.TEXT_DARK,
    marginTop: Matrics.vs(10),
    marginRight: Matrics.s(10),
  },
  featureText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(22),
  },
  // Bottom Section
  bottomSection: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(15),
  },
  getAccessButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(16),
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  getAccessButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.WHITE,
    lineHeight: 18,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  termsText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_DARK,
  },
  termsDot: {
    width: Matrics.s(4),
    height: Matrics.s(4),
    borderRadius: Matrics.s(2),
    backgroundColor: colors.TEXT_DARK,
    marginHorizontal: Matrics.s(10),
  },
});

export default Paywall;
