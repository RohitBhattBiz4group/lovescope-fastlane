import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import { FriendNavParam } from "../../interfaces/navigationTypes";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import Button from "../../components/common/Button";
import CommonHeader from "../../components/common/CommonHeader";
import useTranslation from "../../hooks/useTranslation";
import useAuth from "../../hooks/useAuth";
import quizService from "../../services/quizService";
import {
  IFriendQuizItem,
  IFriendQuizSection,
} from "../../interfaces/quizInterfaces";
import { toastMessageError } from "../../components/common/ToastMessage";
import { truncateText, formatQuizTime } from "../../utils/helper";
import { CDN_IMAGE_URL, LIMIT_QUIZ } from "../../constants/commonConstant";
import LinearGradient from "react-native-linear-gradient";

import { QUIZ_STATUS } from "../../constants/commonConstant";
import QuizCardSkeleton from "../../skeletons/QuizCardSkeleton";
const LIMIT = LIMIT_QUIZ;

const FriendChatDetails: React.FC<ScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { authData } = useAuth();
  const user = authData?.user;
  const currentPlan = authData?.plan;
  const { friend } = (route?.params as { friend?: FriendNavParam }) || {};

  const [quizSections, setQuizSections] = useState<IFriendQuizSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [friendAccountDeleted, setFriendAccountDeleted] = useState(false);
  const [quizCount, setQuizCount] = useState(0);

  const fetchQuizList = useCallback(
    async (pageNum: number, isInitial: boolean = false) => {
      if (!friend?.id) {
        setLoading(false);
        return;
      }
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const response = await quizService.getFriendQuizList(
          Number(friend.id),
          pageNum,
          LIMIT,
        );
        if (response.success && response.data) {
          setFriendAccountDeleted(!!response.extra_data?.friend_account_deleted);
          const newSections = response.data;
          const totalQuizzes = newSections.reduce(
            (sum, section) => sum + section.quizzes.length,
            0,
          );
          if (isInitial) {
            setQuizSections(newSections);
          } else {
            setQuizSections((prev) => [...prev, ...newSections]);
          }
          setHasMore(totalQuizzes >= LIMIT);
          setPage(pageNum);
        } else {
          toastMessageError(t("common.something_went_wrong"));
        }
      } catch (error) {
        console.error("Failed to fetch quiz list:", error);
        toastMessageError(
          t("common.something_went_wrong"),
          t("common.try_again_later"),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [friend?.id],
  );

  const getQuizCount = async () => {
    try {
      const res = await quizService.getQuizCount();
      if (res.success && res.data) {
        setQuizCount(res.data);
      } else {
        console.log(res, "res");
      }
    } catch (error) {
      console.log(error, "error");
    }
  }

  useEffect(() => {
    getQuizCount();
    fetchQuizList(1, true);
  }, []);

  // Refresh quiz list when returning from AnswerQuiz with refresh flag
  useEffect(() => {
    const refresh = (route?.params as { refresh?: boolean })?.refresh;
    if (refresh && friend?.id) {
      fetchQuizList(1, true);
      // Clear the refresh param to avoid re-fetching on subsequent renders
      navigation.setParams({ refresh: undefined });
    }
  }, [(route?.params as { refresh?: boolean })?.refresh]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchQuizList(page + 1, false);
    }
  }, [loadingMore, hasMore, loading, page, fetchQuizList]);

  const handleQuizAction = (quiz: IFriendQuizItem) => {
    const isSentByMe = quiz.created_by === user?.id;
    if (isSentByMe || quiz.status === "closed") {
      const hideAnswers = isSentByMe && quiz.status === "active";
      navigation.navigate("QuizResponse", { quiz, hideAnswers });
    } else {
      navigation.navigate("AnswerQuiz", { quiz, friend });
    }
  };

  const handleSendNewQuiz = () => {

    const monthlyLimitRaw = currentPlan?.limits?.quiz_limit;
    const monthlyLimit = monthlyLimitRaw === null || monthlyLimitRaw === undefined
      ? null
      : Number(monthlyLimitRaw);

    if ( !currentPlan?.product_id && monthlyLimit! <= quizCount) {
      toastMessageError(
        t("quiz.create.limit_reached"),
        t("quiz.create.free_plan")
      );
    } else {
      navigation.navigate("CreateNewQuiz", { friend: friend });
    }
  };

  const isSent = (quiz: IFriendQuizItem) => quiz.created_by === user?.id;

  const renderQuizCard = (quiz: IFriendQuizItem) => {
    const sentByMe = isSent(quiz);
    return (
      <View
        key={quiz.id}
        style={[styles.cardContainer, sentByMe && styles.cardContainerSent]}
      >
        <View style={[styles.card, sentByMe && styles.cardSent]}>
          <Text style={[styles.quizTitle, sentByMe && styles.textWhite]}>
            {quiz.title}
          </Text>
          <View style={styles.quizInfoRow}>
            <Image
              source={Images.QUIZ_USER}
              style={[styles.quizIcon, sentByMe && styles.iconWhite]}
              resizeMode="contain"
            />
            <Text
              style={[styles.quizInfoText, sentByMe && styles.textWhite]}
            >
              {truncateText(quiz.profile_name, 25)}
            </Text>
          </View>
          <View style={styles.quizInfoRow}>
            <Image
              source={Images.QUIZ_QUESTION}
              style={[styles.quizIcon, sentByMe && styles.iconWhite]}
              resizeMode="contain"
            />
            <Text style={[styles.quizInfoText, sentByMe && styles.textWhite]}>
              {quiz.total_questions} {t("quiz.chat.questions")}
            </Text>
          </View>
          {(() => {
            const friendSentQuiz = !sentByMe;
            const canAnswerFriendQuiz =
              friendSentQuiz &&
              !friendAccountDeleted &&
              quiz.status === QUIZ_STATUS.ACTIVE;
            const canViewFriendQuiz =
              friendSentQuiz &&
              !friendAccountDeleted &&
              quiz.status === QUIZ_STATUS.CLOSED;
            const canViewMyQuiz =
              sentByMe && quiz.status === QUIZ_STATUS.CLOSED;
            const canViewMyActiveQuiz = sentByMe && quiz.status === "active";
            const showActionButton =
              canAnswerFriendQuiz ||
              canViewFriendQuiz ||
              canViewMyQuiz ||
              canViewMyActiveQuiz;
            const buttonLabel = canAnswerFriendQuiz
              ? t("quiz.chat.answer_quiz")
              : canViewMyActiveQuiz
                ? t("quiz.chat.view_quiz")
                : t("quiz.chat.view_responses");
            return showActionButton ? (
              <TouchableOpacity
                style={[
                  styles.cardButton,
                  sentByMe && styles.cardButtonSent,
                ]}
                onPress={() => handleQuizAction(quiz)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.cardButtonText,
                    sentByMe && styles.cardButtonTextSent,
                  ]}
                >
                  {buttonLabel}
                </Text>
              </TouchableOpacity>
            ) : null;
          })()}
        </View>
        {quiz.created_at && (
          <Text style={[styles.quizTime, sentByMe && styles.quizTimeSent]}>
            {formatQuizTime(quiz.created_at)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      {/* Header */}
      <CommonHeader
        variant="chat"
        profileName={truncateText(friend?.name || t("friends.title"))}
        profileImage={CDN_IMAGE_URL + friend?.avatar}
        onBackPress={() => navigation.goBack()}
        showNotificationBadge
        onNotificationPress={() => navigation.navigate("Notifications")}
      />

      {/* Quiz Cards */}
      {loading ? (
        <QuizCardSkeleton count={3} />
      ) : (
        <SectionList
          sections={quizSections.map((section) => ({
            title: section.created_date,
            data: section.quizzes,
          }))}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => renderQuizCard(item)}
          renderSectionFooter={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          inverted
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.PRIMARY}
                style={styles.loadingMore}
              />
            ) : null
          }
        />
      )}

      {/* Send New Quiz Button */}
      <View style={styles.bottomButtonContainer}>
        {friendAccountDeleted && (
          <View style={styles.friendDeletedBanner}>
            <Text style={styles.friendDeletedBannerText}>
              {t("quiz.chat.friend_account_deleted_warning")}
            </Text>
          </View>
        )}
        {loading ? null : (
          <Button
            title={t("quiz.chat.send_new_quiz")}
            onPress={handleSendNewQuiz}
            containerStyle={styles.sendQuizButton}
            textStyle={styles.sendQuizButtonText}
            disabled={friendAccountDeleted || loading || loadingMore}
          />
        )}

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(10),
    paddingBottom: Matrics.vs(100),
  },
  // Quiz Card - Common Styles
  cardContainer: {
    alignItems: "flex-start" as const,
    marginBottom: Matrics.vs(25),
  },
  cardContainerSent: {
    alignItems: "flex-end" as const,
  },
  card: {
    backgroundColor: "rgba(31, 31, 31, 0.05)",
    borderRadius: Matrics.s(10),
    padding: Matrics.s(16),
    width: Matrics.s(230),
  },
  cardSent: {
    backgroundColor: colors.PRIMARY,
  },
  quizTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    marginBottom: Matrics.vs(12),
    color: colors.TEXT_PRIMARY,
  },
  quizInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(6),
  },
  quizIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(8),
    tintColor: colors.TEXT_SECONDARY,
  },
  quizInfoText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
  },
  cardButton: {
    backgroundColor: colors.PRIMARY,
    borderRadius: Matrics.s(24),
    paddingVertical: Matrics.vs(12),
    paddingHorizontal: Matrics.s(24),
    alignItems: "center",
    justifyContent: "center",
    marginTop: Matrics.vs(16),
  },
  cardButtonSent: {
    backgroundColor: colors.WHITE,
  },
  cardButtonText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.WHITE,
    lineHeight: 18,
  },
  cardButtonTextSent: {
    color: colors.PRIMARY,
  },
  // Variant Modifiers
  textWhite: {
    color: colors.WHITE,
  },
  iconWhite: {
    tintColor: colors.WHITE,
  },
  // Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(20),
    paddingTop: Matrics.vs(5),
  },
  friendDeletedBanner: {
    backgroundColor: "rgba(255, 99, 71, 0.15)",
    borderRadius: Matrics.s(12),
    padding: Matrics.s(12),
    marginBottom: Matrics.vs(10),
  },
  friendDeletedBannerText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    color: colors.DANGER || "#FF3B30",
    textAlign: "center",
  },
  sendQuizButton: {
    borderRadius: Matrics.s(30),
    paddingVertical: Matrics.vs(16),
  },
  sendQuizButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    lineHeight: 18,
  },
  loadingMore: {
    paddingVertical: Matrics.vs(10),
  },
  sectionHeader: {
    alignItems: "center",
    paddingVertical: Matrics.vs(12),
  },
  sectionHeaderText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY,
  },
  quizTime: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    fontWeight: "400",
    color: colors.TEXT_SECONDARY,
    marginTop: Matrics.vs(4),
  },
  quizTimeSent: {
    alignSelf: "flex-end",
  },
});

export default FriendChatDetails;
