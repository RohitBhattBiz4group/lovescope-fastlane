import React, { useCallback, useState, useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Text } from "react-native";
import { CopilotStep } from "react-native-copilot";
import { useFocusEffect } from "@react-navigation/native";
import Images from "../../config/Images";
import { CopilotView } from "../walkthrough";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import { formatMemberNames } from "../../utils/helper";
import useTranslation from "../../hooks/useTranslation";
import subscriptionService from "../../services/subscriptionService";
import useAuth from "../../hooks/useAuth";
import { getUnreadNotificationCount } from "../../services/notifications";
import { useAppDispatch } from "../../stateManagement/hooks";
import { authAction } from "../../stateManagement/features/authSlice";


interface CommonHeaderProps {
  onNotificationPress?: () => void;
  showNotificationBadge?: boolean;
  onBackPress?: () => void;
  showBackButton?: boolean;
  title?: string;
  // Chat profile header props
  variant?: "default" | "chat" | "group";
  profileName?: string;
  profileImage?: string;
  showSkipButton?: boolean;
  onSkipPress?: () => void;
  // Group chat header props
  groupImage?: string;
  groupName?: string;
  onGroupNameClick?: () => void;
  showTimeline?: boolean;
  onTimelinePress?: () => void;
  members?: Array<{ full_name: string }>;
  timelineTooltip?: {
    active: boolean;
    text: string;
    order: number;
    name: string;
  };
}



