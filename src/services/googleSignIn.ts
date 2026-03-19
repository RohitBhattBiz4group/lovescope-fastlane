/**
 * Google Sign-In Service
 * Handles Google OAuth authentication flow
 */
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";
import { toastMessageError } from "../components/common/ToastMessage";
import { captureException } from "../utils/sentry";

// Configure Google Sign-In
// Google OAuth Client ID from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = "346400482152-kan9iomf91oj45gac9ad32dtdcq5sd4a.apps.googleusercontent.com";

// Create iOS OAuth client with bundle ID: app.lovescope.com
const GOOGLE_IOS_CLIENT_ID = "346400482152-98ndibfhc0o2krnjd13c5op7jhovn1g0.apps.googleusercontent.com";

const configureGoogleSignIn = () => {
  try {
    GoogleSignin.configure({
      // Web Client ID (required for Android)
      webClientId: GOOGLE_WEB_CLIENT_ID,
      // iOS Client ID (required for iOS to avoid "Custom scheme URIs not allowed" error)
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      // Optional: offline access
      offlineAccess: false,
      // Optional: force code for refresh token
      forceCodeForRefreshToken: false,
    });
  } catch (error) {
    console.error("Error configuring Google Sign-In:", error);
  }
};

// Initialize on module load
configureGoogleSignIn();

/**
 * Sign in with Google
 * @returns Google ID token or null if failed
 */
export const signInWithGoogle = async (): Promise<string | null> => {
  try {
    // Check if Google Play Services are available (Android only)
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    // Ensure we're signed out first to avoid token caching issues
    // This helps prevent clock skew errors when switching users
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      // Ignore sign-out errors - user may not have been signed in
      console.log("Pre-signin cleanup (may not be needed):", signOutError);
    }

    // Sign in (this will prompt user to select account if multiple accounts exist)
    const signInResult = await GoogleSignin.signIn();
    
    // Check if sign-in was successful - signInResult has a 'data' property with user info
    if (!signInResult || !signInResult.data) {
      console.log("Google Sign-In: User cancelled or sign-in failed");
      return null;
    }

    // Verify user is signed in before getting tokens
    const currentUser = await GoogleSignin.getCurrentUser();
    if (!currentUser) {
      console.log("Google Sign-In: User is not signed in");
      return null;
    }

    // Small delay to ensure token is fully issued (helps with clock skew)
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));

    // Get fresh ID token (this ensures we get a new token, not a cached one)
    // getTokens() always returns fresh tokens from Google
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens.idToken;
    
    // Log token info (without exposing full token for security)
   

    if (!idToken) {
      console.error("Google Sign-In: ID token is null");
      toastMessageError("Failed to get Google authentication token");
      return null;
    }

    return idToken;
  } catch (error: any) {
    // Log full error details for debugging
    console.error("Google Sign-In Error Details:", {
      code: error.code,
      message: error.message,
      error: JSON.stringify(error, null, 2),
    });

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // User cancelled the login flow - this is expected behavior, don't send to Sentry
      console.log("Google Sign-In cancelled by user");
      return null;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // Operation (e.g. sign in) is in progress already - expected behavior
      console.log("Google Sign-In already in progress");
      return null;
    } else if (error.code === "getTokens" || error.message?.includes("getTokens requires a user to be signed in")) {
      // User cancelled or closed modal without signing in - expected behavior
      console.log("Google Sign-In: User cancelled or closed modal without signing in");
      return null;
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // Play services not available or outdated
      toastMessageError("Google Play Services not available. Please update Google Play Services.");
      return null;
    } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
      // Sign in required - expected when user cancels
      console.log("Google Sign-In: Sign in required (user may have cancelled)");
      return null;
    } else if (error.code === "10" || error.message?.includes("DEVELOPER_ERROR")) {
      // DEVELOPER_ERROR - Usually means SHA-1 fingerprint not added or wrong client ID
      console.error("Google Sign-In DEVELOPER_ERROR - Check SHA-1 fingerprint and Client ID");
      toastMessageError("Google Sign-In configuration error. Please check SHA-1 fingerprint in Google Cloud Console.");
      return null;
    } else if (error.code === "12500" || error.message?.includes("NETWORK_ERROR")) {
      // Network error
      console.error("Google Sign-In: Network error");
      toastMessageError("Network error. Please check your internet connection.");
      return null;
    } else if (error.code === "7" || error.message?.includes("NETWORK_ERROR")) {
      // Network error (alternative code)
      console.error("Google Sign-In: Network error");
      toastMessageError("Network error. Please check your internet connection.");
      return null;
    } else {
      // Generic error - only send to Sentry if it's not a cancellation/expected error
      // Capture error in Sentry for unexpected errors
      captureException(error, {
        tags: {
          service: "google_signin",
          error_type: "authentication_error",
        },
        extra: {
          code: error.code,
          message: error.message,
        },
      });

      // Generic error - show detailed message
      const errorMessage = error.message || "Unknown error occurred";
      console.error("Google Sign-In Error:", {
        code: error.code,
        message: errorMessage,
        fullError: error,
      });
      toastMessageError(`Google Sign-In failed: ${errorMessage}. Please try again.`);
      return null;
    }
  }
};

/**
 * Sign out from Google
 * This clears the Google sign-in state and revokes tokens
 */
export const signOutFromGoogle = async (): Promise<void> => {
  try {
    // Sign out from Google (clears cached tokens)
    await GoogleSignin.signOut();
    // Revoke access to ensure tokens are invalidated
    try {
      await GoogleSignin.revokeAccess();
    } catch (revokeError) {
      // revokeAccess may fail if user wasn't signed in, which is fine
      console.log("Google revoke access (may not be needed):", revokeError);
    }
  } catch (error) {
    console.error("Google Sign-Out Error:", error);
    // Don't throw - allow logout to continue even if Google sign-out fails
  }
};

/**
 * Check if user is already signed in with Google
 */
export const isSignedInWithGoogle = async (): Promise<boolean> => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser !== null;
  } catch (error) {
    console.error("Error checking Google sign-in status:", error);
    return false;
  }
};

/**
 * Get current Google user info (if signed in)
 */
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo;
  } catch (error) {
    console.error("Error getting current Google user:", error);
    return null;
  }
};

