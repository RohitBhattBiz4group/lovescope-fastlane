import React, { useEffect, useMemo, useRef, useState } from "react";
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
  IQuestion,
  OnboardingAnswerValue,
} from "../../interfaces/onboardingInterfaces";
import preferencesService from "../../services/preferencesService";
import QuestionStep from "../../components/common/QuestionStep";
import {
  ONBOARDING_QUESTION_TYPE,
  ONBOARDING_DIRECTION,
  ONBOARDING_ANIMATION_TRANSLATE,
  ONBOARDING_ANIMATION_DURATION,
} from "../../constants/commonConstant";
import FullPageLoader from "../../components/common/FullPageLoader";

const SetPreferences: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      await fetchQuestions();
    })();
  }, []);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<
    Record<number, OnboardingAnswerValue>
  >({});
  const [initialAnswersByQuestionId, setInitialAnswersByQuestionId] = useState<
    Record<number, OnboardingAnswerValue>
  >({});
  const [loading, setLoading] = useState(false);
  const [quesLoading, setQuesLoading] = useState(true);
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { width: windowWidth } = useWindowDimensions();

  const animOpacity = useRef(new Animated.Value(1)).current;
  const animTranslate = useRef(new Animated.Value(0)).current;

  const steps: IQuestion[] = useMemo(() => {
    const sorted = [...questions].sort(
      (firstQuestion, secondQuestion) =>
        firstQuestion.order_index - secondQuestion.order_index,
    );
    return sorted.filter((question) => question.is_active !== false);
  }, [questions]);

  const parentSteps: IQuestion[] = useMemo(() => {
    return steps.filter((question) => question.is_parent === true);
  }, [steps]);

  const totalQuestionCount = parentSteps.length;

  const activeStep = steps[currentStepIndex];

  const currentParentIndex = useMemo(() => {
    if (!activeStep) return 0;
    const idx = parentSteps.findIndex(
      (question) => question.id === activeStep.id,
    );
    return idx >= 0 ? idx : 0;
  }, [activeStep?.id, parentSteps]);

  const progress =
    totalQuestionCount > 0
      ? ((currentParentIndex + 1) / totalQuestionCount) * 100
      : 0;

  const canRenderQuestion = !quesLoading && steps.length > 0 && !!activeStep;

  const setAnswer = (questionId: number, value: OnboardingAnswerValue) => {
    setAnswersByQuestionId((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const submitAnswer = async (
    questionId: number,
    answer: OnboardingAnswerValue,
  ) => {
    const payload = {
      question_id: questionId,
      answer,
    };

    return preferencesService.submitAnswer(payload);
  };

  const isAnswerValid = (question: IQuestion): boolean => {
    const type = question.question_type;

    if (type === ONBOARDING_QUESTION_TYPE.SECTION) {
      const children = (question.children ?? [])
        .filter((child) => child.is_active !== false)
        .sort(
          (firstQuestion, secondQuestion) =>
            firstQuestion.order_index - secondQuestion.order_index,
        );
      return children.every((child) => isAnswerValid(child));
    }

    const value = answersByQuestionId[question.id];
    if (type === ONBOARDING_QUESTION_TYPE.RANGE)
      return typeof value === "number";

    if (
      type === ONBOARDING_QUESTION_TYPE.MULTISELECT ||
      type === ONBOARDING_QUESTION_TYPE.CHECKBOX
    ) {
      return Array.isArray(value) && value.length > 0;
    }

    return typeof value === "string" && value.trim().length > 0;
  };

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

  const hasAnswerChanged = (questionId: number): boolean => {
    const currentAnswer = answersByQuestionId[questionId];
    const initialAnswer = initialAnswersByQuestionId[questionId];
    return !areAnswersEqual(currentAnswer, initialAnswer);
  };

  const hasQuestionChanged = (question: IQuestion): boolean => {
    if (question.question_type === ONBOARDING_QUESTION_TYPE.SECTION) {
      const children = (question.children ?? [])
        .filter((child) => child.is_active !== false)
        .sort(
          (firstQuestion, secondQuestion) =>
            firstQuestion.order_index - secondQuestion.order_index,
        );
      return children.some((child) => hasQuestionChanged(child));
    }
    return hasAnswerChanged(question.id);
  };

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

  const handleContinue = async () => {
    if (loading) return;
    if (!activeStep) return;

    setErrorMessage("");

    if (!isAnswerValid(activeStep)) {
      setErrorMessage(t("onboarding.please_answer_before_continuing"));
      return;
    }

    const hasChanged = hasQuestionChanged(activeStep);

    if (!hasChanged) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        runStepTransition(ONBOARDING_DIRECTION.NEXT);
      } else {
        navigation.goBack();
      }
      return;
    }

    setLoading(true);
    try {
      const submitSingle = async (question: IQuestion) => {
        if (question.question_type === ONBOARDING_QUESTION_TYPE.SECTION) {
          const children = (question.children ?? [])
            .filter((child) => child.is_active !== false)
            .sort(
              (firstQuestion, secondQuestion) =>
                firstQuestion.order_index - secondQuestion.order_index,
            );
          for (const child of children) {
            if (hasQuestionChanged(child)) {
              await submitSingle(child);
            }
          }
          return;
        }

        if (!hasAnswerChanged(question.id)) {
          return;
        }

        const value = answersByQuestionId[question.id];
        const res = await submitAnswer(question.id, value);
        if (!res?.success) {
          throw new Error(res?.message || "Failed to submit answer");
        }
      };

      await submitSingle(activeStep);

      const updateInitialAnswers = (question: IQuestion) => {
        if (question.question_type === ONBOARDING_QUESTION_TYPE.SECTION) {
          const children = (question.children ?? [])
            .filter((child) => child.is_active !== false)
            .sort(
              (firstQuestion, secondQuestion) =>
                firstQuestion.order_index - secondQuestion.order_index,
            );
          children.forEach((child) => updateInitialAnswers(child));
          return;
        }
        const currentAnswer = answersByQuestionId[question.id];
        const initialAnswer = Array.isArray(currentAnswer)
          ? [...currentAnswer]
          : currentAnswer;
        setInitialAnswersByQuestionId((prev) => ({
          ...prev,
          [question.id]: initialAnswer,
        }));
      };
      updateInitialAnswers(activeStep);

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        runStepTransition(ONBOARDING_DIRECTION.NEXT);
      } else {
        navigation.goBack();
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

  const fetchAnswer = async (questionId: number) => {
    try {
      const res = await preferencesService.fetchAnswer(questionId);
      if (
        res?.success &&
        res?.data &&
        res.data.answer !== undefined &&
        res.data.answer !== null
      ) {
        const answer = res.data.answer;
        setAnswer(questionId, answer);
        const initialAnswer = Array.isArray(answer) ? [...answer] : answer;
        setInitialAnswersByQuestionId((prev) => ({
          ...prev,
          [questionId]: initialAnswer,
        }));
      }
    } catch (err) {
      console.error("error:", err);
      setErrorMessage(t("onboarding.failed_to_load_answer"));
    }
  };

  const fetchAllAnswers = async () => {
    try {
      const res = await preferencesService.fetchAllAnswers();
      if (res?.success && res?.data) {
        const allAnswers = res.data;

        Object.keys(allAnswers).forEach((questionIdStr) => {
          const questionId = Number(questionIdStr);
          const answer = allAnswers[questionId];

          if (answer !== undefined && answer !== null) {
            setAnswer(questionId, answer);
            const initialAnswer = Array.isArray(answer) ? [...answer] : answer;
            setInitialAnswersByQuestionId((prev) => ({
              ...prev,
              [questionId]: initialAnswer,
            }));
          }
        });
      }
    } catch (err) {
      console.error("error fetching all answers:", err);
      setErrorMessage(t("onboarding.failed_to_load_answers"));
    }
  };

  const fetchQuestions = async () => {
    setQuesLoading(true);
    try {
      const res = await preferencesService.fetchQuestions();
      if (res.success && res.data) {
        setCurrentStepIndex(0);
        setQuestions(res.data);
        await fetchAllAnswers();
      }
    } catch (err) {
      console.log("err", err);
      setErrorMessage(t("onboarding.unable_to_load_questions"));
    } finally {
      setQuesLoading(false);
    }
  };

  const handleBack = async () => {
    try {
      if (loading) return;

      setErrorMessage("");

      if (currentStepIndex === 0) {
        navigation.goBack();
        return;
      }

      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      runStepTransition(ONBOARDING_DIRECTION.BACK);
    } catch (err) {
      console.error("error::", err);
      setErrorMessage(t("onboarding.something_went_wrong"));
    }
  };

  useEffect(() => {
    const question = activeStep;
    if (!question) return;

    if (question.question_type === ONBOARDING_QUESTION_TYPE.SECTION) {
      const children = (question.children ?? []).filter(
        (child) => child.is_active !== false,
      );
      children.forEach((child) => {
        if (answersByQuestionId[child.id] === undefined) {
          fetchAnswer(child.id);
        }
      });
      return;
    }

    if (answersByQuestionId[question.id] === undefined) {
      fetchAnswer(question.id);
    }
  }, [activeStep?.id]);

  const contentMaxWidth = Math.min(Matrics.s(560), windowWidth);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent={false}
      />
      {canRenderQuestion ? (
        <>
          <View style={styles.stickyHeader}>
            <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
              <Text style={styles.questionNumber}>
                {t("onboarding.question_of", {
                  current: Math.min(currentParentIndex + 1, totalQuestionCount),
                  total: totalQuestionCount,
                })}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
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
                <QuestionStep
                  fromPrefrence={true}
                  question={activeStep}
                  answersByQuestionId={answersByQuestionId}
                  setAnswer={setAnswer}
                  disabled={loading}
                  variant="classic"
                />
              </Animated.View>
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <View style={[styles.bottomInner, { maxWidth: contentMaxWidth }]}>
              {currentStepIndex > 0 && (
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
                  currentStepIndex === 0 && styles.continueButtonFullWidth,
                  (!isAnswerValid(activeStep) || loading) &&
                    styles.continueButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={loading || !isAnswerValid(activeStep)}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.WHITE} />
                ) : (
                  <Text style={styles.continueButtonText}>
                    {currentStepIndex === steps.length - 1
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  stickyHeader: {
    backgroundColor: colors.WHITE,
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(0),
    paddingBottom: Matrics.vs(12),
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
    marginTop: Matrics.vs(8),
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(8),
  },
  questionNumber: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  scrollContent: {
    paddingHorizontal: Matrics.s(20),
  },
  centerWrap: {
    width: "100%",
    alignSelf: "center",
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: "rgba(230, 20, 20, 0.25)",
    backgroundColor: "rgba(230, 20, 20, 0.06)",
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(10),
    borderRadius: Matrics.s(12),
    marginBottom: Matrics.vs(14),
  },
  errorText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.DANGER,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Matrics.s(20),
    backgroundColor: colors.WHITE,
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
});

export default SetPreferences;
