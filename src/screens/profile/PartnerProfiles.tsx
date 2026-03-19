import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StatusBar,
} from "react-native";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { CopilotStep, useCopilot } from "react-native-copilot";
import { ScreenProps, IUserOnboardingStatus } from "../../interfaces/commonInterfaces";
import CommonHeader from "../../components/common/CommonHeader";
import CommonSearchBar from "../../components/common/CommonSearchBar";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import EmptyData from "../../components/common/EmptyData";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import profileService from "../../services/profileService";
import { handleApiError } from "../../utils/http";
import { ILoveProfile } from "../../interfaces/profileInterfaces";
import {
  toastMessageSuccess,
  toastMessageError,
  toastMessageUpgrade,
} from "../../components/common/ToastMessage";
import useTranslation from "../../hooks/useTranslation";
import CommonFooter from "../../components/common/CommonFooter";
import LinearGradient from "react-native-linear-gradient";
import useAuth from "../../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateOnboardingStatusLocally } from "../../stateManagement/features/authSlice";
import FullPageLoader from "../../components/common/FullPageLoader";
import { PLANS } from "../../constants/commonConstant";
import { WALKTHROUGH_STEPS } from "../../constants/walkthroughConstants";
import onboardingService from "../../services/onboardingService";
import { CopilotView, CopilotTouchableOpacity } from "../../components/walkthrough";

const DEBOUNCE_DELAY = 300; // milliseconds

const DEFAULT_ONBOARDING_STATUS: IUserOnboardingStatus = {
  skip_profile_creation: false,
  skip_onboarding_question: false,
  skip_walkthrough: false,
  profile_creation_completed: false,
  love_profile_onboarding: false,
  analyser_onboarding: false,
  global_chat_onboarding: false,
  friends_onboarding: false,
};


interface PartnerProfilesParams {
  showAnalyzerTooltip?: boolean;
  continueTour?: boolean;
}

