import React, { useEffect, useState, useRef } from "react";
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
import Button from "../../components/common/Button";
import {
  InputFormatType,
  INPUT_FORMAT_TEXT,
  APP_STORE_LINK,
  SHARE_FOOTER_TEXT,
  SHARE_PREFILLED_TEXT,
} from "../../constants/commonConstant";
import analyzerService from "../../services/analyzerService";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AnalyzerStackParamList,
  AnalyzerNavigationProp,
} from "../../interfaces/navigationTypes";
import { AnalyzerResponse } from "../../interfaces/analyzerInterfaces";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import { useNavigation } from "@react-navigation/native";
import useTranslation from "../../hooks/useTranslation";
import { getInitials, getTitleCase } from "../../utils/helper";
import LinearGradient from "react-native-linear-gradient";
import FullPageLoader from "../../components/common/FullPageLoader";
import BlurWrapper from "../../components/common/BlurWrapper";
import useAuth from "../../hooks/useAuth";

import { captureRef } from "react-native-view-shot";
import ImageShare from 'react-native-share';

// Navigation params expected by the TextAnalysisResult screen
interface TextAnalysisParams {
  profile: number;
  inputType: InputFormatType;
  conversationText?: string;
  context: string;
  specify_output_context?: string;
  imageUrl?: string[];
  isSyncedToChat?: boolean;
  timeline_reference?: string | null;
  selected_event_id?: string | null;
  selected_event_title?: string | null;
  selected_event_summary?: string | null;
}

type TextAnalysisResultProps = NativeStackScreenProps<
  AnalyzerStackParamList,
  "TextAnalysisResult"
>;

