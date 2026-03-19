import * as http from "../utils/http";
import endpoints from "../constants/endpoints";
import { IAuthData } from "../interfaces/commonInterfaces";
import { IApiResponseCommonInterface, IAppleAuth, IForgotPassword, IGoogleAuth, IResendOtp, IResetPassword, ISignin, ISignup, ISignupResponseData, IVerifyOtp } from "../interfaces/authInterfaces";

class AuthService {
  signUp = async (data: ISignup): Promise<IApiResponseCommonInterface<ISignupResponseData | null>> => {
    return http.post(endpoints.auth.SIGNUP, data);
  };

  signIn = async (data: ISignin): Promise<IApiResponseCommonInterface<IAuthData | null>> => {
    return http.post(endpoints.auth.SIGNIN, data);
  };

  googleSignIn = async (data: IGoogleAuth): Promise<IApiResponseCommonInterface<IAuthData | null>> => {
    return http.post(endpoints.auth.GOOGLE_SIGNIN, data);
  };

  googleSignUp = async (data: IGoogleAuth): Promise<IApiResponseCommonInterface<IAuthData | null>> => {
    return http.post(endpoints.auth.GOOGLE_SIGNUP, data);
  };

  forgotPassword = async (data: IForgotPassword): Promise<IApiResponseCommonInterface<null>> => {
    return http.post(endpoints.auth.FORGOT_PASSWORD, data);
  };

  resetPassword = async (data: IResetPassword): Promise<IApiResponseCommonInterface<null>> => {
    return http.post(endpoints.auth.RESET_PASSWORD, data);
  };

  verifyOtp = async (data: IVerifyOtp): Promise<IApiResponseCommonInterface<IAuthData | null>> => {
    return http.post(endpoints.auth.VERIFY_OTP, data);
  };

  resendOtp = async (data: IResendOtp): Promise<IApiResponseCommonInterface<null>> => {
    return http.post(endpoints.auth.RESEND_OTP, data);
  };

  appleSignIn = async (data: IAppleAuth): Promise<IApiResponseCommonInterface<IAuthData | null>> => {
    return http.post(endpoints.auth.APPLE_SIGNIN, data);
  };
}

export default new AuthService();