const CommonHeader: React.FC<CommonHeaderProps> = ({
  onNotificationPress,
  showNotificationBadge = false,
  onBackPress,
  showBackButton = false,
  title,
  variant = "default",
  profileName,
  profileImage,
  showSkipButton = false,
  onSkipPress,
  groupImage,
  groupName,
  onGroupNameClick,
  showTimeline = false,
  onTimelinePress,
  members,
  timelineTooltip,
}) => {

  const { t } = useTranslation();
  const { authData } = useAuth();
  const dispatch = useAppDispatch();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const hasUnreadNotifications = unreadCount > 0;

  const hasFetchedSubscriptionRef = useRef(false);
  const authDataRef = useRef(authData);

  const getUserCurrentSubscription = useCallback(async () => {
    try {
      const res = await subscriptionService.getUserCurrentSubscription();
      const currentAuthData = authDataRef.current;
      if (!currentAuthData) {
        return;
      }
      dispatch(
        authAction({
          ...currentAuthData,
          plan: res.data,
        })
      );
    } catch (_error) {
      /* error logged silently */
    }
  }, [dispatch]);

  const fetchUnreadNotificationCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      if (res.success && res.data !== undefined) {
        setUnreadCount(res.data?.unread_count || 0);
      }
    } catch (_error) {
      /* error logged silently */
    }
  }, []);

  // Keep authDataRef in sync
  useEffect(() => {
    authDataRef.current = authData;
    if (!authData) {
      hasFetchedSubscriptionRef.current = false;
    }
  }, [authData]);

  useEffect(() => {
    if (authData && !hasFetchedSubscriptionRef.current) {
      hasFetchedSubscriptionRef.current = true;
      getUserCurrentSubscription();
    }
  }, [authData, getUserCurrentSubscription]);

  useFocusEffect(
    useCallback(() => {
      if (authData && showNotificationBadge) {
        fetchUnreadNotificationCount();
      }
    }, [authData, showNotificationBadge, fetchUnreadNotificationCount])
  );

  /**
   * Returns the initials from a given name string.
   */
  const getInitials = (name: string): string => {
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };


  // Chat profile header variant
  if (variant === "chat" && profileName) {
    return (
      <View style={styles.container}>
        <View style={styles.chatLeftSection}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Image
              source={Images.BACK_ICON}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.profileSection}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.profileInitials}>
                  {getInitials(profileName)}
                </Text>
              </View>
            )}
            <Text style={styles.profileName}>{profileName}</Text>
          </View>
        </View>

        {!showTimeline && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Image
              source={Images.NOTIFICATION_ICON}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
            {hasUnreadNotifications && <View style={styles.badge} />}
          </TouchableOpacity>
        )}

        {showTimeline && timelineTooltip?.active ? (
          <CopilotStep
            text={timelineTooltip.text}
            order={timelineTooltip.order}
            name={timelineTooltip.name}
          >
            <CopilotView collapsable={false} style={styles.timelineTooltipWrapper}>
              <TouchableOpacity
                style={styles.timelineButton}
                onPress={onTimelinePress}
              >
                <Image
                  source={Images.TIMELINE_ICON}
                  style={styles.notificationIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </CopilotView>
          </CopilotStep>
        ) : showTimeline ? (
          <TouchableOpacity
            style={styles.timelineButton}
            onPress={onTimelinePress}
          >
            <Image
              source={Images.TIMELINE_ICON}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (variant === "group" && groupName) {
    const memberNamesText =
      members && members.length > 0 ? formatMemberNames(members, 2) : "";
    return (
      <View style={styles.container}>
        <View style={styles.chatLeftSection}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Image
              source={Images.BACK_ICON}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onGroupNameClick}>
            <View style={styles.groupSection}>
              {groupImage ? (
                <Image
                  source={{ uri: groupImage }}
                  style={styles.profileAvatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.profileInitials}>
                    {getInitials(groupName)}
                  </Text>
                </View>
              )}
              <View style={styles.groupNameContainer}>
                <Text
                  style={
                    memberNamesText ? styles.groupName : styles.profileName
                  }
                >
                  {groupName}
                </Text>
                {memberNamesText ? (
                  <Text style={styles.memberNames}>{memberNamesText}</Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Image
            source={Images.NOTIFICATION_ICON}
            style={styles.notificationIcon}
            resizeMode="contain"
          />
          {hasUnreadNotifications && <View style={styles.badge} />}
        </TouchableOpacity>
      </View>
    );
  }

  // When we have both back button and title, use centered layout
  const hasCenteredTitle = showBackButton && title;
  if (hasCenteredTitle) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Image
            source={Images.BACK_ICON}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.centeredTitle} pointerEvents="none">
          {title}
        </Text>
        {showSkipButton && onSkipPress ? (
          <TouchableOpacity style={styles.skipButton} onPress={onSkipPress}>
            <Text style={styles.skipButtonText}>{t("common.skip")}</Text>
          </TouchableOpacity>
        ) : onNotificationPress ? (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Image
              source={Images.NOTIFICATION_ICON}
              style={styles.notificationIcon}
              resizeMode="contain"
            />
            {hasUnreadNotifications && <View style={styles.badge} />}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    );
  }

  // Handle case with back button and skip button but no title (signup/login flow)
  if (showBackButton && showSkipButton && onSkipPress && !title) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Image
            source={Images.BACK_ICON}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.flexSpacer} />
        <TouchableOpacity style={styles.skipButton} onPress={onSkipPress}>
          <Text style={styles.skipButtonText}>{t("common.skip")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderLeftContent = () => {
    if (showBackButton && onBackPress) {
      return (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Image
            source={Images.BACK_ICON}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }
    if (title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    return (
      <Image source={Images.LOGO} style={styles.logo} resizeMode="contain" />
    );
  };

  return (
    <View style={styles.container}>
      {renderLeftContent()}
      {onNotificationPress && (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Image
            source={Images.NOTIFICATION_ICON}
            style={styles.notificationIcon}
            resizeMode="contain"
          />
          {hasUnreadNotifications && <View style={styles.badge} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(10),
    // backgroundColor: colors.DANGER,
    backgroundColor: colors.WHITE,
    position: "relative",
    zIndex: 1,
  },
  logo: {
    width: Matrics.s(93),
    height: Matrics.vs(20),
    objectFit: "contain",
  },
  notificationButton: {
    position: "relative",
    padding: Matrics.s(0),
    zIndex: 10,
  },
  timelineButton: {
    position: "relative",
    padding: Matrics.s(0),
    zIndex: 10,
  },
  timelineTooltipWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Matrics.s(16),
    paddingVertical: Matrics.vs(10),
  },
  notificationIcon: {
    width: Matrics.s(21),
    minWidth: Matrics.s(21),
    height: Matrics.vs(21),
    minHeight: Matrics.vs(21),
  },
  badge: {
    position: "absolute",
    top: Matrics.vs(2),
    right: Matrics.s(2),
    width: Matrics.s(7),
    height: Matrics.s(7),
    minWidth: Matrics.s(7),
    minHeight: Matrics.s(7),
    borderRadius: Matrics.s(100),
    backgroundColor: colors.DANGER,
  },
  backButton: {
    padding: Matrics.s(4),
    zIndex: 10,
  },
  backIcon: {
    width: Matrics.s(24),
    height: Matrics.vs(22),
    tintColor: colors.TEXT_PRIMARY,
  },
  title: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(22),
  },
  centeredTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_DARK,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  // Chat profile header styles
  chatLeftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Matrics.s(8),
  },
  groupSection: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Matrics.s(8),
  },
  groupNameContainer: {
    marginLeft: Matrics.s(10),
  },
  memberNames: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Medium,
    fontWeight: "500",
    color: colors.TEXT_SECONDARY || colors.TEXT_PRIMARY,
    marginTop: Matrics.vs(2),
    opacity: 0.7,
  },
  profileAvatar: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(20),
  },
  profileAvatarPlaceholder: {
    width: Matrics.s(32),
    height: Matrics.s(32),
    borderRadius: Matrics.s(20),
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
  },
  profileName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
    marginLeft: Matrics.s(10),
  },
  groupName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Satoshi.Bold,
    fontWeight: "700",
    color: colors.TEXT_PRIMARY,
    marginLeft: Matrics.s(0),
  },
  skipButton: {
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Matrics.vs(6),
  },
  skipButtonText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.PRIMARY,
  },
  flexSpacer: {
    flex: 1,
  },
  placeholder: {
    width: Matrics.s(40),
  },
});

export default CommonHeader;