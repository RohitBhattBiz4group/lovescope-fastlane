export interface ISignup {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country_code?: string;
  country_name?: string;
  verification_via?: "email" | "phone_number";
}

export interface ISignupResponseData {
  is_resend?: boolean;
}

export interface ISignin {
  email: string;
  password: string;
}

export interface IForgotPassword {
  email: string;
}

export interface IResetPassword {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface IVerifyOtp {
  email: string;
  otp: string;
  type: string;
  phoneNumber?: string;
  verificationVia?: string;
}

export interface IResendOtp {
  email: string;
  type: string;
  phoneNumber?: string;
  verificationVia: string;
}

export interface IGoogleAuth {
  id_token: string;
}

export interface IAppleAuth {
  id_token: string;
}

export interface IApiResponseCommonInterface<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: Record<string, string>;
  status_code: number;
  extra_data?: Record<string, any>;
}

