import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import {
  IOnboardingPage,
  IPageQuestion,
  IPageResponseData,
  ISingleResponsePayload,
  OnboardingAnswerValue,
  IQuestion,
} from "../../interfaces/onboardingInterfaces";
import onboardingService from "../../services/onboardingService";
import { CommonActions } from "@react-navigation/native";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import {
  removeData,
  retrieveData,
  storeData,
  StorageKeys,
} from "../../storage";
import QuestionStep from "../../components/common/QuestionStep";
import {
  ONBOARDING_QUESTION_TYPE,
  ONBOARDING_DIRECTION,
  ONBOARDING_ANIMATION_TRANSLATE,
  ONBOARDING_ANIMATION_DURATION,
  NAV_ROUTES,
  PROFILE_CREATION_START_PAGE_ORDER,
  PROFILE_CREATION_END_PAGE_ORDER,
} from "../../constants/commonConstant";
import profileService from "../../services/profileService";
import { ICreateProfile } from "../../interfaces/profileInterfaces";
import FullPageLoader from "../../components/common/FullPageLoader";
import LinearGradient from "react-native-linear-gradient";
import fontsSize from "../../config/appStyling/fontsSize";

// ── Helpers to convert between page-based response format and QuestionRenderer format ──

// Map page_key to profile field for profile creation steps
const PAGE_KEY_TO_PROFILE_FIELD: Record<string, (keyof ICreateProfile)[]> = {
  profile_name_new: ["full_name"],
  profile_name_past: ["full_name"],
  profile_name_complicated: ["full_name"],
  profile_vibe: ["relationship_tag"],
  profile_details: ["age", "gender"],
  profile_ethnicity: ["ethnicity", "region"],
  profile_notes: ["notes"],
};

const toAnswerValue = (
  data: IPageResponseData,
  questionType: string,
): OnboardingAnswerValue | undefined => {
  if (
    questionType === ONBOARDING_QUESTION_TYPE.RANGE &&
    data.answer_numeric != null
  ) {
    return data.answer_numeric;
  }
  if (
    questionType === ONBOARDING_QUESTION_TYPE.MULTISELECT ||
    questionType === ONBOARDING_QUESTION_TYPE.CHECKBOX
  ) {
    return data.selected_option_values ?? [];
  }
  return data.answer_text ?? undefined;
};

const toResponsePayload = (
  questionId: number,
  value: OnboardingAnswerValue,
  questionType: string,
): ISingleResponsePayload => {
  if (questionType === ONBOARDING_QUESTION_TYPE.RANGE) {
    return { question_id: questionId, answer_numeric: value as number };
  }
  if (
    questionType === ONBOARDING_QUESTION_TYPE.MULTISELECT ||
    questionType === ONBOARDING_QUESTION_TYPE.CHECKBOX
  ) {
    return {
      question_id: questionId,
      selected_option_values: value as string[],
    };
  }
  return { question_id: questionId, answer_text: value as string };
};

/** Normalize an option object from any JSONB format to {text, description, value} */
const normalizeOption = (
  opt: Record<string, any>,
): { text: string; description?: string; value?: string } => ({
  text: opt.text ?? opt.label ?? "",
  description: opt.description ?? opt.subtitle ?? "",
  value: opt.value ?? undefined,
});

/** Map IPageQuestion → IQuestion shape for QuestionStep/QuestionRenderer compatibility */
const toIQuestion = (pq: IPageQuestion): IQuestion => ({
  id: pq.id,
  question: pq.question_title ?? "",
  question_type: pq.question_type,
  order_index: pq.question_order,
  is_active: true,
  options: pq.options?.map(normalizeOption) ?? null,
  range: null,
  is_parent: true,
});

