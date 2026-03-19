import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GlobalChat from "../screens/chat/GlobalChat";

const globalChatStack = createNativeStackNavigator();

const GlobalChatkNavigator: React.FC = () => {
  return (
    <globalChatStack.Navigator
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <globalChatStack.Screen
        name="GlobalChat"
        component={GlobalChat}
        options={{
          headerShown: false,
        }}
      />
    </globalChatStack.Navigator>
  );
};

export default GlobalChatkNavigator;
