import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UserStackParamList } from "../interfaces/navigationTypes";

import Friends from "../screens/friends/Friends";
import FriendChatDetails from "../screens/friends/FriendChatDetails";
import GroupDetails from "../screens/friends/GroupDetails";
import AnswerQuiz from "../screens/friends/AnswerQuiz";
import QuizResponse from "../screens/friends/QuizResponse";
import CreateNewQuiz from "../screens/friends/CreateNewQuiz";
import CreatedQuiz from "../screens/friends/CreatedQuiz";
import Notifications from "../screens/notifications/Notifications";
import CommonHeader from "../components/common/CommonHeader";
import GroupChat from "../screens/friends/GroupChat";
import CreateGroupPage from "../screens/friends/CreateGroupPage";
import ContactListing from "../screens/friends/ContactListing";
import RelationshipTimeline from "../screens/profile/RelationshipTimeline";

const UserStack = createNativeStackNavigator<UserStackParamList>();

const UserStackNavigator: React.FC = () => {
  return (
    <UserStack.Navigator
      screenOptions={{
        headerShown: true,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <UserStack.Screen
        name="FriendsMain"
        component={Friends}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="FriendChatDetails"
        component={FriendChatDetails}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="GroupDetails"
        component={GroupDetails}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="AnswerQuiz"
        component={AnswerQuiz}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="QuizResponse"
        component={QuizResponse}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="CreateNewQuiz"
        component={CreateNewQuiz}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="CreatedQuiz"
        component={CreatedQuiz}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="GroupChat"
        component={GroupChat}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="CreateGroupPage"
        component={CreateGroupPage}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
        name="ContactListing"
        component={ContactListing}
        options={{
          headerShown: false,
        }}
      />
      <UserStack.Screen
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
      <UserStack.Screen
        name="RelationshipTimeline"
        component={RelationshipTimeline}
        options={{
          headerShown: false,
        }}
      />
    </UserStack.Navigator>
  );
};

export default UserStackNavigator;
