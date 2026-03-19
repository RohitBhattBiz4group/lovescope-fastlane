import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import SettingsStackNavigator from "./SettingsStackNavigator";
import ProfilesStackNavigator from "./ProfileStackNavigator";
import AnalyzerStackNavigator from "./AnalyzerStackNavigator";
import ChatStackNavigator from "./ChatStackNavigator";
import UserStackNavigator from "./UserStackNavigator";
import GlobalChatkNavigator from "./globalChatStackNavigator";
const Tab = createBottomTabNavigator();

const BottomTabNavigator: React.FC = () => {

  return (
    <Tab.Navigator
      initialRouteName="ProfilesTab"
      screenOptions={{
        headerShown: false, // we handle headers in stacks / screens
        sceneStyle: { backgroundColor: "transparent" },
        tabBarStyle: { display: "none" }, // Hide the default tab bar
      }}
    >
      {/* Heart / profiles tab - Initial route */}
      <Tab.Screen
        name="ProfilesTab"
        component={ProfilesStackNavigator}
        options={{ title: "Profiles" }}
      />

      {/* Chat tab */}
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{ title: "Chat" }}
      />

      {/* Settings tab */}
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: "Settings" }}
      />

      <Tab.Screen
        name="FilesTab"
        component={AnalyzerStackNavigator}
        options={{ title: "Analyzer" }}
      />

      <Tab.Screen
        name="UserTab"
        component={UserStackNavigator}
        options={{ title: "Friends" }}
      />

       <Tab.Screen
        name="GlobalChatTab"
        component={GlobalChatkNavigator}
        options={{ title: "Chat" }}
      />

    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
