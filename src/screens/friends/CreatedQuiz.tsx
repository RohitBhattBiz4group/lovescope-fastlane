import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import Button from "../../components/common/Button";
import CommonHeader from "../../components/common/CommonHeader";
import AddEditQuestionsModal from "../../components/friends/AddEditQuestionsModal";
import quizService from "../../services/quizService";
import {
  ICreateQuizResponse,
  IQuizQuestion,
} from "../../interfaces/quizInterfaces";
import { UserStackParamList } from "../../interfaces/navigationTypes";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import { getInitials, truncateText } from "../../utils/helper";
import { useTranslation } from "../../hooks/useTranslation";
import LinearGradient from "react-native-linear-gradient";
import { CDN_IMAGE_URL, QUIZ_TYPE } from "../../constants/commonConstant";
import FullPageLoader from "../../components/common/FullPageLoader";

const CreatedQuiz: React.FC<ScreenProps<UserStackParamList, "CreatedQuiz">> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const params = (route?.params ?? {}) as UserStackParamList["CreatedQuiz"];
  const {
    quizTitle,
    purpose,
    questionCount,
    friend_details,
    group_details,
    love_profile_id,
    quiz_type,
    timeline_reference,
    quiz_category,
    selected_event_id,
    selected_event_title,
    selected_event_summary,
  } = params;

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [questions, setQuestions] = useState<IQuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<ICreateQuizResponse | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [error, setError] = useState(false);
  const [shareError, setShareError] = useState(false);

  const createQuiz = async () => {
    try {
      setLoading(true);
      setError(false);

      const parsedLoveProfileId =
        typeof love_profile_id === "string"
          ? parseInt(love_profile_id, 10)
          : typeof love_profile_id === "number"
            ? love_profile_id
            : undefined;

      const noOfQuestions =
        typeof questionCount === "string"
          ? parseInt(questionCount, 10)
          : typeof questionCount === "number"
            ? questionCount
            : undefined;

      if (!quizTitle || !parsedLoveProfileId || !noOfQuestions) {
        setLoading(false);
        setError(true);
        return;
      }

      const payload = {
        title: quizTitle,
        purpose: purpose || "",
        group_id: group_details && group_details.id ? group_details.id : null,
        target_user_id:
          friend_details && friend_details.id
            ? parseInt(String(friend_details.id), 10)
            : null,
        profile_id: parsedLoveProfileId,
        no_of_question: noOfQuestions,
        timeline_reference: timeline_reference || null,
        quiz_category: quiz_category || null,
        selected_event_id: selected_event_id || null,
        selected_event_summary: selected_event_summary || null,
      };

      const response = await quizService.createNewQuiz(payload);

      if (response && response.success && response.data) {
        setQuizData(response.data);

        const mappedQuestions = response.data.quiz_questions.map((q, index) => ({
          id: String(index + 1),
          questionNumber: t("quiz.create.question_label", { number: index + 1 < 10 ? `0${index + 1}` : index + 1 }),
          question: q.question,
        }));

        setQuestions(mappedQuestions);
      } else {
        setError(true);
        toastMessageError(response.message || t("quiz.create.failed_to_create_quiz"));
      }
    } catch (error: unknown) {
      setError(true);
      toastMessageError(t("analyzer.portrait.no_profiles_title"),
        t("analyzer.portrait.no_profiles_message"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createQuiz();
  }, [quizTitle, purpose, questionCount, friend_details, love_profile_id]);

  const handleAddEdit = () => {
    setShowAddEditModal(true);
  };

  const handleSaveQuestions = (updatedQuestions: IQuizQuestion[]) => {
    setQuestions(updatedQuestions);
  };

  const handleShareQuiz = async () => {
    try {
      setShareError(false);
      const parsedLoveProfileId =
        typeof love_profile_id === "string"
          ? parseInt(love_profile_id, 10)
          : typeof love_profile_id === "number"
            ? love_profile_id
            : undefined;

      if (!quizTitle || !parsedLoveProfileId || !questions || questions.length === 0) {
        setShareError(true);
        toastMessageError(t("quiz.create.unable_to_share_quiz"));
        return;
      }

      setShareLoading(true);

      const payload = {
        title: quizTitle,
        purpose: purpose || "",
        group_id: group_details && group_details.id ? group_details.id : null,
        target_user_id:
          friend_details && friend_details.id
            ? parseInt(String(friend_details.id), 10)
            : null,
        profile_id: parsedLoveProfileId,
        no_of_question: questions.length,
        quiz_questions: questions.map((quizQuestion) => ({ question: quizQuestion.question })),
        timeline_reference: timeline_reference || null,
        quiz_category: quiz_category || null,
        selected_event_id: selected_event_id || null,
      };

      const response = await quizService.shareQuiz(payload);

      if (response.success) {
        if (quiz_type === QUIZ_TYPE.GROUP) {
          navigation.reset({
            index: 1,
            routes: [
              { name: "FriendsMain" },
              { name: "GroupChat", params: { group: group_details } },
            ],
          });
        } else {
          navigation.reset({
            index: 1,
            routes: [
              { name: "FriendsMain" },
              { name: "FriendChatDetails", params: { friend: friend_details } },
            ],
          });
        }
        toastMessageSuccess(
          response.message || t("quiz.create.quiz_shared_successfully")
        );
      } else {
        setShareError(true);
        toastMessageError(response.message || t("quiz.create.failed_to_share_quiz"));
      }
    } catch (error: unknown) {
      setShareError(true);
      const err = error as { message?: string; error?: string } | null;
      const message =
        (err && (err.message || err.error || String(err))) ||
        t("common.something_went_wrong");
      toastMessageError(t("quiz.response.something_went_wrong"), message);
    } finally {
      setShareLoading(false);
    }
  };

  const sharingName =
    truncateText(friend_details?.name) ||
    truncateText(group_details?.group_name) ||
    "";

  const renderQuestionItem = (question: IQuizQuestion, index: number) => (
    <View key={index}>
      <Text style={styles.questionLabel}>
        {t("quiz.create.question_label", { number: index + 1 })}
      </Text>
      <Text style={styles.questionText}>{question.question}</Text>
      {questions && index < questions.length - 1 && (
        <View style={styles.divider} />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
        locations={[0.1977, 1]}
        style={styles.gradient}
      />
      {/* Header */}
      <CommonHeader
        showBackButton
        title={t("quiz.create.header_title")}
        onBackPress={() => navigation.goBack()}
        showNotificationBadge
        onNotificationPress={() => navigation.navigate("Notifications")}
      />

      {loading ? (
        <FullPageLoader />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t("quiz.response.something_went_wrong")}</Text>
              <Text style={styles.errorSubText}>{t("common.try_again_later")}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={createQuiz}>
                <Text style={styles.retryButtonText}>{t("common.try_again")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.quizTitle}>
                {quizData?.quiz_title || quizTitle}
              </Text>

              <View style={styles.profileCard}>
                <View style={styles.profileContent}>
                  <View style={styles.avatarContainer}>
                    {
                      <Text style={styles.avatarText}>
                        {getInitials(quizData?.profile?.name || "")}
                      </Text>
                    }
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {quizData?.profile?.name || ""}
                    </Text>
                    <View style={styles.tagsContainer}>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {quizData?.profile?.age}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {quizData?.profile?.gender}
                        </Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>
                          {truncateText(quizData?.profile?.relationship_tag, 10)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              <ImageBackground
                source={Images.RESPONSE_BG}
                style={styles.card}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>
                  {t("quiz.create.purpose_label")}
                </Text>
                {/* <Text style={styles.purposeType}>{QUIZ_DATA.purpose.type}</Text> */}
                <Text style={styles.purposeDescription}>
                  {quizData?.quiz_purpose || purpose}
                </Text>
              </ImageBackground>

              <ImageBackground
                source={Images.RESPONSE_BG}
                style={styles.card}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
              >
                <Text style={styles.cardTitle}>
                  {t("quiz.create.sharing_with")}
                </Text>
                <View style={styles.sharingContent}>
                  <View style={[styles.avatarContainer, styles.avatarContainerSmall]}>
                    {friend_details?.avatar && (
                      <Image
                        source={{ uri: CDN_IMAGE_URL + friend_details?.avatar }}
                        style={styles.sharingAvatar}
                        resizeMode="cover"
                      />
                    )}
                    {!friend_details?.avatar && friend_details?.name && (
                      <Text style={[styles.avatarText, styles.avatarSmallText]}>
                        {getInitials(friend_details?.name || "")}
                      </Text>
                    )}
                    {group_details?.group_icon_url && (
                      <Image
                        source={{ uri: CDN_IMAGE_URL + group_details?.group_icon_url }}
                        style={styles.sharingAvatar}
                        resizeMode="cover"
                      />
                    )}
                    {!group_details?.group_icon_url &&
                      group_details?.group_name && (
                        <Text style={[styles.avatarText, styles.avatarSmallText]}>
                          {getInitials(group_details?.group_name || "")}
                        </Text>
                      )}
                  </View>
                  <Text style={styles.sharingName}>
                    {sharingName || t("quiz.create.no_recipient")}
                  </Text>
                </View>
              </ImageBackground>

              <ImageBackground
                source={Images.RESPONSE_BG}
                style={styles.questionsCard}
                imageStyle={styles.cardImageStyle}
                resizeMode="cover"
              >
                <View style={styles.questionsHeader}>
                  <Text
                    style={[styles.cardTitle, { marginBottom: Matrics.vs(0) }]}
                  >
                    {t("quiz.create.questions_title")}
                  </Text>
                  <TouchableOpacity
                    style={styles.addEditButton}
                    onPress={handleAddEdit}
                  >
                    <Image
                      source={Images.PENCIL_EDIT}
                      style={styles.pencilIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.addEditText}>
                      {t("quiz.create.add_edit")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {questions?.map(renderQuestionItem)}
              </ImageBackground>
            </>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Questions Modal */}
      <AddEditQuestionsModal
        visible={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        onSaveChanges={handleSaveQuestions}
        initialQuestions={questions || []}
      />

      {/* Share Quiz Button */}
      {!error && !loading && (
        <View style={styles.bottomButtonContainer}>
          {shareError && (
            <Text style={styles.shareErrorText}>
              {t("quiz.response.something_went_wrong")} {t("common.try_again_later")}
            </Text>
          )}
          <Button
            title={t("quiz.create.share_quiz")}
            onPress={handleShareQuiz}
            loading={shareLoading}
            containerStyle={styles.shareButton}
            textStyle={styles.shareButtonText}
            disabled={shareLoading || loading}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(5),
    paddingBottom: Matrics.vs(20),
  },
  skeletonTitle: {
    width: "70%",
    height: Matrics.vs(18),
    borderRadius: Matrics.s(4),
    backgroundColor: colors.GRAY_LIGHT,
    marginBottom: Matrics.vs(12),
  },
  // Quiz Title
  quizTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
  },
  skeletonAvatar: {
    width: Matrics.s(46),
    height: Matrics.s(46),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_LIGHT,
  },
  // Profile Card
  profileCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(15),
    marginBottom: Matrics.vs(15),
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
  avatarContainerSmall: {
    width: Matrics.s(35),
    height: Matrics.s(35),
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
  avatarSmallText: {
    fontSize: FontsSize.Small,
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
  // Card Styles (Purpose, Sharing With, Questions)
  card: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(15),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
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
  skeletonLine: {
    width: "100%",
    height: Matrics.vs(12),
    borderRadius: Matrics.s(4),
    backgroundColor: colors.GRAY_LIGHT,
    marginBottom: Matrics.vs(8),
  },
  skeletonLineShort: {
    width: "60%",
  },
  skeletonParagraph: {
    width: "100%",
    height: Matrics.vs(40),
    borderRadius: Matrics.s(6),
    backgroundColor: colors.GRAY_LIGHT,
    marginTop: Matrics.vs(8),
  },
  skeletonSharingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Matrics.vs(8),
  },
  skeletonSharingAvatar: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_LIGHT,
    marginRight: Matrics.s(10),
  },
  skeletonTitleShort: {
    width: "40%",
  },
  skeletonButton: {
    width: Matrics.s(80),
  },
  skeletonQuestionBlock: {
    marginTop: Matrics.vs(10),
  },
  // Purpose Card
  purposeType: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    opacity: 0.6,
  },
  purposeDescription: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    lineHeight: 22,
  },
  // Sharing With Card
  sharingContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Matrics.vs(0),
  },
  sharingAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: Matrics.s(100),

  },
  sharingName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginLeft: Matrics.s(10),
  },
  // Questions Card
  questionsCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(15),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
    overflow: "hidden",
  },
  questionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Matrics.vs(15),
  },
  addEditButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  pencilIcon: {
    width: Matrics.s(16),
    height: Matrics.s(16),
    tintColor: colors.PRIMARY,
    marginRight: Matrics.s(5),
  },
  addEditText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.PRIMARY,
    lineHeight: 18,
  },
  // Question Item
  questionLabel: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    opacity: 0.6,
  },
  questionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginVertical: Matrics.vs(12),
  },
  // Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(5),
  },
  shareButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(16),
  },
  shareButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Matrics.vs(100),
  },
  errorText: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    textAlign: "center",
  },
  errorSubText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    opacity: 0.6,
    marginBottom: Matrics.vs(20),
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.PRIMARY,
    paddingHorizontal: Matrics.s(24),
    paddingVertical: Matrics.vs(12),
    borderRadius: Matrics.s(30),
  },
  retryButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
  shareErrorText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.DANGER,
    textAlign: "center",
    marginBottom: Matrics.vs(10),
  },
});

export default CreatedQuiz;
