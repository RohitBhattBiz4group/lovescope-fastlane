import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { IAuthData, IUserOnboardingStatus } from "../../interfaces/commonInterfaces";
import { removeData, retrieveData, storeData, StorageKeys } from "../../storage";
import { setUser, clearUser } from "../../utils/sentry";
import { signOutFromGoogle } from "../../services/googleSignIn";
import { cancelAllPendingRequests } from "../../utils/http";
import { store } from "../store";

interface AuthState {
  authData: IAuthData | null;
  loading: boolean;
  appLoading: boolean;
  errorMessage: string | undefined;
}

const initialState: AuthState = {
  authData: null,
  loading: false,
  appLoading: true,
  errorMessage: undefined,
};

// Async thunk to initialize auth from storage
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const storedAuthData = await retrieveData(StorageKeys.authData);
      if (storedAuthData) {
        const parsedAuthData = JSON.parse(storedAuthData);
        // Set Sentry user context
        if (parsedAuthData?.user) {
          setUser({
            id: parsedAuthData.user.id?.toString() || parsedAuthData.user.email || "",
            email: parsedAuthData.user.email,
            username: parsedAuthData.user.name || parsedAuthData.user.email,
            has_completed_onboarding: parsedAuthData.user.has_completed_onboarding ?? false,
          });
        }
        return parsedAuthData;
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to initialize auth");
    }
  }
);

// Async thunk to set auth data
export const setAuthDataThunk = createAsyncThunk(
  "auth/setAuthData",
  async (data: IAuthData | undefined, { rejectWithValue }) => {
    try {
      if (data) {
        // Store in encrypted storage
        await storeData(StorageKeys.authData, data);
        // Set Sentry user context
        if (data?.user) {
          const user = data.user as { id?: string | number; email?: string; name?: string; has_completed_onboarding?: boolean };
          setUser({
            id: user.id?.toString() || user.email || "",
            email: user.email,
            username: user.name || user.email,
            has_completed_onboarding: user.has_completed_onboarding ?? false,
          });
        }
        return data;
      } else {
        // Clear storage and Sentry context
        await removeData(StorageKeys.authData);
        // Clear onboarding question ID to prevent new users from resuming previous user's progress
        await removeData(StorageKeys.onboardingQuestionId);
        clearUser();
        return null;
      }
    } catch (error) {
      return rejectWithValue("Failed to set auth data");
    }
  }
);

// Async thunk to sign out
export const signOutThunk = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Cancel all in-flight API requests so they don't block logout
      cancelAllPendingRequests();
      // Remove from storage
      await removeData(StorageKeys.authData);
      // Clear onboarding question ID to prevent new users from resuming previous user's progress
      await removeData(StorageKeys.onboardingQuestionId);
      // Clear onboarding page key to prevent new users from resuming previous user's progress
      await removeData(StorageKeys.onboardingPageKey);
      // Clear Sentry user context
      clearUser();
      // Clear first_profile from onboarding slice
      dispatch({ type: "onboarding/clearFirstProfile" });
      return null;
    } catch (error) {
      return rejectWithValue("Failed to sign out");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.errorMessage = undefined;
    },
    // Keep the old action for backward compatibility during migration
    authAction: (state, action: PayloadAction<IAuthData | null>) => {
      state.authData = action.payload;
    },
    // Synchronous reducer to update onboarding status immediately after API success
    updateOnboardingStatusLocally: (state, action: PayloadAction<Partial<IUserOnboardingStatus>>) => {
      if (state.authData?.user) {
        state.authData.user.onboarding_status = {
          ...(state.authData.user.onboarding_status || {
            skip_profile_creation: false,
            skip_onboarding_question: false,
            skip_walkthrough: false,
            profile_creation_completed: false,
            love_profile_onboarding: false,
            analyser_onboarding: false,
            global_chat_onboarding: false,
            friends_onboarding: false,
          }),
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Initialize auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.appLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.authData = action.payload;
        state.appLoading = false;
        state.errorMessage = undefined;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.appLoading = false;
        state.errorMessage = action.payload as string;
      });

    // Set auth data
    builder
      .addCase(setAuthDataThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = undefined;
      })
      .addCase(setAuthDataThunk.fulfilled, (state, action) => {
        state.authData = action.payload;
        state.loading = false;
        state.errorMessage = undefined;
      })
      .addCase(setAuthDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload as string;
      });

    // Sign out
    builder
      .addCase(signOutThunk.pending, (state) => {
        state.loading = true;
        state.errorMessage = undefined;
      })
      .addCase(signOutThunk.fulfilled, (state) => {
        state.authData = null;
        state.loading = false;
        state.errorMessage = undefined;
      })
      .addCase(signOutThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.payload as string;
      });
  },
});

export const { clearError, authAction, updateOnboardingStatusLocally } = authSlice.actions;

// Flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;

/**
 * Utility function to logout user from non-React contexts (e.g., HTTP interceptors)
 * This combines Google sign-out with Redux signOutThunk dispatch
 * It's safe to call multiple times - subsequent calls will be ignored if logout is in progress
 */
export const logoutUser = async (): Promise<void> => {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    console.log("Logout already in progress, skipping...");
    return;
  }

  isLoggingOut = true;

  try {
    // Cancel all in-flight API requests immediately
    cancelAllPendingRequests();

    // Try to sign out from Google (non-blocking)
    // This won't fail the logout process if it errors
    try {
      await signOutFromGoogle();
    } catch (error) {
      // Ignore Google sign-out errors (user might not be signed in with Google)
      console.log("Google Sign-Out error (non-critical):", error);
    }

    // Dispatch signOutThunk to clear auth data
    // This will:
    // - Clear authData from storage
    // - Clear onboarding question ID
    // - Clear Sentry user context
    // - Update Redux state (which will trigger Router to show AuthStack)
    await store.dispatch(signOutThunk());
  } catch (error) {
    console.error("Error during logout:", error);
    // Even if logout fails, we should still try to clear the store
    // to prevent the user from being stuck in an invalid state
    try {
      await store.dispatch(signOutThunk());
    } catch (fallbackError) {
      console.error("Fallback logout also failed:", fallbackError);
    }
  } finally {
    // Reset the flag after a short delay to allow the logout to complete
    // This prevents rapid-fire 401 errors from causing issues
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
};

export default authSlice.reducer;

