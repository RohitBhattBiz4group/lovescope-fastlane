import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Settings from "../screens/settings/Settings";
import ChangePassword from "../screens/settings/ChangePassword";
import CommonHeader from "../components/common/CommonHeader";
import MyProfile from "../screens/settings/MyProfile";
import Notifications from "../screens/notifications/Notifications";
import Subscription from "../screens/subscription/Subscription";
import Paywall from "../screens/subscription/Paywall";
import SetPreferences from "../screens/preferences/SetPreferences";
import useTranslation from "../hooks/useTranslation";
import { CommonActions } from "@react-navigation/native";

/**
 * Stack for the "settings" tab
 */
const SettingsStack = createNativeStackNavigator();
const SettingsStackNavigator: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <SettingsStack.Screen
        name="SettingsMain"
        component={Settings}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title={t("settings.title")}
              onNotificationPress={() => navigation.navigate("Notifications")}
              showNotificationBadge={true}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="ChangePassword"
        component={ChangePassword}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title={t("settings.change_password")}
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
              onNotificationPress={() => navigation.navigate("Notifications")}
              showNotificationBadge={true}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="MyProfile"
        component={MyProfile}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title={t("settings.my_profile")}
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
              onNotificationPress={() => navigation.navigate("Notifications")}
              showNotificationBadge={true}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title="Notifications"
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="Subscription"
        component={Subscription}
        options={{
          header: ({ navigation, route }: any) => (
            <CommonHeader
              title={t("settings.subscriptions")}
              showBackButton={true}
              onBackPress={() => {
                const fromTab = route?.params?.navigationFrom?.tab as
                  | string
                  | undefined;
                const fromScreen = route?.params?.navigationFrom?.screen as
                  | string
                  | undefined;

                // Always reset settings stack so Settings tab doesn't stay stuck on Subscription
                const parent = navigation.getParent?.();

                if (fromTab && parent) {
                  // Reset *this* settings stack (do not reset the parent tab navigator)
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: "SettingsMain" }],
                    })
                  );

                  // Switch back to the originating tab/screen
                  parent.dispatch(
                    CommonActions.navigate({
                      name: fromTab,
                      params: fromScreen ? { screen: fromScreen } : undefined,
                    })
                  );
                  return;
                }

                if (navigation.canGoBack?.()) {
                  navigation.goBack();
                  return;
                }

                navigation.navigate("SettingsMain");
              }}
              onNotificationPress={() => navigation.navigate("Notifications")}
              showNotificationBadge={true}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="Paywall"
        component={Paywall}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title="Get All Access"
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
              onNotificationPress={() => navigation.navigate("Notifications")}
              showNotificationBadge={true}
            />
          ),
        }}
      />
      <SettingsStack.Screen
        name="SetPreferences"
        component={SetPreferences}
        options={{
          header: ({ navigation }) => (
            <CommonHeader
              title={t("settings.set_preferences")}
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
        }}
      />
    </SettingsStack.Navigator>
  );
};

export default SettingsStackNavigator;
