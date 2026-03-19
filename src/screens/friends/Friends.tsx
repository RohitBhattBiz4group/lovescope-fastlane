import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import AddFriendModal from "../../components/friends/AddFriendModal";
import {
  sendFriendRequest,
  getFriendRequests,
} from "../../services/friends";
import {
  toastMessageSuccess,
  toastMessageError,
} from "../../components/common/ToastMessage";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import useTranslation from "../../hooks/useTranslation";
import { TAB_TYPE, REQUEST_STATUS } from "../../constants/commonConstant";
import Groups from "./Groups";
import FriendsList from "./FriendsList";
import FriendRequests from "./FriendRequests";
import CommonHeader from "../../components/common/CommonHeader";
import CommonFooter from "../../components/common/CommonFooter";
import { CopilotStep, useCopilot } from "react-native-copilot";
import { useFocusEffect } from "@react-navigation/native";
import { CopilotTouchableOpacity } from "../../components/walkthrough";
import onboardingService from "../../services/onboardingService";

type TabType = "friends" | "groups" | "requests";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  unreadCount?: number;
}

const Friends: React.FC<ScreenProps> = ({ navigation, route }) => {
  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { start, stop, copilotEvents } = useCopilot();
  const startRef = useRef(start);
  const walkthroughStartedRef = useRef(false);
  const isUserInitiatedStopRef = useRef(true);

  const onboardingStatus = authData?.user?.onboarding_status;
  const shouldShowOnboarding = onboardingStatus && onboardingStatus.friends_onboarding !== true;
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  // Ensure tooltip never shows if friends_onboarding is true, regardless of other conditions
  const showOnboardingTooltip = shouldShowOnboarding && isScreenFocused && !(onboardingStatus && onboardingStatus.friends_onboarding);
  
  

  const initialTabFromParams = (route?.params as any)?.initialTab as
    | TabType
    | undefined;
  const [activeTab, setActiveTab] = useState<TabType>(
    initialTabFromParams ?? "friends"
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [prefillPhone, setPrefillPhone] = useState<string | undefined>(undefined);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groupsRefreshToken, setGroupsRefreshToken] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Handle initial tab from route params
  useEffect(() => {
    const nextTab = (route?.params as any)?.initialTab as TabType | undefined;
    if (!nextTab) return;
    setActiveTab(nextTab);
    navigation.setParams({ initialTab: undefined } as any);
  }, [(route?.params as any)?.initialTab]);

  useEffect(() => {
    const selectedPhone = (route?.params as any)?.selectedPhone as string | undefined;
    if (!selectedPhone) return;

    setPrefillPhone(selectedPhone);
    setIsModalVisible(true);
    navigation.setParams({ selectedPhone: undefined } as any);
  }, [(route?.params as any)?.selectedPhone]);

  // Fetch friends list for the CreateGroupPage
  useEffect(() => {
    const fetchFriendsForGroup = async () => {
      if (!authData?.user?.id) return;
      try {
        const { getFriendsList } = await import("../../services/friends");
        const response = await getFriendsList();
        if (response.success && response.data) {
          const formattedFriends: Friend[] = response.data.map((friend) => ({
            id: friend.friend_id.toString(),
            name: friend.friend_name,
            avatar: friend.friend_image || undefined,
          }));
          setFriends(formattedFriends);
        } else {
          toastMessageError(t("common.something_went_wrong"));
        }
      } catch (error) {
        console.error("Error fetching friends list:", error);
        toastMessageError(t("common.something_went_wrong"));
      }
    };

    fetchFriendsForGroup();
  }, [authData?.user?.id]);

  // Refresh groups when returning from CreateGroupPage
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setGroupsRefreshToken((prev) => prev + 1);
    });

    return unsubscribe;
  }, [navigation]);

  // Fetch pending friend requests count for header/tab badge
  const fetchPendingRequestsCount = useCallback(async () => {
    if (!authData?.user?.id) return;
    try {
      const response = await getFriendRequests(1, 100);
      if (response.success && response.data) {
        const userId = authData.user.id;
        const count = response.data.filter(
          (req) =>
            req.status === REQUEST_STATUS.PENDING && req.receiver_id === userId
        ).length;
        setPendingRequestsCount(count);
      }
    } catch {
      // Non-critical: keep previous count on error
    }
  }, [authData?.user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPendingRequestsCount();
    });
    return unsubscribe;
  }, [navigation, fetchPendingRequestsCount]);

  // Keep startRef updated
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  // Reset walkthrough state and stop on screen blur
  useFocusEffect(
    useCallback(() => {
      walkthroughStartedRef.current = false;
      isUserInitiatedStopRef.current = true;
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
        // Stop any active walkthrough when leaving screen (not user-initiated)
        if (walkthroughStartedRef.current) {
          isUserInitiatedStopRef.current = false;
          stop();
        }
      };
    }, [stop])
  );

  // Start onboarding tooltip on screen focus
  useFocusEffect(
    useCallback(() => {
      if (walkthroughStartedRef.current) return;

      // Double-check that friends_onboarding is not true before showing tooltip
      if (showOnboardingTooltip && !(onboardingStatus && onboardingStatus.friends_onboarding)) {
        walkthroughStartedRef.current = true;
        const timer = setTimeout(() => {
          startRef.current("friendsAddButton");
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [showOnboardingTooltip, onboardingStatus?.friends_onboarding])
  );

  // Handle onboarding tooltip dismissal (only on user interaction)
  useEffect(() => {
    if (!showOnboardingTooltip) return;

    const handleStop = async () => {
      // Only update if user tapped screen or pressed hardware back
      if (!isUserInitiatedStopRef.current) return;

      try {
        await onboardingService.updateOnboardingField(
          "friends_onboarding",
          true
        );
        
        // Immediately update Redux state for instant UI feedback
        dispatch(updateOnboardingStatusLocally({
          friends_onboarding: true,
        }));
        
      } catch (error) {
        console.log("Failed to update friends_onboarding:", error);
      }
      if (authData?.user) {
        setAuthData({
          ...authData,
          user: {
            ...authData.user,
            onboarding_status: {
              ...authData.user.onboarding_status!,
              friends_onboarding: true,
            },
          },
        });
      }
    };

    copilotEvents.on("stop", handleStop);
    return () => {
      copilotEvents.off("stop", handleStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboardingTooltip]);

  const handleSendRequest = async (email: string) => {
    setSendingRequest(true);
    try {
      const response = await sendFriendRequest({ receiver_email: email });
      if (response.success) {
        setIsModalVisible(false);
        toastMessageSuccess(t("friends.friend_request_sent_success"));
      } else {

        // Display the message as-is (it already includes the user's name)
        setIsModalVisible(false);
        toastMessageError(response.message || t("friends.failed_to_send_friend_request"));
      }
    } catch (error: unknown) {
      console.error("Error sending friend request:", error);
      const err = error as { status_code?: number; message?: string } | null;
      // Check if error indicates user not found
      setIsModalVisible(false);
      if (
        err?.status_code === 404 ||
        err?.message?.toLowerCase().includes("user not found") ||
        err?.message?.toLowerCase().includes("email not found")
      ) {
        toastMessageError(t("friends.user_not_found"));
      } else if (
        err?.message?.toLowerCase().includes("already your friend") ||
        err?.message?.toLowerCase().includes("already friends")
      ) {
        // Display the message as-is (it already includes the user's name)
        toastMessageError(err?.message || t("friends.already_friend"));
      } else {
        toastMessageError(
          err?.message || t("friends.failed_to_send_friend_request")
        );
      }
      // Close modal on error
    } finally {
      setSendingRequest(false);
    }
  };

  const renderTab = (tab: TabType, label: string) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Image
        source={
          tab === TAB_TYPE.FRIENDS
            ? Images.FRIENDS_ICON
            : tab === TAB_TYPE.GROUPS
              ? Images.GROUPS_ICON
              : Images.REQUESTS_ICON
        }
        style={[styles.tabIcon, activeTab === tab && styles.activeTabIcon]}
        resizeMode="contain"
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "friends":
        return <FriendsList />;
      case "groups":
        return <Groups refreshToken={groupsRefreshToken} />;
      case "requests":
        return (
          <FriendRequests onPendingCountChange={setPendingRequestsCount} />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "friends":
        return t("friends.title");
      case "groups":
        return t("friends.groups");
      case "requests":
        return pendingRequestsCount > 0
          ? `${t("friends.requests")} (${pendingRequestsCount})`
          : t("friends.requests");
      default:
        return t("friends.title");
    }
  };

  const getRequestsTabLabel = () =>
    pendingRequestsCount > 0
      ? `${t("friends.requests")} (${pendingRequestsCount})`
      : t("friends.requests");

  return (
    // <LinearGradient
    //             colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
    //             locations={[0.1977, 1]}
    //             style={styles.container}
    //           >
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.WHITE}
        translucent={false}
      />

      <CommonHeader
        onNotificationPress={() => navigation.navigate("Notifications")}
        showNotificationBadge={true}
        title={getHeaderTitle()}
      />

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {renderTab(TAB_TYPE.FRIENDS, t("friends.title"))}
        {renderTab(TAB_TYPE.GROUPS, t("friends.groups"))}
        {renderTab(TAB_TYPE.REQUESTS, getRequestsTabLabel())}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Plus Button - Hide on Requests tab */}
      {activeTab !== TAB_TYPE.REQUESTS && (
        <CopilotStep
          text={t("walkthrough.friends.add_button")}
          order={1}
          name="friendsAddButton"
          active={Boolean(showOnboardingTooltip)}
        >
          <CopilotTouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (activeTab === TAB_TYPE.GROUPS) {
                navigation.navigate("CreateGroupPage", { friends });
              } else {
                setIsModalVisible(true);
              }
            }}
          >
            <Image
              source={Images.ADD_PROFILE}
              style={styles.addIcon}
              resizeMode="contain"
            />
          </CopilotTouchableOpacity>
        </CopilotStep>
      )}

      {/* Add Friend Modal */}
      <CommonFooter
        activeTab="user"
        onChatPress={() => navigation.navigate("ChatTab")}
        onHeartPress={() => (navigation as any).navigate("ProfilesTab", {
          screen: "PartnerProfiles",
        })}
        onFilePress={() => (navigation as any).navigate("FilesTab", {
          screen: "Analyzer",
          params: { resetSequence: Date.now() },
        })}
        onUserPress={() => { }}
        onSettingsPress={() => navigation.navigate("SettingsTab")}
        bgColor="#fff"
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setPrefillPhone(undefined);
        }}
        onSendRequest={(email: string) => {
          handleSendRequest(email);
        }}
        setSendingRequest={setSendingRequest}
        loading={sendingRequest}
        prefillPhone={prefillPhone}
      />
    </GestureHandlerRootView>
    // </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: colors.WHITE,
    // remove when use bg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(15),
  },
  headerTitle: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
  },
  notificationButton: {
    position: "relative",
    padding: Matrics.s(0),
    zIndex: 10,
  },
  notificationIcon: {
    width: Matrics.s(21),
    height: Matrics.vs(21),
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
  tabsScrollView: {
    flexGrow: 0,
    marginBottom: Matrics.vs(0),
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(10),
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Matrics.vs(8),
    paddingHorizontal: Matrics.s(16),
    borderRadius: Matrics.s(25),
    marginRight: Matrics.s(10),
    backgroundColor: colors.GRAY_LIGHT,
  },
  activeTab: {
    backgroundColor: colors.PRIMARY_LG,
  },
  tabIcon: {
    width: Matrics.s(16),
    height: Matrics.vs(16),
    marginRight: Matrics.s(6),
    tintColor: colors.TEXT_DARK,
    opacity: 0.6,
  },
  activeTabIcon: {
    tintColor: colors.WHITE,
    opacity: 1,
  },
  tabText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
    opacity: 0.6,
    lineHeight: Matrics.vs(20),
  },
  activeTabText: {
    color: colors.WHITE,
    opacity: 1,
  },
  content: {
    flex: 1,
  },
  addButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? Matrics.vs(85) : Matrics.vs(100),
    right: Matrics.s(20),
    width: Matrics.s(40),
    height: Matrics.s(40),
    minWidth: Matrics.s(40),
    minHeight: Matrics.s(40),
    borderRadius: Matrics.s(100),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  addIcon: {
    width: "100%",
    height: "100%",
  },
});

export default Friends;
