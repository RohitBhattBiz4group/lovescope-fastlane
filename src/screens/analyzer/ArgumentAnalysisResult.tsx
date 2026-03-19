import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { AnalyzerNavigationProp, AnalyzerStackParamList } from "../../interfaces/navigationTypes";
import argumentAnalyzerService from "../../services/argumentAnalyzerService";
import {
  AnalyseArgumentRequest,
  ArgumentAnalysisResponse,
} from "../../interfaces/argumentAnalyzerInterfaces";
import {
  INPUT_FORMAT_TEXT,
  INPUT_FORMAT_IMAGE,
  SHARE_FOOTER_TEXT,
  APP_STORE_LINK,
} from "../../constants/commonConstant";
import FullPageLoader from "../../components/common/FullPageLoader";
import { getInitials } from "../../utils/helper";
import ToneComparisonBar from "../../components/analyzer/ToneComparison";
import ProgressBar from "../../components/analyzer/ProgressBar";
import EthicalResponsibilityBar from "../../components/analyzer/EthicalResponsibilityBar";
import useTranslation from "../../hooks/useTranslation";
import CardWithArc from "../../components/common/CardWithArc";
import BlurWrapper from "../../components/common/BlurWrapper";
import useAuth from "../../hooks/useAuth";

import { captureRef } from "react-native-view-shot";
import ImageShare from "react-native-share";

