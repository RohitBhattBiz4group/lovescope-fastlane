import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import EmptyData from "../../components/common/EmptyData";
import {
  getFriendRequests,
  approveFriendRequest,
  rejectFriendRequest,
} from "../../services/friends";
import {
  toastMessageSuccess,
  toastMessageError,
} from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import useTranslation from "../../hooks/useTranslation";
import { REQUEST_STATUS, REQUEST_ACTION, CDN_IMAGE_URL } from "../../constants/commonConstant";
import { getInitials } from "../../utils/helper";
import FullPageLoader from "../../components/common/FullPageLoader";

interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  requestId: number;
  senderId: number;
  receiverId: number;
  status: "pending" | "approved" | "rejected";
}

interface FriendRequestsProps {
  onRefresh?: () => void;
  onPendingCountChange?: (count: number) => void;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({
  onRefresh,
  onPendingCountChange,
}) => {
  const { authData } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );
  const [processingAction, setProcessingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [isDeleteRequestModalVisible, setIsDeleteRequestModalVisible] =
    useState(false);
  const [requestToDelete, setRequestToDelete] = useState<FriendRequest | null>(
    null,
  );

  // Fetch friend requests with pagination (only received requests that can be approved/rejected)
  const fetchFriendRequests = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (!authData?.user?.id) return;

      try {
        if (refresh) {
          setPage(1);
        } else if (pageNum === 1) {
          setLoadingRequests(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getFriendRequests(pageNum, 10);
        if (response.success && response.data) {
          const userId = authData.user.id;
          const formattedRequests: FriendRequest[] = response.data
            .filter(
              (req) =>
                req.status === REQUEST_STATUS.PENDING &&
                req.receiver_id === userId,
            )
            .map((req) => {
              // Current user is always the receiver for these requests
              return {
                id: req.id.toString(),
                requestId: req.id,
                senderId: req.sender_id,
                receiverId: req.receiver_id,
                name: req.sender_name,
                avatar: req.sender_image || undefined,
                initials: !req.sender_image
                  ? getInitials(req.sender_name)
                  : undefined,
                status: req.status,
              };
            });

          if (refresh || pageNum === 1) {
            setRequests(formattedRequests);
            if (refresh) {
              onPendingCountChange?.(formattedRequests.length);
            }
          } else {
            setRequests((prev) => {
              const next = [...prev, ...formattedRequests];
              onPendingCountChange?.(next.length);
              return next;
            });
          }

          setHasMore(response.has_more ?? false);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching friend requests:", error);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setLoadingRequests(false);
        setLoadingMore(false);
      }
    },
    [authData],
  );

  // Load more friend requests
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loadingRequests) {
      fetchFriendRequests(page + 1);
    }
  }, [hasMore, loadingMore, loadingRequests, page, fetchFriendRequests]);

  useEffect(() => {
    fetchFriendRequests(1);
  }, [fetchFriendRequests]);

  // Expose refresh function to parent
  useEffect(() => {
    if (onRefresh) {
      // Store the refresh function if needed
    }
  }, [onRefresh]);

  const handleAcceptRequest = useCallback(
    async (request: FriendRequest) => {
      setProcessingRequestId(request.id);
      setProcessingAction("approve");
      try {
        const response = await approveFriendRequest({
          request_id: request.requestId,
        });
        if (response.success) {
          toastMessageSuccess(t("friends.friend_request_accepted"));
          // Refresh requests list
          await fetchFriendRequests(1, true);
        } else {
          toastMessageError(
            response.message || t("friends.failed_to_accept_request"),
          );
        }
      } catch (error) {
        console.error("Error accepting friend request:", error);
        toastMessageError(t("friends.failed_to_accept_friend_request"));
      } finally {
        setProcessingRequestId(null);
        setProcessingAction(null);
      }
    },
    [fetchFriendRequests, t],
  );

  const handleRejectRequest = useCallback((request: FriendRequest) => {
    setRequestToDelete(request);
    setIsDeleteRequestModalVisible(true);
  }, []);

  const handleCloseDeleteRequestModal = useCallback(() => {
    setIsDeleteRequestModalVisible(false);
    setRequestToDelete(null);
  }, []);

  const handleConfirmDeleteRequest = useCallback(async () => {
    if (!requestToDelete) return;

    setProcessingRequestId(requestToDelete.id);
    setProcessingAction("reject");
    try {
      const response = await rejectFriendRequest({
        request_id: requestToDelete.requestId,
      });
      if (response.success) {
        toastMessageSuccess(t("friends.friend_request_rejected"));
        // Refresh requests list
        await fetchFriendRequests(1, true);
      } else {
        toastMessageError(
          response.message || t("friends.failed_to_reject_request"),
        );
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toastMessageError(t("friends.failed_to_reject_friend_request"));
    } finally {
      setProcessingRequestId(null);
      setProcessingAction(null);
      handleCloseDeleteRequestModal();
    }
  }, [requestToDelete, fetchFriendRequests, handleCloseDeleteRequestModal, t]);

  const renderRequestItem = ({
    item,
    index,
  }: {
    item: FriendRequest;
    index: number;
  }) => {
    const isProcessing = processingRequestId === item.id;
    const isApproving =
      isProcessing && processingAction === REQUEST_ACTION.APPROVE;
    const isRejecting =
      isProcessing && processingAction === REQUEST_ACTION.REJECT;

    return (
      <View
        style={[
          styles.requestItem,
          index === requests.length - 1 && styles.noBorder,
        ]}
      >
        {item.avatar ? (
          <Image
            source={{ uri: CDN_IMAGE_URL+item.avatar }}
            style={styles.avatar}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{item.initials}</Text>
          </View>
        )}
        <Text style={styles.requestName}>{item.name}</Text>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[
              styles.requestActionButton,
              isProcessing && { opacity: 0.6 },
            ]}
            onPress={() => handleRejectRequest(item)}
            disabled={isProcessing}
          >
            {isRejecting ? (
              <ActivityIndicator size="small" color={colors.TEXT_DARK} />
            ) : (
              <Image
                source={Images.REQUEST_CANCEL}
                style={styles.requestActionIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.requestActionButton,
              isProcessing && { opacity: 0.6 },
            ]}
            onPress={() => handleAcceptRequest(item)}
            disabled={isProcessing}
          >
            {isApproving ? (
              <ActivityIndicator size="small" color={colors.TEXT_DARK} />
            ) : (
              <Image
                source={Images.REQUEST_ACCEPT}
                style={styles.requestActionIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      {loadingRequests && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator size="large" color={colors.PRIMARY} /> */}
          <FullPageLoader showAnimatedText={false}/>
        </View>
      ) : requests.length > 0 ? (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
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
          icon={Images.REQUESTS_ICON}
          title={t("friends.no_requests_yet")}
          description={t("friends.no_requests_description")}
          containerStyle={{ height: Matrics.screenHeight * 0.5 }}
        />
      )}

      {/* Delete Friend Request Confirmation Modal */}
      <ConfirmationModal
        visible={isDeleteRequestModalVisible}
        title={t("friends.delete_friend_request")}
        message={
          requestToDelete
            ? t("friends.delete_friend_request_confirmation", {
                name: requestToDelete.name,
              })
            : ""
        }
        onYesPress={handleConfirmDeleteRequest}
        onNoPress={handleCloseDeleteRequestModal}
        loading={
          processingRequestId !== null &&
          processingAction === REQUEST_ACTION.REJECT
        }
        disable={
          processingRequestId !== null &&
          processingAction === REQUEST_ACTION.REJECT
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: Matrics.vs(10),
    overflow: "visible",
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(12),
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
  requestName: {
    flex: 1,
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(5),
  },
  requestActionButton: {
    padding: Matrics.s(2),
  },
  requestActionIcon: {
    width: Matrics.s(22),
    height: Matrics.s(22),
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

export default FriendRequests;
