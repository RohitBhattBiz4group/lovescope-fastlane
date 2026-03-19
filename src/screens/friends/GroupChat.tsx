import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { UserStackParamList } from "../../interfaces/navigationTypes";
import { useCallback, useState } from "react";
import {
  IGroupDetailsResponse,
  IGroupResponse,
  IGroupMemberResponse,
} from "../../interfaces/groupInterface";
import CommonHeader from "../../components/common/CommonHeader";
import {
  colors,
  FontsSize,
  Matrics,
  typography,
} from "../../config/appStyling";
import Button from "../../components/common/Button";
import groupService from "../../services/groupService";
import quizService from "../../services/quizService";
import {
  IGroupQuizItem,
  IGroupQuizSection,
} from "../../interfaces/quizInterfaces";
import useTranslation from "../../hooks/useTranslation";
import useAuth from "../../hooks/useAuth";
import Images from "../../config/Images";
import { toastMessageError } from "../../components/common/ToastMessage";
import { getInitials, truncateText, formatQuizTime } from "../../utils/helper";
import { CDN_IMAGE_URL, LIMIT_QUIZ } from "../../constants/commonConstant";
import LinearGradient from "react-native-linear-gradient";
import QuizCardSkeleton from "../../skeletons/QuizCardSkeleton";

type GroupChatScreenProps = NativeStackScreenProps<
  UserStackParamList,
  "GroupChat"
>;

