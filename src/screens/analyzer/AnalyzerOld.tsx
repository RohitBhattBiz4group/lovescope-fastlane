import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../../config/appStyling/colors";
import { FontsSize, Matrics, typography } from "../../config/appStyling";
import { useCallback, useEffect, useRef, useState } from "react";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import TextAnalysis from "./TextAnalysis";
import PartnerPotrait from "./PartnerPotrait";
import { useFocusEffect } from "@react-navigation/native";
import { useRoute, useNavigation } from "@react-navigation/native";

import {
  AnalyzerNavigationProp,
  AnalyzerRouteProp,
  TabNavigationProp,
} from "../../interfaces/navigationTypes";
import CommonFooter from "../../components/common/CommonFooter";
import profileService from "../../services/profileService";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import {
  toastMessageError,
  toastMessageInfo,
} from "../../components/common/ToastMessage";
import {
  ANALYSER_TEXT,
  ANALYSER_PORTRAIT,
  KEYBOARD_OFFSET_IOS,
  KEYBOARD_OFFSET_ANDROID,
  APP,
} from "../../constants/commonConstant";
import LinearGradient from "react-native-linear-gradient";

interface AnalyzerRouteParams {
  resetSequence?: number;
}

type ActiveTabType = typeof ANALYSER_TEXT | typeof ANALYSER_PORTRAIT;

const Analyzer = () => {
  const { t } = useTranslation();
  const route = useRoute<AnalyzerRouteProp>();
  const navigation = useNavigation<AnalyzerNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabType>(ANALYSER_TEXT);
  const [textFormResetKey, setTextFormResetKey] = useState(0);
  const [lastResetSequence, setLastResetSequence] = useState<
    number | undefined
  >(undefined);
  const [profiles, setProfiles] = useState<ILoveProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [textAnalysisCount, setTextAnalysisCount] = useState({
    portrait_count: 0,
    text_analysis_count: 0,
  });

  const TextAnalysisComponent: typeof TextAnalysis = TextAnalysis;
  const PartnerPotraitComponent: typeof PartnerPotrait = PartnerPotrait;

  const fetchProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const response = await profileService.getProfiles();
      setTextAnalysisCount({
        portrait_count: Number(response.extra_data?.portrait_count ?? 0),
        text_analysis_count: Number(response.extra_data?.text_analysis_count ?? 0),
      });
      if (response.success && response.data) {
        setProfiles(response.data);

        if (Array.isArray(response.data) && response.data.length === 0) {
          toastMessageInfo(
            t("analyzer.portrait.no_profiles_title"),
            t("analyzer.portrait.no_profiles_message")
          );
        }
      } else {
        toastMessageError(t("common.something_went_wron"), response.message);
      }
    } catch (error) {
      console.error("Error fetching profiles", error);
      toastMessageError(
        t("common.something_went_wrong"),
        t("common.please_try_again")
      );
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  // Refresh profiles and reset scroll position when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [fetchProfiles])
  );

  useEffect(() => {
    const resetSequence = (route.params as AnalyzerRouteParams)?.resetSequence;
    if (resetSequence && resetSequence !== lastResetSequence) {
      setLastResetSequence(resetSequence);
      setTextFormResetKey((prev) => prev + 1);
      setActiveTab(ANALYSER_TEXT);
    }
  }, [route.params, lastResetSequence]);

  const handleTabPress = (tab: ActiveTabType) => {
    if (tab === ANALYSER_PORTRAIT && activeTab === ANALYSER_TEXT) {
      setTextFormResetKey((prev) => prev + 1);
    }
    setActiveTab(tab);
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
    <KeyboardAvoidingView
      behavior={Platform.OS === APP.IOS ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === APP.IOS ? KEYBOARD_OFFSET_IOS : KEYBOARD_OFFSET_ANDROID}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === ANALYSER_TEXT
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive,
              ]}
              onPress={() => handleTabPress(ANALYSER_TEXT)}
              activeOpacity={0.8}
            >
              <Image
                source={
                  activeTab === ANALYSER_TEXT
                    ? Images.TEXT_ANALYSIS1
                    : Images.TEXT_ANALYSIS
                }
                style={[
                  styles.tabIcon,
                  activeTab === ANALYSER_TEXT
                    ? styles.tabIconActive
                    : styles.tabIconInactive,
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === ANALYSER_TEXT
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                {t("analyzer.text_analysis")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === ANALYSER_PORTRAIT
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive,
              ]}
              onPress={() => handleTabPress(ANALYSER_PORTRAIT)}
              activeOpacity={0.8}
            >
              <Image
                source={Images.PARTNER_PORTRAIT}
                style={[
                  styles.tabIcon,
                  activeTab === ANALYSER_PORTRAIT
                    ? styles.tabIconActive
                    : styles.tabIconInactive,
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === ANALYSER_PORTRAIT
                    ? styles.tabTextActive
                    : styles.tabTextInactive,
                ]}
              >
                {t("analyzer.partner_portrait")}
              </Text>
            </TouchableOpacity>
          </View>
  

          {activeTab === ANALYSER_TEXT && (
            <TextAnalysisComponent
              key={textFormResetKey}
              profiles={profiles}
              profilesLoading={profilesLoading}
              textAnalysisCount={textAnalysisCount.text_analysis_count}
            />
          )}
          {activeTab === ANALYSER_PORTRAIT && (
            <PartnerPotraitComponent
              profiles={profiles}
              profilesLoading={profilesLoading}
              partnerAnalysisCount={textAnalysisCount.portrait_count}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CommonFooter
        activeTab="file"
        onChatPress={() => navigation.getParent<TabNavigationProp>()?.navigate("ChatTab")}
        onHeartPress={() => navigation.getParent<TabNavigationProp>()?.navigate("ProfilesTab", {
          screen: "PartnerProfiles",
        })}
        onFilePress={() => {}}
        onUserPress={() => navigation.getParent<TabNavigationProp>()?.navigate("UserTab")}
        onSettingsPress={() => navigation.getParent<TabNavigationProp>()?.navigate("SettingsTab")}
        // bgColor="#fff"
      />
    </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Matrics.ms(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(40),
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: Matrics.vs(20),
    gap: Matrics.s(8),
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: Matrics.vs(11),
    paddingHorizontal: Matrics.s(12),
    borderRadius: Matrics.s(100),
    gap: Matrics.s(6),
    fontSize: FontsSize.Small,
  },
  tabButtonActive: {
    backgroundColor: colors.PRIMARY,
  },
  tabButtonInactive: {
    backgroundColor: colors.WHITE,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabIcon: {
    width: Matrics.s(18),
    height: Matrics.s(18),
  },
  tabIconActive: {
    tintColor: colors.WHITE,
  },
  tabIconInactive: {
    tintColor: colors.GRAY_DARK,
  },
  tabText: {
    fontSize: Matrics.ms(13),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    margin: 0,
    padding: 0,
    lineHeight: 18,
  },
  tabTextActive: {
    color: colors.WHITE,
  },
  tabTextInactive: {
    color: colors.GRAY_DARK,
  },
});

export default Analyzer;
