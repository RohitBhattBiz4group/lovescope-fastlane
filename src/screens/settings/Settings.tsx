import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import ConfirmationModal from "../../components/model/ConfirmationModal";
import useAuth from "../../hooks/useAuth";
import {
  toastMessageError,
  toastMessageSuccess,
} from "../../components/common/ToastMessage";
import userProfileService from "../../services/userProfile";
import { signOutFromGoogle } from "../../services/googleSignIn";
import { captureException } from "../../utils/sentry";
import { cancelAllPendingRequests } from "../../utils/http";
import { AUTH_PROVIDER } from "../../constants/commonConstant";
import CommonFooter from "../../components/common/CommonFooter";

// import DeviceInfo from "react-native-device-info";

interface SettingsMenuItem {
  id: string;
  title: string;
  icon: any;
  showArrow: boolean;
  onPress: () => void;
}

const Settings: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { signOut, authData } = useAuth();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // const appVersion = DeviceInfo.getVersion();

  const handleLogoutPress = () => setIsLogoutModalVisible(true);
  const handleCloseLogoutModal = () => setIsLogoutModalVisible(false);
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    // Cancel all background API requests immediately so they don't interfere with logout
    cancelAllPendingRequests();
    try {
      // Sign out from Google if user signed in with Google
      try {
        await signOutFromGoogle();
      } catch (error) {
        captureException(error, {
          tags: {
            screen: "Settings",
            error_type: "google_signout_error",
          },
        });
        console.log(
          "Google Sign-Out error (may not be signed in with Google):",
          error
        );
        // Continue with logout even if Google sign-out fails
      }

      // Sign out from app (clears auth data)
      // Note: Do NOT close modal or reset loading state here.
      // The component will unmount when authData becomes null,
      // preventing flash of authenticated screens during transition.
      await signOut();
      toastMessageSuccess(t("common.logged_out"));
      // Modal will be cleaned up when component unmounts after auth state change
    } catch (error) {
      captureException(error, {
        tags: {
          screen: "Settings",
          error_type: "logout_error",
        },
      });
      console.error("Logout error:", error);
      toastMessageError(t("settings.logout_error"));
      // Only reset state on error - component stays mounted
      setIsLoggingOut(false);
      handleCloseLogoutModal();
    }
  };

  const handleDeletePress = () => setIsDeleteModalVisible(true);
  const handleCloseDeleteModal = () => setIsDeleteModalVisible(false);
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await userProfileService.deleteAccount();
      if (!response.success) {
        toastMessageError(t("common.something_went_wrong"));
        setIsDeleting(false);
        handleCloseDeleteModal();
        return;
      }
      // Note: Do NOT close modal or reset loading state here.
      // The component will unmount when authData becomes null,
      // preventing flash of authenticated screens during transition.
      await signOut();
      toastMessageSuccess(t("settings.delete_account_success"));
      // Modal will be cleaned up when component unmounts after auth state change
    } catch (e) {
      captureException(e, {
        tags: {
          screen: "Settings",
          error_type: "delete_account_error",
        },
      });
      toastMessageError(t("settings.delete_account_error"));
      // Only reset state on error - component stays mounted
      setIsDeleting(false);
      handleCloseDeleteModal();
    }
  };

  const authProvider = (authData?.user?.auth_provider || AUTH_PROVIDER.EMAIL) as string;
  const isGoogleUser = authProvider.toLowerCase() === AUTH_PROVIDER.GOOGLE;
  const isAppleUser = authProvider.toLowerCase() === AUTH_PROVIDER.APPLE;

  const handleReportBugPress = () => {
    const url = "https://www.lovescope.app/support";
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err)
    );
  };

  const menuItems: SettingsMenuItem[] = [
    {
      id: "1",
      title: t("settings.my_profile"),
      icon: Images.MY_PROFILE_ICON,
      showArrow: true,
      onPress: () => navigation.navigate("MyProfile"),
    },
    // Only show Change Password if user is not signed in with Google
    ...(isGoogleUser || isAppleUser
      ? []
      : [
          {
            id: "2",
            title: t("settings.change_password"),
            icon: Images.CHANGE_PASSWORD_ICON,
            showArrow: true,
            onPress: () => navigation.navigate("ChangePassword"),
          },
        ]),
    {
      id: "3",
      title: t("settings.subscriptions"),
      icon: Images.SUBSCRIPTIONS_ICON,
      showArrow: true,
      onPress: () => navigation.navigate("Subscription"),
    },
    {
      id: "4",
      title: t("settings.set_preferences"),
      icon: Images.SET_PREFERENCES_ICON,
      showArrow: true,
      onPress: () => navigation.navigate("SetPreferences"),
    },
    {
      id: "5",
      title: t("settings.report_bug"),
      icon: Images.REPORT_BUG_ICON,
      showArrow: false,
      onPress: handleReportBugPress,
    },
    {
      id: "6",
      title: t("settings.logout"),
      icon: Images.LOGOUT_ICON,
      showArrow: false,
      onPress: handleLogoutPress,
    },
  ];

  const renderMenuItem = (item: SettingsMenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={item.id === "6" ? styles.menuBottomItem : styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
      disabled={item.id === "6" && isLoggingOut}
    >
      <View style={styles.menuItemLeft}>
        <Image
          source={item.icon}
          style={styles.menuIcon}
          resizeMode="contain"
        />
        <Text style={styles.menuTitle}>{item.title}</Text>
      </View>
      {item.showArrow && (
        <Image
          source={Images.ARROW_RIGHT_ICON}
          style={styles.arrowIcon}
          resizeMode="contain"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 1)', 'rgba(226, 232, 252)']}
      locations={[0.1977, 1]}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <View style={styles.content}>
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.versionText}>{t("settings.version", { version: "1.0" })}</Text>
        <TouchableOpacity onPress={handleDeletePress} activeOpacity={0.7}>
          <Text style={styles.deleteAccountText}>
            {t("settings.delete_account")}
          </Text>
        </TouchableOpacity>
      </View>

      <ConfirmationModal
        visible={isLogoutModalVisible}
        title={t("settings.logout_model")}
        message={t("settings.logout_confirmation")}
        onYesPress={handleConfirmLogout}
        onNoPress={handleCloseLogoutModal}
        loading={isLoggingOut}
        disable={isLoggingOut}
      />

      <ConfirmationModal
        visible={isDeleteModalVisible}
        title={t("settings.delete_account_title")}
        message={t("settings.delete_account_confirmation")}
        onYesPress={handleConfirmDelete}
        onNoPress={handleCloseDeleteModal}
        loading={isDeleting}
        disable={isDeleting}
      />

      <CommonFooter
        activeTab="settings"
        onChatPress={() => navigation.navigate("ChatTab" as never)}
        onHeartPress={() => (navigation as any).navigate("ProfilesTab", {
          screen: "PartnerProfiles",
        })}
        onFilePress={() => (navigation as any).navigate("FilesTab", {
          screen: "Analyzer",
          params: { resetSequence: Date.now() },
        })}
        onUserPress={() => navigation.navigate("UserTab" as never)}
        onSettingsPress={() => {}}
        bgColor="rgba(226, 232, 252)"
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
  },
  menuContainer: {
    paddingHorizontal: Matrics.s(20),
    // paddingTop: Matrics.vs(-10),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Matrics.vs(15),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  menuBottomItem: {
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    paddingVertical: Matrics.vs(15),
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    marginRight: Matrics.s(15),
  },
  menuTitle: {
    fontSize: FontsSize.Medium,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_DARK,
  },
  arrowIcon: {
    width: Matrics.s(20),
    height: Matrics.vs(20),
    tintColor: "#2F2E2C",
  },
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Matrics.s(20),
    paddingVertical: Matrics.vs(10),
  },
  versionText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.TEXT_PRIMARY,
    opacity: 0.6,
  },
  deleteAccountText: {
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.Medium,
    fontWeight: "500",
    color: colors.DANGER,
  },
});

export default Settings;
