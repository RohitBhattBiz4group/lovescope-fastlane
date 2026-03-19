import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import Button from "../../components/common/Button";
import CommonHeader from "../../components/common/CommonHeader";
import TextArea from "../../components/common/TextArea";
import quizService from "../../services/quizService";
import { IQuizDetailResponse, IQuizItem } from "../../interfaces/quizInterfaces";
import { IGroupResponse } from "../../interfaces/groupInterface";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import LinearGradient from "react-native-linear-gradient";
import { useTranslation } from "../../hooks/useTranslation";

interface AnswerQuizParams {
  quiz?: IQuizItem;
  friend?: FriendNavParam;
  group?: IGroupResponse;
}
import { truncateText } from "../../utils/helper";
import { FriendNavParam } from "../../interfaces/navigationTypes";

const MAX_CHAR_COUNT = 200;

const AnswerQuiz: React.FC<ScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { quiz } = (route?.params as AnswerQuizParams) || {};
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizDetail, setQuizDetail] = useState<IQuizDetailResponse | null>(
    null
  );
  const { friend } = (route?.params as { friend?: FriendNavParam }) || {};
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);

  useEffect(() => {
    fetchQuizDetail();
  }, []);

  const fetchQuizDetail = async () => {
    if (!quiz?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await quizService.getQuizDetail(quiz.id);
      if (response.success && response.data) {
        setQuizDetail(response.data);
      } else {
        toastMessageError(t("common.something_went_wrong"));
      }
    } catch (error) {
      console.error("Failed to fetch quiz detail:", error);
      toastMessageError(t("common.something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };
   

  const handleSubmit = async () => {
    setResponseLoading(true);
    if (!quizDetail?.questions || !quiz?.id) return;

    const unansweredQuestions = quizDetail.questions.filter(
      (question) => !answers[question.id]?.trim()
    );

    if (unansweredQuestions.length > 0) {
      setResponseLoading(false);
      toastMessageError(t("quiz.answer.answer_all_questions"));
      return;
    }
    try {
      const response = await quizService.submitQuizAnswers({
        quiz_id: quiz.id,
        answers,
      });
      if (response.success) {
        // Check if this is a group quiz
        if (quiz.group_id) {
          // Navigate back to FriendsMain with groups tab selected, then to GroupChat
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: "FriendsMain", params: { initialTab: "groups" } },
                { name: "GroupChat", params: { group: { id: quiz.group_id, group_name: quiz.group_name } } },
              ],
            })
          );
        } else {
          // Existing behavior for friend chats
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: "FriendsMain" },
                { name: "FriendChatDetails", params: { friend, refresh: true } },
              ],
            })
          );
        }
        toastMessageSuccess(response.message);
      } else {
        toastMessageError(t("quiz.answer.failed_to_submit"));
      }
    } catch (error) {
      console.error("Failed to submit answers:", error);
      toastMessageError(t("quiz.answer.failed_to_submit"));
    } finally {
      setResponseLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      {/* Header */}
      <CommonHeader
        showBackButton
        title={t("quiz.answer.title")}
        onBackPress={() => navigation.goBack()}
        showNotificationBadge
        onNotificationPress={() => navigation.navigate("Notifications")}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quiz Info Card */}
            <View style={styles.quizInfoCard}>
              <Text style={styles.quizTitle}>{quizDetail?.title}</Text>
              <View style={styles.quizMetaRow}>
                <View style={styles.quizMetaItem}>
                  <Image
                    source={Images.QUIZ_USER}
                    style={styles.quizIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.quizMetaText}>
                    {truncateText(quizDetail?.love_profile_name, 25)}
                  </Text>
                </View>
                <View style={styles.quizMetaItem}>
                  <Image
                    source={Images.QUIZ_QUESTION}
                    style={styles.quizIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.quizMetaText}>
                    {t("quiz.answer.questions_count", { count: quizDetail?.questions?.length || 0 })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Questions */}
            {quizDetail?.questions?.map((question) => (
              <View key={question.id} style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  {question.question_text}
                </Text>
                <TextArea
                  name={`answer_${question.id}`}
                  placeholder={t("quiz.answer.enter_answer_placeholder")}
                  value={answers[question.id] || ""}
                  onChangeText={(text) => handleAnswerChange(question.id, text)}
                  maxLength={MAX_CHAR_COUNT}
                  showCharCount
                  containerStyle={styles.textAreaContainer}
                  inputStyle={styles.textAreaInput}
                />
              </View>
            ))}

            {/* Submit Button - inside ScrollView for keyboard adjustment */}
            <View style={styles.bottomButtonContainer}>
              <Button
                title={t("quiz.answer.submit_responses")}
                onPress={handleSubmit}
                loading={responseLoading}
                containerStyle={styles.submitButton}
                textStyle={styles.submitButtonText}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoid: {
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
  // Quiz Info Card
  quizInfoCard: {
    backgroundColor: "rgba(31, 31, 31, 0.05)",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(25),
  },
  quizTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(10),
  },
  quizMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  quizMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Matrics.s(25),
  },
  quizIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(5),
    tintColor: colors.TEXT_PRIMARY,
  },
  quizMetaText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
  },
  // Questions
  questionContainer: {
    marginBottom: Matrics.vs(15),
  },
  questionText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(5),
    lineHeight: 20,
  },
  textAreaContainer: {
    marginBottom: 0,
  },
  textAreaInput: {
    height: Matrics.vs(100),
  },
  // Bottom Button
  bottomButtonContainer: {
    paddingBottom: Matrics.vs(10),
    paddingTop: Matrics.vs(5),
  },
  submitButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(16),
  },
  submitButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 16,
  },
});

export default AnswerQuiz;