const GroupChat: React.FC<GroupChatScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { authData } = useAuth();
  const user = authData?.user;
  const { group } = route.params as { group: IGroupResponse };
  const [groupDetails, setGroupDetails] = useState<IGroupResponse>(group);

  const [quizSections, setQuizSections] = useState<IGroupQuizSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasNoMembers, setHasNoMembers] = useState(false);
  const [members, setMembers] = useState<IGroupMemberResponse[]>([]);
  const [quizCount, setQuizCount] = useState(0);

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

  const fetchGroupDetails = useCallback(async () => {
    try {
      const detailResponse = await groupService.getGroupDetails(group.id);
      if (!detailResponse.success) {
        return;
      }

      const data = detailResponse.data as IGroupDetailsResponse | undefined;
      if (data?.group) {
        setGroupDetails(data.group);
      }
      if (data?.members) {
        setMembers(data.members);
      }
      const memberCount = data?.members?.length || 0;
      if (memberCount <= 1) {
        setHasNoMembers(true);
      } else {
        setHasNoMembers(false);
      }
    } catch (error) {
      console.error(error);
    }
  }, [t]);

  const fetchQuizList = useCallback(
    async (pageNum: number, isInitial: boolean = false) => {
      if (!group?.id) {
        setLoading(false);
        return;
      }
      try {
        if (isInitial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        try {
          if (isInitial) {
            setLoading(true);
          } else {
            setLoadingMore(true);
          }
          const response = await quizService.getGroupQuizList(
            group.id,
            pageNum,
            LIMIT_QUIZ,
          );
          console.log("response", response);
          if (response.success && response.data) {
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
            setHasMore(totalQuizzes >= LIMIT_QUIZ);
            setPage(pageNum);
          }
        } catch (error) {
          console.error("Failed to fetch group quiz list:", error);
          toastMessageError(
            t("common.something_went_wrong"),
            t("common.try_again_later"),
          );
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
      } catch (error) {
        console.error("Failed to fetch group quiz list:", error);
        toastMessageError(
          t("common.something_went_wrong"),
          t("common.try_again_later"),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchQuizList(page + 1, false);
    }
  }, [loadingMore, hasMore, loading, page]);

  useFocusEffect(
    useCallback(() => {
      getQuizCount();
      fetchGroupDetails();
      fetchQuizList(1, true);
    }, []),
  );

  const handleSendNewQuiz = () => {
  
    const monthlyLimitRaw = authData?.plan?.limits?.quiz_limit;
    const monthlyLimit = monthlyLimitRaw === null || monthlyLimitRaw === undefined
      ? null
      : Number(monthlyLimitRaw);

    if (!authData?.plan?.product_id && monthlyLimit! <= quizCount) {
      toastMessageError(
        t("quiz.create.limit_reached"),
        t("quiz.create.free_plan")
      );
    } else {
      navigation.navigate("CreateNewQuiz", { group: groupDetails });
    }
  };

  const handleQuizAction = (quiz: IGroupQuizItem) => {
    const isSentByMe = quiz.created_by === user?.id;
    if (isSentByMe || quiz.has_responded) {
      const hideAnswers = isSentByMe && (quiz.quiz_response_count ?? 0) === 0;
      navigation.navigate("QuizResponse", {
        quiz: quiz,
        showDropdown: isSentByMe && !hideAnswers,
        hideAnswers,
      });
    } else {
      navigation.navigate("AnswerQuiz", { quiz });
    }
  };

  const isSent = (quiz: IGroupQuizItem) => quiz.created_by === user?.id;

  const renderQuizCard = (quiz: IGroupQuizItem) => {
    const sentByMe = isSent(quiz);
    return (
      <View
        key={quiz.id}
        style={[styles.cardContainer, sentByMe && styles.cardContainerSent]}
      >
        <View style={[styles.creatorRow, sentByMe && styles.creatorRowSent]}>
          {quiz.creator_image ? (
            <Image
              source={{ uri: CDN_IMAGE_URL + quiz.creator_image }}
              style={styles.creatorImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.creatorInitials}>
              <Text style={styles.creatorInitialsText}>
                {getInitials(quiz.creator_name)}
              </Text>
            </View>
          )}
          <Text style={styles.creatorName}>{quiz.creator_name}</Text>
        </View>
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
            <Text style={[styles.quizInfoText, sentByMe && styles.textWhite]}>
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
          <TouchableOpacity
            style={[styles.cardButton, sentByMe && styles.cardButtonSent]}
            onPress={() => handleQuizAction(quiz)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.cardButtonText,
                sentByMe && styles.cardButtonTextSent,
              ]}
            >
              {sentByMe
                ? (quiz.quiz_response_count ?? 0) === 0
                  ? t("quiz.chat.view_quiz")
                  : t("quiz.chat.view_responses")
                : quiz.has_responded
                  ? t("quiz.chat.view_responses")
                  : t("quiz.chat.answer_quiz")}
            </Text>
          </TouchableOpacity>
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
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
        locations={[0.1977, 1]}
        style={styles.gradient}
      />
      {/* Header */}
      <CommonHeader
        variant="group"
        groupName={truncateText(groupDetails.group_name || t("friends.groups"))}
        groupImage={
          groupDetails.group_icon_url ? CDN_IMAGE_URL + groupDetails.group_icon_url : ""
        }
        members={members}
        onGroupNameClick={() =>
          navigation.navigate("GroupDetails", { group: groupDetails })
        }
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
        {!loading && hasNoMembers && (
          <View style={styles.noMembersBanner}>
            <Text style={styles.noMembersBannerText}>
              {t("quiz.chat.no_members_to_share")}
            </Text>
          </View>
        )}
        {loading ? null : (
          <Button
            title={t("quiz.chat.send_new_quiz")}
            onPress={handleSendNewQuiz}
            containerStyle={styles.sendQuizButton}
            textStyle={styles.sendQuizButtonText}
            disabled={loading || loadingMore || hasNoMembers}
          />
        )}
      </View>
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
  noMembersBanner: {
    backgroundColor: "rgba(255, 99, 71, 0.15)",
    borderRadius: Matrics.s(12),
    padding: Matrics.s(12),
    marginBottom: Matrics.vs(10),
  },
  noMembersBannerText: {
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
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Matrics.vs(8),
  },
  creatorRowSent: {
    alignSelf: "flex-end",
  },
  creatorImage: {
    width: Matrics.s(28),
    height: Matrics.s(28),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(8),
  },
  creatorInitials: {
    width: Matrics.s(28),
    height: Matrics.s(28),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(8),
  },
  creatorInitialsText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    lineHeight: 12,
  },
  creatorName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
  },
  quizTime: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
    marginTop: Matrics.vs(4),
    opacity: 0.6,
  },
  quizTimeSent: {
    alignSelf: "flex-end",
  },
  sectionHeader: {
    alignItems: "center",
    paddingVertical: Matrics.vs(12),
  },
  sectionHeaderText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    color: colors.TEXT_PRIMARY,
    marginTop: Matrics.vs(4),
    opacity: 0.6,
  },
});

export default GroupChat;
