import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import {
  colors,
  Matrics,
  FontsSize,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";
import {
  AnalyzerNavigationProp,
  PartnerPortraitResultRouteProp,
} from "../../interfaces/navigationTypes";
import { PortraitSection } from "../../interfaces/analyzerInterfaces";
import analyzerService from "../../services/analyzerService";
import { toastMessageError } from "../../components/common/ToastMessage";
import useTranslation from "../../hooks/useTranslation";
import { getInitials, getTitleCase } from "../../utils/helper";
import LinearGradient from "react-native-linear-gradient";
import FullPageLoader from "../../components/common/FullPageLoader";
import BlurWrapper from "../../components/common/BlurWrapper";

import { captureRef } from "react-native-view-shot";
import ImageShare from "react-native-share";
import useAuth from "../../hooks/useAuth";
import ProgressBar from "../../components/analyzer/ProgressBar";
import {
  APP_STORE_LINK,
  SHARE_FOOTER_TEXT,
  SHARE_PREFILLED_TEXT,
} from "../../constants/commonConstant";

interface Props {
  navigation: AnalyzerNavigationProp;
  route: PartnerPortraitResultRouteProp;
}

export const PORTRAIT_SECTION_ICONS = {
  "into_you": Images.INTO_YOU,
  "detected_behavioral_pattern": Images.BEHAVIORAL_PATTERN,
  "detected_communication_styles": Images.COMMUNICATION_STYLE,
  "consistency_&_effort": Images.CONSISTENCY_EFFORT,
  "trust_&_credibility": Images.TRUST_CREDIBILITY,
  "emotional_availability": Images.EMOTIONAL_AVAILABILITY,
};

const FLAG_TYPES = ["red_flags", "green_flags"] as const;

interface FlagCardProps {
  type: "red" | "green";
  title: string;
  subtitle: string;
  items: string[];
  icon: number;
  iconStyle?: object;
}

const FlagCard: React.FC<FlagCardProps> = ({
  type,
  title,
  subtitle,
  items,
  icon,
  iconStyle,
}) => (
  <View
    style={[
      styles.flagCard,
      type === "red" ? styles.redFlagCard : styles.greenFlagCard,
    ]}
  >
    <View style={styles.flagCardTitleRow}>
      <Image source={icon} style={iconStyle || styles.flagCardIcon} />
      <Text
        style={[
          styles.flagCardTitle,
          type === "red" ? styles.redFlagTitle : styles.greenFlagTitle,
        ]}
      >
        {title}
      </Text>
    </View>
    <Text style={styles.flagCardSubtitle}>{subtitle}</Text>
    {items.length > 0 && (
      <View style={styles.flagBulletListContainer}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.flagBulletItem}>
            <Text style={styles.flagBulletPoint}>•</Text>
            <Text style={styles.flagBulletText}>{item}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const PartnerPortraitResult: React.FC<Props> = ({ navigation, route }) => {
  const profile = route.params.profile;
  const { t } = useTranslation();

  const { authData } = useAuth();
  const currentPlan = authData?.plan;

  // Helper function to check if user has no plan
  const hasNoPlan = currentPlan?.product_id === null || currentPlan?.product_id === undefined;

  const handleUnlockPress = () => {
    navigation.navigate("Subscription" as never);
  };

  const BlurWithUnlock: React.FC<{
    children: React.ReactNode;
    blurAmount?: number;
    borderRadius?: number;
  }> = ({ children, blurAmount = 8, borderRadius }) => {
    return (
      <View style={styles.unlockBlurContainer}>
        <BlurWrapper blurAmount={blurAmount} borderRadius={borderRadius}>
          {children}
        </BlurWrapper>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleUnlockPress}
          style={styles.unlockOverlay}
        >
          <View style={styles.unlockContainer}>
             <Image source={Images.UNLOCK_PARTNER_PORTAIT} style={styles.unlockIcon} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHalfBlurredText = (text: string) => {
    if (!hasNoPlan) {
      return <Text style={styles.contextText}>{text}</Text>;
    }

    const words = text.split(" ");
    const halfPoint = Math.ceil(words.length / 2);
    const firstHalf = words.slice(0, halfPoint).join(" ");
    const secondHalf = words.slice(halfPoint).join(" ");

    return (
      <View>
        <Text style={styles.contextText}>{firstHalf}</Text>
        <BlurWithUnlock blurAmount={5}>
          <Text style={styles.contextText}>{secondHalf}</Text>
        </BlurWithUnlock>
      </View>
    );
  };

  const overviewSectionRef = useRef<View>(null);
  const coreTraitsSectionRef = useRef<View>(null);
  const extendedInsightsSectionRef = useRef<View>(null);

  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<
    PortraitSection[] | null
  >(null);
  const [partnerPersona, setPartnerPersona] = useState<string | null>(null);
  const [keyInsights, setKeyInsights] = useState<string[] | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async () => {
    try {
      setIsCapturing(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const uri = await captureRef(overviewSectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      const uri2 = await captureRef(coreTraitsSectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      const uri3 = await captureRef(extendedInsightsSectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      setIsCapturing(false);

      const shareOptions = {
        title: t("analyzer.portrait.analysis_result"),
        message: `${t("analyzer.portrait.share_message")}\n${SHARE_FOOTER_TEXT}\n${APP_STORE_LINK}`,
        urls: [uri, uri2, uri3],
        type: "image/png",
        failOnCancel: false,
      };

      await ImageShare.open(shareOptions);
    } catch (error) {
      setIsCapturing(false);
      const err = error as { message?: string };
      if (err && err.message && !err.message.includes("User did not share")) {
        toastMessageError(t("common.something_went_wrong"));
      }
    }
  };

  useEffect(() => {
    // Fetch analysis data whenever input parameters change or when the screen first mounts
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        // Call the text analysis endpoint when the user has entered plain text
        const response = await analyzerService.generatePortrait({
          profile_id: Number(profile.id),
        });
        if (!response.success) {
          toastMessageError(
            response.message || t("analyzer.text_analyzer.analysis_failed"),
          );
          navigation.goBack();
          return;
        }
        if (!response.data) {
          if (response.extra_data?.insufficient_data) {
            setAnalysisResult(null);
            setPartnerPersona(null);
            setKeyInsights(null);
            return;
          }
          toastMessageError(
            response.message || t("analyzer.text_analyzer.analysis_failed"),
          );
          // navigation.goBack();
          return;
        }
        // Check if summary exists
        if (!response.data || !response.data.has_summary) {
          setAnalysisResult(null);
          setPartnerPersona(null);
          setKeyInsights(null);
        } else {
          setAnalysisResult(response.data.sections);
          setPartnerPersona(response.data.partner_persona);
          setKeyInsights(response.data.key_insights);
        }
      } catch (error) {
        toastMessageError(
          t("common.something_went_wrong"),
          t("common.try_again_later"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [profile]);

  if (loading) {
    // Show a skeleton layout while the analysis request is in progress
    return (
      <LinearGradient
        colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
        locations={[0.1977, 1]}
        style={styles.container}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={false}
        />
        <FullPageLoader />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={overviewSectionRef}
          collapsable={false}
          style={styles.snapshotContainer}
        >

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(profile.name)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {getTitleCase(profile.name)}
                </Text>
                <View style={styles.tagsContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{profile.age}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {getTitleCase(profile.gender)}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {getTitleCase(profile.relationship)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Analysis Results Section */}
          {!analysisResult && !partnerPersona ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                {t("analyzer.portrait.not_enough_data")}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                {t("analyzer.portrait.analysis_result")}
              </Text>

              {/* Key Insights Card */}
              {keyInsights && keyInsights.length > 0 && (
                <ImageBackground
                  source={Images.RESPONSE_BG}
                  style={styles.card}
                  imageStyle={styles.cardImageStyle}
                  resizeMode="cover"
                >
                  <View
                    style={[
                      styles.cardTitleRow,
                      { marginBottom: Matrics.vs(15) },
                    ]}
                  >
                    <Image
                      source={Images.KEY_INSIGHTS}
                      style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon}
                    />
                    <Text style={styles.cardTitle}>
                      {t("analyzer.portrait.key_insights")}
                    </Text>
                  </View>
                  <View style={styles.bulletListContainer}>
                    {keyInsights.map((insight, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                </ImageBackground>
              )}

              {/* Partner Persona Card */}
              {partnerPersona && (
                <ImageBackground
                  source={Images.RESPONSE_BG}
                  style={styles.card}
                  imageStyle={styles.cardImageStyle}
                  resizeMode="cover"
                >
                  <View
                    style={[
                      styles.cardTitleRow,
                      { marginBottom: Matrics.vs(15) },
                    ]}
                  >
                    <Image
                      source={Images.PARTNER_PERSONA}
                      style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon}
                    />
                    <Text style={styles.cardTitle}>
                      {t("analyzer.portrait.partner_persona")}
                    </Text>
                  </View>
                  <Text style={styles.personaText}>{partnerPersona}</Text>
                </ImageBackground>
              )}
            </>
          )}

          {isCapturing && (
            <Text style={styles.shareCardPageIndicator}>1/3</Text>
          )}
        </View>

        {!analysisResult && !partnerPersona ? null : (
          <>
          <View
            ref={coreTraitsSectionRef}
            collapsable={false}
            style={styles.snapshotContainer}
          >

            {/* Regular Section Cards - First half (Into You, Behavioral Pattern, Communication Styles) */}
            {analysisResult && analysisResult.length > 0
              ? analysisResult
                  .filter(
                    (section: PortraitSection) =>
                      section.section_name !== "red_flags" &&
                      section.section_name !== "green_flags",
                  )
                  .slice(0, 3)
                  .map((section: PortraitSection, index: number) => {
                    return (
                      <View key={index}>
                        <TouchableOpacity activeOpacity={1}>
                          <ImageBackground
                            source={Images.RESPONSE_BG}
                            style={styles.card}
                            imageStyle={styles.cardImageStyle}
                            resizeMode="cover"
                          >
                            <View style={styles.toggleHeader}>
                              <View
                                style={[
                                  styles.cardTitleRow,
                                  {
                                    width:
                                      section.percentage || section.scale
                                        ? "40%"
                                        : "100%",
                                  },
                                ]}
                              >
                                <Image
                                  source={
                                    PORTRAIT_SECTION_ICONS[
                                      section.section_name as keyof typeof PORTRAIT_SECTION_ICONS
                                    ]
                                  }
                                  style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon}
                                />
                                <Text style={styles.cardTitle}>
                                  {section.title}
                                </Text>
                              </View>
                              {(section.percentage || section.scale) && (
                                <View style={styles.ratingRow}>
                                  <View style={styles.ratingBadge}>
                                    {section.percentage && (
                                      <Text style={styles.ratingText}>
                                        {section.percentage}
                                        {t("analyzer.portrait.percent_sign")}
                                      </Text>
                                    )}
                                    {section.scale && (
                                      <Text style={styles.ratingText}>
                                        {section.scale}
                                        {t("analyzer.portrait.out_of_ten")}
                                      </Text>
                                    )}
                                  </View>
                                  {section.change_direction != null &&
                                    section.change_percentile != null && (
                                      <View
                                        style={[
                                          styles.changeIndicator,
                                          section.change_direction ===
                                            "higher" &&
                                            styles.changeIndicatorUp,
                                          section.change_direction ===
                                            "lower" &&
                                            styles.changeIndicatorDown,
                                          section.change_direction ===
                                            "stable" &&
                                            styles.changeIndicatorStable,
                                        ]}
                                      >
                                        {section.change_direction ===
                                        "higher" ? (
                                          <Image
                                            source={Images.INCREASED_ICON}
                                            style={styles.changeIcon}
                                          />
                                        ) : section.change_direction ===
                                          "lower" ? (
                                          <Image
                                            source={Images.DECREASED_ICON}
                                            style={styles.changeIcon}
                                          />
                                        ) : (
                                          <Image
                                            source={Images.STABLE_ICON}
                                            style={styles.changeIcon}
                                          />
                                        )}
                                        {section.change_percentile != null && (
                                          <Text
                                            style={[
                                              styles.changePercentile,
                                              section.change_direction ===
                                                "higher" &&
                                                styles.changeArrowUp,
                                              section.change_direction ===
                                                "lower" &&
                                                styles.changeArrowDown,
                                              section.change_direction ===
                                                "stable" &&
                                                styles.changeArrowStable,
                                            ]}
                                          >
                                            {section.change_percentile}%
                                          </Text>
                                        )}
                                      </View>
                                    )}
                                </View>
                              )}
                            </View>

                            <View style={styles.styleTagsContainer}>
                              {section.tags &&
                                section?.tags.map((tag, tagIndex) => (
                                  <View key={tagIndex} style={styles.styleTag}>
                                    <Text style={styles.styleTagText}>
                                      {getTitleCase(tag)}
                                    </Text>
                                  </View>
                                ))}
                            </View>

                            {section.section_name === "into_you" &&
                              section.percentage != null && (
                                <ProgressBar
                                  percentage={section.percentage}
                                  tooltipLabel={section.percentage_label || ""}
                                  tooltipColor="#2F59EB"
                                />
                              )}

                            <View style={styles.expandedContent}>
                              <Text style={styles.contextLabel}>
                                {t("analyzer.portrait.context")}
                              </Text>
                              {(section.section_name === "into_you" && hasNoPlan) ||
                               (section.section_name === "detected_communication_styles" && hasNoPlan) ||
                               (section.section_name === "trust_&_credibility" && hasNoPlan) ? (
                                <BlurWithUnlock blurAmount={8}>
                                  <Text style={styles.contextText}>{section?.context}</Text>
                                </BlurWithUnlock>
                              ) : (section.section_name === "detected_behavioral_pattern" && hasNoPlan) ||
                                     (section.section_name === "consistency_&_effort" && hasNoPlan) ? (
                                renderHalfBlurredText(section?.context || '')
                              ) : (
                                <Text style={styles.contextText}>
                                  {section?.context}
                                </Text>
                              )}
                            </View>
                          </ImageBackground>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              : ""}

            {isCapturing && (
              <Text style={styles.shareCardPageIndicator}>2/3</Text>
            )}
          </View>

          <View
            ref={extendedInsightsSectionRef}
            collapsable={false}
            style={styles.snapshotContainer}
          >

            {/* Regular Section Cards - Second half (Consistency & Effort, Trust & Credibility, Emotional Availability) */}
            {analysisResult && analysisResult.length > 0
              ? analysisResult
                  .filter(
                    (section: PortraitSection) =>
                      section.section_name !== "red_flags" &&
                      section.section_name !== "green_flags",
                  )
                  .slice(3)
                  .map((section: PortraitSection, index: number) => {
                    return (
                      <View key={index}>
                        <TouchableOpacity activeOpacity={1}>
                          <ImageBackground
                            source={Images.RESPONSE_BG}
                            style={styles.card}
                            imageStyle={styles.cardImageStyle}
                            resizeMode="cover"
                          >
                            <View style={styles.toggleHeader}>
                              <View
                                style={[
                                  styles.cardTitleRow,
                                  {
                                    width:
                                      section.percentage || section.scale
                                        ? "40%"
                                        : "100%",
                                  },
                                ]}
                              >
                                <Image
                                  source={
                                    PORTRAIT_SECTION_ICONS[
                                      section.section_name as keyof typeof PORTRAIT_SECTION_ICONS
                                    ]
                                  }
                                  style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon}
                                />
                                <Text style={styles.cardTitle}>
                                  {section.title}
                                </Text>
                              </View>
                              {(section.percentage || section.scale) && (
                                <View style={styles.ratingRow}>
                                  <View style={styles.ratingBadge}>
                                    {section.percentage && (
                                      <Text style={styles.ratingText}>
                                        {section.percentage}
                                        {t("analyzer.portrait.percent_sign")}
                                      </Text>
                                    )}
                                    {section.scale && (
                                      <Text style={styles.ratingText}>
                                        {section.scale}
                                        {t("analyzer.portrait.out_of_ten")}
                                      </Text>
                                    )}
                                  </View>
                                  {section.change_direction != null &&
                                    section.change_percentile != null && (
                                      <View
                                        style={[
                                          styles.changeIndicator,
                                          section.change_direction ===
                                            "higher" &&
                                            styles.changeIndicatorUp,
                                          section.change_direction ===
                                            "lower" &&
                                            styles.changeIndicatorDown,
                                          section.change_direction ===
                                            "stable" &&
                                            styles.changeIndicatorStable,
                                        ]}
                                      >
                                        {section.change_direction ===
                                        "higher" ? (
                                          <Image
                                            source={Images.INCREASED_ICON}
                                            style={styles.changeIcon}
                                          />
                                        ) : section.change_direction ===
                                          "lower" ? (
                                          <Image
                                            source={Images.DECREASED_ICON}
                                            style={styles.changeIcon}
                                          />
                                        ) : (
                                          <Image
                                            source={Images.STABLE_ICON}
                                            style={styles.changeIcon}
                                          />
                                        )}
                                        {section.change_percentile != null && (
                                          <Text
                                            style={[
                                              styles.changePercentile,
                                              section.change_direction ===
                                                "higher" &&
                                                styles.changeArrowUp,
                                              section.change_direction ===
                                                "lower" &&
                                                styles.changeArrowDown,
                                              section.change_direction ===
                                                "stable" &&
                                                styles.changeArrowStable,
                                            ]}
                                          >
                                            {section.change_percentile}%
                                          </Text>
                                        )}
                                      </View>
                                    )}
                                </View>
                              )}
                            </View>

                            <View style={styles.styleTagsContainer}>
                              {section.tags &&
                                section?.tags.map((tag, tagIndex) => (
                                  <View key={tagIndex} style={styles.styleTag}>
                                    <Text style={styles.styleTagText}>
                                      {getTitleCase(tag)}
                                    </Text>
                                  </View>
                                ))}
                            </View>

                            {section.section_name === "into_you" &&
                              section.percentage != null && (
                                <ProgressBar
                                  percentage={section.percentage}
                                  tooltipLabel={section.percentage_label || ""}
                                  tooltipColor="#2F59EB"
                                />
                              )}

                            <View style={styles.expandedContent}>
                              <Text style={styles.contextLabel}>
                                {t("analyzer.portrait.context")}
                              </Text>
                              {(section.section_name === "into_you" && hasNoPlan) ||
                               (section.section_name === "detected_communication_styles" && hasNoPlan) ||
                               (section.section_name === "trust_&_credibility" && hasNoPlan) ? (
                                <BlurWithUnlock blurAmount={8}>
                                  <Text style={styles.contextText}>{section?.context}</Text>
                                </BlurWithUnlock>
                              ) : (section.section_name === "detected_behavioral_pattern" && hasNoPlan) ||
                                     (section.section_name === "consistency_&_effort" && hasNoPlan) ? (
                                renderHalfBlurredText(section?.context || '')
                              ) : (
                                <Text style={styles.contextText}>
                                  {section?.context}
                                </Text>
                              )}
                            </View>
                          </ImageBackground>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              : ""}

            {/* Relationship Signals Section - Red & Green Flags */}
            {analysisResult &&
              analysisResult.some(
                (section: PortraitSection) =>
                  FLAG_TYPES.includes(
                    section.section_name as (typeof FLAG_TYPES)[number],
                  ) &&
                  Array.isArray(section.context) &&
                  section.context.length > 0,
              ) && (
                <>
                  <Text style={styles.sectionTitle}>
                    {t("analyzer.portrait.relationship_signals")}
                  </Text>

                  {analysisResult
                    .filter(
                      (section: PortraitSection) =>
                        section.section_name === "red_flags",
                    )
                    .map((section: PortraitSection, index: number) => {
                      const items = Array.isArray(section.context)
                        ? section.context
                        : [];

                      if (items.length === 0) return null;

                    return (
                      <View key={`red-${index}`}>
                        {hasNoPlan ? (
                          <BlurWithUnlock blurAmount={5}>
                            <FlagCard
                              type="red"
                              title={t("analyzer.portrait.red_flags")}
                              subtitle={t("analyzer.portrait.red_flags_subtitle")}
                              items={items}
                              icon={Images.RED_FLAG_ICON}
                              iconStyle={isCapturing ? styles.shareFlagCardIcon : undefined}
                            />
                          </BlurWithUnlock>
                        ) : (
                          <FlagCard
                            type="red"
                            title={t("analyzer.portrait.red_flags")}
                            subtitle={t("analyzer.portrait.red_flags_subtitle")}
                            items={items}
                            icon={Images.RED_FLAG_ICON}
                            iconStyle={isCapturing ? styles.shareFlagCardIcon : undefined}
                          />
                        )}
                      </View>
                    );
                  })}

                  {analysisResult
                    .filter(
                      (section: PortraitSection) =>
                        section.section_name === "green_flags",
                    )
                    .map((section: PortraitSection, index: number) => {
                      const items = Array.isArray(section.context)
                        ? section.context
                        : [];

                      if (items.length === 0) return null;

                    return (
                      <View key={`green-${index}`}>
                        {hasNoPlan ? (
                          <BlurWithUnlock blurAmount={5}>
                            <FlagCard
                              type="green"
                              title={t("analyzer.portrait.green_flags")}
                              subtitle={t("analyzer.portrait.green_flags_subtitle")}
                              items={items}
                              icon={Images.GREEN_FLAG_ICON}
                              iconStyle={isCapturing ? styles.shareFlagCardIcon : undefined}
                            />
                          </BlurWithUnlock>
                        ) : (
                          <FlagCard
                            type="green"
                            title={t("analyzer.portrait.green_flags")}
                            subtitle={t("analyzer.portrait.green_flags_subtitle")}
                            items={items}
                            icon={Images.GREEN_FLAG_ICON}
                            iconStyle={isCapturing ? styles.shareFlagCardIcon : undefined}
                          />
                        )}
                      </View>
                    );
                  })}
              </>
            )}

            {isCapturing && (
              <Text style={styles.shareCardPageIndicator}>3/3</Text>
            )}
          </View>
          </>
        )}
      </ScrollView>

      {!(!analysisResult && !partnerPersona) && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleShare}
          style={styles.floatingShareButton}
        >
          <Image source={Images.SHARE_ICON} style={styles.floatingShareIcon} />
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  snapshotContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Matrics.ms(20),
    paddingVertical: Matrics.vs(15),
  },
  unlockBlurContainer: {
    position: "relative",
  },
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,

    
  },
  unlockContainer: {
    width: "100%",
    height: "100%",
    padding: Matrics.s(10),
  },
  unlockIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingHorizontal moved to snapshot container to ensure clean share captures
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40),
  },
  // Profile Card Styles
  profileCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(15),
    marginBottom: Matrics.vs(10),
    backgroundColor: "rgba(47, 89, 235, 0.2)",
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: Matrics.s(46),
    height: Matrics.s(46),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: Matrics.s(100),
  },
  avatarText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  profileInfo: {
    marginLeft: Matrics.s(12),
    flex: 1,
  },
  profileName: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(4),
  },
  tagsContainer: {
    flexDirection: "row",
    gap: Matrics.s(6),
  },
  tag: {
    backgroundColor: "rgba(47, 89, 235, 0.15)",
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(3),
    borderRadius: Matrics.s(100),
  },
  tagText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  // Section Title
  sectionTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
    marginTop: Matrics.vs(6),
  },
  // Card Styles
  card: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(20),
    marginBottom: Matrics.vs(15),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
    overflow: "hidden",
  },
  cardImageStyle: {
    borderRadius: Matrics.s(10),
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: Matrics.vs(10),
    gap: Matrics.s(10),
  },
  cardTitleIcon: {
    width: Matrics.s(22),
    height: Matrics.s(22),
  },
  shareCardTitleIcon: {
    width: Matrics.s(18),
    height: Matrics.s(18),
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  personaText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  // Toggle Card Styles
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(0),
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(6),
  },
  ratingBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(2),
    borderRadius: Matrics.s(100),
    borderWidth: 1,
    borderColor: colors.PRIMARY,
  },
  ratingText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.PRIMARY,
    lineHeight: Matrics.vs(14),
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(3),
    paddingHorizontal: Matrics.s(8),
    paddingVertical: Matrics.vs(2),
    borderRadius: Matrics.s(100),
    borderWidth: 1,
    borderStyle: "solid",
  },
  changeIndicatorUp: {
    backgroundColor: "transparent",
    borderColor: "#358610",
  },
  changeIndicatorDown: {
    backgroundColor: "transparent",
    borderColor: "#C42828",
  },
  changeIndicatorStable: {
    backgroundColor: "transparent",
    borderColor: "rgba(142, 142, 147, 0.8)",
  },
  changeIcon: {
    width: Matrics.s(12),
    height: Matrics.s(12),
  },
  changeArrowUp: {
    color: "#358610",
  },
  changeArrowDown: {
    color: "#C42828",
  },
  changeArrowStable: {
    color: "#8E8E93",
  },
  changePercentile: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
  },
  chevronContainer: {
    width: Matrics.s(44),
    height: Matrics.s(24),
    alignItems: "center",
    justifyContent: "center",
  },
  chevronContainerUp: {
    transform: [{ rotate: "180deg" }],
  },
  chevronIcon: {
    width: Matrics.s(14),
    height: Matrics.s(14),
    tintColor: colors.TEXT_DARK,
  },
  expandedContent: {
    marginTop: Matrics.vs(10),
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(31, 31, 31, 0.1)",
    marginBottom: Matrics.vs(16),
  },
  contextLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.6,
    marginBottom: Matrics.vs(10),
  },
  contextText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  // Communication Style Tags
  emotionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.s(10),
  },
  styleTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.s(8),
    marginTop: Matrics.vs(10),
  },
  styleTag: {
    backgroundColor: "rgba(146, 129, 233, 0.12)",
    paddingVertical: Matrics.vs(6),
    paddingHorizontal: Matrics.s(14),
    borderRadius: Matrics.s(100),
  },
  styleTagText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  skeletonAvatar: {
    width: Matrics.s(46),
    height: Matrics.s(46),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  skeletonLine: {
    height: Matrics.vs(12),
    borderRadius: Matrics.s(6),
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    marginVertical: Matrics.vs(4),
  },
  skeletonTag: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(8),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(6),
  },
  skeletonEmotionTag: {
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    paddingHorizontal: Matrics.s(28),
    paddingVertical: Matrics.vs(10),
    borderRadius: Matrics.s(100),
  },
  noDataContainer: {
    marginTop: Matrics.vs(20),
    padding: Matrics.s(20),
    backgroundColor: "rgba(47, 89, 235, 0.1)",
    borderRadius: Matrics.s(10),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
  },
  noDataText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(22),
  },
  bulletListContainer: {
    marginTop: Matrics.vs(4),
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Matrics.vs(8),
  },
  bulletPoint: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(8),
    lineHeight: Matrics.vs(18),
  },
  bulletText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  flagCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(20),
    marginBottom: Matrics.vs(15),
    borderWidth: 1,
    overflow: "hidden",
  },
  redFlagCard: {
    backgroundColor: "#C428280D",
    borderColor: "#C4282833",
  },
  greenFlagCard: {
    backgroundColor: "#3586100D",
    borderColor: "#35861033",
  },
  flagCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(10),
  },
  flagCardIcon: {
    width: Matrics.s(22),
    height: Matrics.s(22),
  },
  shareFlagCardIcon: {
    width: Matrics.s(18),
    height: Matrics.s(18),
  },
  flagCardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  redFlagTitle: {
    color: "#C42828",
  },
  greenFlagTitle: {
    color: "#358610",
  },
  flagCardSubtitle: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.6,
    marginTop: Matrics.vs(10),
    marginBottom: Matrics.vs(10),
  },
  flagBulletListContainer: {
    marginTop: Matrics.vs(4),
  },
  flagBulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Matrics.vs(8),
  },
  flagBulletPoint: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(8),
    lineHeight: Matrics.vs(18),
  },
  flagBulletText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  shareCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(12),
  },
  shareCardTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
  },
  shareCardPageIndicator: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.5,
    textAlign: "center",
    marginTop: Matrics.vs(12),
  },
  shareCardFooterText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    opacity: 0.4,
    textAlign: "center",
    marginTop: Matrics.vs(12),
  },
  floatingShareButton: {
    position: "absolute",
    right: Matrics.s(24),
    bottom: Matrics.vs(24),
    width: Matrics.s(48),
    height: Matrics.s(48),
    borderRadius: Matrics.s(24),
    backgroundColor: colors.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  floatingShareIcon: {
    width: Matrics.s(18),
    height: Matrics.s(18),
    tintColor: colors.WHITE,
  },
});

export default PartnerPortraitResult;
