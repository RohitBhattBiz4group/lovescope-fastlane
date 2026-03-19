import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  UserNavigationProp,
  UserStackParamList,
} from "../../interfaces/navigationTypes";
import { RouteProp } from "@react-navigation/native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import CommonHeader from "../../components/common/CommonHeader";
import Select from "../../components/common/Select";
import quizService from "../../services/quizService";
import useAuth from "../../hooks/useAuth";
import {
  IQuizResponseDetail,
  IQuestionAnswer,
  IQuizDetailResponse,
} from "../../interfaces/quizInterfaces";
import groupService from "../../services/groupService";
import { IGroupMember } from "../../interfaces/groupInterface";
import { toastMessageError, toastMessageSuccess } from "../../components/common/ToastMessage";
import { useTranslation } from "../../hooks/useTranslation";
import LinearGradient from "react-native-linear-gradient";
import { QUIZ_TYPE } from "../../constants/commonConstant";
import Button from "../../components/common/Button";
import { commonStyles } from "../../components/common/styles";

interface Props {
  navigation: UserNavigationProp;
  route: RouteProp<UserStackParamList, "QuizResponse">;
}

const QuizResponse: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { authData } = useAuth();
  const user = authData?.user;
  const quiz = route.params.quiz;
  const showDropdown = route.params.showDropdown || false;
  const hideAnswers = route?.params?.hideAnswers || false;

  const [loading, setLoading] = useState(true);
  const [quizResponse, setQuizResponse] = useState<IQuizResponseDetail | null>(
    null
  );
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberList, setMemberList] = useState<IGroupMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    if (hideAnswers) {
      fetchQuizDetail();
    } else if (showDropdown && quiz?.quiz_type === QUIZ_TYPE.GROUP && quiz?.group_id) {
      fetchMemberList();
    } else {
      fetchQuizResponse();
    }
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
        const quizDetail: IQuizDetailResponse = response.data;
        const mappedResponse: IQuizResponseDetail = {
          quiz_id: quizDetail.id,
          quiz_title: quizDetail.title,
          quiz_purpose: "",
          quiz_type: quizDetail.quiz_type,
          love_profile_name: quizDetail.love_profile_name,
          created_by: quizDetail.created_by,
          responded_by: 0,
          response_id: 0,
          question_answers: quizDetail.questions.map((q) => ({
            question_id: q.id,
            question_text: q.question_text,
            question_order: q.question_order,
            answer_text: "",
          })),
        };
        setQuizResponse(mappedResponse);
      } else {
        setQuizResponse(null);
      }
    } catch (error) {
      console.error("Failed to fetch quiz detail:", error);
      toastMessageError(t("quiz.response.something_went_wrong"));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberList = async () => {
    setMemberLoading(true);
    setLoading(false);
    try {
      const getMemberList = await groupService.getGroupMembers(quiz!.group_id!);
      if (getMemberList.success && getMemberList.data) {
        setMemberList(getMemberList.data);
      } else {
        toastMessageError(t("quiz.response.something_went_wrong"));
        navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to fetch member list:", error);
      toastMessageError(t("quiz.response.something_went_wrong"));
      navigation.goBack();
    } finally {
      setMemberLoading(false);
    }
  };

  const fetchQuizResponse = async (memberId?: string) => {
    if (!quiz?.id || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const userId = user!.id as number;
      let respondedBy: number;
      if (showDropdown && quiz?.quiz_type === QUIZ_TYPE.GROUP && quiz?.group_id && memberId) {
        respondedBy = parseInt(memberId);
      } else if (quiz!.created_by === userId) {
        respondedBy = quiz!.target_user_id ?? userId;
      } else {
        respondedBy = userId;
      }
      const response = await quizService.viewQuizResponse({
        quiz_id: quiz!.id,
        responded_by: respondedBy,
      });
      if (response.success && response.data) {
        setQuizResponse(response.data);
      } else {
        // toastMessageError("Something went wrong try again later.")
        setQuizResponse(null);
        // navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to fetch quiz response:", error);
      toastMessageError(t("quiz.response.something_went_wrong"));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatQuestionNumber = (order: number) => {
    return `${t("quiz.response.question_label", { number: order })}`;
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId);
    setLoading(true);
    setTimeout(() => {
      fetchQuizResponse(memberId);
    }, 300);
  };

  const handleSyncToProfile = async () => {
    if (!quiz?.profile_id || !quizResponse?.summary || !quiz?.id) {
      toastMessageError(t("quiz.response.sync_failed") || "Failed to sync summary");
      return;
    }

    setSyncLoading(true);
    try {
      const response = await quizService.syncSummaryToChat({
        profile_id: quiz.profile_id,
        message: quizResponse.full_summary || quizResponse.summary ,
        quiz_id: quiz.id,
      });

      if (response.success) {
        toastMessageSuccess(
          response.message || t("quiz.response.sync_success") || "Summary synced successfully"
        );
      } else {
        toastMessageError(response.message || t("quiz.response.sync_failed") || "Failed to sync summary");
      }
    } catch (error) {
      console.error("Error syncing summary to profile:", error);
      toastMessageError(t("quiz.response.sync_failed") || "Failed to sync summary");
    } finally {
      setSyncLoading(false);
    }
  };

  const renderResponseCard = (response: IQuestionAnswer) => (
    <ImageBackground
      key={response.question_id}
      source={Images.RESPONSE_BG}
      style={styles.responseCard}
      resizeMode="cover"
    >
      <Text style={styles.questionNumber}>
        {formatQuestionNumber(response.question_order)}
      </Text>
      <Text style={styles.questionText}>{response.question_text}</Text>
      {!hideAnswers && (
        <>
          <View style={styles.divider} />
          <Text style={styles.answerText}>{response.answer_text}</Text>
        </>
      )}
    </ImageBackground>
  );

  return (

    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}>
      {/* Header */}
      <CommonHeader
        showBackButton
        title={
          hideAnswers
            ? t("quiz.response.header_waiting_title")
            : t("quiz.response.header_title")
        }
        onBackPress={() => navigation.goBack()}
        showNotificationBadge
        onNotificationPress={() => navigation.navigate("Notifications")}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Waiting for Response Banner */}
        {hideAnswers && (
          <View style={styles.waitingBanner}>
            <Text style={styles.waitingBannerText}>
              {t("quiz.response.waiting_for_response")}
            </Text>
          </View>
        )}

        {/* Quiz Info Card */}
        <View style={styles.quizInfoCard}>
          <Text style={styles.quizTitle}>
            {quizResponse?.quiz_title || quiz?.title}
          </Text>
          <View style={styles.quizMetaRow}>
            <View style={styles.quizMetaItem}>
              <Image
                source={Images.QUIZ_USER}
                style={styles.quizIcon}
                resizeMode="contain"
              />
              <Text style={styles.quizMetaText}>
                {quizResponse?.love_profile_name || quiz?.profile_name}
              </Text>
            </View>
            <View style={styles.quizMetaItem}>
              <Image
                source={Images.QUIZ_QUESTION}
                style={styles.quizIcon}
                resizeMode="contain"
              />
              <Text style={styles.quizMetaText}>
                {t("quiz.chat.questions_count", { count: quizResponse?.question_answers?.length || quiz?.total_questions })}
              </Text>
            </View>
          </View>
        </View>

        {/* Member Select Dropdown */}
        {showDropdown && quiz?.quiz_type === QUIZ_TYPE.GROUP && quiz?.group_id && (
          <Select
            name="member"
            label={t("quiz.response.select_member")}
            placeholder={t("quiz.response.select_member")}
            options={memberList.map((member) => ({
              label: member.full_name,
              value: member.user_id.toString(),
            }))}
            value={selectedMember}
            onValueChange={(value) => handleMemberSelect(value)}
            loading={memberLoading}
          />
        )}

        {/* Summary Section - How Others See You - Only show for quiz creator */}
        {!loading && quizResponse?.summary && (quiz?.created_by === user?.id || quizResponse?.created_by === user?.id) && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryHeading}>
              {t("quiz.response.how_others_see_you") || "How Others See You"}
            </Text>
            <ImageBackground
              source={Images.RESPONSE_BG}
              style={styles.summaryCard}
              resizeMode="cover"
            >
              <View style={styles.summaryIconContainer}>
                <Image
                  source={Images.SUMMARY_ICON}
                  style={styles.summaryIcon}
                  resizeMode="contain"
                />

                <Text style={styles.summaryLabel}>
                  {t("quiz.response.summary") || "Summary"}
                </Text>
              </View>
              <Text style={styles.summaryText}>{quizResponse.summary}</Text>

            </ImageBackground>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.PRIMARY} />
          </View>
        ) : quizResponse?.question_answers &&
          quizResponse.question_answers.length > 0 ? (
          quizResponse.question_answers.map(renderResponseCard)
        ) : showDropdown &&
          quiz?.quiz_type === QUIZ_TYPE.GROUP &&
          quiz?.group_id &&
          !selectedMember ? null : (
          <Text style={styles.noResponseText}>
            {t("quiz.response.no_response")}
          </Text>
        )}

        {(!loading && quizResponse?.summary && (quiz?.created_by === user?.id || quizResponse?.created_by === user?.id)) && (
          <Button
            loading={syncLoading}
            disabled={syncLoading}
            title={t("quiz.response.sync_all_responses")}
            onPress={() => handleSyncToProfile()}
            containerStyle={commonStyles.buttonPrimary}
            />)
        }

      </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(30),
  },
  // Quiz Info Card (Blue)
  quizInfoCard: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(20),
  },
  quizTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    marginBottom: Matrics.vs(10),
  },
  quizMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(5),
  },
  quizMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Matrics.s(25),
    maxWidth: "45%",
  },
  quizIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(5),
    tintColor: colors.WHITE,
  },
  quizMetaText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.WHITE,
  },
  // Response Card
  responseCard: {
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    marginBottom: Matrics.vs(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
    overflow: "hidden",
  },
  questionNumber: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(5),
  },
  questionText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "400",
    color: colors.TEXT_SECONDARY,
    lineHeight: 24,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    marginVertical: Matrics.vs(16),
  },
  answerText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    lineHeight: 22,
  },
  noResponseText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY,
    textAlign: "center" as const,
    marginTop: Matrics.vs(20),
  },
  waitingBanner: {
    backgroundColor: "rgba(47, 89, 235, 0.1)",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(12),
    marginBottom: Matrics.vs(16),
  },
  waitingBannerText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.PRIMARY,
    textAlign: "center" as const,
  },
  // Summary Section
  summarySection: {
    marginBottom: Matrics.vs(20),
  },
  summaryHeading: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(12),
  },
  summaryCard: {
    backgroundColor: "transparent",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    borderWidth: 1,
    borderColor: "rgba(47, 89, 235, 0.20)",
    overflow: "hidden",
  },
  summaryIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: Matrics.vs(8),
  },
  summaryIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(10),
  },
  summaryLabel: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
  },
  summaryText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    color: colors.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: Matrics.vs(16),
  },
  syncButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(8),
    paddingVertical: Matrics.vs(12),
    paddingHorizontal: Matrics.s(16),
    alignItems: "center",
    justifyContent: "center",
    marginTop: Matrics.vs(8),
  },
  syncButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
  },
});

export default QuizResponse;
