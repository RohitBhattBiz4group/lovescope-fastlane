import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AnalyzerStackParamList } from "../../interfaces/navigationTypes";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import {
  InputFormatType,
  INPUT_FORMAT_TEXT,
  INPUT_FORMAT_IMAGE,
} from "../../constants/commonConstant";
import analyzerService from "../../services/analyzerService";
import {
  LineByLineRequest,
  LineByLineResponse,
} from "../../interfaces/analyzerInterfaces";
import Images from "../../config/Images";
import { getInitials, getTitleCase } from "../../utils/helper";
import { toastMessageError } from "../../components/common/ToastMessage";
import useTranslation from "../../hooks/useTranslation";
import LinearGradient from "react-native-linear-gradient";
import FullPageLoader from "../../components/common/FullPageLoader";
import BlurWrapper from "../../components/common/BlurWrapper";
import useAuth from "../../hooks/useAuth";

interface TextAnalysisParams {
  profile: number;
  inputType: InputFormatType;
  conversationText?: string;
  context: string;
  specify_output_context?: string;
  imageUrl?: string[];
  fingerprint?: string;
}

type LineByLineAnalysisProps = NativeStackScreenProps<
  AnalyzerStackParamList,
  "LineByLineAnalysis"
>;

const LineByLineAnalysis: React.FC<LineByLineAnalysisProps> = ({
  route,
  navigation,
}) => {
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

  const {
    profile,
    inputType,
    conversationText,
    context,
    specify_output_context,
    imageUrl,
    fingerprint,
  } = route.params as TextAnalysisParams;

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<LineByLineResponse | null>(null);

  const requestPayload: LineByLineRequest = useMemo(
    () => ({
      profile_id: profile,
      input_format: inputType,
      context: context ?? null,
      conversation_text:
        inputType === INPUT_FORMAT_TEXT ? (conversationText ?? null) : null,
      conversation_image: inputType === INPUT_FORMAT_IMAGE ? (imageUrl ?? null) : null,
      fingerprint,
    }),
    [profile, inputType, context, conversationText, imageUrl, fingerprint]
  );

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setAnalysis(null);

      try {
        const res =
          inputType === INPUT_FORMAT_IMAGE
            ? await analyzerService.lineByLineImageAnalysis(requestPayload)
            : await analyzerService.lineByLineTextAnalysis(requestPayload);
        if (!isMounted) return;
        setAnalysis(res?.data ?? null);
      } catch (error: unknown) {
        if (!isMounted) return;
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toastMessageError(
          err?.response?.data?.message ??
            err?.message ??
            t("common.something_went_wrong")
        );
        navigation.goBack();
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    if (inputType === INPUT_FORMAT_TEXT && !conversationText) {
      toastMessageError(t("analyzer.line_by_line.missing_conversation_text"));
      navigation.goBack();
      return;
    }

    if (inputType === INPUT_FORMAT_IMAGE && (!imageUrl || imageUrl.length === 0)) {
      toastMessageError(t("analyzer.line_by_line.missing_conversation_images"));
      navigation.goBack();
      return;
    }

    run();
    return () => {
      isMounted = false;
    };
  }, [inputType, requestPayload, conversationText, imageUrl]);

  if (loading) {
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
        {/* <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.profileInfo}>
                <View style={[styles.skeletonLine, { width: "50%" }]} />
                <View style={styles.tagsContainer}>
                  <View style={styles.skeletonTag} />
                  <View style={styles.skeletonTag} />
                  <View style={styles.skeletonTag} />
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {t("analyzer.line_by_line.analysis_results")}
          </Text>

          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <View style={[styles.skeletonLine, { width: "40%" }]} />
            <View
              style={[
                styles.skeletonLine,
                { width: "100%", marginTop: Matrics.vs(12) },
              ]}
            />
            <View style={[styles.skeletonLine, { width: "90%" }]} />
            <View style={[styles.skeletonLine, { width: "80%" }]} />
            <View style={styles.divider} />
            <View style={[styles.skeletonLine, { width: "50%" }]} />
            <View
              style={[
                styles.skeletonLine,
                { width: "100%", marginTop: Matrics.vs(12) },
              ]}
            />
            <View style={[styles.skeletonLine, { width: "85%" }]} />
          </ImageBackground>

          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <View style={[styles.skeletonLine, { width: "40%" }]} />
            <View
              style={[
                styles.skeletonLine,
                { width: "100%", marginTop: Matrics.vs(12) },
              ]}
            />
            <View style={[styles.skeletonLine, { width: "95%" }]} />
            <View style={[styles.skeletonLine, { width: "80%" }]} />
            <View style={styles.divider} />
            <View style={[styles.skeletonLine, { width: "50%" }]} />
            <View
              style={[
                styles.skeletonLine,
                { width: "100%", marginTop: Matrics.vs(12) },
              ]}
            />
            <View style={[styles.skeletonLine, { width: "85%" }]} />
          </ImageBackground>
        </ScrollView> */}
        <FullPageLoader />
      </LinearGradient>
    );
  }

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {analysis ? (
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(analysis?.profile?.name ?? "")}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {getTitleCase(analysis?.profile?.name ?? "")}
                </Text>
                <View style={styles.tagsContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {analysis?.profile?.age ?? ""}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {getTitleCase(analysis?.profile?.gender ?? "")}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {analysis?.profile?.relationship_tag ?? ""}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {t("analyzer.line_by_line.analysis_results")}
        </Text>

        {analysis?.messages?.length ? (
          analysis.messages.map((item, index) => (
            <ImageBackground
              key={index}
              source={Images.RESPONSE_BG}
              style={styles.card}
              imageStyle={styles.cardImageStyle}
              resizeMode="cover"
            >
              {hasNoPlan && index > 0 ? (
                <BlurWithUnlock blurAmount={3}>
                  <View>
                    <Text style={styles.cardTitle}>
                      {t("analyzer.line_by_line.message_title", {
                        index: index + 1,
                      })}
                    </Text>
                    <Text style={styles.cardLabel}>
                      {t("analyzer.line_by_line.original_message")}
                    </Text>
                    <Text style={styles.messageText}>{item.message ?? ""}</Text>

                    {item.analysis ? (
                      <View style={styles.analysisBox}>
                        <Text style={styles.analysisTitle}>
                          {t("analyzer.line_by_line.what_they_mean")}
                        </Text>
                        <Text style={styles.analysisText}>{item.analysis}</Text>
                      </View>
                    ) : null}
                  </View>
                </BlurWithUnlock>
              ) : (
                <View>
                  <Text style={styles.cardTitle}>
                    {t("analyzer.line_by_line.message_title", {
                      index: index + 1,
                    })}
                  </Text>
                  <Text style={styles.cardLabel}>
                    {t("analyzer.line_by_line.original_message")}
                  </Text>
                  <Text style={styles.messageText}>{item.message ?? ""}</Text>

                  {item.analysis ? (
                    <View style={styles.analysisBox}>
                      <Text style={styles.analysisTitle}>
                        {t("analyzer.line_by_line.what_they_mean")}
                      </Text>
                      <Text style={styles.analysisText}>{item.analysis}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ImageBackground>
          ))
        ) : (
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <Text style={styles.summaryText}>
              {t("analyzer.line_by_line.no_messages_found")}
            </Text>
          </ImageBackground>
        )}

        {/* {analysis?.overall_summary ? (
          <ImageBackground
            source={Images.RESPONSE_BG}
            style={styles.card}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            <Text style={styles.cardTitle}>Overall Summary</Text>
            <Text style={styles.summaryText}>{analysis.overall_summary}</Text>
          </ImageBackground>
        ) : null} */}
      </ScrollView>
   </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(8),
    paddingBottom: Matrics.vs(40),
  },
  profileCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(15),
    marginBottom: Matrics.vs(20),
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
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
  },
  cardLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
    marginTop: Matrics.vs(6),
  },
  messageText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  analysisBox: {
    marginTop: Matrics.vs(10),
    padding: Matrics.s(10),
    borderRadius: Matrics.s(10),
    backgroundColor: "rgba(47, 89, 235, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
  },
  analysisTitle: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    color: colors.PRIMARY,
    marginBottom: Matrics.vs(6),
  },
  analysisText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(16),
  },
  summaryText: {
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
});

export default LineByLineAnalysis;
