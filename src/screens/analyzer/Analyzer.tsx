import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
} from "react-native-svg";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Images from "../../config/Images";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { CopilotStep, useCopilot } from "react-native-copilot";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import profileService from "../../services/profileService";
import { toastMessageError } from "../../components/common/ToastMessage";
import useTranslation from "../../hooks/useTranslation";
import CommonFooter from "../../components/common/CommonFooter";
import CardWithArc from "../../components/common/CardWithArc";

const GLOW_SIZE = Matrics.ms(200);

const GlowCircle = () => (
  <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox="0 0 200 200">
    <Defs>
      <RadialGradient id="glowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="#2F59EB" stopOpacity="0.15" />
        <Stop offset="70%" stopColor="#2F59EB" stopOpacity="0.05" />
        <Stop offset="100%" stopColor="#2F59EB" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="100" cy="100" r="100" fill="url(#glowGradient)" />
  </Svg>
);

const GrayGlowCircle = () => (
  <Svg width={GLOW_SIZE} height={GLOW_SIZE} viewBox="0 0 200 200">
    <Defs>
      <RadialGradient id="glowGradient" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="#8F8F8F" stopOpacity="0.15" />
        <Stop offset="70%" stopColor="#8F8F8F" stopOpacity="0.05" />
        <Stop offset="100%" stopColor="#8F8F8F" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Circle cx="100" cy="100" r="100" fill="url(#glowGradient)" />
  </Svg>
);
import { CopilotView } from "../../components/walkthrough";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import onboardingService from "../../services/onboardingService";

