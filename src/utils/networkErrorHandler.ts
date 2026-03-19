import NetInfo from "@react-native-community/netinfo";
import { toastMessageError } from "../components/common/ToastMessage";
import { captureException } from "./sentry";

/**
 * Network error types
 */
export type NetworkErrorType = "no_connection" | "network_error" | "timeout" | "unknown";

/**
 * Network error handler result
 */
export interface NetworkErrorResult {
  isNetworkError: boolean;
  errorType: NetworkErrorType;
  message: string;
}

/**
 * Check if device has network connectivity
 * @returns Promise<boolean> - true if connected, false otherwise
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  } catch (error) {
    console.error("Error checking network connectivity:", error);
    return false;
  }
};

/**
 * Detect if an error is a network-related error
 * @param error - The error object to check
 * @returns NetworkErrorResult with error details
 */
export const detectNetworkError = (error: unknown): NetworkErrorResult => {
  // Default result
  const defaultResult: NetworkErrorResult = {
    isNetworkError: false,
    errorType: "unknown",
    message: "",
  };

  if (!error) {
    return defaultResult;
  }

  // Check for error message strings
  let errorMessage = "";
  if (error instanceof Error) {
    errorMessage = error.message.toLowerCase();
  } else if (typeof error === "object" && "message" in error) {
    errorMessage = String(error.message).toLowerCase();
  } else if (typeof error === "string") {
    errorMessage = error.toLowerCase();
  }

  // Network-related keywords
  const networkKeywords = [
    "network",
    "connection",
    "timeout",
    "fetch failed",
    "network request failed",
    "no internet",
    "offline",
    "econnrefused",
    "enotfound",
    "eai_again",
  ];

  // Check if error message contains network-related keywords
  const isNetworkError = networkKeywords.some((keyword) =>
    errorMessage.includes(keyword)
  );

  if (!isNetworkError) {
    return defaultResult;
  }

  // Determine error type
  let errorType: NetworkErrorType = "network_error";
  if (errorMessage.includes("timeout")) {
    errorType = "timeout";
  } else if (
    errorMessage.includes("no internet") ||
    errorMessage.includes("offline")
  ) {
    errorType = "no_connection";
  }

  return {
    isNetworkError: true,
    errorType,
    message: errorMessage,
  };
};

/**
 * Handle network errors with consistent messaging and logging
 * @param error - The error object
 * @param translate - Translation function (optional)
 * @param screenName - Screen name for error tracking (optional)
 * @param customTitle - Custom error title (optional)
 * @returns void - Shows error toast and logs to Sentry
 */
export const handleNetworkError = (
  error: unknown,
  translate?: (key: string) => string,
  screenName?: string,
  customTitle?: string
): void => {
  // Capture error in Sentry
  captureException(error, {
    tags: {
      screen: screenName || "unknown",
      error_type: "network_error",
    },
  });

  // Get translation function
  const t = translate || ((key: string) => key);

  // Detect if it's a network error
  const networkError = detectNetworkError(error);

  if (networkError.isNetworkError) {
    // Show network-specific error message
    const title = customTitle || t("common.error");
    const message = t("common.network_error");
    toastMessageError(title, message);
  } else {
    // Show generic error message
    const title = customTitle || t("common.error");
    const message = t("common.connection_error");
    toastMessageError(title, message);
  }
};

/**
 * Wrapper function to check network connectivity before API calls
 * @param apiCall - The API call function to execute
 * @param translate - Translation function (optional)
 * @param screenName - Screen name for error tracking (optional)
 * @param customErrorTitle - Custom error title for network errors (optional)
 * @returns Promise<T> - Result of the API call
 */
export const withNetworkCheck = async <T>(
  apiCall: () => Promise<T>,
  translate?: (key: string) => string,
  screenName?: string,
  customErrorTitle?: string
): Promise<T> => {
  // Check network connectivity first
  const isConnected = await checkNetworkConnectivity();

  if (!isConnected) {
    const t = translate || ((key: string) => key);
    const title = customErrorTitle || t("common.error");
    const message = t("common.network_error");
    toastMessageError(title, message);

    // Capture in Sentry
    captureException(new Error("No network connection"), {
      tags: {
        screen: screenName || "unknown",
        error_type: "no_connection",
      },
    });

    throw new Error("No network connection");
  }

  try {
    return await apiCall();
  } catch (error) {
    // Handle network errors
    handleNetworkError(error, translate, screenName, customErrorTitle);
    throw error;
  }
};




