import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import { getNotifications, markAllNotificationsAsRead } from "../../services/notifications";
import { toastMessageError } from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import useTranslation from "../../hooks/useTranslation";
import { NOTIFICATIONS_PAGE_SIZE } from "../../constants/commonConstant";
import LinearGradient from "react-native-linear-gradient";
import NotificationSkeleton from "../../skeletons/NotificationSkeleton";

interface Notification {
  id: number;
  title: string;
  content: string;
  created_ts: string;
}

const Notifications: React.FC<ScreenProps> = () => {
  const { authData } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Format date to relative time (e.g., "2 hours ago", "Yesterday")
  const formatRelativeTime = (dateString: string): string => {
    try {
      // Parse the ISO date string - ensure it's treated as UTC if no timezone is specified
      let date: Date;
      if (
        dateString.includes("Z") ||
        dateString.includes("+") ||
        dateString.includes("-", 10)
      ) {
        // Has timezone info, parse directly
        date = new Date(dateString);
      } else {
        // No timezone info, assume UTC and append Z
        date = new Date(dateString + "Z");
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return "";
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      // Handle negative differences (future dates)
      if (diffInSeconds < 0) {
        return t("notifications.just_now");
      }

      if (diffInSeconds < 60) {
        return t("notifications.just_now");
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return minutes === 1
          ? t("notifications.minute_ago", { count: minutes })
          : t("notifications.minutes_ago", { count: minutes });
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return hours === 1
          ? t("notifications.hour_ago", { count: hours })
          : t("notifications.hours_ago", { count: hours });
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        if (days === 1) {
          return t("notifications.yesterday");
        }
        return t("notifications.days_ago", { count: days });
      } else {
        // Format as date if older than a week
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year:
            date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (!authData?.user?.id) return;

      try {
        if (refresh) {
          setRefreshing(true);
          setPage(1);
        } else if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getNotifications(
          pageNum,
          NOTIFICATIONS_PAGE_SIZE,
        );
        if (response.success && response.data) {
          const formattedNotifications: Notification[] = response.data.map(
            (notif) => ({
              id: notif.id,
              title: notif.title,
              content: notif.content,
              created_ts: notif.created_ts,
            }),
          );

          if (refresh || pageNum === 1) {
            setNotifications(formattedNotifications);
            // Mark all notifications as read after initial load
            if (formattedNotifications.length > 0) {
              markAllNotificationsAsRead();
            }
          } else {
            setNotifications((prev) => [...prev, ...formattedNotifications]);
          }

          setHasMore(response.has_more ?? false);
          setPage(pageNum);
        } else {
          toastMessageError(t("common.something_went_wrong"));
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toastMessageError(t("common.something_went_wrong"));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [authData],
  );

  // Load more notifications
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchNotifications(page + 1);
    }
  }, [hasMore, loadingMore, loading, page, fetchNotifications]);

  // Refresh notifications
  const onRefresh = useCallback(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const renderNotificationItem = ({
    item,
    index,
  }: {
    item: Notification;
    index: number;
  }) => (
    <View
      style={[
        styles.notificationItem,
        index === notifications.length - 1 && styles.noBorder,
        index === 0 && styles.firstItem,
      ]}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationText}>{item.content}</Text>
        <Text style={styles.notificationTime}>
          {formatRelativeTime(item.created_ts)}
        </Text>
      </View>
    </View>
  );

  return (
    
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.WHITE}
        translucent={false}
      />

      {/* Content */}
      {(loading && notifications.length === 0) || refreshing ? (
        <View style={styles.listContainer}>
          <NotificationSkeleton count={6} />
        </View>
      ) : // <FullPageLoader size={160} />
      notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              tintColor={colors.PRIMARY}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.PRIMARY} />
              </View>
            ) : !hasMore && notifications.length > 0 ? (
              <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingMoreText}>
                  {t("notifications.no_more_notifications")}
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {t("notifications.no_notifications")}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    // paddingHorizontal: Matrics.s(20),
    height: "100%",
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingTop: Matrics.vs(0),
    paddingHorizontal: Matrics.s(20),
  },
  firstItem: {
    paddingTop: Matrics.vs(0),
  },
  notificationItem: {
    paddingVertical: Matrics.vs(15),
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    marginBottom: Matrics.vs(3),
  },
  notificationText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Regular,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(16),
    marginBottom: Matrics.vs(10),
  },
  notificationTime: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Matrics.vs(50),
  },
  emptyText: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
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

export default Notifications;