const TextAnalyzer: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { start, stop, copilotEvents } = useCopilot();
  const startRef = useRef(start);
  const walkthroughStartedRef = useRef(false);
  const isUserInitiatedStopRef = useRef(true);

  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();

  const onboardingStatus = authData?.user?.onboarding_status;
  const shouldShowOnboarding = onboardingStatus && onboardingStatus.analyser_onboarding !== true;
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const showOnboardingTooltip = shouldShowOnboarding && isScreenFocused;
  const [showChatPrompt, setShowChatPrompt] = useState(false);
  const skipWalkthrough = onboardingStatus && onboardingStatus.skip_walkthrough === true;
  const chatPromptDismissedRef = useRef(false);
  const chatPromptStartedRef = useRef(false);

  const [profiles, setProfiles] = useState<ILoveProfile[]>([]);
  const [analysisCount, setAnalysisCount] = useState();
  const isNavigatingToChild = useRef(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const response = await profileService.getProfiles();
      console.log("response", response);
      if (response.success && response.data) {
        setProfiles(response.data);
        setAnalysisCount(response.extra_data?.analysis_count || 0);
      } else {
        toastMessageError(t("common.something_went_wrong"), response.message);
      }
    } catch (error) {
      console.error("Error fetching profiles", error);
      toastMessageError(
        t("common.something_went_wrong"),
        t("common.please_try_again"),
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isNavigatingToChild.current) {
        isNavigatingToChild.current = false;
        return;
      }
      fetchProfiles();

      // Reset walkthrough state on focus so it can start fresh
      walkthroughStartedRef.current = false;
      isUserInitiatedStopRef.current = true;
      setIsScreenFocused(true);
      if (chatPromptDismissedRef.current) {
        setShowChatPrompt(false);
      }

      return () => {
        setIsScreenFocused(false);
        // Stop any active walkthrough when leaving screen (not user-initiated)
        if (walkthroughStartedRef.current) {
          isUserInitiatedStopRef.current = false;
          stop();
        }
      };
    }, [fetchProfiles, stop]),
  );

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useFocusEffect(
    useCallback(() => {
      if (walkthroughStartedRef.current) return;

      if (showOnboardingTooltip) {
        walkthroughStartedRef.current = true;
        const timer = setTimeout(() => {
          startRef.current("analyzerTextAnalysis");
        }, 50);
        return () => clearTimeout(timer);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showOnboardingTooltip])
  );

  useEffect(() => {
    if (!showOnboardingTooltip) return;

    const handleStop = async () => {
      // Only update if user tapped screen or pressed hardware back
      if (!isUserInitiatedStopRef.current) return;

      try {
        await onboardingService.updateOnboardingField(
          "analyser_onboarding",
          true
        );
        
        // Immediately update Redux state for instant UI feedback
        dispatch(updateOnboardingStatusLocally({
          analyser_onboarding: true,
        }));
        
      } catch (error) {
        console.log("Failed to update analyser_onboarding:", error);
      }

      if (skipWalkthrough !== true) {
        chatPromptStartedRef.current = false;
        setShowChatPrompt(true);
      }
      
      if (authData?.user) {
        setAuthData({
          ...authData,
          user: {
            ...authData.user,
            onboarding_status: {
              ...authData.user.onboarding_status!,
              analyser_onboarding: true,
            },
          },
        });
      }

      
    };

    copilotEvents.on("stop", handleStop);
    return () => {
      copilotEvents.off("stop", handleStop);
    };
  }, [
    showOnboardingTooltip,
    authData,
    setAuthData,
    copilotEvents,
    skipWalkthrough,
  ]);

  const handleChatPress = useCallback(() => {
    chatPromptDismissedRef.current = true;
    setShowChatPrompt(false);
    stop();
    navigation.navigate("ChatTab" as never);
  }, [navigation, stop]);

  useEffect(() => {
    if (!showChatPrompt || chatPromptDismissedRef.current || chatPromptStartedRef.current) {
      return;
    }

    chatPromptStartedRef.current = true;
    const startTimer = setTimeout(() => {
      startRef.current("analyzerChatPrompt");
    }, 10);

    return () => clearTimeout(startTimer);
  }, [showChatPrompt]);

  useEffect(() => {
    if (!showChatPrompt) return;

    const handleChatPromptStop = () => {
      setShowChatPrompt(false);
      chatPromptDismissedRef.current = true;
      if (isUserInitiatedStopRef.current) {
        navigation.navigate("ChatTab" as never);
      }
    };

    copilotEvents.on("stop", handleChatPromptStop);
    return () => {
      copilotEvents.off("stop", handleChatPromptStop);
    };
  }, [showChatPrompt, copilotEvents, navigation]);

  const analyzerOptions = [
    {
      id: 1,
      icon: Images.TEXT_ANALYSIS_BLUE,
      title: t("analyzer.text_analysis"),
      description: t("analyzer.text_analysis_description"),
      walkthroughText: t("walkthrough.analyzer.text_analysis"),
      walkthroughName: "analyzerTextAnalysis",
      walkthroughOrder: 1,
      onPress: () => {
        isNavigatingToChild.current = true;
        navigation.navigate("TextAnalysis", { profiles, analysisCount });
      },
      show_navigation_arrow: true,
      showWalkthrough: true,
    },
    {
      id: 2,
      icon: Images.PARTNER_PORTRAIT_BLUE,
      title: t("analyzer.partner_portrait"),
      description: t("analyzer.partner_portrait_description"),
      walkthroughText: t("walkthrough.analyzer.partner_portrait"),
      walkthroughName: "analyzerPartnerPortrait",
      walkthroughOrder: 2,
      onPress: () => {
        isNavigatingToChild.current = true;
        navigation.navigate("PartnerPortrait", { profiles, analysisCount });
      },
      show_navigation_arrow: true,
      showWalkthrough: true,
    },
    {
      id: 3,
      icon: Images.ARGUMENT_ANALYSIS_ICON,
      title: t("analyzer.arguement_analysis"),
      description: t("analyzer.argument_analysis_description"),
      walkthroughText: t("walkthrough.analyzer.argument_analysis"),
      walkthroughName: "analyzerArgumentAnalysis",
      walkthroughOrder: 3,
      onPress: () => {
        isNavigatingToChild.current = true;
        navigation.navigate("ArgumentAnalysis", { profiles, analysisCount });
      },
      show_navigation_arrow: true,
      showWalkthrough: true,
    },
    {
      id: 4,
      icon: Images.COMING_SOON_ICON,
      title: t("analyzer.coming_soon"),
      description: t("analyzer.coming_soon_description"),
      walkthroughText: "",
      walkthroughName: "",
      walkthroughOrder: 0,
      onPress: () => {
        return;
      },
      show_navigation_arrow: false,
      showWalkthrough: false,
    },
  ];

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
      {/* <CommonHeader
        title="Analyzer"
        onNotificationPress={() => {
          // Navigate to notifications
        }}
      /> */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {analyzerOptions.map((option) => (
          <CopilotStep
            key={option.id}
            text={option.walkthroughText}
            order={option.walkthroughOrder}
            name={option.walkthroughName}
            active={Boolean(option.showWalkthrough && showOnboardingTooltip)}
          >
            <CopilotView>
              <TouchableOpacity
                onPress={option.onPress}
                activeOpacity={0.8}
              >
                <View style={styles.cardWrapper}>
              <LinearGradient
                colors={
                  option.id === 4
                    ? ["rgba(255, 255, 255, 0.34)", "rgba(139, 139, 139, 0.34)"]
                    : ["rgba(255, 255, 255, 0.34)", "rgba(47, 89, 235, 0.34)"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.cardBorder}
              >
                <LinearGradient
                  colors={["#FFF", "#FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.3 }}
                  style={styles.card}
                >
                  {/* Bottom glow effect */}
                  <View style={styles.glowContainerBottomLeft}>
                    {option.id === 4 ? <GrayGlowCircle /> : <GlowCircle />}
                  </View>
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        option.id === 4 && styles.iconContainerGray,
                      ]}
                    >
                      <Image
                        source={option.icon}
                        style={[
                          styles.icon,
                          option.id === 4 && { tintColor: "#8F8F8F" },
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.cardTitle}>{option.title}</Text>
                      <Text style={styles.cardDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  {option.show_navigation_arrow ? (
                    <Image
                      source={Images.ARROW_RIGHT_ICON}
                      style={styles.arrowIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    option.id === 4 && (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>{t("analyzer.coming_soon_badge")}</Text>
                      </View>
                    )
                  )}
                </LinearGradient>
              </LinearGradient>
            </View>
              </TouchableOpacity>
            </CopilotView>
          </CopilotStep>
        ))}
      </ScrollView>
      <CommonFooter
        activeTab="file"
        onChatPress={handleChatPress}
        onHeartPress={() =>
          (navigation as any).navigate("ProfilesTab", {
            screen: "PartnerProfiles",
          })
        }
        onFilePress={() => {}}
        onUserPress={() => navigation.navigate("UserTab" as never)}
        onSettingsPress={() => navigation.navigate("SettingsTab" as never)}
        {...(showChatPrompt && {
          chatTabTooltip: {
            active: showChatPrompt,
            text: t("walkthrough.analyzer.relationship_guide_prompt"),
            order: 1,
            name: "analyzerChatPrompt",
          },
        })}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40),
  },
  cardWrapper: {
    marginBottom: Platform.OS === "ios" ? Matrics.vs(10) : Matrics.vs(16),
    shadowColor: "#2F59EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBorder: {
    borderRadius: Matrics.ms(10),
    padding: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Matrics.ms(10),
    padding: Platform.OS === "ios" ? Matrics.ms(1) : Matrics.ms(15),
    position: "relative",
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Matrics.ms(15),
    padding: Platform.OS === "ios" ? Matrics.vs(10) : 0,
  },
  iconContainer: {
    width: Platform.OS === "ios" ? Matrics.ms(50) : Matrics.ms(50),
    height: Platform.OS === "ios" ? Matrics.ms(50) : Matrics.ms(50),
    borderRadius: 100,
    backgroundColor: "rgba(47, 89, 235, 0.10)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainerGray: {
    backgroundColor: "rgba(143, 143, 143, 0.10)",
  },
  icon: {
    width: Platform.OS === "ios" ? Matrics.ms(26) : Matrics.ms(26),
    height: Platform.OS === "ios" ? Matrics.ms(26) : Matrics.ms(26),
    objectFit: "contain",
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    paddingBottom: Platform.OS === "ios" ? Matrics.vs(5) : 0,
  },
  cardDescription: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
  },
  arrowIcon: {
    width: Matrics.ms(24),
    height: Matrics.ms(24),
    marginEnd: Platform.OS === "ios" ? Matrics.ms(10) : 0,
  },
  comingSoonBadge: {
    paddingVertical: Matrics.vs(3),
    paddingLeft: Matrics.ms(9),
    paddingRight: Matrics.ms(10),
    borderTopLeftRadius: Matrics.ms(12),
    borderBottomLeftRadius: Matrics.ms(12),
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    position: "absolute",
    right: 0,
    top: "38%",
    transform: [{ translateY: -15 }],
    backgroundColor: "#8F8F8F",
  },
  comingSoonText: {
    fontSize: Matrics.ms(9),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.WHITE,
    lineHeight: Matrics.vs(10),
  },
  glowContainerBottomLeft: {
    position: "absolute",
    left: Matrics.ms(-60),
    bottom: Matrics.ms(-130),
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
});

export default TextAnalyzer;