const TextAnalysisResult: React.FC<TextAnalysisResultProps> = ({ route }) => {
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const summarySectionRef = useRef<View>(null);
  const guidanceSectionRef = useRef<View>(null);
  const nextStepsSectionRef = useRef<View>(null);

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
            <Image source={Images.UNLOCK_TEXT_ANALYSIS} style={styles.unlockIcon} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper function to split text for half blur effect
  const renderHalfBlurredText = (text: string, textStyle?: any) => {
    if (!hasNoPlan) {
      return <Text style={textStyle || styles.summaryText}>{text}</Text>;
    }
    
    // Split text roughly in half by words
    const words = text.split(' ');
    const halfPoint = Math.ceil(words.length / 2);
    const firstHalf = words.slice(0, halfPoint).join(' ');
    const secondHalf = words.slice(halfPoint).join(' ');
    
    return (
      <View>
        <Text style={textStyle || styles.summaryText}>{firstHalf}</Text>
        <BlurWithUnlock blurAmount={5}>
          <Text style={textStyle || styles.summaryText}>{secondHalf}</Text>
        </BlurWithUnlock>
      </View>
    );
  };

  // Helper function to render half of list items blurred
  const renderHalfBlurredList = (items: string[]) => {
    if (!hasNoPlan) {
      return items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.listItemText}>{item}</Text>
        </View>
      ));
    }
    
    const halfPoint = Math.ceil(items.length / 2);
    
    return (
      <View>
        {items.slice(0, halfPoint).map((item, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.listItemText}>{item}</Text>
          </View>
        ))}
        <BlurWithUnlock blurAmount={5}>
          {items.slice(halfPoint).map((item, index) => (
            <View key={index + halfPoint} style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </BlurWithUnlock>
      </View>
    );
  };
  const {
    profile,
    inputType,
    conversationText,
    context,
    specify_output_context,
    imageUrl,
    isSyncedToChat: initialSyncedToChat,
    timeline_reference,
    selected_event_id,
    selected_event_title,
    selected_event_summary,
  } = route.params as TextAnalysisParams;

  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResponse | null>(
    null
  );
  const [syncLoading, setSyncLoading] = useState(false);
  const [isSyncedToChat, setIsSyncedToChat] = useState(
    initialSyncedToChat ?? false
  );
  const [requestFingerprint, setRequestFingerprint] = useState<string | undefined>(undefined);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShare = async () => {
    try {
      if (!analysisResult) {
        return;
      }

      setIsCapturing(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const uri = await captureRef(summarySectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      const uri2 = await captureRef(guidanceSectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      const uri3 = await captureRef(nextStepsSectionRef, {
        format: "png",
        quality: 0.8,
        result: "tmpfile",
      });

      setIsCapturing(false);

      const shareOptions = {
        title: t("analyzer.text_analyzer.analysis_results"),
        message: `${t("analyzer.text_analyzer.share_message")}\n${SHARE_FOOTER_TEXT}\n${APP_STORE_LINK}`,
        urls: [uri, uri2, uri3],
        type: "image/png",
        failOnCancel: false,
      };

      await ImageShare.open(shareOptions);
    } catch (error: unknown) {
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
        if (inputType == INPUT_FORMAT_TEXT) {
          const response = await analyzerService.textAnalysis({
            profile: profile,
            input_type: inputType,
            conversation_text: conversationText || "",
            context: context,
            specify_output_context: specify_output_context,
            timeline_reference: timeline_reference || undefined,
            selected_event_id: selected_event_id || undefined,
            selected_event_summary: selected_event_summary || undefined,
          });
          if (!response.success || !response.data) {
            toastMessageError(
              response.message || t("analyzer.text_analyzer.analysis_failed")
            );
            navigation.goBack();
            return;
          }

          setAnalysisResult(response.data);
          if (response.extra_data?.fingerprint) {
            setRequestFingerprint(response.extra_data.fingerprint);
          } else if (response.extra_data?.request_fingerprint) {
            setRequestFingerprint(response.extra_data.request_fingerprint);
          }
          if (response.extra_data?.sync_with_chat) {
            setIsSyncedToChat(true);
          }
        } else {
          // Call the image analysis endpoint when the user has provided images instead of text
          const response = await analyzerService.imageAnalysis({
            profile: profile,
            input_type: inputType,
            context: context,
            specify_output_context: specify_output_context,
            image_url: imageUrl || [],
            timeline_reference: timeline_reference || undefined,
            selected_event_id: selected_event_id || undefined,
            selected_event_summary: selected_event_summary || undefined,
          });
          if (!response.success || !response.data) {
            toastMessageError(
              response.message || t("analyzer.text_analyzer.analysis_failed")
            );
            navigation.goBack();
            return;
          }
          setAnalysisResult(response.data);
          if (response.extra_data?.fingerprint) {
            setRequestFingerprint(response.extra_data.fingerprint);
          } else if (response.extra_data?.request_fingerprint) {
            setRequestFingerprint(response.extra_data.request_fingerprint);
          }
          if (response.extra_data?.sync_with_chat) {
            setIsSyncedToChat(true);
          }
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        toastMessageError(
          t("common.something_went_wrong"),
          t("common.try_again_later")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [profile, inputType, conversationText, context, specify_output_context, timeline_reference, selected_event_id, selected_event_summary]);

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

  // Sync the generated analysis summary back into the chat for this profile
  const handleSyncWithChat = async () => {
    setSyncLoading(true);

    try {
      // Persist the analysis summary as a new chat message for the current profile
      const response = await analyzerService.syncToChat({
        profile_id: profile,
        message: analysisResult?.summary ?? "",
        ...(requestFingerprint && { request_fingerprint: requestFingerprint }),
      });
      if (!response.success) {
        toastMessageError(response.message);
        return;
      }

      toastMessageSuccess(response.message);
      setIsSyncedToChat(true);
    } catch (e) {
      console.error("Error syncing with chat", e);
      toastMessageError(t("common.something_went_wrong"));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleLineByLine = () => {
    navigation.navigate("LineByLineAnalysis", {
      profile,
      inputType,
      conversationText,
      context,
      specify_output_context,
      imageUrl,
      isSyncedToChat,
      fingerprint: requestFingerprint,
    });
  };

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
        <View ref={summarySectionRef} collapsable={false} style={styles.snapshotContainer}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {getInitials(analysisResult?.profile.name ?? "")}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {getTitleCase(analysisResult?.profile.name ?? "")}
              </Text>
              <View style={styles.tagsContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {analysisResult?.profile.age ?? ""}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {getTitleCase(analysisResult?.profile.gender ?? "")}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text
                    style={styles.tagText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {analysisResult?.profile.relationship_tag ?? ""}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Your Inputs Card */}
        {/* {inputType === "text" ? (
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.your_inputs")}
            </Text>

            <Text style={styles.cardLabel}>
              {t("analyzer.text_analyzer.conversation_text")}
            </Text>
            <Text style={styles.conversationText}>{conversationText}</Text>

            {specify_output_context ? (
              <View>
                <View style={styles.divider} />
                <View>
                  <Text style={styles.cardLabel}>
                    {t("analyzer.text_analyzer.your_question")}
                  </Text>
                  <Text style={styles.questionText}>
                    {specify_output_context}
                  </Text>
                </View>
              </View>
            ) : null}
          </ImageBackground>
        ) : (
          ""
        )} */}

        {/* Analysis Results Section */}
        <Text style={styles.sectionTitle}>
          {t("analyzer.text_analyzer.analysis_results")}
        </Text>

        {/* Summary Card */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={styles.card}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.SUMMARY} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.summary")}
            </Text>
          </View>
          <Text style={styles.summaryText}>
            {analysisResult?.summary || t("analyzer.text_analyzer.no_summary")}
          </Text>
        </ImageBackground>

        {/* Detected Emotions Card */}
        {
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <View style={styles.cardTitleRow}>
              <Image source={Images.DETECTED_EMOTION} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
              <Text style={styles.cardTitle}>
                {t("analyzer.text_analyzer.detected_emotions")}
              </Text>
            </View>
            <View style={styles.emotionsContainer}>
              {analysisResult?.detected_emotions ? (
                analysisResult.detected_emotions.map((emotion, index) => (
                  <View key={index} style={styles.emotionTag}>
                    <Text style={styles.emotionTagText}>{emotion}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.summaryText}>
                  {t("analyzer.text_analyzer.no_emotion_detected")}
                </Text>
              )}
            </View>
          </ImageBackground>
        }

        {/* Overall Tone Card */}
        {
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <View style={styles.cardTitleRow}>
              <Image source={Images.TONE} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
              <Text style={styles.cardTitle}>
                {t("analyzer.text_analyzer.tone")}
              </Text>
            </View>
            <Text style={styles.cardLabel}>
              {t("analyzer.text_analyzer.overall_tone")}
            </Text>
            <Text style={styles.conversationText}>
              {analysisResult?.overall_tone ||
                t("analyzer.text_analyzer.no_tone")}
            </Text>
            <View style={styles.divider} />
            <View>
              <Text style={styles.cardLabel}>
                {t("analyzer.text_analyzer.subtext")}
              </Text>
              <Text style={styles.summaryText}>
                {analysisResult?.subtext ||
                  t("analyzer.text_analyzer.no_subtext")}
              </Text>
            </View>
          </ImageBackground>
        }

        {isCapturing && (
          <Text style={styles.shareCardPageIndicator}>1/3</Text>
        )}
        </View>
        <View ref={guidanceSectionRef} collapsable={false} style={styles.snapshotContainer}>

        {/* Specified Analysis Card (moved to page 2) */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={styles.card}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.SPECIFIED_ANALYSIS} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.specified_analysis")}
            </Text>
          </View>
          {renderHalfBlurredText(
            analysisResult?.specified_analysis ||
              t("analyzer.text_analyzer.no_specified_analysis"),
            styles.summaryText
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLineByLine}
            style={styles.lineByLineButton}
          >
            <View style={styles.lineByLineIconContainer}>
              <Image
                source={Images.ANALYSIS_ICON}
                style={styles.lineByLineIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.lineByLineText}>
              {t("analyzer.text_analyzer.get_line_by_line_analysis")}
            </Text>
          </TouchableOpacity>
        </ImageBackground>

        {/* Suggested Reply Card */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={[styles.card, styles.suggestedReplyCard]}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.SUGGESTED_REPLY} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={[styles.cardTitle, styles.suggestedReplyTitle]}>
              {t("analyzer.text_analyzer.suggested_reply")}
            </Text>
          </View>
          {analysisResult?.suggested_reply ? (
            <View style={styles.suggestedReplyContent}>
              <View style={styles.suggestedReplySection}>
                <Text style={[styles.suggestedReplyLabel, styles.suggestedReplyText]}>
                  {t("analyzer.text_analyzer.guidance")}:
                </Text>
                <Text style={[styles.summaryText, styles.suggestedReplyText]}>
                  {analysisResult.suggested_reply.guidance}
                </Text>
              </View>
              <View style={styles.suggestedReplySection}>
                <Text style={[styles.suggestedReplyLabel, styles.suggestedReplyText]}>
                  {t("analyzer.text_analyzer.why_this_helps")}:
                </Text>
                {hasNoPlan ? (
                  <BlurWithUnlock blurAmount={5}>
                    <Text style={[styles.summaryText, styles.suggestedReplyText]}>
                      {analysisResult.suggested_reply.why_this_helps}
                    </Text>
                  </BlurWithUnlock>
                ) : (
                  <Text style={[styles.summaryText, styles.suggestedReplyText]}>
                    {analysisResult.suggested_reply.why_this_helps}
                  </Text>
                )}
              </View>
              <View style={styles.suggestedReplySection}>
                <Text style={[styles.suggestedReplyLabel, styles.suggestedReplyText]}>
                  {t("analyzer.text_analyzer.timing_note")}:
                </Text>
                {hasNoPlan ? (
                  <BlurWithUnlock blurAmount={5}>
                    <Text style={[styles.summaryText, styles.suggestedReplyText]}>
                      {analysisResult.suggested_reply.timing_note}
                    </Text>
                  </BlurWithUnlock>
                ) : (
                  <Text style={[styles.summaryText, styles.suggestedReplyText]}>
                    {analysisResult.suggested_reply.timing_note}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={[styles.summaryText, styles.suggestedReplyText]}>
              {t("analyzer.text_analyzer.no_suggested_reply")}
            </Text>
          )}
        </ImageBackground>

        {isCapturing && (
          <Text style={styles.shareCardPageIndicator}>2/3</Text>
        )}
        </View>

        <View ref={nextStepsSectionRef} collapsable={false} style={styles.snapshotContainer}>

        {/* Recommendation Card */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={styles.card}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.RECOMMENDATION} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.recommendations")}
            </Text>
          </View>
          {analysisResult?.recommendations &&
            analysisResult.recommendations.length > 0 ? (
            renderHalfBlurredList(analysisResult.recommendations)
          ) : (
            <Text style={styles.summaryText}>
              {t("analyzer.text_analyzer.no_recommendations")}
            </Text>
          )}
        </ImageBackground>

        {/* Prediction Card */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={styles.card}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.PREDICTION} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.predictions")}
            </Text>
          </View>
          {analysisResult?.predictions &&
            analysisResult.predictions.length > 0 ? (
            renderHalfBlurredList(analysisResult.predictions)
          ) : (
            <Text style={styles.summaryText}>
              {t("analyzer.text_analyzer.no_predictions")}
            </Text>
          )}
        </ImageBackground>

        {/* What to watch out for Card */}
        <ImageBackground
          source={Images.RESPONSE_BG}
          style={styles.card}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <View style={styles.cardTitleRow}>
            <Image source={Images.WHAT_TO_WATCH_OUT} style={isCapturing ? styles.shareCardTitleIcon : styles.cardTitleIcon} />
            <Text style={styles.cardTitle}>
              {t("analyzer.text_analyzer.watch_out_for")}
            </Text>
          </View>
          {analysisResult?.watch_out_for &&
            analysisResult.watch_out_for.length > 0 ? (
            hasNoPlan ? (
              <BlurWithUnlock blurAmount={3}>
                {analysisResult.watch_out_for.map((item, index) => (
                  <View key={index}>
                    <View>
                      <Text style={{ color: colors.TEXT_PRIMARY }}>
                        {item.message}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.summaryText}>{item.context}</Text>
                    </View>
                  </View>
                ))}
              </BlurWithUnlock>
            ) : (
              analysisResult.watch_out_for.map((item, index) => (
                <View key={index}>
                  <View>
                    <Text style={{ color: colors.TEXT_PRIMARY }}>
                      {item.message}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.summaryText}>{item.context}</Text>
                  </View>
                </View>
              ))
            )
          ) : (
            <Text style={styles.summaryText}>
              {t("analyzer.text_analyzer.nothing_to_watch_out_for")}
            </Text>
          )}
        </ImageBackground>

        {isCapturing && (
          <Text style={styles.shareCardPageIndicator}>3/3</Text>
        )}
        </View>
        <Button
          title={t("analyzer.text_analyzer.sync_with_chat")}
          onPress={() => handleSyncWithChat()}
          containerStyle={styles.syncButton}
          loading={syncLoading}
          disabled={isSyncedToChat}
        />
      </ScrollView>

      {analysisResult && (
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
    backgroundColor: '#FFFFFF', // Add a solid background color (light blue/white to match your theme)
    paddingHorizontal: Matrics.ms(10), // Move padding here from scrollContent
    paddingVertical: Matrics.vs(15),
    // borderRadius: Matrics.s(10), // Optional: makes the shared image look cleaner
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
    // paddingHorizontal: Matrics.ms(20),
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
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "rgba(47, 89, 235, 0.15)",
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(3),
    borderRadius: Matrics.s(100),
    maxWidth: "45%",
    flexShrink: 1,
  },
  tagText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
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
    marginBottom: Matrics.vs(10),
    gap: Matrics.s(10),
  },
  cardTitleIcon: {
    width: Matrics.s(21),
    height: Matrics.s(21),
  },
  shareCardTitleIcon: {
    width: Matrics.s(17),
    height: Matrics.s(17),
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  cardLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(8),
    opacity: 0.6,
  },
  conversationText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(16),
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginVertical: Matrics.vs(16),
  },
  questionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(24),
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
  // Summary Styles
  summaryText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  // List Styles
  listItem: {
    flexDirection: "row",
    marginBottom: Matrics.vs(5),
  },
  bulletPoint: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    marginRight: Matrics.s(8),
    lineHeight: Matrics.vs(18),
  },
  listItemText: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  // Emotions Styles
  emotionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Matrics.s(10),
  },
  emotionTag: {
    backgroundColor: "rgba(47, 89, 235, 0.12)",
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(6),
    borderRadius: Matrics.s(100),
  },
  emotionTagText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  // Skeleton Styles
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
  // Button Styles
  analysisButton: {
    marginTop: Matrics.vs(30),
    marginBottom: Matrics.vs(0),
  },
  syncButton: {
    marginTop: Matrics.vs(10),
    marginBottom: Matrics.vs(0),
  },
  // Line-by-line Analysis Button
  lineByLineButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Matrics.vs(12),
  },
  lineByLineIconContainer: {
    width: Matrics.s(24),
    height: Matrics.s(24),
    marginRight: Matrics.s(10),
  },
  lineByLineIcon: {
    width: "100%",
    height: "100%",
  },
  lineByLineText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.PRIMARY,
  },
  // Suggested Reply Card Styles (color overrides)
  suggestedReplyCard: {
    backgroundColor: colors.PRIMARY,
  },
  suggestedReplyTitle: {
    color: colors.WHITE,
  },
  suggestedReplyText: {
    color: colors.WHITE,
  },
  suggestedReplyContent: {
    marginTop: Matrics.vs(8),
  },
  suggestedReplySection: {
    marginBottom: Matrics.vs(12),
  },
  suggestedReplyLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    marginBottom: Matrics.vs(4),
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

export default TextAnalysisResult;