const Questions: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const [pages, setPages] = useState<IOnboardingPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<number, OnboardingAnswerValue>
  >({});
  const [initialAnswersByQuestionId, setInitialAnswersByQuestionId] = useState<
    Record<number, OnboardingAnswerValue>
  >({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();

  const { width: windowWidth } = useWindowDimensions();

  const animOpacity = useRef(new Animated.Value(1)).current;
  const animTranslate = useRef(new Animated.Value(0)).current;

  // ── Resolve page variants ──
  // Pages sharing the same page_order are conditional variants.
  // The correct variant is selected by matching page_key against
  // "profile_name_<selected_value>" derived from the dependency question's answer.
  const resolvedPages: IOnboardingPage[] = useMemo(() => {
    if (pages.length === 0) return [];

    // Group pages by page_order
    const orderGroups = new Map<number, IOnboardingPage[]>();
    for (const page of pages) {
      const group = orderGroups.get(page.page_order) ?? [];
      group.push(page);
      orderGroups.set(page.page_order, group);
    }

    const result: IOnboardingPage[] = [];
    const sortedOrders = [...orderGroups.keys()].sort((a, b) => a - b);

    for (const order of sortedOrders) {
      const group = orderGroups.get(order)!;
      if (group.length === 1) {
        result.push(group[0]);
      } else {
        // Multiple variants with same page_order — resolve by page_key match.
        // Find the dependency question ID from any variant's questions
        const depQuestionId = group[0].questions.find(
          (q) => q.depends_on_question_id != null,
        )?.depends_on_question_id;

        const depAnswer = depQuestionId != null
          ? answersByQuestionId[depQuestionId]
          : undefined;

        if (depAnswer != null && typeof depAnswer === "string") {
          // Build expected key: "profile_name_<selected_value>" (lowercase, spaces → underscores)
          const expectedKey =
            "profile_name_" + depAnswer.toLowerCase().replace(/\s+/g, "_");

          const matched = group.find(
            (page) => page.page_key === expectedKey,
          );
          result.push(matched ?? group[0]);
        } else {
          // Dependency not answered yet — show first variant as fallback
          result.push(group[0]);
        }
      }
    }

    return result;
  }, [pages, answersByQuestionId]);

  const currentPage = resolvedPages[currentPageIndex] ?? null;
  const totalPageCount = resolvedPages.length;

  const progress =
    totalPageCount > 0
      ? ((currentPageIndex + 1) / totalPageCount) * 100
      : 0;

  const canRender = !pageLoading && resolvedPages.length > 0 && !!currentPage;

  // ── Check if current page is a profile creation step (page_order 3-6) ──
  const isProfileCreationStep = useMemo(() => {
    if (!currentPage) return false;
    return (
      currentPage.page_order >= PROFILE_CREATION_START_PAGE_ORDER &&
      currentPage.page_order <= PROFILE_CREATION_END_PAGE_ORDER
    );
  }, [currentPage]);

  // ── Visible questions (conditional dependency logic) ──

  const visibleQuestions: IPageQuestion[] = useMemo(() => {
    if (!currentPage) return [];
    return currentPage.questions.filter((q) => {
      if (!q.depends_on_question_id) return true;
      const depAnswer = answersByQuestionId[q.depends_on_question_id];
      if (depAnswer === undefined || depAnswer === null) return false;
      const expectedValue = q.depends_on_option_value ?? "";
      if (Array.isArray(depAnswer)) {
        return depAnswer.includes(expectedValue);
      }
      return String(depAnswer) === expectedValue;
    });
  }, [currentPage, answersByQuestionId]);

  // ── Answer helpers ──

  const setAnswer = useCallback(
    (questionId: number, value: OnboardingAnswerValue) => {
      setAnswersByQuestionId((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    },
    [],
  );

  const areAnswersEqual = (
    firstAnswer: OnboardingAnswerValue,
    secondAnswer: OnboardingAnswerValue,
  ): boolean => {
    if (firstAnswer === undefined && secondAnswer === undefined) return true;
    if (firstAnswer === undefined || secondAnswer === undefined) return false;
    if (firstAnswer === null && secondAnswer === null) return true;
    if (firstAnswer === null || secondAnswer === null) return false;

    if (Array.isArray(firstAnswer) && Array.isArray(secondAnswer)) {
      if (firstAnswer.length !== secondAnswer.length) return false;
      const sortedFirst = [...firstAnswer].sort();
      const sortedSecond = [...secondAnswer].sort();
      return sortedFirst.every((value, index) => value === sortedSecond[index]);
    }

    if (typeof firstAnswer === "string" && typeof secondAnswer === "string") {
      return firstAnswer.trim() === secondAnswer.trim();
    }

    if (typeof firstAnswer === "number" && typeof secondAnswer === "number") {
      return firstAnswer === secondAnswer;
    }

    return false;
  };

  // ── Validation ──

  const isPageValid = (): boolean => {
    return visibleQuestions.every((q) => {
      if (q.is_optional) return true;
      const value = answersByQuestionId[q.id];
      const type = q.question_type;

      if (type === ONBOARDING_QUESTION_TYPE.RANGE) {
        return typeof value === "number";
      }
      if (
        type === ONBOARDING_QUESTION_TYPE.MULTISELECT ||
        type === ONBOARDING_QUESTION_TYPE.CHECKBOX
      ) {
        return Array.isArray(value) && value.length > 0;
      }
      return typeof value === "string" && value.trim().length > 0;
    });
  };

  // ── Transitions ──

  const runStepTransition = (
    direction:
      | typeof ONBOARDING_DIRECTION.NEXT
      | typeof ONBOARDING_DIRECTION.BACK,
  ) => {
    animOpacity.setValue(0);
    animTranslate.setValue(
      direction === ONBOARDING_DIRECTION.NEXT
        ? ONBOARDING_ANIMATION_TRANSLATE
        : -ONBOARDING_ANIMATION_TRANSLATE,
    );
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: ONBOARDING_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animTranslate, {
        toValue: 0,
        duration: ONBOARDING_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ── Skip / complete onboarding ──

  const handleSkip = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await onboardingService.updateOnboardingStatus();
      if (response.success) {
        await removeData(StorageKeys.onboardingPageKey);
        dispatch(updateOnboardingStatusLocally({
          skip_profile_creation: true,
          skip_onboarding_question: true,
          skip_walkthrough: true,
        }));

        // Update auth data with profile_creation_completed and has_completed_onboarding
        if (authData?.user) {
          setAuthData({
            ...authData,
            user: {
              ...authData.user,
              has_completed_onboarding: true,
              onboarding_status: {
                ...(authData.user.onboarding_status || {
                  skip_profile_creation: true,
                  skip_onboarding_question: true,
                  skip_walkthrough: true,
                  love_profile_onboarding: false,
                  analyser_onboarding: false,
                  global_chat_onboarding: false,
                  friends_onboarding: false,
                }),
                profile_creation_completed: false,
              },
            },
          });
        }

        const appStackNavigation = navigation.getParent()?.getParent();
        if (appStackNavigation) {
          appStackNavigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: NAV_ROUTES.MAIN_STACK }],
            }),
          );
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: NAV_ROUTES.MAIN_STACK }],
            }),
          );
        }
      } else {
        setErrorMessage(t("onboarding.something_went_wrong"));
      }
    } catch (err) {
      console.error("Error", err);
      setErrorMessage(t("onboarding.something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  // ── Submit answers for current page ──

  const submitCurrentPageAnswers = async (): Promise<boolean> => {
    const changedResponses: ISingleResponsePayload[] = [];

    for (const q of visibleQuestions) {
      const currentAnswer = answersByQuestionId[q.id];
      const initialAnswer = initialAnswersByQuestionId[q.id];
      if (currentAnswer === undefined) continue;
      if (!areAnswersEqual(currentAnswer, initialAnswer)) {
        changedResponses.push(toResponsePayload(q.id, currentAnswer, q.question_type));
      }
    }

    if (changedResponses.length === 0) return true;

    const res = await onboardingService.submitOnboardingResponses({
      responses: changedResponses,
    });

    if (!res?.success) {
      throw new Error(res?.message || "Failed to submit responses");
    }

    // Update initial answers to match current
    const updatedInitial = { ...initialAnswersByQuestionId };
    for (const q of visibleQuestions) {
      const val = answersByQuestionId[q.id];
      if (val !== undefined) {
        updatedInitial[q.id] = Array.isArray(val) ? [...val] : val;
      }
    }
    setInitialAnswersByQuestionId(updatedInitial);

    return true;
  };

  // ── Build profile data directly from answers across all profile pages ──
  const buildProfileData = (): ICreateProfile => {
    const profileData: ICreateProfile = {
      full_name: "",
      age: 18,
      gender: "",
      relationship_tag: "",
      ethnicity: [],
      region: "",
      notes: "",
    };

    for (const page of resolvedPages) {
      if (
        page.page_order < PROFILE_CREATION_START_PAGE_ORDER ||
        page.page_order > PROFILE_CREATION_END_PAGE_ORDER
      ) {
        continue;
      }

      const fields = PAGE_KEY_TO_PROFILE_FIELD[page.page_key];
      if (!fields) continue;

      const pageQuestions = page.questions.filter((q) => {
        if (!q.depends_on_question_id) return true;
        const depAnswer = answersByQuestionId[q.depends_on_question_id];
        if (depAnswer === undefined || depAnswer === null) return false;
        const expectedValue = q.depends_on_option_value ?? "";
        if (Array.isArray(depAnswer)) {
          return depAnswer.includes(expectedValue);
        }
        return String(depAnswer) === expectedValue;
      });

      fields.forEach((field, index) => {
        const question = pageQuestions[index];
        if (!question) return;

        const answerValue = answersByQuestionId[question.id];
        if (answerValue === undefined) return;

        (profileData as unknown as Record<string, string | string[] | number>)[field] =
          answerValue;
      });
    }

    return profileData;
  };

  // ── Save profile and complete onboarding ──
  const saveProfileAndComplete = async () => {
    const profileData = buildProfileData();

    // Create the profile
    const profileResponse = await profileService.createProfile(profileData);
    if (!profileResponse.success) {
      throw new Error(profileResponse.message || "Failed to create profile");
    }

    // Mark profile creation as completed (without setting skip flags)
    const response = await onboardingService.completeProfileCreation();
    if (!response.success) {
      throw new Error("Failed to update onboarding status");
    }

    await removeData(StorageKeys.onboardingPageKey);

    // Immediately update Redux state for instant UI feedback
    dispatch(updateOnboardingStatusLocally({
      profile_creation_completed: true,
    }));

    // Update auth data with profile_creation_completed and has_completed_onboarding
    if (authData?.user) {
      setAuthData({
        ...authData,
        user: {
          ...authData.user,
          has_completed_onboarding: true,
          onboarding_status: {
            ...(authData.user.onboarding_status || {
              skip_profile_creation: false,
              skip_onboarding_question: false,
              skip_walkthrough: false,
              love_profile_onboarding: false,
              analyser_onboarding: false,
              global_chat_onboarding: false,
              friends_onboarding: false,
            }),
            profile_creation_completed: true,
          },
        },
      });
    }

    // Navigate to ProfilesTab > PartnerProfiles with walkthrough param
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
                  routes: [
                    {
                      name: "PartnerProfiles",
                      params: { startWalkthrough: true },
                    },
                  ],
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
  };

  // ── Continue to next page ──

  const handleContinue = async () => {
    if (loading) return;
    if (!currentPage) return;

    setErrorMessage("");

    if (!isPageValid()) {
      setErrorMessage(t("onboarding.please_answer_before_continuing"));
      return;
    }

    setLoading(true);
    try {
      await submitCurrentPageAnswers();

      // Check if this is the last profile creation step (page_order 6)
      const isLastProfileStep =
        currentPage.page_order === PROFILE_CREATION_END_PAGE_ORDER;

      if (isLastProfileStep) {
        // Save profile and complete onboarding
        await saveProfileAndComplete();
      } else if (currentPageIndex < resolvedPages.length - 1) {
        setCurrentPageIndex((prev) => prev + 1);
        runStepTransition(ONBOARDING_DIRECTION.NEXT);
      } else {
        await handleSkip();
      }
    } catch (err) {
      console.error("error::", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : t("onboarding.something_went_wrong");
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Back ──

  const handleBack = () => {
    if (loading) return;
    setErrorMessage("");

    if (currentPageIndex === 0) {
      return;
    }

    setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    runStepTransition(ONBOARDING_DIRECTION.BACK);
  };

  // ── Fetch pages + responses on mount ──

  const fetchPagesAndResponses = async () => {
    setPageLoading(true);
    try {
      const [pagesRes, responsesRes] = await Promise.all([
        onboardingService.fetchOnboardingPages(),
        onboardingService.fetchOnboardingResponses(),
      ]);


      if (pagesRes.success && pagesRes.data) {
        setPages(pagesRes.data);

        // Pre-fill answers from existing responses
        const answers: Record<number, OnboardingAnswerValue> = {};
        const initAnswers: Record<number, OnboardingAnswerValue> = {};

        if (responsesRes?.success && responsesRes?.data) {

          // Build a question type lookup from all pages
          const questionTypeMap: Record<number, string> = {};
          for (const page of pagesRes.data) {
            for (const q of page.questions) {
              questionTypeMap[q.id] = q.question_type;
            }
          }

          Object.keys(responsesRes?.data ?? {}).forEach((questionIdStr) => {
            const questionId = Number(questionIdStr);
            const responseData = responsesRes?.data?.[questionId];
            if (!responseData) return;

            const qType = questionTypeMap[questionId];
            if (!qType) return;

            const val = toAnswerValue(responseData, qType);
            if (val !== undefined) {
              answers[questionId] = val;
              initAnswers[questionId] = Array.isArray(val) ? [...val] : val;
            }
          });

          setAnswersByQuestionId(answers);
          setInitialAnswersByQuestionId(initAnswers);
        }

        // Resume from stored page key
        // Resolve pages inline using the same logic as the memo
        const storedPageKeyRaw = await retrieveData(StorageKeys.onboardingPageKey);
        if (storedPageKeyRaw) {
          const storedPageKey = JSON.parse(storedPageKeyRaw);

          const orderGroups = new Map<number, IOnboardingPage[]>();
          for (const page of pagesRes.data) {
            const group = orderGroups.get(page.page_order) ?? [];
            group.push(page);
            orderGroups.set(page.page_order, group);
          }
          const tempResolved: IOnboardingPage[] = [];
          for (const order of [...orderGroups.keys()].sort((a, b) => a - b)) {
            const group = orderGroups.get(order)!;
            if (group.length === 1) {
              tempResolved.push(group[0]);
            } else {
              const depQId = group[0].questions.find(
                (q) => q.depends_on_question_id != null,
              )?.depends_on_question_id;
              const depAns = depQId != null ? answers[depQId] : undefined;
              if (depAns != null && typeof depAns === "string") {
                const expKey =
                  "profile_name_" + depAns.toLowerCase().replace(/\s+/g, "_");
                const m = group.find((p) => p.page_key === expKey);
                tempResolved.push(m ?? group[0]);
              } else {
                tempResolved.push(group[0]);
              }
            }
          }

          const idx = tempResolved.findIndex(
            (p) => p.page_key === storedPageKey,
          );

          // Only skip to the stored page if all required questions on previous pages have responses
          if (idx > 0) {
            let canResume = true;
            for (let i = 0; i < idx; i++) {
              const page = tempResolved[i];
              for (const q of page.questions) {
                if (q.is_optional) continue;
                const answer = answers[q.id];
                const hasAnswer =
                  answer !== undefined &&
                  answer !== null &&
                  (Array.isArray(answer) ? answer.length > 0 : String(answer).trim().length > 0);
                if (!hasAnswer) {
                  canResume = false;
                  break;
                }
              }
              if (!canResume) break;
            }
            if (canResume) {
              setCurrentPageIndex(idx);
            }
          }
        }
      }
    } catch (err) {
      console.log("err", err);
      setErrorMessage(t("onboarding.unable_to_load_questions"));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchPagesAndResponses();
  }, []);

  // Persist current page key for resume
  useEffect(() => {
    const pageKey = resolvedPages[currentPageIndex]?.page_key;
    if (pageKey) {
      storeData(StorageKeys.onboardingPageKey, pageKey);
    }
  }, [currentPageIndex, resolvedPages]);

  const contentMaxWidth = Math.min(Matrics.s(560), windowWidth);

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          translucent={false}
        />

        {canRender ? (
          <>
            <View style={styles.stickyHeader}>
              <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progress}%` }]}
                  />
                </View>
                <Text style={styles.questionNumber}>
                  {t("onboarding.question_of", {
                    current: Math.min(currentPageIndex + 1, totalPageCount),
                    total: totalPageCount,
                  })}
                </Text>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: Matrics.vs(16), paddingBottom: Matrics.vs(140) },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.centerWrap, { maxWidth: contentMaxWidth }]}>
                {!!errorMessage && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <Animated.View
                  style={{
                    opacity: animOpacity,
                    transform: [{ translateY: animTranslate }],
                  }}
                >
                  {currentPage.page_title && (
                    <Text style={styles.pageTitle}>{currentPage.page_title}</Text>
                  )}
                  {!!currentPage.page_subtext && (
                    <Text style={styles.pageSubtext}>{currentPage.page_subtext}</Text>
                  )}

                  <View style={styles.questionsContainer}>
                    {visibleQuestions.map((pq) => (
                      <View key={pq.id} style={styles.questionItem}>
                        <QuestionStep
                          question={toIQuestion(pq)}
                          answersByQuestionId={answersByQuestionId}
                          setAnswer={setAnswer}
                          disabled={loading}
                          variant={pq.question_type === ONBOARDING_QUESTION_TYPE.PILL ? "pill" : undefined}
                          showArc={currentPageIndex === 0 || currentPageIndex === 2 || currentPageIndex === 4 || currentPageIndex === 5}
                        />
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
              {!isProfileCreationStep && (
                <View style={styles.skipButtonContainer}>
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>{t("onboarding.skip_for_now")}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.bottomInner, { maxWidth: contentMaxWidth }]}>
                {currentPageIndex > 0 && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("../../assets/images/arrow-left.png")}
                      style={styles.backButtonIcon}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    currentPageIndex === 0 && styles.continueButtonFullWidth,
                    (!isPageValid() || loading) &&
                    styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={loading || !isPageValid()}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.WHITE} />
                  ) : (
                    <Text style={styles.continueButtonText}>
                      {currentPageIndex === resolvedPages.length - 1
                        ? t("onboarding.save_and_continue")
                        : t("common.next")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <FullPageLoader size={180} showAnimatedText={false} />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(0),
    paddingBottom: Matrics.vs(0),
  },
  headerInner: {
    width: "100%",
    alignSelf: "center",
  },
  progressBar: {
    height: Matrics.vs(7),
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: Matrics.s(8),
    overflow: "hidden",
    marginTop: Matrics.vs(20),
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(8),
  },
  questionNumber: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginTop: Matrics.vs(8),
  },
  scrollContent: {
    paddingHorizontal: Matrics.s(20),
  },
  centerWrap: {
    width: "100%",
    alignSelf: "center",
  },
  pageTitle: {
    fontSize: fontsSize.XXLarge,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    // lineHeight: Matrics.vs(30),
    marginBottom: Matrics.vs(4),
  },
  pageSubtext: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(20),
    marginBottom: Matrics.vs(16),
  },
  questionsContainer: {
    gap: Matrics.ms(5),
  },
  questionItem: {},
  errorBanner: {
    borderWidth: 1,
    borderColor: "rgba(230, 20, 20, 0.25)",
    backgroundColor: "rgba(230, 20, 20, 0.06)",
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(10),
    borderRadius: Matrics.s(12),
    marginBottom: Matrics.vs(10),
  },
  errorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    color: colors.DANGER,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Matrics.s(20),
    backgroundColor: "transparent",
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(10),
  },
  bottomInner: {
    width: "100%",
    alignSelf: "center",
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
  continueButtonFullWidth: {
    flex: 1,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
  skipButtonContainer: {
    alignItems: "flex-end",
    marginBottom: Matrics.vs(8),
  },
  skipButton: {
    paddingVertical: Matrics.vs(0),
    paddingHorizontal: Matrics.s(2),
  },
  skipButtonText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
    lineHeight: Matrics.vs(17),
  },
});

export default Questions;
