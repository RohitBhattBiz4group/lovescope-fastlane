import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GlobalChat from "../screens/chat/GlobalChat";
import Notifications from "../screens/notifications/Notifications";
import CommonHeader from "../components/common/CommonHeader";

/**
 * Stack for the "chat" tab
 */
const ChatStack = createNativeStackNavigator();
const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator
      initialRouteName="GlobalChat"
      screenOptions={{
        headerShown: false, // use your CommonHeader inside screens instead
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <ChatStack.Screen
        name="GlobalChat"
        component={GlobalChat}
      />
      <ChatStack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerShown: true,
          header: ({ navigation }) => (
            <CommonHeader
              title="Notifications"
              showBackButton={true}
              onBackPress={() => navigation.goBack()}
            />
          ),
        }}
      />

      {/*
        Later you can add more chat-related screens:
        <ChatStack.Screen
          name="ChatDetails"
          component={ChatDetails}
        />
      */}
    </ChatStack.Navigator>
  );
};

export default ChatStackNavigator;

