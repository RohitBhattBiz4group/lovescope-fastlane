import { NavigatorScreenParams, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ILoveProfile } from "./profileInterfaces";
import { IGroupResponse } from "./groupInterface";
import { InputFormatType } from "../constants/commonConstant";

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Verification: { email?: string; type?: string, phoneNumber?: string, verificationVia?: string };
  ResetPassword: { email?: string; token?: string };
};

// Onboarding Stack
export type OnboardingStackParamList = {
  Onboarding: undefined;
  Questions: { navigationFrom?: string };
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsMain: undefined;
  ChangePassword: undefined;
  MyProfile: undefined;
  Notifications: undefined;
  Subscription: undefined;
  Paywall: undefined;
  Questions: { navigationFrom?: string };
  OnboardingComplete: { navigationFrom?: string };
};

// Profiles Stack
export type ProfilesStackParamList = {
  PartnerProfiles: { startWalkthrough?: boolean } | undefined;
  ProfileChat: { loveProfileId: number; profileName: string; startWalkthrough?: boolean };
  RelationshipTimeline: { loveProfileId?: number | string | null; selectionMode?: boolean; returnRoute?: string; returnScreen?: string };
  AddNewProfile: { profileId?: number; profile?: ILoveProfile } | undefined;
  Notifications: undefined;
};

// Analyzer Stack
export type AnalyzerStackParamList = {
  Analyzer: { resetSequence?: number } | undefined;
  TextAnalysis: { profiles: ILoveProfile[]; selectedEvent?: { id: string; title: string; summary?: string } | null, analysisCount: number };
  PartnerPortrait: { profiles: ILoveProfile[], analysisCount: number };
  ArgumentAnalysis: { profiles: ILoveProfile[], analysisCount: number };
  TextAnalysisResult: {
    profile: number;
    inputType: InputFormatType;
    conversationText?: string;
    context: string;
    specify_output_context?: string;
    imageUrl?: string[];
    isSyncedToChat?: boolean;
    fingerprint?: string;
    timeline_reference?: string | null;
    selected_event_id?: string | null;
    selected_event_title?: string | null;
    selected_event_summary?: string | null;
  };
  PartnerPortraitResult: {
    profile: {
      id: string;
      name: string;
      age: number;
      gender: string;
      relationship: string;
    };
  };
  ArgumentAnalysisResult: {
    profile: number;
    argumentSubject?: string;
    timelineReference: string;
    context: string;
    inputType?: InputFormatType;
    conversationText?: string;
    imageUrl?: string[];
    selected_event_id?: string | null;
    selected_event_title?: string | null;
    selected_event_summary?: string | null;
  };
  LineByLineAnalysis: {
    profile: number;
    inputType: InputFormatType;
    conversationText?: string;
    context: string;
    specify_output_context?: string;
    imageUrl?: string[];
    isSyncedToChat?: boolean;
    fingerprint?: string;
  };
  Subscription: undefined;
  Notifications: undefined;
};

// Chat Stack
export type ChatStackParamList = {
  GlobalChat: undefined;
  Notifications: undefined;
};

// Friend interface for navigation
export interface FriendNavParam {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  unreadCount?: number;
}

// Quiz item for navigation (simplified)
export interface QuizNavParam {
  id: number;
  quiz_type: string;
  group_id?: number | null;
  group_name?: string;
  title: string;
  purpose: string;
  status: string;
  total_questions: number;
  created_at?: string | null;
  created_by: number;
  creator_name?: string;
  creator_image?: string | null;
  profile_id: number;
  profile_name: string;
  has_responded?: boolean;
  target_user_id?: number;
}

// User (Friends) Stack
export type UserStackParamList = {
  FriendsMain: { initialTab?: string; selectedPhone?: string } | undefined;
  FriendChatDetails: { friend: FriendNavParam };
  GroupDetails: { group: IGroupResponse };
  AnswerQuiz: { quiz: QuizNavParam };
  QuizResponse: { quiz: QuizNavParam; showDropdown?: boolean; hideAnswers?: boolean };
  CreateNewQuiz: { friend?: FriendNavParam; group?: IGroupResponse; selectedEvent?: { id: string; title: string } };
  CreatedQuiz: {
    quizTitle: string;
    love_profile_id: number | string;
    purpose?: string;
    questionCount: number | string;
    friend_details?: FriendNavParam;
    group_details?: IGroupResponse;
    quiz_type?: "group" | "direct";
    timeline_reference?: string | null;
    quiz_category?: string | null;
    selected_event_id?: string | null;
    selected_event_title?: string | null;
    selected_event_summary?: string | null;
  };
  GroupChat: { group: IGroupResponse };
  CreateGroupPage: undefined;
  ContactListing: undefined;
  Notifications: undefined;
  RelationshipTimeline: {
    loveProfileId?: number | string | null;
    selectionMode?: boolean;
  };
};

// Global Chat Stack
export type GlobalChatStackParamList = {
  GlobalChat: undefined;
};

// Tab Navigator
export type TabParamList = {
  ChatTab: NavigatorScreenParams<ChatStackParamList> | undefined;
  ProfilesTab: NavigatorScreenParams<ProfilesStackParamList> | undefined;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
  FilesTab: NavigatorScreenParams<AnalyzerStackParamList> | undefined;
  UserTab: NavigatorScreenParams<UserStackParamList> | undefined;
  GlobalChatTab: NavigatorScreenParams<GlobalChatStackParamList> | undefined;
};

// App Stack (Root for authenticated users)
export type AppStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  MainStack: NavigatorScreenParams<TabParamList>;
};

// Root Navigation (combines Auth and App)
export type RootStackParamList = AuthStackParamList & AppStackParamList;

// Tab navigator navigation prop
export type TabNavigationProp = NativeStackNavigationProp<TabParamList>;

// Navigation prop types for screens
export type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;
export type ProfilesNavigationProp = NativeStackNavigationProp<ProfilesStackParamList>;
export type AnalyzerNavigationProp = NativeStackNavigationProp<AnalyzerStackParamList>;
export type ChatNavigationProp = NativeStackNavigationProp<ChatStackParamList>;
export type UserNavigationProp = NativeStackNavigationProp<UserStackParamList>;
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type OnboardingNavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

// Route prop types for screens
export type AnalyzerRouteProp = RouteProp<AnalyzerStackParamList, "Analyzer">;
export type TextAnalysisResultRouteProp = RouteProp<AnalyzerStackParamList, "TextAnalysisResult">;
export type LineByLineAnalysisRouteProp = RouteProp<AnalyzerStackParamList, "LineByLineAnalysis">;
export type PartnerPortraitResultRouteProp = RouteProp<AnalyzerStackParamList, "PartnerPortraitResult">;
export type ProfileChatRouteProp = RouteProp<ProfilesStackParamList, "ProfileChat">;
export type AddNewProfileRouteProp = RouteProp<ProfilesStackParamList, "AddNewProfile">;
export type GroupChatRouteProp = RouteProp<UserStackParamList, "GroupChat">;
export type GroupDetailsRouteProp = RouteProp<UserStackParamList, "GroupDetails">;
export type FriendsMainRouteProp = RouteProp<UserStackParamList, "FriendsMain">;
export type QuestionsRouteProp = RouteProp<OnboardingStackParamList, "Questions">;

// Composite navigation type for nested navigation
export type CompositeNavigationProp = NativeStackNavigationProp<RootStackParamList> & {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
};