const PartnerProfiles: React.FC<ScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const routeData = useRoute();
  const { authData, setAuthData } = useAuth();
  const dispatch = useDispatch();
  const { start, stop, copilotEvents } = useCopilot();
  const userCurrentPlan = authData?.plan;

  const isPremiumPlus = !!userCurrentPlan?.product_id?.includes(PLANS.PREMIUM_PLUS);
  const isPremium = !!userCurrentPlan?.product_id?.includes(PLANS.PREMIUM);
  console.log(isPremiumPlus, "isPremiumPlus");
  console.log(isPremium, "isPremium");
  const profileLimit = Number(userCurrentPlan?.limits?.limit)

  const { continueTour } = (route?.params as PartnerProfilesParams) || {};
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [profiles, setProfiles] = useState<ILoveProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ILoveProfile | null>(
    null,
  );
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const hasLoadedProfilesRef = useRef(false);
  const filesTooltipDismissedRef = useRef(false);
  const [showFilesTabTooltip, setShowFilesTabTooltip] = useState(false);
  const [showAddButtonOnboarding, setShowAddButtonOnboarding] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef(start);
  const walkthroughStartedRef = useRef(false);
  const isUserInitiatedStopRef = useRef(true);
  const [isReturningFromAddProfile, setIsReturningFromAddProfile] = useState(false);

  const closeDropdown = useCallback(() => {
    setOpenDropdownId(null);
  }, []);

  const onboardingStatus = authData?.user?.onboarding_status;
  const shouldShowOnboardingTooltip =
    onboardingStatus &&
    onboardingStatus.profile_creation_completed === true &&
    onboardingStatus.love_profile_onboarding !== true;
  const showOnboardingTooltip =
    shouldShowOnboardingTooltip && isScreenFocused && profiles.length > 0;

  // Show tooltip on add button when user skips onboarding
  const shouldShowAddButtonTooltip =
    onboardingStatus &&
    onboardingStatus.skip_profile_creation === true &&
    onboardingStatus.skip_walkthrough === true && 
    onboardingStatus.love_profile_onboarding !== true;
  const showAddButtonTooltip =
    shouldShowAddButtonTooltip && isScreenFocused;

  // Generate initials from full name
  const getInitials = (name: string): string => {
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfiles();

      if (response.success && response.data) {
        setProfiles(response.data);
        hasLoadedProfilesRef.current = true;
      } else {
        const errorMessage =
          response.message || t("analyzer.failed_to_fetch_profiles");
        handleApiError(
          { message: errorMessage, status_code: response.status_code },
          undefined,
          "PartnerProfiles",
        );
      }
    } catch (error) {
      handleApiError(error, undefined, "PartnerProfiles");
    } finally {
      setLoading(false);
      // no-op
    }
  }, []);

  useEffect(() => {
    if (hasLoadedProfilesRef.current) return;

    hasLoadedProfilesRef.current = true;
    fetchProfiles();
  }, []);

  // Refresh profiles when screen comes into focus (e.g., when returning from AddNewProfile)
  useFocusEffect(
    useCallback(() => {
      // Only refresh profiles if returning from AddNewProfile or first load
      if (isReturningFromAddProfile || !hasLoadedProfilesRef.current) {
        fetchProfiles();
        setIsReturningFromAddProfile(false); // Reset the flag
        hasLoadedProfilesRef.current = true;
      }

      // Reset search text when screen comes into focus (user navigated away and came back)
      setSearchText("");
      setDebouncedSearchText("");
      setOpenDropdownId(null);
      walkthroughStartedRef.current = false;
      isUserInitiatedStopRef.current = true;
      setIsScreenFocused(true);

      // Check if we should show files tab tooltip for continue tour
      if (continueTour && !filesTooltipDismissedRef.current) {
        setShowFilesTabTooltip(true);
      }

      return () => {
        setIsScreenFocused(false);
        if (walkthroughStartedRef.current) {
          isUserInitiatedStopRef.current = false;
          stop();
        }
      };
    }, [stop, continueTour, navigation, isReturningFromAddProfile, fetchProfiles]),
  );

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  useEffect(() => {
    if (!showOnboardingTooltip || walkthroughStartedRef.current) {
      return;
    }

    walkthroughStartedRef.current = true;
    const timer = setTimeout(() => {
      startRef.current(WALKTHROUGH_STEPS.PROFILE.LIST.name);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showOnboardingTooltip]);

  useEffect(() => {
    if (!showFilesTabTooltip || !isScreenFocused || walkthroughStartedRef.current) {
      return;
    }

    walkthroughStartedRef.current = true;
    const timer = setTimeout(() => {
      startRef.current("filesTooltip");
    }, 600);

    return () => clearTimeout(timer);
  }, [showFilesTabTooltip, isScreenFocused]);

  // Start add button tooltip when needed
  useEffect(() => {
    if (showAddButtonTooltip && isScreenFocused) {
      setShowAddButtonOnboarding(true);
      walkthroughStartedRef.current = true;
      const timer = setTimeout(() => {
        startRef.current('addButtonTooltip');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAddButtonTooltip, isScreenFocused]);

  useEffect(() => {
    if (!showOnboardingTooltip && !showFilesTabTooltip) return;

    const handleStop = async () => {
      if (showFilesTabTooltip) {
        filesTooltipDismissedRef.current = true;
        setShowFilesTabTooltip(false);
        navigateToAnalyzer();
      }
      // Don't mark love_profile_onboarding as complete here
      // It will be completed in ProfileChat after showing timeline and input tooltips
    };

    copilotEvents.on("stop", handleStop);
    return () => {
      copilotEvents.off("stop", handleStop);
    };
  }, [
    showOnboardingTooltip,
    showFilesTabTooltip,
    authData,
    setAuthData,
    copilotEvents,
  ]);

  // Separate event handler for add button tooltip only
  useEffect(() => {
    if (!showAddButtonOnboarding) return;

    const handleAddButtonStop = async () => {
      try {
        await onboardingService.updateOnboardingField(
          'love_profile_onboarding',
          true,
        );
        
        // Immediately update Redux state for instant UI feedback
        dispatch(updateOnboardingStatusLocally({
          love_profile_onboarding: true,
        }));
        if (authData?.user) {
          const updatedOnboardingStatus: IUserOnboardingStatus = {
            ...DEFAULT_ONBOARDING_STATUS,
            ...(authData.user.onboarding_status ?? {}),
            love_profile_onboarding: true,
          };

          setAuthData({
            ...authData,
            user: {
              ...authData.user,
              onboarding_status: updatedOnboardingStatus,
            },
          });
        }
      } catch (error) {
        console.log('Failed to update love_profile_onboarding:', error);
      }
      setShowAddButtonOnboarding(false);
    };

    copilotEvents.on("stop", handleAddButtonStop);
    return () => {
      copilotEvents.off("stop", handleAddButtonStop);
    };
  }, [showAddButtonOnboarding, copilotEvents, authData, setAuthData]);

  const handleMenuPress = (profile: ILoveProfile) => {
    setOpenDropdownId(openDropdownId === profile.id ? null : profile.id);
    setSelectedProfile(profile);
  };

  const handleEdit = (profile: ILoveProfile) => {
    closeDropdown();
    // Flag that we're navigating to AddNewProfile for editing
    setIsReturningFromAddProfile(true);
    navigation.navigate("AddNewProfile", {
      profileId: profile.id,
      profile: profile,
    });
  };

  const handleDelete = (profile: ILoveProfile) => {
    if (!isPremiumPlus && !isPremium) {
      toastMessageUpgrade(
        t("love_profile.delete_profile_toast"),
        undefined,
        t("love_profile.upgrade_to_unlock"),
        () => {
          const parentNav = navigation.getParent?.();
          if (parentNav) {
            parentNav.navigate("SettingsTab", {
              screen: "Subscription",
              params: {
                navigationFrom: {
                  tab: "ProfilesTab",
                  screen: routeData?.name,
                },
              },
            });
            return;
          }
          (navigation as any).navigate?.("Subscription", {
            navigationFrom: {
              tab: "ProfilesTab",
              screen: routeData?.name,
            },
          });
        },
      );
      return;
    }
    // Close the dropdown first
    closeDropdown();
    setSelectedProfile(profile);
    // Open delete modal after a small delay to ensure dropdown closes first
    setTimeout(() => {
      setIsDeleteModalVisible(true);
    }, 100);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalVisible(false);
    // Clear selectedProfile when modal is closed
    setSelectedProfile(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfile) return;

    setIsDeleting(true);
    const profileIdToDelete = selectedProfile.id;
    try {
      const response = await profileService.deleteProfile(profileIdToDelete);

      // Check if response has success property
      if (response && response.success) {
        // Optimistically remove the profile from the list immediately
        setProfiles((prevProfiles) =>
          prevProfiles.filter((profile) => profile.id !== profileIdToDelete),
        );

        toastMessageSuccess(
          t("love_profile.profile_delete"),
          t("love_profile.profile_deleted"),
        );
        setIsDeleteModalVisible(false);
        setSelectedProfile(null);

        // No need to refresh from server as we already updated the list optimistically
      } else {
        // Handle different error scenarios based on status code
        const statusCode = response?.status_code;
        let errorTitle = t("love_profile.profile_delete_error");
        let errorMessage = t("love_profile.profile_delete_failed");

        if (statusCode === 404) {
          errorTitle = t("love_profile.profile_not_found");
          errorMessage = t("love_profile.profile_not_found_message");
          // Optimistically remove the profile from the list if not found
          setProfiles((prevProfiles) =>
            prevProfiles.filter((profile) => profile.id !== profileIdToDelete),
          );
          // Close modal - no need to refresh as we already updated the list
          setIsDeleteModalVisible(false);
          setSelectedProfile(null);
        } else if (statusCode === 403 || statusCode === 401) {
          errorTitle = t("love_profile.profile_delete_unauthorized");
          errorMessage = t("love_profile.profile_delete_unauthorized_message");
        } else if (statusCode === 500) {
          errorMessage = response?.message || t("common.something_went_wrong");
        } else if (response?.message) {
          errorMessage = response.message;
        }

        toastMessageError(errorTitle, errorMessage);
      }
    } catch (error: unknown) {
      // Handle error object structure from http interceptor
      const err = error as {
        status_code?: number;
        status?: number;
        message?: string;
      };
      const statusCode = err?.status_code || err?.status;
      let errorTitle = t("common.error");
      let errorMessage = t("love_profile.profile_delete_failed");

      if (statusCode === 404) {
        errorTitle = t("love_profile.profile_not_found");
        errorMessage = t("love_profile.profile_not_found_message");
        // Optimistically remove the profile from the list if not found
        setProfiles((prevProfiles) =>
          prevProfiles.filter((profile) => profile.id !== profileIdToDelete),
        );
        // Close modal - no need to refresh as we already updated the list
        setIsDeleteModalVisible(false);
        setSelectedProfile(null);
      } else if (statusCode === 403 || statusCode === 401) {
        errorTitle = t("love_profile.profile_delete_unauthorized");
        errorMessage = t("love_profile.profile_delete_unauthorized_message");
      } else if (err?.message) {
        errorMessage = err.message;
      } else {
        // Fallback to handleApiError for other errors
        handleApiError(err, t, "PartnerProfiles");
        setIsDeleting(false);
        return;
      }

      toastMessageError(errorTitle, errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Debounce search text to optimize performance
  useEffect(() => {
    // Clear existing timer if user types again
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update debounced value
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, DEBOUNCE_DELAY);

    // Cleanup function to clear timer on unmount or when searchText changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchText]);

  const navigateToAnalyzer = useCallback(() => {
    navigation.setParams({ continueTour: undefined });
    navigation.navigate("FilesTab", {
      screen: "Analyzer",
      params: { resetSequence: Date.now() },
    });
  }, [navigation]);

  const handleFilePress = () => {
    filesTooltipDismissedRef.current = true;
    setShowFilesTabTooltip(false);
    stop();
    navigateToAnalyzer();
  };

  // Memoize filtered profiles to avoid unnecessary recalculations
  const filteredProfiles = useMemo(() => {
    if (!debouncedSearchText.trim()) {
      return profiles;
    }

    const searchLower = debouncedSearchText.toLowerCase().trim();
    return profiles.filter((profile) => {
      const fullName = (profile.full_name ?? "").toLowerCase().trim();
      const nameMatch = fullName.includes(searchLower);

      return nameMatch;
    });
  }, [profiles, debouncedSearchText]);

  const renderProfileItem = ({
    item,
    index,
  }: {
    item: ILoveProfile;
    index: number;
  }) => (
    <View
      style={[
        styles.profileCard,
        index === filteredProfiles.length - 1 && styles.noBorder,
        openDropdownId === item.id && { zIndex: 1000 },
      ]}
    >
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ProfileChat", {
                loveProfileId: item.id,
                profileName: item.full_name,
              })
            }
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ProfileChat", {
                loveProfileId: item.id,
                profileName: item.full_name,
              })
            }
          >
            <Text style={styles.profileName}>
              {item.full_name && item.full_name.length > 20
                ? `${item.full_name.substring(0, 20)}...`
                : item.full_name}
            </Text>
            <View style={styles.profileDetails}>
              <Text style={styles.detailText}>{item.age}</Text>
              <Text style={styles.detailText}>{item.gender}</Text>
              <Text style={styles.detailText}>
                {item.relationship_tag && item.relationship_tag.length > 15
                  ? `${item.relationship_tag.substring(0, 15)}...`
                  : item.relationship_tag}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileActionsWrapper}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={(event) => {
            event.stopPropagation?.();
            handleMenuPress(item);
          }}
        >
          <Image
            source={Images.THREE_DOTS}
            style={[
              styles.menuIcon,
              openDropdownId === item.id && styles.menuIconActive,
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Inline Dropdown */}
        {openDropdownId === item.id && (
          <View
            style={[
              styles.inlineDropdown,
              index === filteredProfiles.length - 1 &&
              filteredProfiles.length > 1 &&
              styles.inlineDropdownBottom,
            ]}
          >
            <TouchableOpacity
              style={styles.dropdownMenuItem}
              onPress={(event) => {
                event.stopPropagation?.();
                handleEdit(item);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={Images.PENCIL_EDIT}
                style={styles.dropdownMenuIcon}
                resizeMode="contain"
              />
              <Text style={styles.dropdownMenuText}>{t("common.edit")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownMenuItem}
              onPress={(event) => {
                event.stopPropagation?.();
                handleDelete(item);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Image
                source={Images.TRASH_ICON}
                style={styles.dropdownMenuIcon}
                resizeMode="contain"
              />
              <Text style={styles.dropdownMenuText}>{t("common.delete")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderProfilesList = () => (
    <FlatList
      data={filteredProfiles}
      renderItem={renderProfileItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={false}
      nestedScrollEnabled={true}
      onScrollBeginDrag={() => {
        if (openDropdownId !== null) {
          closeDropdown();
        }
      }}
      ListEmptyComponent={
        !loading ? (
          <EmptyData
            icon={Images.FRIENDS_ICON}
            title={
              debouncedSearchText.trim()
                ? t("love_profile.no_user_found")
                : t("love_profile.no_profiles_yet")
            }
            description={
              debouncedSearchText.trim()
                ? t("love_profile.no_user_found_description")
                : t("love_profile.no_profiles_description")
            }
            containerStyle={{ height: Matrics.screenHeight * 0.5 }}
          />
        ) : null
      }
    />
  );

  const renderContent = () => (
    <TouchableWithoutFeedback onPress={closeDropdown}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <CommonSearchBar
            placeholder={t("love_profile.search_profile")}
            value={searchText}
            onChangeText={(text) => setSearchText(text.toLowerCase())}
            onFocus={() => {
              if (openDropdownId !== null) {
                closeDropdown();
              }
            }}
            onSearchPress={() => { }}
            disabled={profiles.length === 0}
          />
        </View>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>
            {t("love_profile.all_profiles")} ({filteredProfiles.length})
          </Text>
        </View>

        {loading && profiles.length === 0 ? (
          <View style={styles.loadingContainer}>
            {/* <ActivityIndicator size="large" color={colors.PRIMARY} /> */}
            <FullPageLoader showAnimatedText={false} />
          </View>
        ) : showOnboardingTooltip ? (
          <CopilotStep
            text={t("walkthrough.profile_chat.first_profile")}
            order={WALKTHROUGH_STEPS.PROFILE.LIST.order}
            name={WALKTHROUGH_STEPS.PROFILE.LIST.name}
          >
            <CopilotView style={styles.walkthroughWrapper}>
              {renderProfilesList()}
            </CopilotView>
          </CopilotStep>
        ) : (
          renderProfilesList()
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    // <>
    <LinearGradient
      colors={["rgba(255, 255, 255, 1)", "rgba(226, 232, 252)"]}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <CommonHeader
        onNotificationPress={() => {
          closeDropdown();
          navigation.navigate("Notifications");
        }}
        showNotificationBadge={true}
      />

      {renderContent()}

      <CopilotStep
        text="Create a profile for your current connection and talk about them to clear a situation or get advice"
        order={1}
        name="addButtonTooltip"
        active={showAddButtonOnboarding}
      >
        <CopilotTouchableOpacity
          style={styles.fabButton}
          onPress={() => {
            // Check if user has reached the limit

            if (profiles.length >= profileLimit) {
              toastMessageUpgrade(
                t("love_profile.limit_reached", { limit: profileLimit }),
                undefined,
                t("love_profile.upgrade_to_create"),
                () => {
                  const parentNav = navigation.getParent?.();
                  if (parentNav) {
                    parentNav.navigate("SettingsTab", {
                      screen: "Subscription",
                      params: {
                        navigationFrom: {
                          tab: "ProfilesTab",
                          screen: routeData?.name,
                        },
                      },
                    });
                    return;
                  }
                  (navigation as any).navigate?.("Subscription", {
                    navigationFrom: {
                      tab: "ProfilesTab",
                      screen: routeData?.name,
                    },
                  });
                },
              );
              return;
            }
            // Flag that we're navigating to AddNewProfile
            setIsReturningFromAddProfile(true);
            navigation.navigate("AddNewProfile");
          }}
        >
          <Image
            source={Images.ADD_PROFILE}
            style={styles.fabIcon}
            resizeMode="contain"
          />
        </CopilotTouchableOpacity>
      </CopilotStep>

      <ConfirmationModal
        visible={isDeleteModalVisible && selectedProfile !== null}
        title={t("love_profile.delete_profile")}
        message={
          selectedProfile
            ? t("love_profile.delete_profile_confirmation", {
              name: selectedProfile.full_name,
            })
            : ""
        }
        onYesPress={handleConfirmDelete}
        onNoPress={handleCloseDeleteModal}
        loading={isDeleting}
        disable={isDeleting}
      />

      <CommonFooter
        activeTab="heart"
        onChatPress={() => navigation.navigate("ChatTab")}
        onHeartPress={() => { }}
        onFilePress={handleFilePress}
        onUserPress={() => navigation.navigate("UserTab")}
        onSettingsPress={() => navigation.navigate("SettingsTab")}
        filesTabTooltip={{
          active: showFilesTabTooltip,
          text: "Continue your tour by exploring the analyzer section",
          order: 1,
          name: "filesTooltip",
        }}
      />
    </LinearGradient>
    // </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    position: "relative",
  },
  searchContainer: {
    paddingHorizontal: Matrics.s(20),
    backgroundColor: "#fff",
    zIndex: 100,
  },
  headerSection: {
    paddingHorizontal: Matrics.s(20),
    paddingTop: Matrics.vs(20),
    paddingBottom: Matrics.vs(10),
    backgroundColor: "#fff",
    zIndex: 100,
  },
  headerTitle: {
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.ExtraBold,
    fontWeight: 700,
    color: colors.TEXT_DARK,
  },
  listContainer: {
    paddingHorizontal: Matrics.s(20),
    paddingBottom: Matrics.vs(100),
    overflow: "visible",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingVertical: Matrics.vs(16),
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 31, 31, 0.10)",
    overflow: "visible",
    zIndex: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: Matrics.s(10),
  },
  avatar: {
    width: Matrics.s(45),
    height: Matrics.s(45),
    minWidth: Matrics.s(45),
    minHeight: Matrics.s(45),
    borderRadius: Matrics.s(100),
    backgroundColor: "rgba(26, 26, 26, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    color: colors.TEXT_DARK,
    fontWeight: 700,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Bold,
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    fontWeight: 700,
  },
  profileDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Matrics.s(10),
  },
  detailText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
    color: colors.TEXT_PRIMARY,
    backgroundColor: "#9281E91A",
    paddingVertical: Matrics.vs(1),
    paddingHorizontal: Matrics.s(8),
    borderRadius: Matrics.s(100),
    fontWeight: 500,
  },
  profileActionsWrapper: {
    position: "relative",
    alignItems: "flex-end",
    overflow: "visible",
    zIndex: 100,
  },
  menuButton: {
    padding: Matrics.s(4),
  },
  menuIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(15),
    tintColor: colors.TEXT_SECONDARY,
  },
  menuIconActive: {
    tintColor: colors.PRIMARY,
    opacity: 1,
  },
  inlineDropdown: {
    position: "absolute",
    top: Matrics.vs(22),
    right: 0,
    backgroundColor: colors.WHITE,
    borderRadius: Matrics.s(10),
    paddingVertical: Matrics.vs(8),
    paddingHorizontal: Matrics.s(6),
    minWidth: Matrics.s(125),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  inlineDropdownBottom: {
    top: "auto",
    bottom: Matrics.vs(22),
  },
  dropdownMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Matrics.s(10),
    paddingVertical: Matrics.vs(5),
  },
  dropdownMenuIcon: {
    width: Matrics.s(18),
    height: Matrics.vs(18),
    marginRight: Matrics.s(8),
    tintColor: colors.TEXT_DARK,
  },
  dropdownMenuText: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(18),
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    zIndex: 5,
  },
  fabButton: {
    position: "absolute",
    bottom: Matrics.vs(85),
    right: Matrics.s(20),
    width: Matrics.s(40),
    height: Matrics.s(40),
    minWidth: Matrics.s(40),
    minHeight: Matrics.s(40),
    borderRadius: Matrics.s(100),
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Matrics.vs(50),
  },
  walkthroughWrapper: {
    flex: 1,
  },
});

export default PartnerProfiles;
