import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { Animated } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { UserNavigationProp } from "../../interfaces/navigationTypes";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import EmptyData from "../../components/common/EmptyData";
import { getFriendsList, deleteFriend } from "../../services/friends";
import {
  toastMessageSuccess,
  toastMessageError,
} from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import useTranslation from "../../hooks/useTranslation";
import { getInitials } from "../../utils/helper";
import FullPageLoader from "../../components/common/FullPageLoader";
import { CDN_IMAGE_URL } from "../../constants/commonConstant";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  unreadCount?: number;
}

interface FriendsListProps {
  onRefresh?: () => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onRefresh }) => {
  const { authData } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<UserNavigationProp>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingFriendId, setDeletingFriendId] = useState<string | null>(null);
  const [isDeleteFriendModalVisible, setIsDeleteFriendModalVisible] =
    useState(false);
  const [friendToDelete, setFriendToDelete] = useState<string | null>(null);
  const swipeableRefs = React.useRef<Map<string, Swipeable>>(new Map());
  const hasAuthRef = useRef(!!authData);

  useEffect(() => {
    hasAuthRef.current = !!authData;
  }, [authData]);

  // Fetch friends list with pagination
  const fetchFriendsList = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (!hasAuthRef.current) return;

      try {
        if (refresh) {
          setPage(1);
        } else if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getFriendsList(pageNum, 10);

        if (response.success && response.data) {
          const formattedFriends: Friend[] = response.data.map((friend) => ({
            id: friend.friend_id.toString(),
            name: friend.friend_name,
            avatar: friend.friend_image || undefined,
            initials: !friend.friend_image
              ? getInitials(friend.friend_name)
              : undefined,
            unreadCount: friend.unread_quiz_count,
          }));

          if (refresh || pageNum === 1) {
            setFriends(formattedFriends);
          } else {
            setFriends((prev) => {
              const existingIds = new Set(prev.map((friend) => friend.id));
              const newFriends = formattedFriends.filter(
                (friend) => !existingIds.has(friend.id),
              );
              return [...prev, ...newFriends];
            });
          }

          setHasMore(response.has_more ?? false);
          setPage(pageNum);
        } else {
          toastMessageError(t("common.something_went_wrong"));
        }
      } catch (error) {
        console.error("Error fetching friends list:", error);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Load more friends
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchFriendsList(page + 1);
    }
  }, [hasMore, loadingMore, loading, page, fetchFriendsList]);

  // Refresh friends list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchFriendsList(1, true);
    }, [fetchFriendsList]),
  );

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      // Store the refresh function if needed
    }
  }, [onRefresh]);

  const handleDeletePress = useCallback((id: string) => {
    setFriendToDelete(id);
    setIsDeleteFriendModalVisible(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteFriendModalVisible(false);
    setFriendToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!friendToDelete) return;

    setDeletingFriendId(friendToDelete);
    try {
      const friendId = parseInt(friendToDelete, 10);
      if (isNaN(friendId)) {
        toastMessageError(t("friends.invalid_friend_id"));
        handleCloseDeleteModal();
        return;
      }

      const response = await deleteFriend({ friend_id: friendId });
      if (response.success) {
        toastMessageSuccess(t("friends.friend_removed_success"));
        // Refresh friends list
        await fetchFriendsList(1, true);
      } else {
        toastMessageError(
          response.message || t("friends.failed_to_remove_friend"),
        );
      }
    } catch (error) {
      console.error("Error deleting friend:", error);
      toastMessageError(t("friends.failed_to_remove_friend"));
    } finally {
      setDeletingFriendId(null);
      handleCloseDeleteModal();
    }
  }, [friendToDelete, fetchFriendsList, handleCloseDeleteModal, t]);

  const closeOtherSwipeables = useCallback((currentId: string) => {
    swipeableRefs.current.forEach((ref, id) => {
      if (id !== currentId && ref) {
        ref.close();
      }
    });
  }, []);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    id: string,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1, 1],
      extrapolate: "clamp",
    });

    const isDeleting = deletingFriendId === id;

    return (
      <Animated.View style={[styles.deleteAction, { opacity: isDeleting ? 0.6 : opacity }]}>
        <TouchableOpacity
          style={styles.deleteActionTouchable}
          onPress={() => handleDeletePress(id)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
        <Animated.View
            style={[styles.deleteIconContainer, { transform: [{ scale }] }]}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.TEXT_DARK} />
            ) : (
              <Image
                source={Images.TRASH_ICON}
                style={styles.deleteIcon}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleFriendPress = useCallback(
    (friend: Friend) => {
      navigation.navigate("FriendChatDetails", { friend });
    },
    [navigation],
  );

  const renderFriendItem = ({
    item,
    index,
  }: {
    item: Friend;
    index: number;
  }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(item.id, ref);
        }
      }}
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item.id)
      }
      onSwipeableWillOpen={() => closeOtherSwipeables(item.id)}
      overshootRight={false}
      rightThreshold={80}
      friction={2}
    >
      <TouchableOpacity
        style={[
          styles.friendItem,
          index === friends.length - 1 && styles.noBorder,
        ]}
        onPress={() => handleFriendPress(item)}
        activeOpacity={0.7}
      >
        {item.avatar ? (
          <Image
            source={{ uri: CDN_IMAGE_URL+item.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{item.initials}</Text>
          </View>
        )}
        <Text style={styles.friendName}>{item.name}</Text>
        {!!item.unreadCount && item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {loading && friends.length === 0 ? (
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator size="large" color={colors.PRIMARY} /> */}
          <FullPageLoader showAnimatedText={false}/>
        </View>
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
              </View>
            ) : null
          }
        />
      ) : (
        <EmptyData
          icon={Images.FRIENDS_ICON}
          title={t("friends.no_friends_yet")}
          description={t("friends.no_friends_description")}
          containerStyle={{ height: Matrics.screenHeight * 0.5 }}
        />
      )}

      {/* Delete Friend Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteFriendModalVisible}
        title={t("friends.delete_friend")}
        message={t("friends.delete_friend_confirmation")}
        onYesPress={handleConfirmDelete}
        onNoPress={handleCloseDeleteModal}
        loading={deletingFriendId !== null}
        disable={deletingFriendId !== null}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingTop: Matrics.vs(10),
    overflow: "visible",
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(10),
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  avatar: {
    width: Matrics.s(44),
    height: Matrics.s(44),
    borderRadius: Matrics.s(100),
    marginRight: Matrics.s(15),
  },
  initialsContainer: {
    width: Matrics.s(44),
    height: Matrics.s(44),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.GRAY_MEDIUM,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Matrics.s(15),
  },
  initialsText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  friendName: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  unreadBadge: {
    width: Matrics.s(19),
    height: Matrics.s(19),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.PRIMARY_LG,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    fontSize: Matrics.ms(9),
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.WHITE,
    lineHeight: Matrics.vs(16),
  },
  deleteAction: {
    backgroundColor: "rgba(31, 31, 31, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    width: Matrics.s(60),
  },
  deleteActionTouchable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIconContainer: {
    width: Matrics.s(56),
    height: Matrics.s(76),
    borderRadius: Matrics.s(60),
    backgroundColor: colors.DANGER,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    width: Matrics.s(26),
    height: Matrics.vs(26),
    tintColor: colors.WHITE,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Matrics.vs(50),
  },
  loadingMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Matrics.vs(20),
  },
  loadingMoreText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY,
    opacity: 0.6,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
});

export default FriendsList;
