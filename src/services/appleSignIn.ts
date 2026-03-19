import appleAuth from "@invertase/react-native-apple-authentication";

export type AppleSignInSuccess = {
  success: true;
  identityToken: string;
  userId?: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
};

export type AppleSignInFailure = {
  success: false;
  error: string;
};

type AppleSignInResult = AppleSignInSuccess | AppleSignInFailure;

export const OAUTH_CONFIG = {
  APPLE: {
    OPERATION: {
      LOGIN: "LOGIN",
      LOGOUT: "LOGOUT",
    },
    SCOPES: {
      EMAIL: "EMAIL",
      FULL_NAME: "FULL_NAME",
    },
    ERROR_CODES: {
      USER_CANCELLED: "1001",
    },
  },
};

const isUserCancelled = (error: { code?: string; message?: string }): boolean => {
  return error.code === OAUTH_CONFIG.APPLE.ERROR_CODES.USER_CANCELLED || error.message?.toLowerCase().includes("cancel") === true;
};


class AppleOAuthService {
  async signIn(): Promise<AppleSignInResult> {
    try {
      
      // Check if Apple Authentication is supported on this device
      // if (!appleAuth.isSupported) {
      //   return { 
      //     success: false, 
      //     error: "Apple Sign-In is not supported on this device. Currently Apple Authentication works on iOS devices running iOS 13 or later." 
      //   };
      // }

      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!response.identityToken) {
        return { success: false, error: "Apple Sign-In failed: No identity token returned" };
      }

      return {
        success: true,
        identityToken: response.identityToken,
        userId: response.user,
        email: response.email,
        fullName: response.fullName,
      };
    } catch (error: unknown) {
      console.log("Apple sign in error:", error);
      const parsedError = error as { code?: string; message?: string };

      if (isUserCancelled(parsedError)) {
        return { success: false, error: "Apple Sign-In was cancelled" };
      }

      return { success: false, error: parsedError?.message ?? "Apple Sign-In failed" };
    }
  }

  async signOut(userId?: string): Promise<AppleSignInResult> {
    if (!userId) {
      return { success: false, error: "User ID is required for Apple Sign-Out" };
    }

    try {
      // Check if Apple Authentication is supported on this device
      if (!appleAuth.isSupported) {
        return { 
          success: false, 
          error: "Apple Sign-In is not supported on this device. Currently Apple Authentication works on iOS devices running iOS 13 or later." 
        };
      }

      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGOUT,
        user: userId,
      });

      return {
        success: true,
        identityToken: response.identityToken ?? "",
        email: response.email,
        fullName: response.fullName,
      };
    } catch {
      return { success: false, error: "Apple Sign-Out failed" };
    }
  }
}

const appleOAuthService = new AppleOAuthService();
export const signInWithApple = (): Promise<AppleSignInResult> => appleOAuthService.signIn();