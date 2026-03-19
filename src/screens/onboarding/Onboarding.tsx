import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { CommonActions, StackActions } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import Button from "../../components/common/Button";
import onboardingService from "../../services/onboardingService";
import routes from "../../constants/routes";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import { removeData, retrieveData, StorageKeys } from "../../storage";
import {
  ONBOARDING_BUTTON_ACTION,
  NAV_ROUTES,
} from "../../constants/commonConstant";
import { toastMessageError } from "../../components/common/ToastMessage";

const Onboarding: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [isBeginLoading, setIsBeginLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedQuestionIdRaw = await retrieveData(
          StorageKeys.onboardingQuestionId,
        );
        if (storedQuestionIdRaw) {
          navigation.dispatch(
            StackActions.replace(routes.onboarding.QUESTION_ANSWER),
          );
        }
      } catch (err) {
        console.log("err", err);
        toastMessageError(t("common.something_went_wrong"));
      }
    })();
  }, [navigation]);

  const handleContinue = async (buttonType: string) => {
    if (buttonType === ONBOARDING_BUTTON_ACTION.SKIP) {
      setIsSkipLoading(true);
      try {
        const response = await onboardingService.updateOnboardingStatus();
        if (response.success) {
          await removeData(StorageKeys.onboardingQuestionId);
          
          // Immediately update Redux state for instant UI feedback
          dispatch(updateOnboardingStatusLocally({
            skip_profile_creation: true,
            skip_onboarding_question: true,
            skip_walkthrough: true,
          }));
          
          if (authData) {
            setAuthData({
              ...authData,
              user: {
                ...authData.user!,
                has_completed_onboarding: true,
                onboarding_status: {
                  ...(authData.user?.onboarding_status || {
                    profile_creation_completed: false,
                    love_profile_onboarding: false,
                    analyser_onboarding: false,
                    global_chat_onboarding: false,
                    friends_onboarding: false,
                  }),
                  skip_profile_creation: true,
                  skip_onboarding_question: true,
                  skip_walkthrough: true,
                },
              },
            });
          }
          const resetAction = CommonActions.reset({
            index: 0,
            routes: [
              {
                name: NAV_ROUTES.MAIN_STACK,
                state: {
                  routes: [
                    {
                      name: "ProfilesTab",
                      state: {
                        routes: [{ name: "PartnerProfiles" }],
                      },
                    },
                  ],
                },
              },
            ],
          });
          const appStackNavigation = navigation.getParent()?.getParent();
          if (appStackNavigation) {
            appStackNavigation.dispatch(resetAction);
          } else {
            navigation.dispatch(resetAction);
          }
        }
      } catch (err) {
        console.log("err", err);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setIsSkipLoading(false);
      }
    } else {
      setIsBeginLoading(true);
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routes.onboarding.QUESTION_ANSWER }],
          }),
        );
      } catch (err) {
        console.log("err", err);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setIsBeginLoading(false);
      }
    }
  };

  return (
    <LinearGradient
      colors={["#fcfdfd", "#F5F7FA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Onboarding Image */}
          <View style={styles.imageContainer}>
            <Image
              source={Images.ONBOARDING1}
              style={styles.onboardingImage}
              resizeMode="contain"
            />
          </View>

          {/* Main Heading */}
          <Text style={styles.mainHeading}>
            {t("onboarding.lets_get_started")}
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            {t("onboarding.subtitle")}
            {/* A few details from you = the most
            accurate insights from us. */}
          </Text>

          {/* Security Card */}
          <ImageBackground
            source={Images.LINEARGRADIENT_BG2}
            style={styles.securityCard}
            imageStyle={styles.cardImageStyle}
            resizeMode="cover"
          >
            {/* Secure Icon */}
            <View style={styles.secureIconContainer}>
              <Image
                source={Images.SECURE_ICON}
                style={styles.secureIcon}
                resizeMode="contain"
              />
            </View>

            {/* Card Content */}
            <View style={styles.secureCardContent}>
              <Text style={styles.cardTitle}>
                {t("onboarding.feelings_safe")}
              </Text>
              <Text style={styles.cardDescription}>
                {t("onboarding.privacy_message")}
              </Text>
            </View>
          </ImageBackground>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomContainer}>
          <Button
            title={t("onboarding.lets_begin")}
            onPress={() => handleContinue(ONBOARDING_BUTTON_ACTION.CONTINUE)}
            disabled={isSkipLoading || isBeginLoading}
            loading={isBeginLoading}
            containerStyle={styles.beginButton}
          />

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleContinue(ONBOARDING_BUTTON_ACTION.SKIP)}
            disabled={isSkipLoading || isBeginLoading}
          >
            {isSkipLoading ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <Text style={styles.skipButtonText}>{t("common.skip")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    height: Matrics.screenHeight,
    backgroundColor: colors.WHITE,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    height: Matrics.screenHeight,
  },
  scrollContent: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    alignItems: "center",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: Matrics.vs(40),
  },
  onboardingImage: {
    width: Matrics.s(280),
    height: Matrics.vs(240),
  },
  mainHeading: {
    fontSize: Matrics.ms(32),
    fontFamily: typography.fontFamily.Poppins.Bold,
    fontWeight: "700",
    color: colors.TEXT_DARK,
    textAlign: "left",
    width: "100%",
    // letterSpacing: -0.5,
    lineHeight: Matrics.vs(32),
    marginBottom: Matrics.vs(8),
  },
  subtitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "left",
    width: "100%",
    lineHeight: Matrics.vs(18),
    marginBottom: Matrics.vs(30),
  },
  securityCard: {
    width: "100%",
    borderRadius: Matrics.s(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.2)",
    alignItems: "center",
    overflow: "visible",
  },
  cardImageStyle: {
    borderRadius: Matrics.s(16),
  },
  secureIconContainer: {
    width: Matrics.s(30),
    height: Matrics.s(30),
    borderRadius: Matrics.s(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: Matrics.vs(-12),
    marginBottom: Matrics.vs(8),
  },
  secureIcon: {
    width: "100%",
    height: "100%",
  },
  secureCardContent: {
    paddingHorizontal: Matrics.s(15),
    paddingBottom: Matrics.vs(20),
  },
  cardTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    textAlign: "center",
    marginBottom: Matrics.vs(5),
  },
  cardDescription: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    textAlign: "center",
    lineHeight: Matrics.vs(16),
  },
  bottomContainer: {
    paddingHorizontal: Matrics.s(24),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(20),
  },
  beginButton: {
    width: "100%",
    marginBottom: Matrics.vs(5),
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Matrics.vs(15),
    paddingBottom: Matrics.vs(0),
  },
  skipButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
  },
});

export default Onboarding;
