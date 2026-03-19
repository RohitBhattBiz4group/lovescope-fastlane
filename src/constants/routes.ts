const routes = {
  auth: {
    LOGIN: "Login",
    SIGNUP: "SignUp",
    FORGOT_PASSWORD: "ForgotPassword",
    VERIFICATION: "Verification",
    RESET_PASSWORD: "ResetPassword",
  },
  user: {
    HOME: "/",
    SETTINGS: "Settings",
    PROFILE: "Profile",
    MY_PROFILE: "MyProfile",
    CHANGE_PASSWORD: "ChangePassword",
    PARTNER_PROFILES: "PartnerProfiles",
    ADD_NEW_PROFILE: "AddNewProfile",
    PROFILE_CHAT: "ProfileChat",
    RELATIONSHIP_TIMELINE: "RelationshipTimeline",
    ANALYZE: "Analyze",
    FRIEND_CHAT_DETAILS: "FriendChatDetails",
    GROUP_DETAILS: "GroupDetails",
    ANSWER_QUIZ: "AnswerQuiz",
    QUIZ_RESPONSE: "QuizResponse",
    CREATE_NEW_QUIZ: "CreateNewQuiz",
    CREATED_QUIZ: "CreatedQuiz",
  },

  chat:{
    CHAT_SCREEN: "ChatScreen",
  },
  onboarding: {
    ONBOARDING: "Onboarding",
    QUESTION_ANSWER: "Questions",
    ONBOARDING_COMPLETE: "OnboardingComplete",
  }
} as const;

export default routes;

