import { NavigationProp, RouteProp, ParamListBase } from "@react-navigation/native";
import { IUserSubscriptionResponse } from "./subscriptionInterface";

export interface IUserOnboardingStatus {
  skip_profile_creation: boolean;
  skip_onboarding_question: boolean;
  skip_walkthrough: boolean;
  profile_creation_completed: boolean;
  love_profile_onboarding: boolean;
  analyser_onboarding: boolean;
  global_chat_onboarding: boolean;
  friends_onboarding: boolean;
}

export interface IAuthUser {
  id: number;
  email: string;
  name: string;
  account_type: string;
  status: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  image: string | null;
  has_completed_onboarding: boolean;
  auth_provider: string;
  phone_number: string | null;
  country_code: string | null;
  country_name: string | null;
  onboarding_status: IUserOnboardingStatus | null;
}

export interface IAuthData {
  token?: string;
  access_token?: string;
  user?: IAuthUser;
  plan?: IUserSubscriptionResponse;
}

export interface IAuthContextData {
  authData?: IAuthData;
  loading: boolean;
  appLoading: boolean;
  signOut: () => Promise<void>;
  setAuthData: (data: IAuthData | undefined) => void;
  errorMessage?: string;
  clearError: () => void;
}

export interface ScreenProps<T extends ParamListBase = ParamListBase, K extends keyof T = keyof T> {
  navigation: NavigationProp<T>;
  route?: RouteProp<T, K>;
}

export interface RouteParams<T = Record<string, unknown>> {
  params?: T;
}