const ArgumentAnalysisResult: React.FC = () => {
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const route =
    useRoute<RouteProp<AnalyzerStackParamList, "ArgumentAnalysisResult">>();
  const { t } = useTranslation();

  const overviewSnapshotRef = useRef<View>(null);
  const insightsSnapshotRef = useRef<View>(null);

  const { authData } = useAuth();
  const currentPlan = authData?.plan;

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
            <Image
              source={Images.UNLOCK_ARGUMENT_ANALYSIS}
              style={styles.unlockIcon}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] =
    useState<ArgumentAnalysisResponse | null>(null);

  const profileId = route.params?.profile;
  const context = route.params?.context || "";
  const conversationText = route.params?.conversationText;
  const imageUrl = route.params?.imageUrl;
  const inputType = route.params?.inputType || INPUT_FORMAT_TEXT;
  const timelineReference = route.params?.timelineReference;
  const selected_event_id = route.params?.selected_event_id ?? undefined;
  const selected_event_title = route.params?.selected_event_title ?? undefined;
  const selected_event_summary = route.params?.selected_event_summary ?? undefined;

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const requestData: AnalyseArgumentRequest = {
          profile_id: profileId,
          context: context,
          type: inputType,
          conversation_text:
            inputType === INPUT_FORMAT_TEXT ? conversationText : undefined,
          image_url: inputType === INPUT_FORMAT_IMAGE ? imageUrl : undefined,
          timeline_reference: timelineReference ?? undefined,
          selected_event_id: selected_event_id ?? undefined,
          selected_event_title: selected_event_title ?? undefined,
          selected_event_summary: selected_event_summary ?? undefined,
        };

        const response =
          await argumentAnalyzerService.analyseArgument(requestData);

        if (response.success && response.data) {
          setAnalysisResult(response.data);
        } else {
          console.error("Analysis failed:", response.message);
        }
      } catch (error) {
        console.error("Error fetching argument analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [profileId, context, conversationText, imageUrl, inputType, timelineReference, selected_event_id, selected_event_title, selected_event_summary]);

  const hasKeyMoments =
    analysisResult?.key_moments &&
    (analysisResult.key_moments.escalation_point.length > 0 ||
      analysisResult.key_moments.stonewalling.length > 0 ||
      analysisResult.key_moments.repair_attempt.length > 0);

  const handleShare = async () => {
    try {
      if (!analysisResult) {
        return;
      }

      const uri = await captureRef(overviewSnapshotRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

        const uri2 = await captureRef(insightsSnapshotRef, {
          format: "png",
          quality: 0.8,
          result: "tmpfile",
        });

      const shareOptions = {
        title: t("analyzer.argument.result_title"),
        message: `${t("analyzer.argument.share_message")}\n${SHARE_FOOTER_TEXT}\n${APP_STORE_LINK}`,
        urls: [uri2, uri],
        type: "image/png",
        failOnCancel: false,
      };

      await ImageShare.open(shareOptions);
    } catch (error: any) {
      if (error && error.message && !error.message.includes("User did not share")) {
        console.error("Error sharing argument analysis:", error);
      }
    }
  };

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252, 1)"]}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <FullPageLoader />
          </View>
        ) : (
          <View>
            <View ref={overviewSnapshotRef} collapsable={false} style={styles.snapshotContainer}>
              {/* Profile Card */}
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitials}>
                    {getInitials(analysisResult?.profile?.name || "")}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {analysisResult?.profile?.name}
                  </Text>
                  <View style={styles.profileTags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {analysisResult?.profile?.age}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {analysisResult?.profile?.gender}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {analysisResult?.profile?.relationship_tag}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Insufficient Data Message */}
              {analysisResult?.insufficient_data ? (
                <CardWithArc>
                  <Text style={styles.insufficientDataMessage}>
                    {analysisResult.insufficient_data_message}
                  </Text>
                </CardWithArc>
              ) : (
                <>
                  {/* Analysis Result Header */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {t("analyzer.argument.result_title")}
                    </Text>
                    <Text style={styles.sectionDescription}>
                      {t("analyzer.argument.result_description")}
                    </Text>
                  </View>

                  {/* Tone Comparison Card */}
                  <CardWithArc>
                    <View style={styles.cardHeader}>
                      <Image source={Images.TONE} style={styles.cardIcon} />
                      <Text style={styles.cardTitle}>
                        {t("analyzer.argument.tone_comparison")}
                      </Text>
                    </View>

                    {analysisResult?.tone_comparison?.user && (
                      <ToneComparisonBar
                        label={t("analyzer.argument.you")}
                        toneData={analysisResult.tone_comparison.user}
                      />
                    )}

                    {analysisResult?.tone_comparison?.partner && (
                      <View style={{ marginTop: Matrics.vs(20) }}>
                        {hasNoPlan ? (
                          <BlurWithUnlock blurAmount={5}>
                            <ToneComparisonBar
                              label={t("analyzer.argument.them")}
                              toneData={analysisResult.tone_comparison.partner}
                            />
                          </BlurWithUnlock>
                        ) : (
                          <ToneComparisonBar
                            label={t("analyzer.argument.them")}
                            toneData={analysisResult.tone_comparison.partner}
                          />
                        )}
                      </View>
                    )}
                  </CardWithArc>

                  {/* Accountability Breakdown Card */}
                  {analysisResult?.accountability_breakdown && (
                    <CardWithArc>
                      <View style={styles.cardHeader}>
                        <Image
                          source={Images.ACCOUNTABILITY_ICON}
                          style={styles.cardIcon}
                        />
                        <Text style={styles.cardTitle}>
                          {t("analyzer.argument.accountability_breakdown")}
                        </Text>
                      </View>

                      <View style={styles.accountabilitySection}>
                        <Text style={styles.accountabilityLabel}>
                          {t("analyzer.argument.you")}
                        </Text>
                        <ProgressBar
                          percentage={
                            analysisResult.accountability_breakdown
                              .user_accountability_percent
                          }
                          showTooltip={false}
                          showPercentageLabel={false}
                        />
                        <Text style={styles.accountabilityPercentText}>
                          {
                            analysisResult.accountability_breakdown
                              .user_accountability_percent
                          }
                          % {t("analyzer.argument.accountability_suffix")}
                        </Text>
                      </View>

                      <View style={styles.accountabilitySection}>
                        <Text style={styles.accountabilityLabel}>
                          {t("analyzer.argument.them")}
                        </Text>
                        <ProgressBar
                          percentage={
                            analysisResult.accountability_breakdown
                              .partner_accountability_percent
                          }
                          showTooltip={false}
                          showPercentageLabel={false}
                        />
                        <Text style={styles.accountabilityPercentText}>
                          {
                            analysisResult.accountability_breakdown
                              .partner_accountability_percent
                          }
                          % {t("analyzer.argument.accountability_suffix")}
                        </Text>
                      </View>
                    </CardWithArc>
                  )}

                  {/* Emotional Maturity Score Card */}
                  {analysisResult?.emotional_maturity_score && (
                    <CardWithArc>
                      <View style={styles.cardHeader}>
                        <Image
                          source={Images.EMOTIONAL_MATURITY_ICON}
                          style={styles.cardIcon}
                        />
                        <Text style={styles.cardTitle}>
                          {t("analyzer.argument.emotional_maturity_score")}
                        </Text>
                      </View>

                      {hasNoPlan ? (
                        <BlurWithUnlock blurAmount={5}>
                          <View>
                            <View style={styles.accountabilitySection}>
                              <Text style={styles.accountabilityLabel}>
                                {t("analyzer.argument.you")}
                              </Text>
                              <ProgressBar
                                percentage={
                                  analysisResult.emotional_maturity_score.user_score
                                }
                                tooltipLabel={`${analysisResult.emotional_maturity_score.user_score}/10`}
                                showTooltip={true}
                                tooltipPosition="top"
                                minValue={0}
                                maxValue={10}
                                showPercentageLabel={false}
                              />
                            </View>

                            <View style={styles.accountabilitySection}>
                              <Text style={styles.accountabilityLabel}>
                                {t("analyzer.argument.them")}
                              </Text>
                              <ProgressBar
                                percentage={
                                  analysisResult.emotional_maturity_score.partner_score
                                }
                                tooltipLabel={`${analysisResult.emotional_maturity_score.partner_score}/10`}
                                showTooltip={true}
                                tooltipPosition="top"
                                minValue={0}
                                maxValue={10}
                                showPercentageLabel={false}
                              />
                            </View>
                          </View>
                        </BlurWithUnlock>
                      ) : (
                        <>
                          <View style={styles.accountabilitySection}>
                            <Text style={styles.accountabilityLabel}>
                              {t("analyzer.argument.you")}
                            </Text>
                            <ProgressBar
                              percentage={
                                analysisResult.emotional_maturity_score.user_score
                              }
                              tooltipLabel={`${analysisResult.emotional_maturity_score.user_score}/10`}
                              showTooltip={true}
                              tooltipPosition="top"
                              minValue={0}
                              maxValue={10}
                              showPercentageLabel={false}
                            />
                          </View>

                          <View style={styles.accountabilitySection}>
                            <Text style={styles.accountabilityLabel}>
                              {t("analyzer.argument.them")}
                            </Text>
                            <ProgressBar
                              percentage={
                                analysisResult.emotional_maturity_score.partner_score
                              }
                              tooltipLabel={`${analysisResult.emotional_maturity_score.partner_score}/10`}
                              showTooltip={true}
                              tooltipPosition="top"
                              minValue={0}
                              maxValue={10}
                              showPercentageLabel={false}
                            />
                          </View>
                        </>
                      )}
                    </CardWithArc>
                  )}

                  {/* Ethical Responsibility Bar Card */}
                  {analysisResult?.ethical_responsibility_balance && (
                    <CardWithArc>
                      <View style={styles.cardHeader}>
                        <Image
                          source={Images.ETHICAL_RESPONSIBILITY_ICON}
                          style={styles.cardIcon}
                        />
                        <Text style={styles.cardTitle}>
                          {t("analyzer.argument.ethical_responsibility_bar")}
                        </Text>
                      </View>
                      <EthicalResponsibilityBar
                        userPercent={
                          analysisResult.ethical_responsibility_balance.user_percent
                        }
                        partnerPercent={
                          analysisResult.ethical_responsibility_balance
                            .partner_percent
                        }
                      />
                    </CardWithArc>
                  )}
                </>
              )}
            </View>

            <View ref={insightsSnapshotRef} collapsable={false} style={styles.snapshotContainer}>
              {analysisResult?.insufficient_data ? null : (
                <>
                  {/* Hidden Meaning Analysis Card */}
                  {analysisResult?.hidden_meaning_analysis &&
                    analysisResult.hidden_meaning_analysis.length > 0 && (
                      <CardWithArc showBottomGlow={true}>
                        <View style={styles.cardHeader}>
                          <Image
                            source={Images.HIDDEN_MEANING_ICON}
                            style={styles.cardIcon}
                          />
                          <Text style={styles.cardTitle}>
                            {t("analyzer.argument.hidden_meaning_analysis")}
                          </Text>
                        </View>
                        {hasNoPlan ? (
                          <BlurWithUnlock blurAmount={5}>
                            <View>
                              {analysisResult.hidden_meaning_analysis.map((item, index) => (
                                <View
                                  key={`hidden-${index}`}
                                  style={[
                                    styles.hiddenMeaningItem,
                                    index > 0 && styles.hiddenMeaningItemBorder,
                                  ]}
                                >
                                  <View style={styles.hiddenMeaningMessageBox}>
                                    <Text style={styles.hiddenMeaningMessage}>
                                      "{item.message}"
                                    </Text>
                                  </View>
                                  <Text style={styles.decodedAsLabel}>
                                    {t("analyzer.argument.decoded_as")}
                                  </Text>
                                  <View style={styles.decodedPointersList}>
                                    {item.pointers.map((pointer, pIndex) => (
                                      <View
                                        key={`pointer-${index}-${pIndex}`}
                                        style={styles.decodedPointerItem}
                                      >
                                        <Text style={styles.decodedPointerBullet}>•</Text>
                                        <Text style={styles.decodedPointerText}>
                                          {pointer}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                </View>
                              ))}
                            </View>
                          </BlurWithUnlock>
                        ) : (
                          analysisResult.hidden_meaning_analysis.map((item, index) => (
                            <View
                              key={`hidden-${index}`}
                              style={[
                                styles.hiddenMeaningItem,
                                index > 0 && styles.hiddenMeaningItemBorder,
                              ]}
                            >
                              <View style={styles.hiddenMeaningMessageBox}>
                                <Text style={styles.hiddenMeaningMessage}>
                                  "{item.message}"
                                </Text>
                              </View>
                              <Text style={styles.decodedAsLabel}>
                                {t("analyzer.argument.decoded_as")}
                              </Text>
                              <View style={styles.decodedPointersList}>
                                {item.pointers.map((pointer, pIndex) => (
                                  <View
                                    key={`pointer-${index}-${pIndex}`}
                                    style={styles.decodedPointerItem}
                                  >
                                    <Text style={styles.decodedPointerBullet}>•</Text>
                                    <Text style={styles.decodedPointerText}>
                                      {pointer}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ))
                        )}
                      </CardWithArc>
                    )}

                  {/* Key Moments Card */}
                  {hasKeyMoments && (
                    <CardWithArc>
                      <View style={styles.cardHeader}>
                        <Image source={Images.KEY_MOMENTS} style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>
                          {t("analyzer.argument.key_moments")}
                        </Text>
                      </View>

                      {/* Escalation Points */}
                      {analysisResult?.key_moments?.escalation_point.length > 0 && (
                        <View style={styles.momentSection}>
                          <Text style={styles.momentSectionTitle}>
                            {t("analyzer.argument.escalation_point")}
                          </Text>
                          {analysisResult.key_moments.escalation_point.map(
                            (moment, index) => (
                              <View
                                key={`escalation-${index}`}
                                style={[
                                  styles.momentPoint,
                                  index > 0 && styles.momentPointBorder,
                                ]}
                              >
                                <View style={styles.momentHeader}>
                                  <Text style={styles.momentDescription}>
                                    "{moment.message}"
                                  </Text>
                                  <Text style={styles.momentPercentage}>
                                    {moment.percent}%
                                  </Text>
                                </View>
                                {/* <Text style={styles.momentExplanation}>{moment.explanation}</Text> */}
                              </View>
                            ),
                          )}
                        </View>
                      )}

                      {/* Stonewalling */}
                      {analysisResult?.key_moments?.stonewalling.length > 0 && (
                        <View
                          style={[styles.momentSection, styles.momentSectionBorder]}
                        >
                          <Text style={styles.momentSectionTitle}>
                            {t("analyzer.argument.stonewalling")}
                          </Text>
                          {analysisResult.key_moments.stonewalling.map(
                            (moment, index) => (
                              <View
                                key={`stonewalling-${index}`}
                                style={[
                                  styles.momentPoint,
                                  index > 0 && styles.momentPointBorder,
                                ]}
                              >
                                <View style={styles.momentHeader}>
                                  <Text style={styles.momentDescription}>
                                    "{moment.message}"
                                  </Text>
                                  <Text style={styles.momentPercentage}>
                                    {moment.percent}%
                                  </Text>
                                </View>
                                {/* <Text style={styles.momentExplanation}>{moment.explanation}</Text> */}
                              </View>
                            ),
                          )}
                        </View>
                      )}

                      {/* Repair Attempts */}
                      {analysisResult?.key_moments?.repair_attempt.length > 0 && (
                        <View
                          style={[styles.momentSection, styles.momentSectionBorder]}
                        >
                          <Text style={styles.momentSectionTitle}>
                            {t("analyzer.argument.repair_attempt")}
                          </Text>
                          {analysisResult.key_moments.repair_attempt.map(
                            (moment, index) => (
                              <View
                                key={`repair-${index}`}
                                style={[
                                  styles.momentPoint,
                                  index > 0 && styles.momentPointBorder,
                                ]}
                              >
                                <View style={styles.momentHeader}>
                                  <Text style={styles.momentDescription}>
                                    "{moment.message}"
                                  </Text>
                                  <Text style={styles.momentPercentage}>
                                    {moment.percent}%
                                  </Text>
                                </View>
                                {/* <Text style={styles.momentExplanation}>{moment.explanation}</Text> */}
                              </View>
                            ),
                          )}
                        </View>
                      )}
                    </CardWithArc>
                  )}

                  {/* Final Summary Card */}
                  <CardWithArc>
                    <View style={styles.cardHeader}>
                      <Image
                        source={Images.FINAL_SUMMARY_ICON}
                        style={styles.cardIcon}
                      />
                      <Text style={styles.cardTitle}>
                        {t("analyzer.argument.final_summary")}
                      </Text>
                    </View>
                    <Text style={styles.conflictText}>
                      {analysisResult?.final_summary_detailed}
                    </Text>
                  </CardWithArc>

                  {/* Conflict Pattern Card */}
                  <CardWithArc>
                    <View style={styles.cardHeader}>
                      <Image source={Images.CONFLICT_ICON} style={styles.cardIcon} />
                      <Text style={styles.cardTitle}>
                        {t("analyzer.argument.conflict_pattern")}
                      </Text>
                    </View>
                    <Text style={styles.conflictText}>
                      {analysisResult?.conflict_pattern?.explanation}
                    </Text>
                  </CardWithArc>
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {analysisResult && !loading && (
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
    paddingBottom: Matrics.vs(40),
    paddingTop: Matrics.vs(0),
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.ms(20),
    paddingVertical: Matrics.vs(16),
    backgroundColor: "transparent",
  },
  backButton: {
    width: Matrics.s(40),
    height: Matrics.s(40),
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    flex: 1,
    textAlign: "center",
  },
  notificationButton: {
    width: Matrics.s(40),
    height: Matrics.s(40),
    alignItems: "center",
    justifyContent: "center",
  },
  notificationIcon: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    resizeMode: "contain",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingBottom: Matrics.vs(40),
    flexGrow: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.ms(10),
    paddingVertical: Matrics.vs(15),
    borderRadius: Matrics.ms(10),
    marginBottom: Matrics.vs(20),
    backgroundColor: "rgba(47, 89, 235, 0.2)",
  },
  profileAvatar: {
    width: Matrics.s(44),
    height: Matrics.s(44),
    borderRadius: Matrics.ms(100),
    backgroundColor: colors.WHITE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(12),
  },
  profileInitials: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  profileTags: {
    flexDirection: "row",
    gap: Matrics.s(8),
  },
  tag: {
    backgroundColor: "rgba(47, 89, 235, 0.2)",
    paddingVertical: Matrics.ms(2),
    paddingHorizontal: Matrics.ms(12),
    borderRadius: Matrics.ms(100),
  },
  tagText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  sectionHeader: {
    marginBottom: Matrics.vs(16),
  },
  sectionTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
  },
  sectionDescription: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  card: {
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.ms(10),
    padding: Matrics.ms(16),
    marginBottom: Matrics.vs(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.ms(15),
  },
  cardIcon: {
    width: Matrics.ms(22),
    height: Matrics.ms(22),
    resizeMode: "contain",
    marginRight: Matrics.ms(10),
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
  },
  toneSection: {
    marginBottom: Matrics.vs(0),
  },
  toneLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  toneBar: {
    flexDirection: "row",
    height: Matrics.vs(8),
    borderRadius: Matrics.s(4),
    overflow: "hidden",
    marginBottom: Matrics.vs(8),
  },
  toneSegment: {
    height: "100%",
  },
  toneLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toneLabelItem: {
    alignItems: "flex-start",
  },
  tonePercentage: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(2),
  },
  toneName: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    color: colors.TEXT_DARK,
  },
  momentSection: {
    marginBottom: Matrics.vs(10),
  },
  momentSectionBorder: {
    paddingTop: Matrics.vs(15),
    borderTopWidth: 1,
    borderTopColor: "rgba(31, 31, 31, 0.2)",
  },
  momentSectionTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(10),
  },
  momentPoint: {
    marginBottom: Matrics.ms(8),
  },
  momentPointBorder: {
    paddingTop: Matrics.ms(8),
    borderTopWidth: 1,
    borderTopColor: "rgba(31, 31, 31, 0.1)",
  },
  momentItem: {
    marginBottom: Matrics.ms(15),
  },
  momentItemBorder: {
    paddingTop: Matrics.ms(15),
    borderTopWidth: 1,
    borderTopColor: "rgba(31, 31, 31, 0.2)",
  },
  momentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  momentTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
  },
  momentPercentage: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  momentDescription: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginTop: Matrics.ms(5),
    flex: 1,
    flexShrink: 1,
    marginRight: Matrics.ms(10),
  },
  momentExplanation: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_DARK,
    marginTop: Matrics.ms(4),
    opacity: 0.8,
  },
  conflictText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  accountabilitySection: {
    marginBottom: Matrics.vs(16),
  },
  accountabilityLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  accountabilityPercentText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginTop: Matrics.vs(4),
  },
  hiddenMeaningItem: {
    marginBottom: Matrics.vs(16),
  },
  hiddenMeaningItemBorder: {
    paddingTop: Matrics.vs(16),
    borderTopWidth: 1,
    borderTopColor: "rgba(31, 31, 31, 0.1)",
  },
  hiddenMeaningMessageBox: {
    backgroundColor: "rgba(47, 89, 235, 0.08)",
    borderRadius: Matrics.s(8),
    padding: Matrics.s(10),
    marginBottom: Matrics.vs(12),
  },
  hiddenMeaningMessage: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    fontStyle: "italic",
  },
  decodedAsLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
  },
  decodedPointersList: {
    marginLeft: Matrics.s(4),
  },
  decodedPointerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Matrics.vs(6),
  },
  decodedPointerBullet: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(8),
    lineHeight: Matrics.vs(18),
  },
  decodedPointerText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  insufficientDataMessage: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    textAlign: "center",
  },
});

export default ArgumentAnalysisResult;
